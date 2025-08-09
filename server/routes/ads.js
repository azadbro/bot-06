const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Watch ad and get reward
router.post('/watch/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findByTelegramId(telegramId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account is blocked' });
    }
    
    if (!user.canWatchAd()) {
      const remainingTime = Math.ceil((parseInt(process.env.AD_COOLDOWN_SECONDS) * 1000 - (Date.now() - new Date(user.lastAdWatch).getTime())) / 1000);
      return res.status(429).json({ 
        error: 'Ad cooldown active',
        remainingTime 
      });
    }
    
    await user.watchAd();
    
    res.json({
      message: 'Ad reward granted',
      reward: parseFloat(process.env.AD_REWARD),
      newBalance: user.trxBalance,
      adsWatched: user.adsWatched,
      canWatchAd: user.canWatchAd(),
      isVerifiedReferral: user.isVerifiedReferral
    });
  } catch (error) {
    console.error('Ad watch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get ad status (can watch or cooldown time)
router.get('/status/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findByTelegramId(telegramId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const canWatch = user.canWatchAd();
    let remainingTime = 0;
    
    if (!canWatch && user.lastAdWatch) {
      const cooldownMs = parseInt(process.env.AD_COOLDOWN_SECONDS) * 1000;
      const timeSinceLastAd = Date.now() - new Date(user.lastAdWatch).getTime();
      remainingTime = Math.ceil((cooldownMs - timeSinceLastAd) / 1000);
    }
    
    res.json({
      canWatchAd: canWatch,
      remainingTime,
      adsWatched: user.adsWatched,
      lastAdWatch: user.lastAdWatch,
      adReward: parseFloat(process.env.AD_REWARD),
      cooldownSeconds: parseInt(process.env.AD_COOLDOWN_SECONDS)
    });
  } catch (error) {
    console.error('Ad status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get ad statistics
router.get('/stats/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findByTelegramId(telegramId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const totalEarnedFromAds = user.adsWatched * parseFloat(process.env.AD_REWARD);
    
    res.json({
      adsWatched: user.adsWatched,
      totalEarnedFromAds,
      averageEarningsPerAd: parseFloat(process.env.AD_REWARD),
      isVerifiedReferral: user.isVerifiedReferral,
      adsNeededForVerification: Math.max(0, parseInt(process.env.REFERRAL_VERIFICATION_ADS) - user.adsWatched)
    });
  } catch (error) {
    console.error('Ad stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;