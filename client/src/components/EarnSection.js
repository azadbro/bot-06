import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  Play, 
  Clock, 
  Award, 
  BarChart3,
  Eye,
  Timer,
  Zap
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const EarnSection = ({ user, refreshUser, telegramWebApp }) => {
  const [adStatus, setAdStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [adStats, setAdStats] = useState(null);

  // Load ad status
  useEffect(() => {
    const loadAdStatus = async () => {
      if (!user) return;
      
      try {
        const [statusResponse, statsResponse] = await Promise.all([
          axios.get(`/ads/status/${user.telegramId}`),
          axios.get(`/ads/stats/${user.telegramId}`)
        ]);
        
        setAdStatus(statusResponse.data);
        setAdStats(statsResponse.data);
        
        if (!statusResponse.data.canWatchAd) {
          setCountdown(statusResponse.data.remainingTime);
        }
      } catch (error) {
        console.error('Failed to load ad status:', error);
      }
    };

    loadAdStatus();
  }, [user]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Refresh ad status when countdown ends
            if (user) {
              axios.get(`/ads/status/${user.telegramId}`)
                .then(response => setAdStatus(response.data))
                .catch(console.error);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdown, user]);

  // Load Monetag ad script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.show_9682261) {
      const script = document.createElement('script');
      script.src = '//libtl.com/sdk.js';
      script.setAttribute('data-zone', '9682261');
      script.setAttribute('data-sdk', 'show_9682261');
      script.async = true;
      document.head.appendChild(script);

      return () => {
        // Cleanup script if component unmounts
        try {
          document.head.removeChild(script);
        } catch (e) {
          // Script may have already been removed
        }
      };
    }
  }, []);

  const handleWatchAd = async () => {
    if (!adStatus?.canWatchAd) {
      toast.error('Please wait for the cooldown to finish');
      return;
    }

    if (!window.show_9682261) {
      toast.error('Ad service is not available. Please try again later.');
      return;
    }

    try {
      setLoading(true);
      
      // Show the interstitial ad
      await window.show_9682261();
      
      // If ad was shown successfully, reward the user
      const response = await axios.post(`/ads/watch/${user.telegramId}`);
      
      await refreshUser();
      setAdStatus(response.data);
      setCountdown(response.data.canWatchAd ? 0 : 15); // 15 second cooldown
      
      // Reload stats
      const statsResponse = await axios.get(`/ads/stats/${user.telegramId}`);
      setAdStats(statsResponse.data);
      
      toast.success(`🎉 You earned ${response.data.reward} TRX!`);
      
      // Haptic feedback
      if (telegramWebApp?.HapticFeedback) {
        telegramWebApp.HapticFeedback.notificationOccurred('success');
      }
      
    } catch (error) {
      console.error('Ad watch error:', error);
      toast.error(error.response?.data?.error || 'Failed to watch ad. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTRX = (amount) => {
    return parseFloat(amount).toFixed(6);
  };

  if (!user || !adStatus) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Ad Watching Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card card-dark text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <Monitor size={32} color="white" />
          </div>
        </div>
        
        <h3 className="text-white text-xl font-bold mb-2">Watch Ads & Earn TRX</h3>
        <p className="text-white text-opacity-80 text-sm mb-6">
          Earn {adStatus.adReward} TRX for each ad you watch
        </p>

        {adStatus.canWatchAd ? (
          <motion.button
            onClick={handleWatchAd}
            disabled={loading}
            className="btn btn-success w-full text-lg py-4"
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                '0 0 20px rgba(86, 204, 242, 0.5)',
                '0 0 30px rgba(86, 204, 242, 0.8)',
                '0 0 20px rgba(86, 204, 242, 0.5)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="spinner" />
                Loading Ad...
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center">
                <Play size={20} />
                Watch Ad Now!
              </div>
            )}
          </motion.button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-white">
              <Timer size={20} />
              <span className="text-lg font-bold">
                Next ad in: {formatTime(countdown)}
              </span>
            </div>
            <button className="btn btn-disabled w-full text-lg py-4" disabled>
              <Clock size={20} />
              Cooldown Active
            </button>
            <p className="text-white text-opacity-60 text-sm">
              Ads are available every {adStatus.cooldownSeconds} seconds
            </p>
          </div>
        )}
      </motion.div>

      {/* Ad Statistics */}
      {adStats && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} className="text-blue-500" />
            <h4 className="font-semibold">Your Ad Statistics</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500 mb-1">
                {adStats.adsWatched}
              </div>
              <p className="text-sm text-gray-600">Ads Watched</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500 mb-1">
                {formatTRX(adStats.totalEarnedFromAds)}
              </div>
              <p className="text-sm text-gray-600">TRX Earned</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Average per ad:</span>
              <span className="font-semibold">{formatTRX(adStats.averageEarningsPerAd)} TRX</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Referral Verification Progress */}
      {user.referredBy && !user.isVerifiedReferral && adStats && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-3">
            <Award size={20} className="text-orange-500" />
            <h4 className="font-semibold">Referral Verification</h4>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            Watch {adStats.adsNeededForVerification} more ads to verify your referral and unlock bonuses!
          </p>
          
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min(100, (adStats.adsWatched / 5) * 100)}%` 
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold">
              {adStats.adsWatched}/5 ads
            </span>
          </div>
        </motion.div>
      )}

      {/* Tips & Info */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap size={20} className="text-yellow-500" />
          <h4 className="font-semibold">Earning Tips</h4>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span>Watch ads regularly to maximize your earnings</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span>Complete tasks for additional TRX rewards</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
            <span>Refer friends to earn commission on their withdrawals</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
            <span>Minimum withdrawal is 3.5 TRX with 10% commission</span>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      {user.lastAdWatch && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-3">
            <Eye size={20} className="text-gray-500" />
            <h4 className="font-semibold">Last Activity</h4>
          </div>
          
          <p className="text-sm text-gray-600">
            Last ad watched: {new Date(user.lastAdWatch).toLocaleString()}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default EarnSection;