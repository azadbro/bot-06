const express = require('express');
const User = require('../models/User');
const { db } = require('../firebase-config');
const router = express.Router();

// Get referral information
router.get('/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findByTelegramId(telegramId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get detailed referral information
    const referralUsers = [];
    for (const referralId of user.referrals) {
      const referralUser = await User.findByTelegramId(referralId);
      if (referralUser) {
        referralUsers.push({
          telegramId: referralUser.telegramId,
          username: referralUser.username,
          firstName: referralUser.firstName,
          adsWatched: referralUser.adsWatched,
          isVerified: referralUser.isVerifiedReferral,
          totalEarned: referralUser.totalEarned,
          joinedAt: referralUser.createdAt
        });
      }
    }
    
    // Calculate referral earnings
    const referralCommissions = await db.collection('referral_commissions')
      .where('referrerId', '==', telegramId)
      .get();
    
    let totalReferralEarnings = 0;
    referralCommissions.docs.forEach(doc => {
      totalReferralEarnings += doc.data().amount;
    });
    
    // Add verification reward earnings
    const verifiedReferrals = referralUsers.filter(r => r.isVerified).length;
    totalReferralEarnings += verifiedReferrals * parseFloat(process.env.REFERRAL_REWARD);
    
    res.json({
      referralCode: user.referralCode,
      referralLink: user.getReferralLink(),
      totalReferrals: user.referrals.length,
      verifiedReferrals,
      pendingVerification: user.referrals.length - verifiedReferrals,
      totalReferralEarnings,
      referralUsers,
      verificationRequirement: parseInt(process.env.REFERRAL_VERIFICATION_ADS),
      verificationReward: parseFloat(process.env.REFERRAL_REWARD),
      commissionRate: parseFloat(process.env.WITHDRAWAL_COMMISSION) * 100
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get referral statistics
router.get('/:telegramId/stats', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findByTelegramId(telegramId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get referral commission history
    const commissionsSnapshot = await db.collection('referral_commissions')
      .where('referrerId', '==', telegramId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();
    
    const commissions = commissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));
    
    // Calculate daily, weekly, monthly earnings
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let dailyEarnings = 0;
    let weeklyEarnings = 0;
    let monthlyEarnings = 0;
    
    commissions.forEach(commission => {
      const commissionDate = commission.timestamp;
      if (commissionDate >= today) dailyEarnings += commission.amount;
      if (commissionDate >= weekAgo) weeklyEarnings += commission.amount;
      if (commissionDate >= monthAgo) monthlyEarnings += commission.amount;
    });
    
    // Add verification rewards
    const verifiedReferrals = await Promise.all(
      user.referrals.map(async (referralId) => {
        const referralUser = await User.findByTelegramId(referralId);
        return referralUser ? {
          isVerified: referralUser.isVerifiedReferral,
          verifiedAt: referralUser.isVerifiedReferral ? referralUser.updatedAt : null
        } : null;
      })
    );
    
    const verificationRewards = verifiedReferrals.filter(r => r && r.isVerified).length * parseFloat(process.env.REFERRAL_REWARD);
    
    res.json({
      totalCommissions: commissions.reduce((sum, c) => sum + c.amount, 0),
      verificationRewards,
      totalReferralEarnings: commissions.reduce((sum, c) => sum + c.amount, 0) + verificationRewards,
      dailyEarnings,
      weeklyEarnings,
      monthlyEarnings,
      recentCommissions: commissions.slice(0, 10),
      totalReferrals: user.referrals.length,
      verifiedReferrals: verifiedReferrals.filter(r => r && r.isVerified).length
    });
  } catch (error) {
    console.error('Referral stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
router.get('/leaderboard/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get users with most referrals
    const usersSnapshot = await db.collection('users')
      .orderBy('referrals', 'desc')
      .limit(parseInt(limit))
      .get();
    
    const leaderboard = await Promise.all(
      usersSnapshot.docs.map(async (doc) => {
        const userData = { telegramId: doc.id, ...doc.data() };
        
        // Calculate total referral earnings for this user
        const commissionsSnapshot = await db.collection('referral_commissions')
          .where('referrerId', '==', doc.id)
          .get();
        
        let totalReferralEarnings = 0;
        commissionsSnapshot.docs.forEach(commissionDoc => {
          totalReferralEarnings += commissionDoc.data().amount;
        });
        
        // Add verification rewards
        const verifiedReferrals = userData.referrals ? userData.referrals.filter(async (referralId) => {
          const referralUser = await User.findByTelegramId(referralId);
          return referralUser && referralUser.isVerifiedReferral;
        }).length : 0;
        
        totalReferralEarnings += verifiedReferrals * parseFloat(process.env.REFERRAL_REWARD);
        
        return {
          telegramId: userData.telegramId,
          username: userData.username,
          firstName: userData.firstName,
          totalReferrals: userData.referrals ? userData.referrals.length : 0,
          totalReferralEarnings,
          totalEarned: userData.totalEarned || 0
        };
      })
    );
    
    // Sort by total referral earnings
    leaderboard.sort((a, b) => b.totalReferralEarnings - a.totalReferralEarnings);
    
    res.json({
      leaderboard,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate referral code
router.get('/validate/:referralCode', async (req, res) => {
  try {
    const { referralCode } = req.params;
    
    const referrer = await User.findByReferralCode(referralCode);
    
    if (!referrer) {
      return res.status(404).json({ 
        valid: false, 
        error: 'Invalid referral code' 
      });
    }
    
    res.json({
      valid: true,
      referrer: {
        username: referrer.username,
        firstName: referrer.firstName,
        totalReferrals: referrer.referrals.length
      }
    });
  } catch (error) {
    console.error('Validate referral error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;