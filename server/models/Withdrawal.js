const { db } = require('../firebase-config');

class Withdrawal {
  constructor(data) {
    this.id = data.id;
    this.telegramId = data.telegramId;
    this.amount = data.amount;
    this.commission = data.commission;
    this.netAmount = data.netAmount;
    this.toAddress = data.toAddress;
    this.status = data.status || 'pending'; // pending, approved, rejected, completed
    this.txHash = data.txHash || null;
    this.adminNotes = data.adminNotes || '';
    this.createdAt = data.createdAt || new Date();
    this.processedAt = data.processedAt || null;
    this.processedBy = data.processedBy || null;
  }

  static async create(telegramId, amount, toAddress) {
    try {
      const commission = amount * parseFloat(process.env.WITHDRAWAL_COMMISSION);
      const netAmount = amount - commission;
      
      const withdrawal = new Withdrawal({
        telegramId,
        amount,
        commission,
        netAmount,
        toAddress,
        status: 'pending'
      });
      
      return await withdrawal.save();
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      throw error;
    }
  }

  static async findById(withdrawalId) {
    try {
      const doc = await db.collection('withdrawals').doc(withdrawalId).get();
      if (doc.exists) {
        return new Withdrawal({ id: doc.id, ...doc.data() });
      }
      return null;
    } catch (error) {
      console.error('Error finding withdrawal:', error);
      throw error;
    }
  }

  static async findByTelegramId(telegramId, limit = 10) {
    try {
      const snapshot = await db.collection('withdrawals')
        .where('telegramId', '==', telegramId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => new Withdrawal({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error finding withdrawals by telegram ID:', error);
      throw error;
    }
  }

  static async getPending(limit = 50) {
    try {
      const snapshot = await db.collection('withdrawals')
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => new Withdrawal({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting pending withdrawals:', error);
      throw error;
    }
  }

  static async getAll(limit = 100, status = null) {
    try {
      let query = db.collection('withdrawals');
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => new Withdrawal({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting all withdrawals:', error);
      throw error;
    }
  }

  async save() {
    try {
      const withdrawalData = { ...this };
      delete withdrawalData.id; // Don't store id in the document
      
      if (this.id) {
        await db.collection('withdrawals').doc(this.id).set(withdrawalData, { merge: true });
      } else {
        const docRef = await db.collection('withdrawals').add(withdrawalData);
        this.id = docRef.id;
      }
      return this;
    } catch (error) {
      console.error('Error saving withdrawal:', error);
      throw error;
    }
  }

  async approve(adminId, txHash = null, notes = '') {
    this.status = 'approved';
    this.processedAt = new Date();
    this.processedBy = adminId;
    this.txHash = txHash;
    this.adminNotes = notes;
    
    await this.save();
    
    // Process referral commission if applicable
    await this.processReferralCommission();
    
    return this;
  }

  async reject(adminId, notes = '') {
    this.status = 'rejected';
    this.processedAt = new Date();
    this.processedBy = adminId;
    this.adminNotes = notes;
    
    // Refund the amount to user
    const User = require('./User');
    const user = await User.findByTelegramId(this.telegramId);
    if (user) {
      await user.addBalance(this.amount, 'withdrawal_refund');
    }
    
    await this.save();
    return this;
  }

  async complete(adminId, txHash, notes = '') {
    this.status = 'completed';
    this.processedAt = new Date();
    this.processedBy = adminId;
    this.txHash = txHash;
    this.adminNotes = notes;
    
    await this.save();
    return this;
  }

  async processReferralCommission() {
    try {
      const User = require('./User');
      const user = await User.findByTelegramId(this.telegramId);
      
      if (user && user.referredBy && user.isVerifiedReferral) {
        const referrer = await User.findByTelegramId(user.referredBy);
        if (referrer) {
          await referrer.addBalance(this.commission, 'referral_commission');
          
          // Log referral commission
          await db.collection('referral_commissions').add({
            referrerId: user.referredBy,
            referredId: this.telegramId,
            withdrawalId: this.id,
            amount: this.commission,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error processing referral commission:', error);
    }
  }

  static async getTotalStats() {
    try {
      const snapshot = await db.collection('withdrawals').get();
      const withdrawals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const stats = {
        total: withdrawals.length,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        totalAmount: 0,
        totalCommission: 0
      };
      
      withdrawals.forEach(w => {
        stats[w.status]++;
        if (w.status === 'completed' || w.status === 'approved') {
          stats.totalAmount += w.amount;
          stats.totalCommission += w.commission;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting withdrawal stats:', error);
      throw error;
    }
  }
}

module.exports = Withdrawal;