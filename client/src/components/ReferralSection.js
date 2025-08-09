import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Copy, 
  Share, 
  Gift, 
  TrendingUp,
  UserPlus,
  Crown,
  Target,
  Calendar,
  Award,
  Check,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ReferralSection = ({ user, refreshUser, telegramWebApp }) => {
  const [referralData, setReferralData] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Load referral data
  useEffect(() => {
    const loadReferralData = async () => {
      if (!user) return;
      
      try {
        const [dataResponse, statsResponse] = await Promise.all([
          axios.get(`/referrals/${user.telegramId}`),
          axios.get(`/referrals/${user.telegramId}/stats`)
        ]);
        
        setReferralData(dataResponse.data);
        setReferralStats(statsResponse.data);
      } catch (error) {
        console.error('Failed to load referral data:', error);
        toast.error('Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };

    loadReferralData();
  }, [user]);

  const copyReferralLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink).then(() => {
        setCopied(true);
        toast.success('Referral link copied to clipboard! 📋');
        setTimeout(() => setCopied(false), 2000);
        
        // Haptic feedback
        if (telegramWebApp?.HapticFeedback) {
          telegramWebApp.HapticFeedback.impactOccurred('light');
        }
      });
    }
  };

  const shareReferralLink = () => {
    if (telegramWebApp && referralData?.referralLink) {
      const message = `🚀 Join TRX Earn Bot and start earning TRX by watching ads!\n\n💎 Earn TRX for watching ads\n🎯 Complete tasks for bonuses\n💰 Get paid for referrals\n\nJoin now: ${referralData.referralLink}`;
      
      // Use Telegram's sharing if available
      if (telegramWebApp.openTelegramLink) {
        telegramWebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralData.referralLink)}&text=${encodeURIComponent(message)}`);
      } else {
        navigator.share({
          title: 'TRX Earn Bot - Earn TRX by watching ads!',
          text: message,
          url: referralData.referralLink
        }).catch(() => {
          // Fallback to copy
          copyReferralLink();
        });
      }
      
      // Haptic feedback
      if (telegramWebApp?.HapticFeedback) {
        telegramWebApp.HapticFeedback.impactOccurred('medium');
      }
    }
  };

  const formatTRX = (amount) => {
    return parseFloat(amount).toFixed(6);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
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
      {/* Referral Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card card-dark"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <Users size={24} color="white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Referral Program</h3>
            <p className="text-white text-opacity-70 text-sm">Earn from your referrals</p>
          </div>
        </div>

        {referralData && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {referralData.totalReferrals}
                </div>
                <p className="text-white text-opacity-70 text-sm">Total Referrals</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {referralData.verifiedReferrals}
                </div>
                <p className="text-white text-opacity-70 text-sm">Verified</p>
              </div>
            </div>

            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-green-300 mb-1">
                {formatTRX(referralData.totalReferralEarnings)} TRX
              </div>
              <p className="text-white text-opacity-70 text-sm">Total Earned</p>
            </div>

            {/* Share Buttons */}
            <div className="flex gap-2">
              <button
                onClick={copyReferralLink}
                className="btn btn-secondary flex-1"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={shareReferralLink}
                className="btn btn-success flex-1"
              >
                <Share size={16} />
                Share
              </button>
            </div>
          </>
        )}
      </motion.div>

      {/* Referral Code */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center gap-2 mb-3">
          <Target size={20} className="text-blue-500" />
          <h4 className="font-semibold">Your Referral Code</h4>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {referralData?.referralCode}
            </div>
            <p className="text-sm text-gray-600 break-all">
              {referralData?.referralLink}
            </p>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          <p className="mb-2">💡 How it works:</p>
          <ul className="space-y-1 text-xs">
            <li>• Share your link with friends</li>
            <li>• They need to watch 5 ads to verify</li>
            <li>• You earn {referralData?.verificationReward} TRX when they verify</li>
            <li>• Get {referralData?.commissionRate}% of their future withdrawals</li>
          </ul>
        </div>
      </motion.div>

      {/* Referral Statistics */}
      {referralStats && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-green-500" />
            <h4 className="font-semibold">Earnings Breakdown</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600 mb-1">
                {formatTRX(referralStats.verificationRewards)}
              </div>
              <p className="text-xs text-blue-600">Verification Rewards</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600 mb-1">
                {formatTRX(referralStats.totalCommissions)}
              </div>
              <p className="text-xs text-green-600">Withdrawal Commissions</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Daily earnings:</span>
              <span className="font-semibold">{formatTRX(referralStats.dailyEarnings)} TRX</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weekly earnings:</span>
              <span className="font-semibold">{formatTRX(referralStats.weeklyEarnings)} TRX</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly earnings:</span>
              <span className="font-semibold">{formatTRX(referralStats.monthlyEarnings)} TRX</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Referral List */}
      {referralData?.referralUsers && referralData.referralUsers.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={20} className="text-purple-500" />
            <h4 className="font-semibold">Your Referrals</h4>
          </div>
          
          <div className="space-y-3">
            {referralData.referralUsers.slice(0, 5).map((referral, index) => (
              <div key={referral.telegramId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    referral.isVerified ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                    {referral.isVerified ? (
                      <Crown size={16} className="text-green-600" />
                    ) : (
                      <Users size={16} className="text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {referral.firstName} {referral.username ? `(@${referral.username})` : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      {referral.adsWatched} ads watched • Joined {formatDate(referral.joinedAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    referral.isVerified ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {referral.isVerified ? 'Verified' : `${5 - referral.adsWatched} ads left`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTRX(referral.totalEarned)} TRX earned
                  </div>
                </div>
              </div>
            ))}
            
            {referralData.referralUsers.length > 5 && (
              <div className="text-center py-2">
                <span className="text-sm text-gray-500">
                  And {referralData.referralUsers.length - 5} more referrals...
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Recent Commissions */}
      {referralStats?.recentCommissions && referralStats.recentCommissions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-4">
            <Gift size={20} className="text-orange-500" />
            <h4 className="font-semibold">Recent Commissions</h4>
          </div>
          
          <div className="space-y-2">
            {referralStats.recentCommissions.slice(0, 3).map((commission, index) => (
              <div key={commission.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Gift size={14} className="text-orange-500" />
                  <span className="text-sm">Withdrawal commission</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-orange-600">
                    +{formatTRX(commission.amount)} TRX
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(commission.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Referral Tips */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <div className="flex items-center gap-2 mb-3">
          <Award size={20} className="text-yellow-500" />
          <h4 className="font-semibold">Maximize Your Earnings</h4>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></span>
            <span>Share your link on social media and messaging apps</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full mt-2"></span>
            <span>Encourage referrals to watch ads to get verified quickly</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full mt-2"></span>
            <span>Verified referrals give you lifetime 10% commission</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-purple-400 rounded-full mt-2"></span>
            <span>The more they earn and withdraw, the more you earn!</span>
          </div>
        </div>
      </motion.div>

      {/* Share Suggestion */}
      {referralData && referralData.totalReferrals === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card text-center py-6"
        >
          <div className="text-6xl mb-4">🚀</div>
          <h4 className="font-semibold mb-2">Start Earning with Referrals!</h4>
          <p className="text-sm text-gray-600 mb-4">
            Share your referral link and start earning passive TRX income
          </p>
          <button
            onClick={shareReferralLink}
            className="btn btn-primary"
          >
            <Share size={16} />
            Share Your Link Now
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ReferralSection;