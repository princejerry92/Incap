import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, getSessionToken, portfolioAPI, notificationsAPI } from './services/api.js';
import cacheService from './services/cache.js';
import Loader from './loader.jsx';
import GoalsStory from './components/GoalsStory.jsx';
import './Goals.css';
import { XCircle, Target, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';


const Goals = ({ dashboardData: propDashboardData, loading: loadingProp }) => {
  const [goalsData, setGoalsData] = useState(null);
  const [dashboardData, setDashboardData] = useState(propDashboardData);
  const [loading, setLoading] = useState(loadingProp ?? !propDashboardData);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Ref to track previous progress percentage for milestone notifications
  const previousProgressRef = useRef(0);

  // Notification utilities for goals
  const sendGoalNotification = useCallback(async (title, message, type = 'info', eventType = 'goal_update', metadata = {}) => {
    try {
      const notificationData = {
        investor_id: dashboardData?.user?.id,
        title,
        message,
        type,
        event_type: eventType,
        timestamp: new Date().toISOString(),
        ...metadata
      };

      // Create notification through the API
      const response = await notificationsAPI.createNotification(notificationData);

      if (response.success) {
        console.log(`Notification sent: ${title}`);
        // Trigger a custom event that the dashboard can listen to
        window.dispatchEvent(new CustomEvent('notification:created', {
          detail: response.data
        }));
      } else {
        console.error('Failed to create notification:', response.error);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [dashboardData]);

  // Check for goal milestones and send notifications
  const checkGoalMilestones = useCallback((goalsData) => {
    if (!goalsData?.progress) return;

    const { percentage } = goalsData.progress;
    const prevPercentage = previousProgressRef.current;

    // Milestones to check: 25%, 50%, 75%, 100%
    const milestones = [25, 50, 75, 100];
    const achievedMilestones = milestones.filter(mile => prevPercentage < mile && percentage >= mile);

    achievedMilestones.forEach(milestone => {
      const isComplete = milestone === 100;

      sendGoalNotification(
        isComplete ? '🎉 Goal Achieved!' : `Milestone Reached: ${milestone}%`,
        isComplete
          ? `Congratulations! You've reached your investment goal of ₦${goalsData.progress.target_amount?.toLocaleString()}. Great job on your financial journey!`
          : `Great progress! You've reached ${milestone}% of your investment goal. You're on track to achieve your target amount.`,
        isComplete ? 'success' : 'info',
        isComplete ? 'goal_achieved' : 'goal_milestone',
        {
          milestone_percentage: milestone,
          current_amount: goalsData.progress.current_amount,
          target_amount: goalsData.progress.target_amount
        }
      );
    });

    // Store current percentage for next comparison
    previousProgressRef.current = percentage;
  }, [sendGoalNotification]);

  // Send goal initialization notification
  const notifyGoalInitialization = useCallback((goalsData) => {
    if (!goalsData?.investment || !goalsData?.progress) return;

    const { investment, progress } = goalsData;

    sendGoalNotification(
      '🎯 Investment Goal Set',
      `Your goal of ₦${progress.target_amount?.toLocaleString()} has been set for ${investment.portfolio_type} - ${investment.investment_type}. Track your progress and stay motivated!`,
      'success',
      'goal_created',
      {
        portfolio_type: investment.portfolio_type,
        investment_type: investment.investment_type,
        target_amount: progress.target_amount,
        start_date: new Date().toISOString()
      }
    );
  }, [sendGoalNotification]);

  // Fetch goals data on mount
  useEffect(() => {
    const fetchGoalsData = async () => {
      const token = getSessionToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to get cached dashboard data first for immediate display
        const cachedData = cacheService.getDashboardData();
        if (cachedData && !propDashboardData) {
          setDashboardData(cachedData);
        }

        // If we have dashboard data with goals, use it directly (dashboard now includes full goals data)
        if ((propDashboardData || cachedData) && (propDashboardData?.goals || cachedData?.goals)) {
          const dataToUse = propDashboardData || cachedData;

          // Use the goals data directly from dashboard cache
          if (dataToUse.goals && Object.keys(dataToUse.goals).length > 0) {
            setGoalsData(dataToUse.goals);
            setLoading(false);
            return;
          }
        }

        // Fallback: if dashboard data exists but no goals, construct minimal goals data
        if ((propDashboardData || cachedData) && (propDashboardData?.investment || cachedData?.investment)) {
          const dataToUse = propDashboardData || cachedData;

          if (dataToUse.investment) {
            // Construct minimal goals data from dashboard data
            const goalsFromCache = {
              investment: dataToUse.investment,
              progress: {
                current_amount: dataToUse.investment?.total_balance || 0,
                target_amount: dataToUse.investment?.total_balance || 0,
                percentage: 100,
                weeks_elapsed: 0,
                total_weeks: 1,
                cumulative_interest: 0,
                cumulative_withdrawals: 0,
                remaining_balance: dataToUse.investment?.total_balance || 0,
                is_renewable: false
              },
              timeline: [],
              withdrawals: []
            };

            setGoalsData(goalsFromCache);
            setLoading(false);
            return;
          }
        }

        // Fetch fresh goals data from API
        const data = await portfolioAPI.getGoalsData();
        if (data.success) {
          setGoalsData(data.data);
          // Check for milestones when data is first loaded
          setTimeout(() => checkGoalMilestones(data.data), 100);
          
          // Send initialization notification for newly created goals
          if (!previousProgressRef.current && data.data?.progress?.percentage > 0) {
            notifyGoalInitialization(data.data);
          }
        } else {
          setError(data.error || 'Failed to load goals data');
        }
      } catch (err) {
        console.error('Goals fetch error:', err);
        // Handle specific case for users who haven't selected investment type
        if (err.message && err.message.includes('select an investment type')) {
          setError('Please select an investment type to view goals data. You can choose an investment option from the "Discover" section.');
        } else {
          setError(err.message || 'Failed to load goals data');
        }
        // If unauthorized, redirect to login
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we don't have complete goals data passed as prop
    if (propDashboardData && propDashboardData.investment && propDashboardData.progress && propDashboardData.timeline) {
      // If we have complete goals data as prop, use it
      setGoalsData(propDashboardData);
    } else {
      fetchGoalsData();
    }
  }, [propDashboardData, navigate, checkGoalMilestones, notifyGoalInitialization]);

  // Listen for dashboard refresh events
  useEffect(() => {
    const handleDashboardRefresh = (event) => {
      // Refresh the dashboard data
      const freshData = cacheService.getDashboardData();
      if (freshData) {
        // Use goals data if available, otherwise construct minimal goals data
        if (freshData.goals && Object.keys(freshData.goals).length > 0) {
          setGoalsData(freshData.goals);
        } else if (freshData.investment) {
          const updatedGoals = {
            investment: freshData.investment,
            progress: {
              current_amount: freshData.investment?.total_balance || 0,
              target_amount: freshData.investment?.total_balance || 0,
              percentage: 100,
              weeks_elapsed: 0,
              total_weeks: 1,
              cumulative_interest: 0,
              cumulative_withdrawals: 0,
              remaining_balance: freshData.investment?.total_balance || 0,
              is_renewable: false
            },
            timeline: [],
            withdrawals: []
          };
          setGoalsData(updatedGoals);
        }
      }
    };

    window.addEventListener('dashboard:refreshed', handleDashboardRefresh);
    return () => window.removeEventListener('dashboard:refreshed', handleDashboardRefresh);
  }, []);

  if (loading && !goalsData) {
    return <Loader text="Loading Goals..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Goals</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="goals-container">
      <GoalsStory goalsData={goalsData} />
    </div>
  );
};

export default Goals;
