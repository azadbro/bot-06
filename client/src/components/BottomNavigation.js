import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Monitor, 
  CheckSquare, 
  Users,
  TrendingUp
} from 'lucide-react';

const BottomNavigation = ({ activeSection, setActiveSection, user }) => {
  const navItems = [
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet,
      color: '#667eea'
    },
    {
      id: 'earn',
      label: 'Earn',
      icon: Monitor,
      color: '#56ccf2'
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      color: '#f093fb'
    },
    {
      id: 'referral',
      label: 'Referral',
      icon: Users,
      color: '#4ade80'
    }
  ];

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    
    // Haptic feedback for Telegram
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg border-t border-white border-opacity-20"
      style={{ zIndex: 1000 }}
    >
      <div className="flex justify-around items-center py-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className="flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[60px]"
              whileTap={{ scale: 0.95 }}
              style={{
                background: isActive 
                  ? `linear-gradient(45deg, ${item.color}, ${item.color}80)` 
                  : 'transparent'
              }}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  rotateY: isActive ? 360 : 0
                }}
                transition={{ duration: 0.3 }}
              >
                <Icon 
                  size={20} 
                  color={isActive ? 'white' : 'rgba(255, 255, 255, 0.7)'} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </motion.div>
              
              <motion.span 
                className={`text-xs mt-1 font-medium ${
                  isActive ? 'text-white' : 'text-white text-opacity-70'
                }`}
                animate={{
                  scale: isActive ? 1.05 : 1
                }}
                transition={{ duration: 0.3 }}
              >
                {item.label}
              </motion.span>
              
              {/* Notification badges */}
              {item.id === 'wallet' && user?.trxBalance > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
                />
              )}
              
              {item.id === 'earn' && user?.canWatchAd && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"
                />
              )}
              
              {item.id === 'referral' && user?.referrals > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-purple-400 rounded-full border-2 border-white flex items-center justify-center"
                >
                  <span className="text-xs text-white font-bold">
                    {user.referrals > 9 ? '9+' : user.referrals}
                  </span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Active section indicator */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 rounded-t-lg"
        style={{
          background: navItems.find(item => item.id === activeSection)?.color || '#667eea'
        }}
        layoutId="activeIndicator"
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default BottomNavigation;