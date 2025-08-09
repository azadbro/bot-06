const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();

// Validate Telegram Web App data
function validateTelegramWebAppData(data, token) {
  try {
    const urlParams = new URLSearchParams(data);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    return calculatedHash === hash;
  } catch (error) {
    console.error('Error validating Telegram data:', error);
    return false;
  }
}

// Login/Register user
router.post('/login', async (req, res) => {
  try {
    const { initData, referralCode } = req.body;
    
    if (!validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN)) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }
    
    const urlParams = new URLSearchParams(initData);
    const userDataString = urlParams.get('user');
    const userData = JSON.parse(userDataString);
    
    let user = await User.findByTelegramId(userData.id);
    
    if (!user) {
      // Create new user
      const newUserData = {
        telegramId: userData.id,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name
      };
      
      // Handle referral code
      if (referralCode) {
        const referrer = await User.findByReferralCode(referralCode);
        if (referrer) {
          newUserData.referredBy = referrer.telegramId;
          // Add user to referrer's list
          await referrer.addReferral(userData.id);
        }
      }
      
      user = new User(newUserData);
      await user.save();
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account is blocked' });
    }
    
    // Return user data without sensitive information
    const safeUserData = {
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      trxBalance: user.trxBalance,
      trxWallet: user.trxWallet,
      totalEarned: user.totalEarned,
      adsWatched: user.adsWatched,
      referralCode: user.referralCode,
      referrals: user.referrals.length,
      isVerifiedReferral: user.isVerifiedReferral,
      canWatchAd: user.canWatchAd(),
      lastAdWatch: user.lastAdWatch
    };
    
    res.json({ user: safeUserData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findByTelegramId(telegramId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const safeUserData = {
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      trxBalance: user.trxBalance,
      trxWallet: user.trxWallet,
      totalEarned: user.totalEarned,
      adsWatched: user.adsWatched,
      referralCode: user.referralCode,
      referrals: user.referrals.length,
      isVerifiedReferral: user.isVerifiedReferral,
      canWatchAd: user.canWatchAd(),
      lastAdWatch: user.lastAdWatch
    };
    
    res.json({ user: safeUserData });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update TRX wallet address
router.post('/wallet/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { walletAddress } = req.body;
    
    if (!walletAddress || !walletAddress.match(/^T[A-Za-z1-9]{33}$/)) {
      return res.status(400).json({ error: 'Invalid TRX wallet address' });
    }
    
    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.trxWallet = walletAddress;
    await user.save();
    
    res.json({ message: 'Wallet address updated successfully' });
  } catch (error) {
    console.error('Wallet update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;