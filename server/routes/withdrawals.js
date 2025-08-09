const express = require('express');
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const router = express.Router();

// Request withdrawal
router.post('/:telegramId/request', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { amount, toAddress } = req.body;
    
    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account is blocked' });
    }
    
    // Validate amount
    const withdrawalAmount = parseFloat(amount);
    const minimumWithdrawal = parseFloat(process.env.MINIMUM_WITHDRAWAL);
    
    if (withdrawalAmount < minimumWithdrawal) {
      return res.status(400).json({ 
        error: `Minimum withdrawal amount is ${minimumWithdrawal} TRX` 
      });
    }
    
    if (withdrawalAmount > user.trxBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Validate TRX address
    if (!toAddress || !toAddress.match(/^T[A-Za-z1-9]{33}$/)) {
      return res.status(400).json({ error: 'Invalid TRX wallet address' });
    }
    
    // Check for pending withdrawals
    const pendingWithdrawals = await Withdrawal.findByTelegramId(telegramId);
    const hasPendingWithdrawal = pendingWithdrawals.some(w => w.status === 'pending');
    
    if (hasPendingWithdrawal) {
      return res.status(400).json({ 
        error: 'You have a pending withdrawal request. Please wait for it to be processed.' 
      });
    }
    
    // Deduct balance from user
    await user.subtractBalance(withdrawalAmount, 'withdrawal');
    
    // Create withdrawal request
    const withdrawal = await Withdrawal.create(telegramId, withdrawalAmount, toAddress);
    
    res.json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        commission: withdrawal.commission,
        netAmount: withdrawal.netAmount,
        toAddress: withdrawal.toAddress,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt
      },
      newBalance: user.trxBalance
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get withdrawal history
router.get('/:telegramId/history', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { limit = 10 } = req.query;
    
    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const withdrawals = await Withdrawal.findByTelegramId(telegramId, parseInt(limit));
    
    const withdrawalHistory = withdrawals.map(w => ({
      id: w.id,
      amount: w.amount,
      commission: w.commission,
      netAmount: w.netAmount,
      toAddress: w.toAddress,
      status: w.status,
      txHash: w.txHash,
      createdAt: w.createdAt,
      processedAt: w.processedAt,
      adminNotes: w.adminNotes
    }));
    
    res.json({
      withdrawals: withdrawalHistory,
      totalWithdrawn: user.totalWithdrawn,
      pendingAmount: withdrawals
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0)
    });
  } catch (error) {
    console.error('Withdrawal history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get withdrawal status
router.get('/:telegramId/status/:withdrawalId', async (req, res) => {
  try {
    const { telegramId, withdrawalId } = req.params;
    
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    if (withdrawal.telegramId !== telegramId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        commission: withdrawal.commission,
        netAmount: withdrawal.netAmount,
        toAddress: withdrawal.toAddress,
        status: withdrawal.status,
        txHash: withdrawal.txHash,
        createdAt: withdrawal.createdAt,
        processedAt: withdrawal.processedAt,
        adminNotes: withdrawal.adminNotes
      }
    });
  } catch (error) {
    console.error('Withdrawal status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel withdrawal (only if pending)
router.post('/:telegramId/cancel/:withdrawalId', async (req, res) => {
  try {
    const { telegramId, withdrawalId } = req.params;
    
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    if (withdrawal.telegramId !== telegramId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot cancel processed withdrawal' });
    }
    
    // Refund the amount to user
    const user = await User.findByTelegramId(telegramId);
    if (user) {
      await user.addBalance(withdrawal.amount, 'withdrawal_cancelled');
    }
    
    // Update withdrawal status
    withdrawal.status = 'cancelled';
    withdrawal.processedAt = new Date();
    withdrawal.adminNotes = 'Cancelled by user';
    await withdrawal.save();
    
    res.json({
      message: 'Withdrawal cancelled successfully',
      refundedAmount: withdrawal.amount,
      newBalance: user.trxBalance
    });
  } catch (error) {
    console.error('Cancel withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get withdrawal statistics
router.get('/:telegramId/stats', async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const allWithdrawals = await Withdrawal.findByTelegramId(telegramId, 100);
    
    const stats = {
      totalRequests: allWithdrawals.length,
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0,
      totalAmount: user.totalWithdrawn,
      totalCommissions: 0,
      averageAmount: 0
    };
    
    allWithdrawals.forEach(w => {
      stats[w.status]++;
      if (w.status === 'completed' || w.status === 'approved') {
        stats.totalCommissions += w.commission;
      }
    });
    
    if (stats.totalRequests > 0) {
      stats.averageAmount = stats.totalAmount / (stats.completed + stats.approved);
    }
    
    res.json({
      ...stats,
      minimumWithdrawal: parseFloat(process.env.MINIMUM_WITHDRAWAL),
      commissionRate: parseFloat(process.env.WITHDRAWAL_COMMISSION) * 100,
      currentBalance: user.trxBalance
    });
  } catch (error) {
    console.error('Withdrawal stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;