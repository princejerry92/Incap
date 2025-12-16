import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Wallet, TrendingUp, X, Settings, Target, BarChart3, LogOut, ChevronRight, Save, Camera, Plus, Users, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearSessionToken } from '../services/api';
import cacheService from '../services/cache';
import dashboardAPI from '../services/dashboardAPI';

const ProfileDropdown = ({ dashboardData, portfolioData, isOpen, onClose, isMobile }) => {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showSwitchAccountModal, setShowSwitchAccountModal] = useState(false);
  const [profileData, setProfileData] = useState({
    phone_number: '',
    address: '',
    profile_pic: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    if (!isMobile && isOpen) {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          !showLogoutModal && !showEditProfileModal && !showDeleteAccountModal && !showSwitchAccountModal) {
          handleClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobile, isOpen, showLogoutModal, showEditProfileModal, showDeleteAccountModal, showSwitchAccountModal]);

  // Prevent body scroll when mobile modal is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isOpen]);

  // Initialize profile data when dashboard data is available
  useEffect(() => {
    if (dashboardData?.user) {
      setProfileData({
        phone_number: dashboardData.user.phone_number || '',
        address: dashboardData.user.address || '',
        profile_pic: dashboardData.user.profile_pic || ''
      });
    }
  }, [dashboardData]);

  const handleClose = () => {
    if (onClose) onClose();
  };

  // Handle logout functionality
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  // Confirm logout
  const confirmLogout = () => {
    // Clear session token from localStorage
    clearSessionToken();

    // Clear all cached data
    cacheService.clearAll();

    // Cleanup real-time listeners if any
    try {
      dashboardAPI.cleanupRealTimeListeners();
    } catch (error) {
      console.warn('Error cleaning up real-time listeners:', error);
    }

    // Close logout modal
    setShowLogoutModal(false);

    // Redirect to login page
    navigate('/login');
  };

  // Cancel logout
  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    try {
      // Call the delete account API
      const response = await dashboardAPI.deleteAccount();

      if (response.message === 'Account successfully deleted') {
        // Clear session and cache
        clearSessionToken();
        cacheService.clearAll();

        // Cleanup real-time listeners if any
        try {
          dashboardAPI.cleanupRealTimeListeners();
        } catch (error) {
          console.warn('Error cleaning up real-time listeners:', error);
        }

        // Close modal
        setShowDeleteAccountModal(false);

        // Show success message
        alert('Your account has been successfully deleted.');

        // Redirect to login page
        navigate('/login');
      } else {
        alert('Failed to delete account: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Delete account error:', error);
      alert('Failed to delete account: ' + error.message);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount || 0).replace('NGN', '₦');
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get user data
  const user = dashboardData?.user || {};
  const investment = dashboardData?.investment || {};
  const portfolio = dashboardData?.portfolio || {};

  // User info
  const getUserName = () => {
    return user.full_name || `${user.first_name || ''} ${user.surname || ''}`.trim() || 'User';
  };

  const getUserEmail = () => user.email || 'Not provided';
  const getUserPhone = () => user.phone_number || 'Not provided';
  const getUserAddress = () => user.address || 'Not provided';
  const getUserJoinDate = () => user.created_at ? formatDate(user.created_at) : 'Unknown';
  const getProfilePic = () => user.profile_pic || null;

  // Investment info
  const getInvestmentBalance = () => investment.total_balance || 0;
  const getInvestmentType = () => investment.investment_type || 'Not Selected';
  const getPortfolioType = () => investment.portfolio_type || 'N/A';
  const getAccountNumber = () => {
    const accountNum = investment.primary_account || '****';
    if (accountNum.length > 4) {
      return accountNum.slice(-4);
    }
    return accountNum;
  };

  // Portfolio analytics
  const getSpendingAccountBalance = () => {
    // Prefer user-level spending account, then investment-level fields and fallbacks
    if (typeof user?.spending_account_balance === 'number') return user.spending_account_balance;
    if (user?.spending_account_balance) return parseFloat(user.spending_account_balance) || 0;

    if (typeof investment?.spending_balance === 'number') return investment.spending_balance;
    if (investment?.spending_balance) return parseFloat(investment.spending_balance) || 0;

    if (typeof investment?.total_due === 'number') return investment.total_due;
    if (investment?.total_due) return parseFloat(investment.total_due) || 0;

    // Fall back to first investment in investments array if present
    if (Array.isArray(dashboardData?.investments) && dashboardData.investments[0]) {
      const inv = dashboardData.investments[0];
      if (typeof inv.spending_balance === 'number') return inv.spending_balance;
      if (inv.spending_balance) return parseFloat(inv.spending_balance) || 0;
      if (typeof inv.total_due === 'number') return inv.total_due;
      if (inv.total_due) return parseFloat(inv.total_due) || 0;
    }

    return 0;
  };
  const getInterestRate = () => investment.interest_rate || 0;
  const getNextDueDate = () => investment.next_due_date ? formatDate(investment.next_due_date) : 'N/A';

  // Handle profile data changes
  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle profile picture change
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleProfileChange('profile_pic', event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle switch account
  const handleSwitchAccount = (token) => {
    // Set the new token
    localStorage.setItem('session_token', token);

    // Clear cache to ensure fresh data for the new user
    cacheService.clearAll();

    // Reload the page to refresh everything with the new token
    window.location.reload();
  };

  // Handle remove account
  const handleRemoveAccount = (tokenToRemove) => {
    // Get current sessions
    const sessions = JSON.parse(localStorage.getItem('all_sessions') || '[]');

    // Filter out the session to remove
    const updatedSessions = sessions.filter(session => session.token !== tokenToRemove);

    // Save back to localStorage
    localStorage.setItem('all_sessions', JSON.stringify(updatedSessions));

    // If we removed the current session, logout
    const currentToken = localStorage.getItem('session_token');
    if (tokenToRemove === currentToken) {
      handleLogout();
    } else {
      // Force re-render of the modal by updating some state or just let React handle it if we were using state for sessions
      // Since we're reading from localStorage directly in the render, we might need to force update
      // For now, let's just close and reopen or rely on the component re-rendering
      setShowSwitchAccountModal(false);
      setTimeout(() => setShowSwitchAccountModal(true), 10);
    }
  };

  // Add new account (redirect to login)
  const handleAddNewAccount = () => {
    navigate('/login', { state: { isAddingAccount: true } });
  };

  // Save profile changes
  const saveProfileChanges = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await dashboardAPI.fetchWithAuth('/dashboard/update-profile', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: profileData.phone_number,
          address: profileData.address,
          profile_pic: profileData.profile_pic
        })
      });

      if (response.success) {
        setSaveSuccess(true);
        // Update cache with new data
        const cachedData = cacheService.getDashboardData();
        if (cachedData) {
          cachedData.user = {
            ...cachedData.user,
            phone_number: profileData.phone_number,
            address: profileData.address,
            profile_pic: profileData.profile_pic
          };
          cacheService.saveDashboardData(cachedData);
        }
        // Close modal after success
        setTimeout(() => {
          setShowEditProfileModal(false);
          setSaveSuccess(false);
        }, 1500);
      } else {
        console.error('Failed to update profile:', response.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Only render if isOpen is true
  if (!isOpen) return null;

  // Profile Content Component (shared between mobile and desktop)
  const ProfileContent = () => (
    <>
      {/* Profile Header */}
      <div className={`p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-100 ${isMobile ? 'rounded-t-3xl' : ''}`}>
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg overflow-hidden ring-4 ring-white ring-opacity-50">
              {getProfilePic() ? (
                <img src={getProfilePic()} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-800 mb-1">{getUserName()}</h3>
          <p className="text-gray-600 mb-4 text-sm">{getUserEmail()}</p>

          <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Active Member
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="p-6 border-b border-gray-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <User className="w-5 h-5 text-green-600 mr-2" />
          Personal Information
        </h4>

        <div className="space-y-3">
          <div className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-800 truncate">{getUserEmail()}</p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-medium text-gray-800 truncate">{getUserPhone()}</p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Address</p>
              <p className="font-medium text-gray-800 text-sm">{getUserAddress()}</p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Member Since</p>
              <p className="font-medium text-gray-800">{getUserJoinDate()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Information */}
      <div className="p-6 border-b border-gray-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Wallet className="w-5 h-5 text-green-600 mr-2" />
          Investment Details
        </h4>

        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Investment Balance</p>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(getInvestmentBalance())}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <p className="text-xs text-gray-500 mb-1">Portfolio</p>
              <p className="font-semibold text-gray-800 text-sm">{getPortfolioType()}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <p className="text-xs text-gray-500 mb-1">Investment</p>
              <p className="font-semibold text-gray-800 text-sm">{getInvestmentType()}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg font-bold text-green-600">****</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Account</p>
                <p className="font-semibold text-gray-800">{getAccountNumber()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">VISA</p>
              <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-800 rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate Network Information */}
      {dashboardData?.points && (
        <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-yellow-50 to-orange-50">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-xs font-bold text-white">₦</span>
            </div>
            Affiliate Network
          </h4>

          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl border border-yellow-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-600">Points Balance</p>
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">₦</span>
                  </div>
                  <span className="text-xs font-medium text-gray-600">1 point = ₦1,000</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{dashboardData.points.points_balance || 0}</p>
              <p className="text-xs text-gray-600 mt-1">
                Worth: {formatCurrency((dashboardData.points.points_balance || 0) * 1000)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Total Earned</p>
                <p className="text-xl font-bold text-green-600">{dashboardData.points.total_points_earned || 0}</p>
              </div>

              <div className="p-3 bg-white rounded-xl shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Redeemed</p>
                <p className="text-xl font-bold text-blue-600">{dashboardData.points.total_points_redeemed || 0}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">Referral Code</p>
                <p className="font-mono text-sm font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                  {user.referral_code || 'Not available'}
                </p>
              </div>
              <button
                onClick={(e) => {
                  if (user.referral_code) {
                    navigator.clipboard.writeText(user.referral_code);
                    // Simple feedback
                    const btn = e.target;
                    const originalText = btn.textContent;
                    btn.textContent = 'Copied!';
                    btn.classList.add('text-green-600');
                    setTimeout(() => {
                      btn.textContent = originalText;
                      btn.classList.remove('text-green-600');
                    }, 2000);
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Analytics */}
      <div className="p-6 border-b border-gray-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
          Portfolio Analytics
        </h4>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 shadow-sm">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Spending Account</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(getSpendingAccountBalance())}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Interest Rate</p>
              <p className="text-xl font-bold text-gray-800">{getInterestRate()}%</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Next Due</p>
              <p className="font-semibold text-gray-800 text-sm">{getNextDueDate()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Progress */}
      {dashboardData?.goals?.progress && (
        <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-purple-50 to-blue-50">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Target className="w-5 h-5 text-purple-600 mr-2" />
            Goals Progress
          </h4>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Weeks Done</p>
                <p className="text-xl font-bold text-purple-600">{dashboardData.goals.progress.weeks_elapsed || 0}</p>
              </div>

              <div className="p-3 bg-white rounded-xl shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Total Weeks</p>
                <p className="text-xl font-bold text-gray-800">{dashboardData.goals.progress.total_weeks || 0}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Interest Earned</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(dashboardData.goals.progress.cumulative_interest || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Summary */}
      {dashboardData?.analytics && Object.keys(dashboardData.analytics).length > 0 && (
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 text-orange-600 mr-2" />
            Analytics Summary
          </h4>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Total Earned</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(dashboardData.analytics.total_earned || 0)}</p>
              </div>

              <div className="p-3 bg-red-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Withdrawn</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(dashboardData.analytics.total_withdrawn || 0)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Avg Weekly</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(dashboardData.analytics.average_weekly_interest || 0)}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Largest</p>
                <p className="text-lg font-bold text-gray-800">{formatCurrency(dashboardData.analytics.largest_withdrawal || 0)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500 mb-1">Progress</p>
                <p className="text-lg font-bold text-gray-800">{dashboardData.analytics.weeks_elapsed || 0} / {dashboardData.analytics.total_weeks || 0}</p>
              </div>
              <div className="text-xs text-gray-600">
                {dashboardData.analytics.withdrawal_count || 0} withdrawals
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-6 space-y-3">
        <button
          onClick={() => setShowEditProfileModal(true)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-all border border-green-100"
        >
          <div className="flex items-center">
            <Settings className="w-5 h-5 text-green-600 mr-3" />
            <span className="font-medium text-gray-800">Edit Profile</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={() => setShowSwitchAccountModal(true)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all border border-blue-100"
        >
          <div className="flex items-center">
            <Users className="w-5 h-5 text-blue-600 mr-3" />
            <span className="font-medium text-gray-800">Switch Account</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={() => setShowDeleteAccountModal(true)}
          className="w-full flex items-center justify-between p-4 bg-red-50 rounded-xl hover:shadow-md transition-all border border-red-100"
        >
          <div className="flex items-center">
            <X className="w-5 h-5 text-red-600 mr-3" />
            <span className="font-medium text-red-600">Delete Account</span>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400" />
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all border border-gray-100"
        >
          <div className="flex items-center">
            <LogOut className="w-5 h-5 text-gray-600 mr-3" />
            <span className="font-medium text-gray-800">Logout</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </>
  );

  // Edit Profile Modal
  const EditProfileModal = () => (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        // Close modal when clicking on backdrop (outside the modal content)
        if (e.target === e.currentTarget) {
          setShowEditProfileModal(false);
        }
      }}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => {
          // Prevent closing when clicking inside the modal
          e.stopPropagation();
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Edit Profile</h3>
          <button
            onClick={() => setShowEditProfileModal(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg overflow-hidden ring-4 ring-white ring-opacity-50">
                {profileData.profile_pic ? (
                  <img src={profileData.profile_pic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md ring-2 ring-white cursor-pointer">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePicChange}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">Tap to change profile picture</p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={profileData.phone_number}
              onChange={(e) => handleProfileChange('phone_number', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={profileData.address}
              onChange={(e) => handleProfileChange('address', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
              placeholder="Enter your address"
              rows="3"
            />
          </div>

          {/* Success Message */}
          {saveSuccess && (
            <div className="p-3 bg-green-100 text-green-700 rounded-xl text-center">
              Profile updated successfully!
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => setShowEditProfileModal(false)}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={saveProfileChanges}
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Full Screen View
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fade-in"
          onClick={handleClose}
        />

        {/* Modal */}
        <div
          ref={dropdownRef}
          className="fixed inset-x-0 bottom-0 bg-white z-50 max-h-[90vh] overflow-y-auto animate-slide-up rounded-t-3xl"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Handle Bar */}
          <div className="sticky top-0 bg-white z-10 pt-3 pb-2 rounded-t-3xl">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-2"></div>
            <div className="flex justify-between items-center px-6 pb-3 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Profile</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <ProfileContent />

          {/* Safe area spacing */}
          <div className="h-6"></div>
        </div>

        {/* Custom Logout Confirmation Modal */}
        {showLogoutModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => {
              // Close modal when clicking on backdrop (outside the modal content)
              if (e.target === e.currentTarget) {
                cancelLogout();
              }
            }}
          >
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100"
              onClick={(e) => {
                // Prevent closing when clicking inside the modal
                e.stopPropagation();
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Confirm Logout</h3>
                <button
                  onClick={cancelLogout}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to logout? You'll need to sign in again to access your account.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteAccountModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => {
              // Close modal when clicking on backdrop (outside the modal content)
              if (e.target === e.currentTarget) {
                setShowDeleteAccountModal(false);
              }
            }}
          >
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100"
              onClick={(e) => {
                // Prevent closing when clicking inside the modal
                e.stopPropagation();
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Confirm Account Deletion</h3>
                <button
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <p className="text-gray-600 mb-2">
                Are you sure you want to delete your account?
              </p>
              <p className="text-gray-600 mb-6 text-sm">
                This action is permanent and cannot be undone. All your data will be permanently deleted.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Edit Profile Modal */}
        {showEditProfileModal && <EditProfileModal />}
      </>
    );
  }

  // Desktop Side Panel View
  return (
    <div className="fixed inset-0 flex items-start justify-end z-50 animate-fade-in">
      <div className="absolute inset-0 bg-transparent"
        onClick={handleClose}
      />

      <div
        ref={dropdownRef}
        className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto animate-slide-left"
      >
        {/* Header with close button */}
        <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-100 shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <ProfileContent />
      </div>

      {/* Custom Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Confirm Logout</h3>
              <button
                onClick={cancelLogout}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={cancelLogout}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Confirm Account Deletion</h3>
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-2">
              Are you sure you want to delete your account?
            </p>
            <p className="text-gray-600 mb-6 text-sm">
              This action is permanent and cannot be undone. All your data will be permanently deleted.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch Account Modal */}
      {showSwitchAccountModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSwitchAccountModal(false);
          }}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Switch Account</h3>
              <button
                onClick={() => setShowSwitchAccountModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {JSON.parse(localStorage.getItem('all_sessions') || '[]').map((session, index) => {
                const isCurrent = session.token === localStorage.getItem('session_token');
                return (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-xl border ${isCurrent ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
                    <div
                      className="flex items-center flex-1 cursor-pointer"
                      onClick={() => !isCurrent && handleSwitchAccount(session.token)}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{session.user?.first_name} {session.user?.surname}</p>
                        <p className="text-xs text-gray-500">{session.user?.email}</p>
                      </div>
                    </div>
                    {isCurrent ? (
                      <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Active</div>
                    ) : (
                      <button
                        onClick={() => handleRemoveAccount(session.token)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              {(!localStorage.getItem('all_sessions') || JSON.parse(localStorage.getItem('all_sessions')).length === 0) && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No accounts found.
                </div>
              )}
            </div>

            <button
              onClick={handleAddNewAccount}
              className="w-full py-3 px-4 bg-white border-2 border-dashed border-gray-300 text-gray-600 rounded-xl font-medium hover:border-green-500 hover:text-green-600 transition-all flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Another Account
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && <EditProfileModal />}
    </div>
  );
};

// Add custom animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  
  @keyframes slide-left {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  .animate-slide-left {
    animation: slide-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
`;
if (!document.getElementById('profile-dropdown-styles')) {
  style.id = 'profile-dropdown-styles';
  document.head.appendChild(style);
}

export default ProfileDropdown;