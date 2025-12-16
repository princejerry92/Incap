import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, Copy, Check, Users, TrendingUp, Wallet, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { referralAPI } from './services/api';

const AffiliateNetwork = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [downlines, setDownlines] = useState([]);
  const [loadingReferralCode, setLoadingReferralCode] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [loadingDownlines, setLoadingDownlines] = useState(true);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redemptionData, setRedemptionData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState('');

  useEffect(() => {
    const loadReferralData = async () => {
      try {
        setError(null);

        // Load all data in parallel
        const [codeResponse, pointsResponse, statsResponse, downlinesResponse] = await Promise.allSettled([
          referralAPI.getReferralCode(),
          referralAPI.getUserPoints(),
          referralAPI.getReferralStats(),
          referralAPI.getDownlines()
        ]);

        // Handle referral code
        if (codeResponse.status === 'fulfilled') {
          const codeData = codeResponse.value;
          setUserData(prev => ({
            ...prev,
            referralCode: codeData.referral_code
          }));
        } else {
          console.error('Error loading referral code:', codeResponse.reason);
        }
        setLoadingReferralCode(false);

        // Handle user points
        if (pointsResponse.status === 'fulfilled') {
          const pointsData = pointsResponse.value;
          setUserData(prev => ({
            ...prev,
            points_balance: pointsData.points_balance,
            total_points_earned: pointsData.total_points_earned,
            total_points_redeemed: pointsData.total_points_redeemed
          }));
        } else {
          console.error('Error loading user points:', pointsResponse.reason);
        }
        setLoadingPoints(false);

        // Handle stats
        if (statsResponse.status === 'fulfilled') {
          setReferralStats(statsResponse.value);
        } else {
          console.error('Error loading referral stats:', statsResponse.reason);
        }
        setLoadingStats(false);

        // Handle downlines
        if (downlinesResponse.status === 'fulfilled') {
          setDownlines(downlinesResponse.value.downlines || []);
        } else {
          console.error('Error loading downlines:', downlinesResponse.reason);
        }
        setLoadingDownlines(false);

      } catch (err) {
        setError(err.message || 'Failed to load referral data. Please try again.');
        console.error('Error loading referral data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReferralData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload all data
      const [codeResponse, pointsResponse, statsResponse, downlinesResponse] = await Promise.allSettled([
        referralAPI.getReferralCode(),
        referralAPI.getUserPoints(),
        referralAPI.getReferralStats(),
        referralAPI.getDownlines()
      ]);

      // Update data with refreshed values
      if (codeResponse.status === 'fulfilled') {
        setUserData(prev => ({
          ...prev,
          referralCode: codeResponse.value.referral_code
        }));
      }

      if (pointsResponse.status === 'fulfilled') {
        setUserData(prev => ({
          ...prev,
          points_balance: pointsResponse.value.points_balance,
          total_points_earned: pointsResponse.value.total_points_earned,
          total_points_redeemed: pointsResponse.value.total_points_redeemed
        }));
      }

      if (statsResponse.status === 'fulfilled') {
        setReferralStats(statsResponse.value);
      }

      if (downlinesResponse.status === 'fulfilled') {
        setDownlines(downlinesResponse.value.downlines || []);
      }

    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyReferralCode = () => {
    if (userData?.referralCode) {
      navigator.clipboard.writeText(userData.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRedeemClick = () => {
    const points = parseInt(pointsToRedeem);
    if (points && points > 0 && points <= userData.points_balance) {
      setRedemptionData({
        points: points,
        amount: points * 500
      });
      setShowRedeemModal(true);
    }
  };

  const handleRedemptionSuccess = async () => {
    try {
      await referralAPI.redeemPoints(redemptionData.points);

      // Refresh user points after successful redemption
      const pointsResponse = await referralAPI.getUserPoints();
      setUserData(prev => ({
        ...prev,
        points_balance: pointsResponse.points_balance,
        total_points_earned: pointsResponse.total_points_earned,
        total_points_redeemed: pointsResponse.total_points_redeemed
      }));

      setShowRedeemModal(false);
      setPointsToRedeem('');
      setRedemptionData(null);

      // Show success message (you might want to add a toast notification here)
      alert('Points redeemed successfully!');
    } catch (error) {
      console.error('Error redeeming points:', error);
      alert('Failed to redeem points. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount || 0).replace('NGN', '₦');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <RefreshCw className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Loading Affiliate Network</h2>
          <p className="text-gray-600">Please wait while we load your data...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-medium"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 mx-4 sm:mx-6 lg:mx-8 rounded-2xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-14">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Affiliate Network
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage your referrals and earnings</p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Points Overview */}
        {userData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8"
          >
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-white/90 text-sm font-medium">Points Balance</p>
                  <p className="text-3xl font-bold">{userData.points_balance || 0}</p>
                </div>
              </div>
              <p className="text-white/80 text-sm">
                Worth {formatCurrency((userData.points_balance || 0) * 500)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-white/90 text-sm font-medium">Total Earned</p>
                  <p className="text-3xl font-bold">{userData.total_points_earned || 0}</p>
                </div>
              </div>
              <p className="text-white/80 text-sm">
                From {referralStats?.total_referrals || 0} referrals
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-white/90 text-sm font-medium">Redeemed</p>
                  <p className="text-3xl font-bold">{userData.total_points_redeemed || 0}</p>
                </div>
              </div>
              <p className="text-white/80 text-sm">
                {formatCurrency((userData.total_points_redeemed || 0) * 500)} total
              </p>
            </div>
          </motion.div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Points Calculator */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">💰</span>
                </div>
                Redeem Points
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points to Redeem
                  </label>
                  <input
                    type="number"
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(e.target.value)}
                    placeholder="Enter points"
                    max={userData?.points_balance}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {userData?.points_balance || 0} points
                  </p>
                </div>

                {pointsToRedeem && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200"
                  >
                    <p className="text-sm text-gray-600 mb-1">You will receive:</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(parseInt(pointsToRedeem || 0) * 500)}
                    </p>
                  </motion.div>
                )}

                <button
                  onClick={handleRedeemClick}
                  disabled={!pointsToRedeem || parseInt(pointsToRedeem) > userData?.points_balance}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Redeem Points
                </button>
              </div>
            </motion.div>

            {/* Referral Code Display */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl"
            >
              <h2 className="text-xl font-bold mb-4">Your Referral Code</h2>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-mono font-bold tracking-wider">
                    {userData?.referralCode}
                  </span>
                  <button
                    onClick={handleCopyReferralCode}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-white/90 text-sm">
                Share this code with friends and earn 25 points for each successful referral!
              </p>
            </motion.div>
          </div>

          {/* Right Column - Downlines */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              Your Referrals ({downlines.length})
            </h2>

            <div className="space-y-3">
              {downlines.map((downline, index) => (
                <motion.div
                  key={downline.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {downline.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{downline.name}</p>
                        <p className="text-xs text-gray-500">
                          Joined {formatDate(downline.date_joined)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        +{downline.points_earned} pts
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${downline.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {downline.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {downlines.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No referrals yet</p>
                  <p className="text-sm text-gray-400">Share your code to get started!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Redeem Modal */}
      <AnimatePresence>
        {showRedeemModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowRedeemModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirm Redemption</h3>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-200">
                <p className="text-sm text-gray-600 mb-2">You are redeeming:</p>
                <p className="text-xl font-bold text-gray-800">{redemptionData?.points} Points</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatCurrency(redemptionData?.amount)}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRedeemModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRedemptionSuccess}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AffiliateNetwork;
