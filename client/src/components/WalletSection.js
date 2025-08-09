import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Send, 
  Settings, 
  History, 
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const WalletSection = ({ user, refreshUser, telegramWebApp }) => {
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);

  // Load withdrawal history
  useEffect(() => {
    const loadWithdrawalHistory = async () => {
      if (!user) return;
      
      try {
        const response = await axios.get(`/withdrawals/${user.telegramId}/history?limit=5`);
        setWithdrawalHistory(response.data.withdrawals);
      } catch (error) {
        console.error('Failed to load withdrawal history:', error);
      }
    };

    loadWithdrawalHistory();
  }, [user]);

  const handleWalletAddressSave = async () => {
    if (!walletAddress.match(/^T[A-Za-z1-9]{33}$/)) {
      toast.error('Please enter a valid TRX wallet address');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/auth/wallet/${user.telegramId}`, {
        walletAddress
      });
      
      await refreshUser();
      setShowWalletSetup(false);
      toast.success('Wallet address saved successfully! 🎉');
    } catch (error) {
      toast.error('Failed to save wallet address');
      console.error('Wallet save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!user.trxWallet) {
      toast.error('Please set your TRX wallet address first');
      setShowWalletSetup(true);
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount < 3.5) {
      toast.error('Minimum withdrawal amount is 3.5 TRX');
      return;
    }

    if (amount > user.trxBalance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/withdrawals/${user.telegramId}/request`, {
        amount,
        toAddress: user.trxWallet
      });
      
      await refreshUser();
      setShowWithdrawal(false);
      setWithdrawalAmount('');
      toast.success('Withdrawal request submitted! ⚡');
      
      // Reload withdrawal history
      const historyResponse = await axios.get(`/withdrawals/${user.telegramId}/history?limit=5`);
      setWithdrawalHistory(historyResponse.data.withdrawals);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to process withdrawal');
      console.error('Withdrawal error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatTRX = (amount) => {
    return parseFloat(amount).toFixed(6);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4ade80';
      case 'approved': return '#60a5fa';
      case 'pending': return '#fbbf24';
      case 'rejected': return '#f87171';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'approved': return '👍';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      default: return '❓';
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card card-dark"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Wallet size={24} color="white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">TRX Balance</h3>
              <p className="text-white text-opacity-70 text-sm">Available for withdrawal</p>
            </div>
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors"
          >
            {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>

        <div className="text-center">
          <motion.div
            animate={{ scale: showBalance ? 1 : 0.8 }}
            transition={{ duration: 0.3 }}
            className="text-4xl font-bold text-white mb-2"
          >
            {showBalance ? `${formatTRX(user.trxBalance)} TRX` : '••••••'}
          </motion.div>
          <p className="text-white text-opacity-70 text-sm mb-4">
            Total Earned: {formatTRX(user.totalEarned)} TRX
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowWithdrawal(true)}
            disabled={user.trxBalance < 3.5}
            className={`btn flex-1 ${
              user.trxBalance >= 3.5 ? 'btn-success' : 'btn-disabled'
            }`}
          >
            <Send size={16} />
            Withdraw
          </button>
          <button
            onClick={() => setShowWalletSetup(true)}
            className="btn btn-secondary"
          >
            <Settings size={16} />
            {user.trxWallet ? 'Edit' : 'Setup'}
          </button>
        </div>
      </motion.div>

      {/* Wallet Status */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-3 h-3 rounded-full ${
            user.trxWallet ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <h4 className="font-semibold">Wallet Status</h4>
        </div>
        
        {user.trxWallet ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Connected wallet: {user.trxWallet.slice(0, 6)}...{user.trxWallet.slice(-6)}
            </p>
            <button
              onClick={() => copyToClipboard(user.trxWallet)}
              className="flex items-center gap-2 text-blue-500 text-sm hover:text-blue-600 transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-orange-500">
            <AlertCircle size={16} />
            <p className="text-sm">Please set up your TRX wallet address</p>
          </div>
        )}
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-500 mb-1">
            {user.adsWatched}
          </div>
          <p className="text-sm text-gray-600">Ads Watched</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-500 mb-1">
            {user.referrals || 0}
          </div>
          <p className="text-sm text-gray-600">Referrals</p>
        </div>
      </motion.div>

      {/* Withdrawal History */}
      {withdrawalHistory.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-4">
            <History size={20} className="text-gray-600" />
            <h4 className="font-semibold">Recent Withdrawals</h4>
          </div>
          
          <div className="space-y-3">
            {withdrawalHistory.slice(0, 3).map((withdrawal) => (
              <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getStatusIcon(withdrawal.status)}</span>
                  <div>
                    <p className="font-medium">{formatTRX(withdrawal.amount)} TRX</p>
                    <p className="text-sm text-gray-500">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span 
                  className="text-sm font-medium px-2 py-1 rounded-full"
                  style={{ 
                    color: getStatusColor(withdrawal.status),
                    backgroundColor: `${getStatusColor(withdrawal.status)}20`
                  }}
                >
                  {withdrawal.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Wallet Setup Modal */}
      {showWalletSetup && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowWalletSetup(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">
              {user.trxWallet ? 'Update' : 'Setup'} TRX Wallet
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Enter your TRX wallet address to receive withdrawals
            </p>
            <input
              type="text"
              placeholder="TRX Wallet Address (T...)"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="input mb-4"
              style={{ color: '#333' }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowWalletSetup(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleWalletAddressSave}
                disabled={loading || !walletAddress}
                className="btn btn-primary flex-1"
              >
                {loading ? <div className="spinner" /> : 'Save'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowWithdrawal(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Withdraw TRX</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Available Balance: {formatTRX(user.trxBalance)} TRX
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Minimum: 3.5 TRX | Commission: 10%
              </p>
              <p className="text-sm text-gray-600">
                To: {user.trxWallet?.slice(0, 6)}...{user.trxWallet?.slice(-6)}
              </p>
            </div>
            <input
              type="number"
              placeholder="Amount (TRX)"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              className="input mb-4"
              style={{ color: '#333' }}
              step="0.000001"
              min="3.5"
              max={user.trxBalance}
            />
            {withdrawalAmount && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm">
                  <p>Amount: {formatTRX(withdrawalAmount)} TRX</p>
                  <p>Commission (10%): {formatTRX(parseFloat(withdrawalAmount) * 0.1)} TRX</p>
                  <p className="font-semibold">
                    You'll receive: {formatTRX(parseFloat(withdrawalAmount) * 0.9)} TRX
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawal}
                disabled={loading || !withdrawalAmount || parseFloat(withdrawalAmount) < 3.5}
                className="btn btn-success flex-1"
              >
                {loading ? <div className="spinner" /> : 'Withdraw'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default WalletSection;