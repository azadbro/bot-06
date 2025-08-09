import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  ExternalLink, 
  Award, 
  Users, 
  MessageSquare,
  Bot,
  Globe,
  Check,
  Clock,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const TasksSection = ({ user, refreshUser, telegramWebApp }) => {
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState(null);

  // Load tasks and stats
  useEffect(() => {
    const loadTasksAndStats = async () => {
      if (!user) return;
      
      try {
        const [tasksResponse, statsResponse] = await Promise.all([
          axios.get(`/tasks/${user.telegramId}`),
          axios.get(`/tasks/${user.telegramId}/stats`)
        ]);
        
        setTasks(tasksResponse.data.tasks);
        setTaskStats(statsResponse.data);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    loadTasksAndStats();
  }, [user]);

  const getTaskIcon = (type) => {
    switch (type) {
      case 'telegram_channel':
        return Users;
      case 'telegram_bot':
        return Bot;
      case 'external_link':
        return Globe;
      default:
        return CheckSquare;
    }
  };

  const getTaskIconColor = (type) => {
    switch (type) {
      case 'telegram_channel':
        return '#3b82f6';
      case 'telegram_bot':
        return '#8b5cf6';
      case 'external_link':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getActionText = (requiredAction) => {
    switch (requiredAction) {
      case 'join':
        return 'Join';
      case 'start':
        return 'Start';
      case 'visit':
        return 'Visit';
      default:
        return 'Complete';
    }
  };

  const handleTaskAction = (task) => {
    // Open the task URL
    if (telegramWebApp && telegramWebApp.openTelegramLink && task.type !== 'external_link') {
      telegramWebApp.openTelegramLink(task.url);
    } else {
      window.open(task.url, '_blank');
    }
    
    // Haptic feedback
    if (telegramWebApp?.HapticFeedback) {
      telegramWebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      setCompletingTask(taskId);
      
      const response = await axios.post(`/tasks/${user.telegramId}/complete/${taskId}`);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, isCompleted: true, canComplete: false }
            : task
        )
      );
      
      await refreshUser();
      
      // Reload stats
      const statsResponse = await axios.get(`/tasks/${user.telegramId}/stats`);
      setTaskStats(statsResponse.data);
      
      toast.success(`🎉 Task completed! You earned ${response.data.reward} TRX!`);
      
      // Haptic feedback
      if (telegramWebApp?.HapticFeedback) {
        telegramWebApp.HapticFeedback.notificationOccurred('success');
      }
      
    } catch (error) {
      console.error('Task completion error:', error);
      toast.error(error.response?.data?.error || 'Failed to complete task');
    } finally {
      setCompletingTask(null);
    }
  };

  const formatTRX = (amount) => {
    return parseFloat(amount).toFixed(6);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Task Statistics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card card-dark"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
            <Award size={24} color="white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Task Progress</h3>
            <p className="text-white text-opacity-70 text-sm">Complete tasks to earn TRX</p>
          </div>
        </div>

        {taskStats && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {taskStats.completedTasks}
                </div>
                <p className="text-white text-opacity-70 text-xs">Completed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {taskStats.availableTasks}
                </div>
                <p className="text-white text-opacity-70 text-xs">Available</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {taskStats.completionPercentage.toFixed(0)}%
                </div>
                <p className="text-white text-opacity-70 text-xs">Progress</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white bg-opacity-20 rounded-full h-2 overflow-hidden mb-3">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${taskStats.completionPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>

            <div className="flex justify-between text-white text-opacity-80 text-sm">
              <span>Earned: {formatTRX(taskStats.totalEarnedFromTasks)} TRX</span>
              <span>Possible: {formatTRX(taskStats.totalPossibleEarnings)} TRX</span>
            </div>
          </>
        )}
      </motion.div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-8"
          >
            <CheckSquare size={48} className="text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-600 mb-2">No Tasks Available</h4>
            <p className="text-sm text-gray-500">
              Check back later for new tasks to complete!
            </p>
          </motion.div>
        ) : (
          tasks.map((task, index) => {
            const Icon = getTaskIcon(task.type);
            const iconColor = getTaskIconColor(task.type);
            
            return (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`card ${task.isCompleted ? 'bg-green-50 border-green-200' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${iconColor}20` }}
                  >
                    {task.isCompleted ? (
                      <Check size={20} color="#4ade80" />
                    ) : (
                      <Icon size={20} color={iconColor} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={`font-semibold ${task.isCompleted ? 'text-green-700' : ''}`}>
                          {task.title}
                        </h4>
                        <p className={`text-sm ${task.isCompleted ? 'text-green-600' : 'text-gray-600'} mt-1`}>
                          {task.description}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className={`text-lg font-bold ${task.isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                          +{formatTRX(task.reward)} TRX
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      {task.isCompleted ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <Check size={16} />
                          <span className="font-medium">Completed</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleTaskAction(task)}
                            className="btn btn-primary text-sm px-4 py-2"
                          >
                            <ExternalLink size={14} />
                            {getActionText(task.requiredAction)}
                          </button>
                          
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={completingTask === task.id}
                            className="btn btn-success text-sm px-4 py-2"
                          >
                            {completingTask === task.id ? (
                              <div className="spinner" />
                            ) : (
                              <>
                                <CheckSquare size={14} />
                                Claim
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* Task Type Badge */}
                    <div className="mt-2">
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${iconColor}15`,
                          color: iconColor
                        }}
                      >
                        <Icon size={12} />
                        {task.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Task Completion Tips */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={20} className="text-blue-500" />
          <h4 className="font-semibold">How to Complete Tasks</h4>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
            <span>Click the action button to open the link</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
            <span>Complete the required action (join channel, start bot, etc.)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
            <span>Return to this page and click "Claim" to receive your reward</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-700 text-sm">
            <Clock size={16} />
            <span className="font-medium">
              Note: Task verification may take a few moments to process
            </span>
          </div>
        </div>
      </motion.div>

      {/* Earning Potential */}
      {taskStats && taskStats.availableTasks > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={20} className="text-green-500" />
            <h4 className="font-semibold">Earning Potential</h4>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            Complete all remaining tasks to earn an additional{' '}
            <span className="font-bold text-green-600">
              {formatTRX(taskStats.totalPossibleEarnings - taskStats.totalEarnedFromTasks)} TRX
            </span>
          </p>
          
          <div className="text-xs text-gray-500">
            💡 Tasks are one-time rewards that help grow our community
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TasksSection;