import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

// Import components
import BottomNavigation from './components/BottomNavigation';
import WalletSection from './components/WalletSection';
import EarnSection from './components/EarnSection';
import TasksSection from './components/TasksSection';
import ReferralSection from './components/ReferralSection';
import LoadingScreen from './components/LoadingScreen';

// Set axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api');

function App() {
  const [activeSection, setActiveSection] = useState('wallet');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [telegramWebApp, setTelegramWebApp] = useState(null);

  // Initialize Telegram Web App
  useEffect(() => {
    const initTelegramWebApp = () => {
      if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        setTelegramWebApp(tg);
        
        // Expand to full screen
        tg.expand();
        
        // Set theme
        tg.setHeaderColor('#667eea');
        tg.setBackgroundColor('#667eea');
        
        // Ready
        tg.ready();
        
        return tg;
      }
      return null;
    };

    const tg = initTelegramWebApp();
    
    // For development/testing without Telegram
    if (!tg) {
      console.log('Telegram Web App not available - using mock data for development');
      setTelegramWebApp({
        initDataUnsafe: {
          user: {
            id: 123456789,
            first_name: "Test",
            last_name: "User",
            username: "testuser"
          }
        },
        initData: "user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22testuser%22%7D"
      });
    }
  }, []);

  // Login user
  useEffect(() => {
    const loginUser = async () => {
      if (!telegramWebApp) return;

      try {
        setLoading(true);
        
        // Get referral code from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('start') || urlParams.get('ref');
        
        const response = await axios.post('/auth/login', {
          initData: telegramWebApp.initData || 'mock_data',
          referralCode
        });
        
        setUser(response.data.user);
        toast.success(`Welcome ${response.data.user.firstName}! 🎉`);
      } catch (error) {
        console.error('Login error:', error);
        toast.error('Failed to login. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loginUser();
  }, [telegramWebApp]);

  // Refresh user data
  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`/auth/profile/${user.telegramId}`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // Section transitions
  const sectionVariants = {
    initial: { opacity: 0, x: 100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -100 }
  };

  const sectionTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'wallet':
        return (
          <WalletSection 
            user={user} 
            refreshUser={refreshUser}
            telegramWebApp={telegramWebApp}
          />
        );
      case 'earn':
        return (
          <EarnSection 
            user={user} 
            refreshUser={refreshUser}
            telegramWebApp={telegramWebApp}
          />
        );
      case 'tasks':
        return (
          <TasksSection 
            user={user} 
            refreshUser={refreshUser}
            telegramWebApp={telegramWebApp}
          />
        );
      case 'referral':
        return (
          <ReferralSection 
            user={user} 
            refreshUser={refreshUser}
            telegramWebApp={telegramWebApp}
          />
        );
      default:
        return <WalletSection user={user} refreshUser={refreshUser} />;
    }
  };

  return (
    <div className="twa-container">
      <div style={{ 
        minHeight: '100vh', 
        paddingBottom: '80px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6 px-4"
        >
          <h1 className="text-white text-2xl font-bold mb-2">
            TRX Earn Bot 💎
          </h1>
          <p className="text-white text-opacity-80 text-sm">
            Earn TRX by watching ads and completing tasks
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial="initial"
              animate="in"
              exit="out"
              variants={sectionVariants}
              transition={sectionTransition}
            >
              {renderActiveSection()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation 
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
        />
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(255, 255, 255, 0.9)',
            color: '#333',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500'
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: 'white'
            }
          },
          error: {
            iconTheme: {
              primary: '#f87171',
              secondary: 'white'
            }
          }
        }}
      />
    </div>
  );
}

export default App;