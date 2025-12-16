import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { BarChart3, TrendingUp, ArrowDownCircle, PieChart, Loader, ChevronDown } from 'lucide-react';
import InterestTrendChart from './InterestTrendChart';
import WithdrawalChart from './WithdrawalChart';
import PortfolioMetrics from './PortfolioMetrics';
import portfolioAPI from '../services/portfolioAPI';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Main Investment Analytics Section component
// Helper function to check if analytics data contains only zeros
const _isAnalyticsDataAllZeros = (data) => {
  if (!data || typeof data !== 'object') return false;

  // Check summary stats
  const summary = data.summary_stats;
  if (summary) {
    const zeroMetrics = [
      summary.total_earned,
      summary.average_weekly_interest,
      summary.total_withdrawn,
      summary.largest_withdrawal,
      summary.withdrawal_count,
      summary.weeks_elapsed
    ];
    if (zeroMetrics.some(metric => metric !== 0 && metric !== null && metric !== undefined)) {
      return false;
    }
  }

  // Check portfolio metrics
  const portfolioMetrics = data.portfolio_metrics;
  if (portfolioMetrics) {
    const metrics = Object.values(portfolioMetrics);
    if (metrics.some(metric => metric !== 0 && metric !== null && metric !== undefined)) {
      return false;
    }
  }

  // Check arrays - if they exist and are empty, it's still zero data
  const arrays = [data.interest_trend, data.withdrawals, data.weekly_withdrawals];
  for (const array of arrays) {
    if (Array.isArray(array) && array.length > 0) {
      return false; // Has actual data
    }
  }

  return true; // All zeros or empty
};

const InvestmentAnalyticsSection = ({ className = "" }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await portfolioAPI.getAnalyticsData(true);
        console.debug('[InvestmentAnalytics] received response:', response);

        if (response.success && response.data) {
          const data = response.data;
          console.debug('[InvestmentAnalytics] data received:', data);

          // Check if data is all zeros - this indicates backend hasn't calculated metrics yet
          if (_isAnalyticsDataAllZeros(data)) {
            console.warn('[InvestmentAnalytics] received all-zero analytics data');
            setError('Analytics data is not yet available. Please ensure you have active investments and try again later.');
            setAnalyticsData(null);
          } else {
            setAnalyticsData(data);
          }
        } else {
          // Try to fall back to cache explicitly, but only if cache wasn't already checked
          const cachedFallback = await portfolioAPI.getAnalyticsData(true);
          if (cachedFallback && cachedFallback.success && cachedFallback.data) {
            if (_isAnalyticsDataAllZeros(cachedFallback.data)) {
              setError('Analytics data is not yet available. Please ensure you have active investments and try again later.');
            } else {
              setAnalyticsData(cachedFallback.data);
            }
          } else {
            setError('Failed to load analytics data. Please try again later.');
          }
        }
      } catch (err) {
        console.error('[InvestmentAnalytics] Error fetching analytics data:', err);
        // Even on error, try to use cached data if available
        const cachedData = await portfolioAPI.getAnalyticsData(true);
        if (cachedData && cachedData.success && cachedData.data) {
          if (_isAnalyticsDataAllZeros(cachedData.data)) {
            setError('Analytics data is not yet available. Please ensure you have active investments and try again later.');
          } else {
            setAnalyticsData(cachedData.data);
            setError(null); // Clear error since we have valid data
          }
        } else {
          // Handle specific case for users who haven't selected investment type
          if (err.message && err.message.includes('select an investment type')) {
            setError('Please select an investment type to view analytics data. You can choose an investment option from the "Discover" section.');
          } else {
            setError(err.message ? err.message : 'Network error occurred');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();

    // Listen for analytics refresh events
    const handleRefresh = async (event) => {
      if (event.detail && event.detail.lastUpdate) {
        // Get fresh data from cache (no API call)
        const freshData = await portfolioAPI.getAnalyticsData(true);
        if (freshData && freshData.success && freshData.data) {
          console.debug('[InvestmentAnalytics] refreshed data:', freshData.data);
          if (_isAnalyticsDataAllZeros(freshData.data)) {
            console.warn('[InvestmentAnalytics] refreshed analytics data is all zeros');
            // Don't update if new data is also zeros and we have valid data
            if (!analyticsData) {
              setAnalyticsData(null);
              setError('Analytics data is not yet available. Please ensure you have active investments and have selected an investment type.');
            }
          } else {
            setAnalyticsData(freshData.data);
            setError(null); // Clear any zero-data error if we now have valid data
          }
        }
      }
    };

    window.addEventListener('analytics:refreshed', handleRefresh);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('analytics:refreshed', handleRefresh);
    };
  }, []);

  const refreshAnalyticsData = async () => {
    setIsRefreshing(true);
    try {
      const response = await portfolioAPI.getAnalyticsData(false);
      console.debug('[InvestmentAnalytics] refresh response:', response);

      if (response.success && response.data) {
        const data = response.data;
        if (_isAnalyticsDataAllZeros(data)) {
          console.warn('[InvestmentAnalytics] refresh received all-zero analytics data');
          if (!analyticsData) {
            setError('Analytics data is not yet available. Please ensure you have active investments and have selected an investment type.');
            setAnalyticsData(null);
          }
        } else {
          setAnalyticsData(data);
          setError(null); // Clear any previous error
        }
      } else {
        if (!analyticsData) {
          setError('Failed to refresh analytics data. Please try again later.');
        }
        const cachedFallback = await portfolioAPI.getAnalyticsData(true);
        if (cachedFallback && cachedFallback.success && cachedFallback.data) {
          if (_isAnalyticsDataAllZeros(cachedFallback.data)) {
            if (!analyticsData) {
              setError('Analytics data is not yet available. Please ensure you have active investments and have selected an investment type.');
            }
          } else {
            setAnalyticsData(cachedFallback.data);
            if (error && !analyticsData) setError(null);
          }
        }
      }
    } catch (err) {
      console.error('[InvestmentAnalytics] Error refreshing analytics data:', err);
      // If we have cached data, continue using it
      if (!analyticsData) {
        setError(err.message || 'Network error occurred while refreshing');
      }
      // Even on error, try to use cached data if available
      const cachedData = await portfolioAPI.getAnalyticsData(true);
      if (cachedData && cachedData.success && cachedData.data) {
        if (_isAnalyticsDataAllZeros(cachedData.data)) {
          if (!analyticsData) {
            setError('Analytics data is not yet available. Please ensure you have active investments and have selected an investment type.');
          }
        } else {
          setAnalyticsData(cachedData.data);
          setError(null); // Clear error since we have valid data
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'interest', label: 'Interest', icon: TrendingUp },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowDownCircle }
  ];

  if (loading) {
    return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <Loader className="w-6 h-6 animate-spin text-green-600 mr-2" />
          <span className="text-gray-600 text-sm md:text-base">Loading investment analytics...</span>
        </div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <BarChart3 className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={refreshAnalyticsData}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If we have no data at all, show an appropriate message
  if (!analyticsData) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <BarChart3 className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-gray-600">No analytics data available</p>
            <button 
              onClick={refreshAnalyticsData}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Load Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        const sliderSettings = {
          dots: true,
          infinite: false,
          speed: 400,
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          adaptiveHeight: true,
          responsive: [
            {
              breakpoint: 640,
              settings: {
                slidesToShow: 1,
                dots: true,
                arrows: false,
              },
            },
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 2,
                slidesToScroll: 1,
                dots: true,
                arrows: true,
              },
            },
          ],
        };

        return (
          <div className="space-y-6">
            <PortfolioMetrics
              portfolioMetrics={analyticsData?.portfolio_metrics}
              summaryStats={analyticsData?.summary_stats}
            />
            <div className="-mx-2 sm:mx-0">
              <Slider {...sliderSettings} className="gap-4 sm:gap-6 px-2 sm:px-0">
                <div className="pr-4 sm:pr-6">
                  <div className="bg-gray-800 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h4 className="text-white text-sm font-medium">Interest Accumulation</h4>
                      <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-2 sm:px-3 py-1">
                        <span className="text-white text-xs sm:text-sm">Weekly</span>
                        <ChevronDown className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <InterestTrendChart
                      data={analyticsData?.interest_trend || []}
                    />
                  </div>
                </div>
                <div className="pr-4 sm:pr-6">
                  <div className="bg-gray-800 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h4 className="text-white text-sm font-medium">Weekly Withdrawals</h4>
                      <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-2 sm:px-3 py-1">
                        <span className="text-white text-xs sm:text-sm">Weekly</span>
                        <ChevronDown className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <WithdrawalChart
                      withdrawals={analyticsData?.withdrawals || []}
                      weeklyWithdrawals={analyticsData?.weekly_withdrawals || {}}
                    />
                  </div>
                </div>
              </Slider>
            </div>
          </div>
        );

      case 'interest':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-2xl p-6">
                <div className="text-sm text-gray-600 mb-2">Total Interest Earned</div>
                <div className="text-2xl font-bold text-gray-800">
                  ₦{analyticsData?.summary_stats?.total_earned?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="bg-blue-50 rounded-2xl p-6">
                <div className="text-sm text-gray-600 mb-2">Average Weekly Interest</div>
                <div className="text-2xl font-bold text-gray-800">
                  ₦{analyticsData?.summary_stats?.average_weekly_interest?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="bg-purple-50 rounded-2xl p-6">
                <div className="text-sm text-gray-600 mb-2">Weeks Invested</div>
                <div className="text-2xl font-bold text-gray-800">
                  {analyticsData?.summary_stats?.weeks_elapsed || 0}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Interest Trend</h3>
                  <p className="text-sm text-gray-600">Your cumulative interest growth</p>
                </div>
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                  <span className="text-gray-600 text-sm">Weekly</span>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <div className="w-full">
                <InterestTrendChart
                  data={analyticsData?.interest_trend || []}
                />
              </div>
            </div>
          </div>
        );

      case 'withdrawals':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-orange-50 rounded-2xl p-6">
                <div className="text-sm text-gray-600 mb-2">Total Withdrawn</div>
                <div className="text-2xl font-bold text-gray-800">
                  ₦{analyticsData?.summary_stats?.total_withdrawn?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="bg-red-50 rounded-2xl p-6">
                <div className="text-sm text-gray-600 mb-2">Largest Withdrawal</div>
                <div className="text-2xl font-bold text-gray-800">
                  ₦{analyticsData?.summary_stats?.largest_withdrawal?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="bg-indigo-50 rounded-2xl p-6">
                <div className="text-sm text-gray-600 mb-2">Withdrawal Count</div>
                <div className="text-2xl font-bold text-gray-800">
                  {analyticsData?.summary_stats?.withdrawal_count || 0}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Withdrawal History</h3>
                  <p className="text-sm text-gray-600">Your withdrawal patterns</p>
                </div>
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                  <span className="text-gray-600 text-sm">Weekly</span>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <div className="w-full">
                <WithdrawalChart
                  withdrawals={analyticsData?.withdrawals || []}
                  weeklyWithdrawals={analyticsData?.weekly_withdrawals || {}}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-6 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">Investment Analytics</h3>
          <p className="text-xs md:text-sm text-gray-600">Track your interest accumulation and withdrawal patterns</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {isRefreshing && (
            <Loader className="w-4 h-4 animate-spin text-green-600" />
          )}
          <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6 p-1 bg-gray-100 rounded-lg">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default InvestmentAnalyticsSection;
