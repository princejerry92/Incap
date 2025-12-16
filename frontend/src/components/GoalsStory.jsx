import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, ArrowDown, ArrowUp, RotateCw, CheckCircle, Target, Check, Flag, Sparkles, Award, TrendingDown, CircleDollarSign } from 'lucide-react';

const GoalsStory = ({ goalsData }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount || 0).replace('NGN', '₦');
  };

  // Format date
  const formatDate = (dateString) => {
    let date;
    if (typeof dateString === 'string') {
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        date = new Date(dateString);
      }
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      date = new Date();
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Progress bar component
  const ProgressBar = ({ current, total, label, color = 'lime' }) => {
    if (total <= 0) {
      return (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">{label}</span>
            <span className="text-sm font-bold text-gray-900">0%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full transition-all duration-700 ease-out" style={{ width: '0%' }}></div>
          </div>
        </div>
      );
    }
    
    const percentage = Math.round((current / total) * 100);
    const gradientColors = {
      lime: 'from-lime-400 via-green-400 to-emerald-500',
      blue: 'from-blue-400 via-cyan-400 to-teal-500',
      purple: 'from-purple-400 via-pink-400 to-rose-500'
    };
    
    return (
      <div className="mb-6 group">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-300">{label}</span>
          <span className="text-sm font-bold text-lime-600">{percentage}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className={`h-full bg-gradient-to-r ${gradientColors[color]} rounded-full transition-all duration-700 ease-out shadow-lg`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // If no goals data
  if (!goalsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl p-12 shadow-2xl border border-gray-200">
          <div className="relative inline-block mb-6">
            <Target className="w-20 h-20 text-gray-300 animate-pulse" />
            <Sparkles className="w-8 h-8 text-lime-500 absolute -top-2 -right-2 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Investment Data</h2>
          <p className="text-gray-600 max-w-sm mx-auto">Start your investment journey today and watch your wealth grow!</p>
        </div>
      </div>
    );
  }

  const { investment, progress, timeline, withdrawals } = goalsData;

  // Mobile view - Progress summary
  const MobileProgressView = () => (
    <div className="p-4 space-y-6">
      {/* Hero Card */}
      <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-lime-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-lime-500/30 animate-pulse">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Investment Progress</h3>
              <p className="text-xs text-gray-500">Track your journey</p>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-200 hover:border-lime-400 hover:shadow-lg hover:shadow-lime-500/10 transition-all duration-300">
            <div className="flex items-center space-x-2 mb-2">
              <CircleDollarSign className="w-5 h-5 text-lime-600" />
              <p className="text-xs text-gray-600 font-medium">Initial Amount</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(investment.initial_investment || 0)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-4 border border-gray-200 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <p className="text-xs text-gray-600 font-medium">Current Balance</p>
            </div>
            <p className="text-lg font-bold text-green-600">{formatCurrency(progress?.remaining_balance || 0)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-4 border border-gray-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <p className="text-xs text-gray-600 font-medium">Interest Earned</p>
            </div>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(progress?.cumulative_interest || 0)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-4 border border-gray-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <p className="text-xs text-gray-600 font-medium">Week Progress</p>
            </div>
            <p className="text-lg font-bold text-purple-600">{progress?.weeks_elapsed || 0}/{progress?.total_weeks || 0}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {progress && progress.total_weeks > 0 ? (
            <>
              <ProgressBar 
                current={progress.weeks_elapsed || 0} 
                total={progress.total_weeks} 
                label={`Weeks Completed`}
                color="lime"
              />
              
              <ProgressBar 
                current={progress.cumulative_interest || 0} 
                total={investment.initial_investment || 0} 
                label={`Interest Growth`}
                color="blue"
              />
              
              {(progress.cumulative_withdrawals || 0) > 0 && (
                <ProgressBar 
                  current={progress.cumulative_withdrawals || 0} 
                  total={investment.initial_investment || 0} 
                  label={`Total Withdrawals`}
                  color="purple"
                />
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Progress data not available</p>
            </div>
          )}
          
          {progress && progress.is_renewable && (
            <div className="bg-gradient-to-r from-lime-100 via-green-100 to-emerald-100 rounded-2xl p-4 border-2 border-lime-400 animate-pulse">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/50">
                  <RotateCw className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg font-bold text-lime-700">Investment is Renewable!</span>
              </div>
              <p className="text-sm text-gray-700 ml-13">
                Your interest equals initial investment - time to renew! 🎉
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Preview for Mobile */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-lime-600" />
          Journey Milestones
        </h3>
        {timeline && timeline.slice(0, 3).map((weekData, index) => (
          <div key={index} className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-lime-400 hover:shadow-lg hover:shadow-lime-500/10 transition-all duration-300">
            <div className="flex items-start space-x-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                weekData.is_final_week ? 'bg-gradient-to-br from-lime-400 to-green-500 shadow-lg shadow-lime-500/50' :
                weekData.is_completed ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30' :
                'bg-gray-100 border-2 border-gray-300'
              }`}>
                {weekData.is_final_week ? (
                  <Flag className="w-6 h-6 text-white" />
                ) : weekData.is_completed ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <Calendar className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-gray-900">Week {weekData.week}</h4>
                  <span className="text-xs text-gray-500">{formatDate(weekData.date)}</span>
                </div>
                <p className="text-xs text-lime-600 font-semibold mb-2">+{formatCurrency(weekData.interest_earned || 0)} earned</p>
                {weekData.is_final_week && (
                  <div className="flex items-center text-xs text-lime-600 font-semibold">
                    <Award className="w-4 h-4 mr-1" />
                    Journey Complete!
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Desktop view - Full story timeline
  const DesktopStoryView = () => (
    <div className="max-w-5xl mx-auto p-8">
      <div className="bg-white rounded-3xl p-8 mb-8 shadow-2xl border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-lime-400 to-green-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-lime-500/30 animate-pulse">
            <Target className="w-9 h-9 text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">Investment Journey Story</h3>
            <p className="text-gray-600">Follow your path to financial growth</p>
          </div>
        </div>
      </div>
      
      <div className="relative">
        {/* Animated gradient line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-lime-400 via-green-500 to-emerald-600 rounded-full shadow-lg shadow-lime-500/20"></div>
        
        <div className="space-y-8 relative">
          {/* Initial Investment */}
          <div className="relative pl-20 group">
            <div className="absolute left-0 w-16 h-16 bg-gradient-to-br from-lime-400 to-green-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-lime-500/50 border-4 border-white group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-9 h-9 text-white" />
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-xl border-l-4 border-lime-500 hover:shadow-2xl hover:shadow-lime-500/20 transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-xl font-bold text-gray-900">Initial Investment</h4>
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
                  {investment.start_date ? formatDate(investment.start_date) : 'Date not available'}
                </span>
              </div>
              <p className="text-gray-700 mb-4">
                Journey started with <span className="text-lime-600 font-bold text-lg">{formatCurrency(investment.initial_investment || 0)}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {investment.portfolio_type && (
                  <span className="px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200">
                    {investment.portfolio_type} Portfolio
                  </span>
                )}
                {investment.investment_type && (
                  <span className="px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200">
                    {investment.investment_type}
                  </span>
                )}
                {investment.weekly_interest_rate && (
                  <span className="px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-lime-100 to-green-100 text-lime-700 border border-lime-200">
                    {investment.weekly_interest_rate}% Weekly Returns
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Weekly Progress */}
          {timeline && timeline.length > 0 ? (
            timeline.map((weekData, index) => (
              <div key={weekData.week || index} className="relative pl-20 group">
                <div className={`absolute left-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white group-hover:scale-110 transition-transform duration-300 ${
                  weekData.is_final_week ? 'bg-gradient-to-br from-lime-400 to-green-500 shadow-lime-500/50 animate-bounce' :
                  weekData.is_renewable ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/50' :
                  weekData.is_completed ? 'bg-gradient-to-br from-gray-100 to-gray-200 shadow-gray-300/50 border-gray-300' :
                  'bg-white shadow-gray-300/50 border-gray-300'
                }`}>
                  {weekData.is_final_week ? (
                    <Flag className="w-9 h-9 text-white" />
                  ) : weekData.is_renewable ? (
                    <RotateCw className="w-9 h-9 text-white" />
                  ) : weekData.is_completed ? (
                    <CheckCircle className="w-9 h-9 text-lime-600" />
                  ) : (
                    <Calendar className="w-9 h-9 text-gray-400" />
                  )}
                </div>
                
                <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border-l-4 ${
                  weekData.is_final_week ? 'border-lime-500 hover:shadow-lime-500/20' :
                  weekData.is_renewable ? 'border-green-500 hover:shadow-green-500/20' :
                  weekData.is_completed ? 'border-green-400' :
                  'border-blue-400'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-1">
                        {weekData.is_final_week ? '🎉 Investment Complete!' :
                         weekData.is_renewable ? '♻️ Renewable Milestone' :
                         weekData.is_completed ? `✅ Week ${weekData.week} Completed` :
                         `Week ${weekData.week}`}
                      </h4>
                      <span className="text-sm text-gray-600 font-medium">
                        {weekData.date ? formatDate(weekData.date) : 'Date not available'} • Week {weekData.week} of {investment.duration_weeks || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gradient-to-br from-lime-50 to-white rounded-xl p-4 border border-lime-200 hover:border-lime-400 hover:shadow-lg hover:shadow-lime-500/10 transition-all duration-300">
                      <div className="flex items-center space-x-2 mb-2">
                        <ArrowUp className="w-5 h-5 text-lime-600" />
                        <span className="text-xs text-gray-600 font-medium">Interest Earned</span>
                      </div>
                      <p className="text-lg font-bold text-lime-600">+{formatCurrency(weekData.interest_earned || 0)}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 border border-green-200 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="text-xs text-gray-600 font-medium">Total Interest</span>
                      </div>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(weekData.cumulative_interest || 0)}</p>
                    </div>
                  </div>
                  
                  {weekData.withdrawals && weekData.withdrawals.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {weekData.withdrawals.map((withdrawal, idx) => (
                        <div key={idx} className="bg-red-50 rounded-xl p-3 border border-red-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <ArrowDown className="w-5 h-5 text-red-500" />
                              <span className="text-sm text-gray-900 font-semibold">Withdrawal</span>
                            </div>
                            <span className="text-sm font-bold text-red-600">-{formatCurrency(withdrawal.amount || 0)}</span>
                          </div>
                          <p className="text-xs text-gray-600 ml-7 mt-1">
                            {withdrawal.date ? formatDate(withdrawal.date) : 'Date not available'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {weekData.is_renewable && (
                    <div className="bg-gradient-to-r from-green-100 via-emerald-100 to-lime-100 rounded-xl p-4 border-2 border-green-400">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/50">
                          <RotateCw className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-700">Renewable Milestone Reached!</p>
                          <p className="text-xs text-gray-700">Interest equals initial investment</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {weekData.is_final_week && (
                    <div className="bg-gradient-to-r from-lime-100 via-green-100 to-emerald-100 rounded-xl p-4 border-2 border-lime-400">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-lime-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/50 animate-bounce">
                          <Award className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-lime-700">Investment Journey Complete!</p>
                          <p className="text-sm text-gray-700">Total interest earned: <span className="text-gray-900 font-bold">{formatCurrency(weekData.cumulative_interest || 0)}</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="relative pl-20">
              <div className="absolute left-0 w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white">
                <Target className="w-9 h-9 text-gray-400" />
              </div>
              <div className="bg-white rounded-2xl p-6 border-l-4 border-gray-300 shadow-xl">
                <h4 className="text-xl font-bold text-gray-900 mb-2">No Timeline Data</h4>
                <p className="text-gray-600">Timeline information is not available at this time.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/30">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Investment Goals</h2>
            </div>
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-lime-400 hover:shadow-lg hover:shadow-lime-500/20"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
      
      {isMobile ? <MobileProgressView /> : <DesktopStoryView />}
    </div>
  );
};

export default GoalsStory;