const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const router = express.Router();

// Get all available tasks for a user
router.get('/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findByTelegramId(telegramId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tasks = await Task.getAll();
    
    // Add completion status for each task
    const tasksWithStatus = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      url: task.url,
      reward: task.reward,
      requiredAction: task.requiredAction,
      isCompleted: user.tasksCompleted.includes(task.id),
      canComplete: !user.tasksCompleted.includes(task.id)
    }));
    
    res.json({
      tasks: tasksWithStatus,
      totalTasks: tasks.length,
      completedTasks: user.tasksCompleted.length
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete a task
router.post('/:telegramId/complete/:taskId', async (req, res) => {
  try {
    const { telegramId, taskId } = req.params;
    
    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account is blocked' });
    }
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (!task.isActive) {
      return res.status(400).json({ error: 'Task is not active' });
    }
    
    if (user.tasksCompleted.includes(taskId)) {
      return res.status(400).json({ error: 'Task already completed' });
    }
    
    // Complete the task
    await user.completeTask(taskId, task.reward);
    await task.markCompleted(telegramId);
    
    res.json({
      message: 'Task completed successfully',
      reward: task.reward,
      newBalance: user.trxBalance,
      taskTitle: task.title
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get task statistics
router.get('/:telegramId/stats', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findByTelegramId(telegramId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const allTasks = await Task.getAll();
    const completedTasks = user.tasksCompleted.length;
    const availableTasks = allTasks.length - completedTasks;
    
    // Calculate total possible earnings from tasks
    let totalPossibleEarnings = 0;
    let totalEarnedFromTasks = 0;
    
    for (const task of allTasks) {
      totalPossibleEarnings += task.reward;
      if (user.tasksCompleted.includes(task.id)) {
        totalEarnedFromTasks += task.reward;
      }
    }
    
    res.json({
      totalTasks: allTasks.length,
      completedTasks,
      availableTasks,
      totalEarnedFromTasks,
      totalPossibleEarnings,
      completionPercentage: allTasks.length > 0 ? (completedTasks / allTasks.length) * 100 : 0
    });
  } catch (error) {
    console.error('Task stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify task completion (for admin or automatic verification)
router.post('/:telegramId/verify/:taskId', async (req, res) => {
  try {
    const { telegramId, taskId } = req.params;
    const { verified } = req.body;
    
    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (verified && !user.tasksCompleted.includes(taskId)) {
      await user.completeTask(taskId, task.reward);
      await task.markCompleted(telegramId);
      
      res.json({
        message: 'Task verified and completed',
        reward: task.reward,
        newBalance: user.trxBalance
      });
    } else if (!verified) {
      res.json({
        message: 'Task verification failed'
      });
    } else {
      res.json({
        message: 'Task already completed'
      });
    }
  } catch (error) {
    console.error('Verify task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;