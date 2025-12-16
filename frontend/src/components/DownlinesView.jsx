import React, { useState } from 'react';
import { Users, ChevronDown, ChevronRight, Crown, User, TrendingUp, Calendar, RefreshCw } from 'lucide-react';

const DownlinesView = ({ downlines = [], loading = false, showSpinner = false }) => {
  const [expandedUsers, setExpandedUsers] = useState(new Set());

  const toggleExpanded = (userId) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center">
            <div className="w-5 h-5 bg-white/20 rounded animate-pulse" />
          </div>
          <div>
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-1" />
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
        </div>

        {/* Network Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-8 animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Network Tree Skeleton */}
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <div className="h-5 bg-gray-200 rounded w-24 animate-pulse mb-4" />

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  </div>
                  <div className="text-right">
                    <div className="h-6 bg-gray-200 rounded w-12 animate-pulse mb-1" />
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Skeleton */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="h-5 bg-gray-200 rounded w-40 animate-pulse mb-2" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLevelColor = (level) => {
    const colors = [
      'from-purple-500 to-pink-500', // Level 1
      'from-blue-500 to-cyan-500',   // Level 2
      'from-green-500 to-emerald-500', // Level 3
      'from-orange-500 to-red-500',  // Level 4
      'from-gray-500 to-slate-500'   // Level 5+
    ];
    return colors[Math.min(level - 1, colors.length - 1)];
  };

  const getLevelIcon = (level) => {
    if (level === 1) return Crown;
    return User;
  };

  const renderUserNode = (user, level = 1, isLast = true) => {
    const hasChildren = user.downlines && user.downlines.length > 0;
    const isExpanded = expandedUsers.has(user.id);
    const LevelIcon = getLevelIcon(level);

    return (
      <div key={user.id} className="relative">
        {/* Connection line */}
        {level > 1 && (
          <div className="absolute left-0 top-0 w-px bg-gradient-to-b from-gray-300 to-transparent h-full -ml-4" />
        )}

        {/* User node */}
        <div className="relative flex items-start gap-4 py-4">
          {/* Expand/collapse button */}
          <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(user.id)}
                className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6" />
            )}
          </div>

          {/* User card */}
          <div className="flex-1">
            <div className={`bg-gradient-to-r ${getLevelColor(level)} rounded-xl p-4 text-white shadow-lg`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <LevelIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{user.full_name || `${user.first_name} ${user.surname}`}</h4>
                    <p className="text-white/80 text-sm">Level {level} Referral</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold">
                    +{user.points_earned || 0}
                  </div>
                  <div className="text-white/80 text-sm">points earned</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/10 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-white/80">Joined</span>
                  </div>
                  <div className="font-medium">{formatDate(user.created_at)}</div>
                </div>

                <div className="bg-white/10 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-white/80">Status</span>
                  </div>
                  <div className="font-medium">
                    {user.investment_status === 'active' ? 'Active Investor' : 'Registered'}
                  </div>
                </div>
              </div>

              {hasChildren && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">
                      {user.downlines.length} direct referral{user.downlines.length !== 1 ? 's' : ''}
                    </span>
                    <span className="font-medium">
                      {user.total_downlines || user.downlines.length} total in network
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-8 relative">
            {/* Vertical connection line */}
            <div className="absolute left-4 top-0 w-px bg-gradient-to-b from-gray-300 to-transparent h-full" />

            {user.downlines.map((child, index) =>
              renderUserNode(child, level + 1, index === user.downlines.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const calculateNetworkStats = () => {
    const stats = {
      totalReferrals: 0,
      totalPoints: 0,
      activeInvestors: 0,
      levels: {}
    };

    const processUser = (user, level = 1) => {
      stats.totalReferrals++;
      stats.totalPoints += user.points_earned || 0;

      if (user.investment_status === 'active') {
        stats.activeInvestors++;
      }

      if (!stats.levels[level]) {
        stats.levels[level] = 0;
      }
      stats.levels[level]++;

      if (user.downlines) {
        user.downlines.forEach(child => processUser(child, level + 1));
      }
    };

    downlines.forEach(user => processUser(user, 1));

    return stats;
  };

  const networkStats = calculateNetworkStats();

  if (!downlines || downlines.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">No Referrals Yet</h3>
        <p className="text-gray-600 mb-6">
          Share your referral code to start building your network and earning points.
        </p>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>How to get started:</strong><br />
            1. Share your referral code with friends<br />
            2. When they sign up and invest, you earn 10 points<br />
            3. Build your downline network for more earnings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 relative">
      {showSpinner && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-spin">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-gray-600">Loading network data...</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-800">Your Network</h3>
          <p className="text-xs sm:text-sm text-gray-600">Track your referral downlines</p>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{networkStats.totalReferrals}</div>
          <div className="text-sm text-blue-800">Total Referrals</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-600">{networkStats.totalPoints}</div>
          <div className="text-sm text-green-800">Points Earned</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{networkStats.activeInvestors}</div>
          <div className="text-sm text-purple-800">Active Investors</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{Object.keys(networkStats.levels).length}</div>
          <div className="text-sm text-orange-800">Network Levels</div>
        </div>
      </div>

      {/* Network Tree */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Referral Tree
        </h4>

        <div className="space-y-2">
          {downlines.map((user, index) => renderUserNode(user, 1, index === downlines.length - 1))}
        </div>
      </div>

      {/* Network Tips */}
      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
        <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          Network Building Tips
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Each direct referral earns you 10 points when they invest</li>
          <li>• Build deeper levels for exponential growth</li>
          <li>• Higher level referrals can earn bonus points</li>
          <li>• Active investors in your network boost your earnings</li>
        </ul>
      </div>
    </div>
  );
};

export default DownlinesView;
