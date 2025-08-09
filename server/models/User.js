const { db } = require('../firebase-config');
const crypto = require('crypto');

class User {
  constructor(data) {
    this.telegramId = data.telegramId;
    this.username = data.username;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.trxBalance = data.trxBalance || 0;
    this.trxWallet = data.trxWallet || '';
    this.totalEarned = data.totalEarned || 0;
    this.totalWithdrawn = data.totalWithdrawn || 0;
    this.adsWatched = data.adsWatched || 0;
    this.tasksCompleted = data.tasksCompleted || [];
    this.referralCode = data.referralCode || this.generateReferralCode();
    this.referredBy = data.referredBy || null;
    this.referrals = data.referrals || [];
    this.isVerifiedReferral = data.isVerifiedReferral || false;
    this.lastAdWatch = data.lastAdWatch || null;
    this.isBlocked = data.isBlocked || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  generateReferralCode() {
    return crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  static async findByTelegramId(telegramId) {
    try {
      const doc = await db.collection('users').doc(telegramId.toString()).get();
      if (doc.exists) {
        return new User({ telegramId, ...doc.data() });
      }
      return null;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  }

  static async findByReferralCode(referralCode) {
    try {
      const snapshot = await db.collection('users')
        .where('referralCode', '==', referralCode)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return new User({ telegramId: doc.id, ...doc.data() });
      }
      return null;
    } catch (error) {
      console.error('Error finding user by referral code:', error);
      throw error;
    }
  }

  async save() {
    try {
      this.updatedAt = new Date();
      const userData = { ...this };
      delete userData.telegramId; // Don't store telegramId in the document
      
      await db.collection('users').doc(this.telegramId.toString()).set(userData, { merge: true });
      return this;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  async addBalance(amount, type = 'general') {
    this.trxBalance += amount;
    this.totalEarned += amount;
    
    // Log transaction
    await this.logTransaction(amount, type, 'earned');
    await this.save();
  }

  async subtractBalance(amount, type = 'withdrawal') {
    if (this.trxBalance < amount) {
      throw new Error('Insufficient balance');
    }
    
    this.trxBalance -= amount;
    this.totalWithdrawn += amount;
    
    // Log transaction
    await this.logTransaction(-amount, type, 'withdrawn');
    await this.save();
  }

  async logTransaction(amount, type, category) {
    try {
      await db.collection('transactions').add({
        telegramId: this.telegramId,
        amount,
        type,
        category,
        timestamp: new Date(),
        balanceAfter: this.trxBalance
      });
    } catch (error) {
      console.error('Error logging transaction:', error);
    }
  }

  async addReferral(referredUserId) {
    if (!this.referrals.includes(referredUserId)) {
      this.referrals.push(referredUserId);
      await this.save();
    }
  }

  async verifyReferral() {
    if (!this.isVerifiedReferral && this.adsWatched >= parseInt(process.env.REFERRAL_VERIFICATION_ADS)) {
      this.isVerifiedReferral = true;
      
      // Reward referrer
      if (this.referredBy) {
        const referrer = await User.findByTelegramId(this.referredBy);
        if (referrer) {
          await referrer.addBalance(parseFloat(process.env.REFERRAL_REWARD), 'referral_verification');
        }
      }
      
      await this.save();
      return true;
    }
    return false;
  }

  canWatchAd() {
    if (!this.lastAdWatch) return true;
    
    const cooldownMs = parseInt(process.env.AD_COOLDOWN_SECONDS) * 1000;
    const timeSinceLastAd = Date.now() - new Date(this.lastAdWatch).getTime();
    
    return timeSinceLastAd >= cooldownMs;
  }

  async watchAd() {
    if (!this.canWatchAd()) {
      throw new Error('Ad cooldown not finished');
    }

    this.adsWatched += 1;
    this.lastAdWatch = new Date();
    
    // Add reward
    await this.addBalance(parseFloat(process.env.AD_REWARD), 'ad_view');
    
    // Check for referral verification
    await this.verifyReferral();
    
    return this;
  }

  async completeTask(taskId, reward) {
    if (!this.tasksCompleted.includes(taskId)) {
      this.tasksCompleted.push(taskId);
      await this.addBalance(reward, 'task_completion');
    }
  }

  static async getLeaderboard(limit = 10) {
    try {
      const snapshot = await db.collection('users')
        .orderBy('totalEarned', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        telegramId: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  getReferralLink() {
    return `https://t.me/${process.env.BOT_USERNAME}?start=${this.referralCode}`;
  }
}

module.exports = User;