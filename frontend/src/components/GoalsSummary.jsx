import React, { useState, useEffect } from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { dashboardAPI, getSessionToken, portfolioAPI } from '../services/api';
import cacheService from '../services/cache';

const GoalsSummary = ({ dashboardData: propDashboardData, loading: loadingProp }) => {
  const [dashboardData, setDashboardData] = useState(propDashboardData);
  const [loading, setLoading] = useState(loadingProp ?? !propDashboardData);
  const [error, setError] = useState(null);

  // Fetch dashboard data if not provided as prop
  useEffect(() => {
    const fetchDashboardData = async () => {
      // If we already have data from props, don't fetch
      if (propDashboardData) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to get cached data first for immediate display
        const cachedData = cacheService.getDashboardData();
        if (cachedData) {
          setDashboardData(cachedData);
          setLoading(false);
        }

        // Fetch fresh data from API (will use cache internally)
        const data = await dashboardAPI.getDashboardData(true);
        if (data.success) {
          setDashboardData(data);
        } else {
          setError(data.error || 'Failed to load dashboard data');
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (!propDashboardData) {
      fetchDashboardData();
    }
  }, [propDashboardData]);

  // Listen for dashboard refresh events
  useEffect(() => {
    const handleDashboardRefresh = (event) => {
      // Refresh the dashboard data
      const freshData = cacheService.getDashboardData();
      if (freshData) {
        setDashboardData(freshData);
      }
    };

    window.addEventListener('dashboard:refreshed', handleDashboardRefresh);
    return () => window.removeEventListener('dashboard:refreshed', handleDashboardRefresh);
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount || 0).replace('NGN', '₦');
  };

  // If no data, show loading or empty state
  if (loading || !dashboardData) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-600" />
            Goals
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse bg-gray-200 rounded-full w-12 h-12 mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Loading goals...</p>
          </div>
        </div>
      </div>
    );
  }

  // Extract investment data
  const investment = dashboardData.investment;
  
  // If no investment data
  if (!investment) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-600" />
            Goals
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No investment yet</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress based on weeks elapsed and total weeks
  let progressPercentage = 0;
  let initialInvestment = 0;
  let currentBalance = 0;
  
  // Try to get progress data from dashboardData
  if (dashboardData.progress && dashboardData.progress.total_weeks > 0) {
    // Use progress data if available
    progressPercentage = dashboardData.progress.completion_percentage || 
      Math.min(100, Math.round((dashboardData.progress.weeks_elapsed / dashboardData.progress.total_weeks) * 100));
    initialInvestment = dashboardData.progress.initial_investment || investment.initial_investment || 0;
    currentBalance = dashboardData.progress.remaining_balance || 
      (investment.initial_investment || 0) + (dashboardData.progress.cumulative_interest || 0);
  } else {
    // Fallback calculation
    initialInvestment = investment.initial_investment || 0;
    // Current value should be total_paid + initial_investment
    const totalPaid = investment.total_paid || 0;
    currentBalance = initialInvestment + totalPaid;
    // For progress, we'll use a simple calculation based on balance vs initial investment
    progressPercentage = initialInvestment > 0 
      ? Math.min(100, Math.round(((currentBalance - initialInvestment) / initialInvestment) * 100))
      : 0;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <Target className="w-5 h-5 mr-2 text-green-600" />
          Goals
        </h3>
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Invested</span>
              <span className="font-medium">{formatCurrency(initialInvestment)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Value</span>
              <span className="font-medium">{formatCurrency(currentBalance)}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+{formatCurrency(currentBalance - initialInvestment)} earned</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsSummary;