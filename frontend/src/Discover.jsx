import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, portfolioAPI, getSessionToken } from './services/api';
import cacheService from './services/cache';
import Loader from './loader.jsx';
import './global-styles.css';
import { 
  DollarSign,
  Truck,
  Building,
  Sprout,
  CheckCircle,
  XCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Lock,
  Star
} from 'lucide-react';

const Discover = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = getSessionToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const cachedData = cacheService.getDashboardData();
        if (cachedData) {
          setDashboardData(cachedData);
          setLoading(false);
        }

        const data = await dashboardAPI.getDashboardData(true);
        if (data.success) {
          setDashboardData(data);
        } else {
          setError(data.error || 'Failed to load dashboard data');
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load dashboard data');
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  useEffect(() => {
    const handleDashboardRefresh = (event) => {
      const freshData = cacheService.getDashboardData();
      if (freshData) {
        setDashboardData(freshData);
      }
    };

    window.addEventListener('dashboard:refreshed', handleDashboardRefresh);
    return () => window.removeEventListener('dashboard:refreshed', handleDashboardRefresh);
  }, []);

  const investmentOptions = [
    {
      id: 'Gold Starter',
      name: 'Gold Starter',
      icon: DollarSign,
      description: 'Invest in precious metals with stable returns',
      gradient: 'from-yellow-400 to-amber-600',
      iconBg: 'bg-gradient-to-br from-yellow-100 to-amber-100',
      badge: 'Most Stable',
      badgeColor: 'bg-yellow-500',
      unavailableMessage: 'Not available for your portfolio type'
    },
    {
      id: 'Gold Flair',
      name: 'Gold Flair',
      icon: Truck,
      description: 'Invest in logistics and transportation infrastructure',
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-gradient-to-br from-blue-100 to-indigo-100',
      badge: 'High Liquidity',
      badgeColor: 'bg-blue-500',
      unavailableMessage: 'Not available for your portfolio type'
    },
    {
      id: 'Gold Accent',
      name: 'Gold Accent',
      icon: Building,
      description: 'Invest in property development and management',
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-gradient-to-br from-emerald-100 to-teal-100',
      badge: 'Premium Growth',
      badgeColor: 'bg-emerald-500',
      unavailableMessage: 'Not available for your portfolio type'
    },
    {
      id: 'Gold Luxury',
      name: 'Gold Luxury',
      icon: Sprout,
      description: 'Invest in agricultural projects and farming ventures',
      gradient: 'from-green-500 to-lime-600',
      iconBg: 'bg-gradient-to-br from-green-100 to-lime-100',
      badge: 'Sustainable',
      badgeColor: 'bg-green-500',
      unavailableMessage: 'Not available for your portfolio type'
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount || 0).replace('NGN', '₦');
  };

  const getPortfolioType = () => {
    const portfolioType = dashboardData?.investment?.portfolio_type || 'N/A';
    
    if (portfolioType.includes('Conservative')) {
      return 'Conservative';
    } else if (portfolioType.includes('Balanced')) {
      return 'Balanced';
    } else if (portfolioType.includes('Growth')) {
      return 'Growth';
    }
    
    return portfolioType;
  };

  const getAvailableInvestments = () => {
    return dashboardData?.investment?.available_investments || [];
  };

  const isInvestmentAvailable = (investmentId) => {
    const available = getAvailableInvestments();
    return available.includes(investmentId);
  };

  const canAffordInvestment = (investmentId) => {
    const requirements = getInvestmentRequirements(investmentId);
    const balance = getInitialInvestment();

    if (!requirements) return false;

    return balance >= requirements.minimum;
  };

  const getInvestmentRequirements = (investmentId) => {
    const portfolioType = getPortfolioType();

    const requirements = {
      'Conservative': {
        'Gold Starter': { minimum: 100000, duration: 20, interest: 5.0 },
        'Gold Flair': { minimum: 250000, duration: 20, interest: 5.0 }
      },
      'Balanced': {
        'Gold Starter': { minimum: 2500000, duration: 12, interest: 7.0 },
        'Gold Flair': { minimum: 5000000, duration: 12, interest: 7.0 },
        'Gold Accent': { minimum: 7500000, duration: 12, interest: 7.0 }
      },
      'Growth': {
        'Gold Starter': { minimum: 10000000, duration: 10, interest: 10.0 },
        'Gold Flair': { minimum: 12000000, duration: 10, interest: 10.0 },
        'Gold Accent': { minimum: 15000000, duration: 10, interest: 10.0 },
        'Gold Luxury': { minimum: 20000000, duration: 10, interest: 10.0 }
      }
    };

    return requirements[portfolioType]?.[investmentId] || null;
  };

  const handleInvestmentSelect = (investmentId) => {
    if (!isInvestmentAvailable(investmentId) || !canAffordInvestment(investmentId)) return;

    setSelectedInvestment(investmentId);
    setShowDetails(true);
  };

  const handleInvest = async () => {
    if (!selectedInvestment) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await portfolioAPI.updateInvestmentType(selectedInvestment);
      
      if (result.success) {
        const updatedDashboardData = {
          ...dashboardData,
          investment: {
            ...dashboardData.investment,
            investment_type: selectedInvestment
          }
        };
        setDashboardData(updatedDashboardData);
        
        setShowDetails(false);
        alert(`Investment type updated to ${selectedInvestment} successfully!`);
      } else {
        alert(`Error updating investment type: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating investment type:', err);
      alert(`Error updating investment type: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitialInvestment = () => {
    return dashboardData?.investment?.total_balance || 0;
  };

  const hasInvestmentType = () => {
    return dashboardData?.investment?.investment_type && dashboardData?.investment?.investment_type !== 'Not Selected';
  };

  if (loading && !dashboardData) {
    return <Loader text="Loading investment options..." textColor="#070707ff" />;
  }

  if (error && !dashboardData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Error Loading Investments</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Premium Header with Gradient */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-500 shadow-xl bg-opacity-20 backdrop-blur-sm p-2.5 sm:p-3 rounded-xl">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  Discover Premium Investments
                </h1>
                <p className="mt-1 sm:mt-2 text-green-50 flex items-center gap-2 text-sm sm:text-base">
                  <Star className="w-4 h-4" />
                  Curated opportunities for your {getPortfolioType()} portfolio
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-teal-600 bg-opacity-20 backdrop-blur-sm text-white hover:bg-opacity-30 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-white border-opacity-30"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Premium Portfolio Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 mb-8 sm:mb-12 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full blur-3xl opacity-30 -mr-24 sm:-mr-32 -mt-24 sm:-mt-32"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 sm:p-4 rounded-2xl shadow-lg">
                  <TrendingUp className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="ml-4 sm:ml-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Your Portfolio Overview</h3>
                  <p className="text-gray-600 mt-1 text-base sm:text-lg">
                    Current investment: <span className="font-bold text-green-600">{formatCurrency(getInitialInvestment())}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="px-3 sm:px-4 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold">
                      {getPortfolioType()} Portfolio
                    </span>
                    {hasInvestmentType() && (
                      <span className="px-3 sm:px-4 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {dashboardData?.investment?.investment_type}
                      </span>
                    )}
                    {!hasInvestmentType() && (
                      <span className="px-3 sm:px-4 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 rounded-full text-xs sm:text-sm font-semibold animate-pulse">
                        Select an investment below
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Investment Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {investmentOptions.map((option) => {
            const IconComponent = option.icon;
            const portfolioAvailable = isInvestmentAvailable(option.id);
            const canAfford = canAffordInvestment(option.id);
            const available = portfolioAvailable && canAfford;
            const requirements = portfolioAvailable ? getInvestmentRequirements(option.id) : null;

            return (
              <div
                key={option.id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 border-2 relative group ${
                  available
                    ? 'hover:shadow-2xl cursor-pointer hover:border-green-400 border-gray-200 hover:scale-[1.02] sm:hover:scale-105 transform'
                    : 'opacity-60 sm:opacity-50 cursor-not-allowed border-gray-200'
                }`}
                onClick={() => available && handleInvestmentSelect(option.id)}
              >
                {/* Gradient overlay on hover */}
                {available && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                )}
                
                <div className="p-5 sm:p-6 relative z-10">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className={`p-3 sm:p-4 rounded-xl ${option.iconBg} shadow-md`}>
                      <IconComponent className="h-6 w-6 sm:h-7 sm:w-7 text-gray-700" />
                    </div>
                    {available ? (
                      <div className="bg-green-100 p-1.5 sm:p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-1.5 sm:p-2 rounded-full">
                        <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-2 sm:mb-3">
                    <span className={`${option.badgeColor} text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full`}>
                      {option.badge}
                    </span>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">{option.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">{option.description}</p>
                  
                  {available && requirements && (
                    <div className="space-y-2.5 sm:space-y-3 pt-3 sm:pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] sm:text-xs text-gray-500 font-medium">Min. Investment</span>
                        <span className="font-bold text-gray-900 text-sm">{formatCurrency(requirements.minimum)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] sm:text-xs text-gray-500 font-medium">Duration</span>
                        <span className="font-bold text-gray-900 text-sm">{requirements.duration} weeks</span>
                      </div>
                      <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 p-2.5 sm:p-3 rounded-lg -mx-1 sm:-mx-2">
                        <span className="text-[11px] sm:text-xs text-green-700 font-semibold">Weekly Interest</span>
                        <span className="font-bold text-green-700 text-base sm:text-lg">{requirements.interest}%</span>
                      </div>
                    </div>
                  )}
                  
                  {!available && (
                    <div className="mt-3 sm:mt-4 bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                          {portfolioAvailable
                            ? `Insufficient balance - requires ${formatCurrency(requirements?.minimum || 0)}`
                            : option.unavailableMessage
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Premium Investment Details Modal */}
        {showDetails && selectedInvestment && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl overflow-hidden transform transition-all flex flex-col max-h-[90vh] sm:max-h-[85vh] overscroll-contain">
              {/* Modal Header with Gradient */}
              <div className={`sticky top-0 z-10 bg-gradient-to-r ${investmentOptions.find(opt => opt.id === selectedInvestment)?.gradient} p-6 sm:p-8 text-white relative overflow-hidden pt-[env(safe-area-inset-top)]`}>
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white rounded-full blur-3xl opacity-10 -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Investment Details</h3>
                    <p className="text-white text-opacity-90 text-xs sm:text-sm">Review your investment choice</p>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all"
                    disabled={isSubmitting}
                    aria-label="Close details"
                  >
                    <XCircle className="h-6 w-6 sm:h-7 sm:w-7" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 sm:space-y-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 sm:p-6 border border-gray-200">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`p-2.5 sm:p-3 rounded-xl ${investmentOptions.find(opt => opt.id === selectedInvestment)?.iconBg}`}>
                      {React.createElement(investmentOptions.find(opt => opt.id === selectedInvestment)?.icon, {
                        className: "h-5 w-5 sm:h-6 sm:w-6 text-gray-700"
                      })}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base sm:text-lg">{selectedInvestment}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {investmentOptions.find(opt => opt.id === selectedInvestment)?.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                {(() => {
                  const requirements = getInvestmentRequirements(selectedInvestment);
                  return requirements ? (
                    <div className="space-y-3.5 sm:space-y-4">
                      <div className="flex justify-between items-center pb-2.5 sm:pb-3 border-b border-gray-200">
                        <span className="text-gray-600 text-sm sm:text-base font-medium">Minimum Investment</span>
                        <span className="font-bold text-gray-900 text-base sm:text-lg">{formatCurrency(requirements.minimum)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2.5 sm:pb-3 border-b border-gray-200">
                        <span className="text-gray-600 text-sm sm:text-base font-medium">Your Investment</span>
                        <span className="font-bold text-green-600 text-base sm:text-lg">{formatCurrency(getInitialInvestment())}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2.5 sm:pb-3 border-b border-gray-200">
                        <span className="text-gray-600 text-sm sm:text-base font-medium">Duration</span>
                        <span className="font-bold text-gray-900">{requirements.duration} weeks</span>
                      </div>
                      <div className="flex justify-between items-center pb-2.5 sm:pb-3 border-b border-gray-200">
                        <span className="text-gray-600 text-sm sm:text-base font-medium">Weekly Interest Rate</span>
                        <span className="font-bold text-green-600 text-lg sm:text-xl">{requirements.interest}%</span>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-5 rounded-xl border-2 border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 text-sm sm:text-base font-semibold">Estimated Weekly Return</span>
                          <span className="font-bold text-green-700 text-xl sm:text-2xl">
                            {formatCurrency((getInitialInvestment() * requirements.interest) / 100)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4 px-6 sm:px-8 pb-[max(env(safe-area-inset-bottom),1rem)] border-t border-gray-100">
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-full sm:flex-1 px-6 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all duration-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvest}
                  className="w-full sm:flex-1 px-6 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transform hover:scale-[1.02] sm:hover:scale-105 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    'Saving...'
                  ) : (
                    <>
                      {hasInvestmentType() ? 'Change Investment' : 'Select Investment'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
