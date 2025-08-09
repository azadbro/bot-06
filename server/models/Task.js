const { db } = require('../firebase-config');

class Task {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.type = data.type; // 'telegram_channel', 'telegram_bot', 'external_link'
    this.url = data.url;
    this.reward = data.reward;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.requiredAction = data.requiredAction; // 'join', 'start', 'visit'
    this.verificationMethod = data.verificationMethod; // 'manual', 'automatic'
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.completedBy = data.completedBy || [];
  }

  static async getAll() {
    try {
      const snapshot = await db.collection('tasks')
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => new Task({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  static async findById(taskId) {
    try {
      const doc = await db.collection('tasks').doc(taskId).get();
      if (doc.exists) {
        return new Task({ id: doc.id, ...doc.data() });
      }
      return null;
    } catch (error) {
      console.error('Error finding task:', error);
      throw error;
    }
  }

  async save() {
    try {
      this.updatedAt = new Date();
      const taskData = { ...this };
      delete taskData.id; // Don't store id in the document
      
      if (this.id) {
        await db.collection('tasks').doc(this.id).set(taskData, { merge: true });
      } else {
        const docRef = await db.collection('tasks').add(taskData);
        this.id = docRef.id;
      }
      return this;
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  }

  async delete() {
    try {
      if (this.id) {
        await db.collection('tasks').doc(this.id).delete();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async markCompleted(telegramId) {
    if (!this.completedBy.includes(telegramId)) {
      this.completedBy.push(telegramId);
      await this.save();
    }
  }

  isCompletedBy(telegramId) {
    return this.completedBy.includes(telegramId);
  }

  static async getDefaultTasks() {
    return [
      {
        title: "Join our Telegram Channel",
        description: "Join our main announcement channel to stay updated",
        type: "telegram_channel",
        url: "https://t.me/trxearnofficial",
        reward: 0.01,
        requiredAction: "join",
        verificationMethod: "manual"
      },
      {
        title: "Follow our Updates Channel",
        description: "Get the latest news and updates about TRX Earn",
        type: "telegram_channel",
        url: "https://t.me/trxearnupdates",
        reward: 0.015,
        requiredAction: "join",
        verificationMethod: "manual"
      },
      {
        title: "Start our Support Bot",
        description: "Start our support bot for help and assistance",
        type: "telegram_bot",
        url: "https://t.me/trxearnsupportbot",
        reward: 0.008,
        requiredAction: "start",
        verificationMethod: "manual"
      },
      {
        title: "Visit our Website",
        description: "Check out our official website for more information",
        type: "external_link",
        url: "https://trxearn.com",
        reward: 0.005,
        requiredAction: "visit",
        verificationMethod: "manual"
      }
    ];
  }

  static async initializeDefaultTasks() {
    try {
      const existingTasks = await Task.getAll();
      if (existingTasks.length === 0) {
        const defaultTasks = Task.getDefaultTasks();
        
        for (const taskData of defaultTasks) {
          const task = new Task(taskData);
          await task.save();
        }
        
        console.log('Default tasks initialized');
      }
    } catch (error) {
      console.error('Error initializing default tasks:', error);
    }
  }
}

module.exports = Task;