const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const Withdrawal = require('../models/Withdrawal');
const { db } = require('../firebase-config');
const router = express.Router();

// Simple admin authentication middleware
const adminAuth = (req, res, next) => {
  const { password } = req.headers;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Get dashboard statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    // Get user statistics
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.adsWatched > 0).length;
    const totalEarned = users.reduce((sum, u) => sum + (u.totalEarned || 0), 0);
    const totalWithdrawn = users.reduce((sum, u) => sum + (u.totalWithdrawn || 0), 0);
    
    // Get withdrawal statistics
    const withdrawalStats = await Withdrawal.getTotalStats();
    
    // Get task statistics
    const tasks = await Task.getAll();
    const totalTasks = tasks.length;
    const totalTaskCompletions = tasks.reduce((sum, t) => sum + (t.completedBy?.length || 0), 0);
    
    // Get referral statistics
    const totalReferrals = users.reduce((sum, u) => sum + (u.referrals?.length || 0), 0);
    const verifiedReferrals = users.filter(u => u.isVerifiedReferral).length;
    
    // Recent activity
    const recentUsers = users
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(u => ({
        telegramId: u.telegramId,
        username: u.username,
        firstName: u.firstName,
        trxBalance: u.trxBalance,
        totalEarned: u.totalEarned,
        adsWatched: u.adsWatched,
        createdAt: u.createdAt,
        isBlocked: u.isBlocked
      }));
    
    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalEarned,
        totalWithdrawn,
        totalReferrals,
        verifiedReferrals,
        totalTasks,
        totalTaskCompletions
      },
      withdrawalStats,
      recentUsers
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users with pagination
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', blocked = '' } = req.query;
    
    let query = db.collection('users');
    
    // Apply filters
    if (blocked === 'true') {
      query = query.where('isBlocked', '==', true);
    } else if (blocked === 'false') {
      query = query.where('isBlocked', '==', false);
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();
    
    let users = snapshot.docs.map(doc => ({ telegramId: doc.id, ...doc.data() }));
    
    // Apply search filter (client-side for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u => 
        u.username?.toLowerCase().includes(searchLower) ||
        u.firstName?.toLowerCase().includes(searchLower) ||
        u.telegramId.toString().includes(search)
      );
    }
    
    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.length
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user details
router.get('/users/:telegramId', adminAuth, async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's withdrawals
    const withdrawals = await Withdrawal.findByTelegramId(telegramId, 10);
    
    // Get user's transactions
    const transactionsSnapshot = await db.collection('transactions')
      .where('telegramId', '==', telegramId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    
    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));
    
    res.json({
      user,
      withdrawals,
      transactions
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Block/Unblock user
router.post('/users/:telegramId/block', adminAuth, async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { blocked, reason = '' } = req.body;
    
    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.isBlocked = blocked;
    if (blocked) {
      user.blockReason = reason;
      user.blockedAt = new Date();
    } else {
      user.blockReason = null;
      user.blockedAt = null;
    }
    
    await user.save();
    
    res.json({
      message: `User ${blocked ? 'blocked' : 'unblocked'} successfully`,
      user: {
        telegramId: user.telegramId,
        isBlocked: user.isBlocked,
        blockReason: user.blockReason
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all pending withdrawals
router.get('/withdrawals/pending', adminAuth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const withdrawals = await Withdrawal.getPending(parseInt(limit));
    
    // Enrich with user data
    const enrichedWithdrawals = await Promise.all(
      withdrawals.map(async (withdrawal) => {
        const user = await User.findByTelegramId(withdrawal.telegramId);
        return {
          ...withdrawal,
          user: user ? {
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName
          } : null
        };
      })
    );
    
    res.json({ withdrawals: enrichedWithdrawals });
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all withdrawals with filtering
router.get('/withdrawals', adminAuth, async (req, res) => {
  try {
    const { status = null, limit = 100 } = req.query;
    
    const withdrawals = await Withdrawal.getAll(parseInt(limit), status);
    
    res.json({ withdrawals });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve withdrawal
router.post('/withdrawals/:withdrawalId/approve', adminAuth, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { txHash = '', notes = '' } = req.body;
    
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal is not pending' });
    }
    
    await withdrawal.approve('admin', txHash, notes);
    
    res.json({
      message: 'Withdrawal approved successfully',
      withdrawal
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject withdrawal
router.post('/withdrawals/:withdrawalId/reject', adminAuth, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { notes = '' } = req.body;
    
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal is not pending' });
    }
    
    await withdrawal.reject('admin', notes);
    
    res.json({
      message: 'Withdrawal rejected successfully',
      withdrawal
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tasks
router.get('/tasks', adminAuth, async (req, res) => {
  try {
    const tasks = await Task.getAll();
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new task
router.post('/tasks', adminAuth, async (req, res) => {
  try {
    const taskData = req.body;
    
    const task = new Task(taskData);
    await task.save();
    
    res.json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task
router.put('/tasks/:taskId', adminAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    Object.assign(task, updateData);
    await task.save();
    
    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete task
router.delete('/tasks/:taskId', adminAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await task.delete();
    
    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manually adjust user balance
router.post('/users/:telegramId/adjust-balance', adminAuth, async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { amount, reason = 'Admin adjustment' } = req.body;
    
    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const adjustmentAmount = parseFloat(amount);
    if (adjustmentAmount > 0) {
      await user.addBalance(adjustmentAmount, 'admin_credit');
    } else {
      await user.subtractBalance(Math.abs(adjustmentAmount), 'admin_debit');
    }
    
    // Log the adjustment
    await db.collection('admin_actions').add({
      action: 'balance_adjustment',
      targetUser: telegramId,
      amount: adjustmentAmount,
      reason,
      timestamp: new Date(),
      adminId: 'admin'
    });
    
    res.json({
      message: 'Balance adjusted successfully',
      newBalance: user.trxBalance,
      adjustment: adjustmentAmount
    });
  } catch (error) {
    console.error('Adjust balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system logs
router.get('/logs', adminAuth, async (req, res) => {
  try {
    const { limit = 50, type = '' } = req.query;
    
    let query = db.collection('admin_actions');
    
    if (type) {
      query = query.where('action', '==', type);
    }
    
    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();
    
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));
    
    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;