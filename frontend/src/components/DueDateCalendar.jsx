import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, DollarSign, Wallet } from 'lucide-react';
import Loader from '../loader';
import { portfolioAPI, getSessionToken, dashboardAPI } from '../services/api';
import dueDatesCacheService from '../services/dueDatesCache';

const DueDateCalendar = ({ onClose, investorId, dueDatesData: propDueDatesData, loading: loadingProp, fallbackSpendingBalance }) => {
  const [dueDates, setDueDates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const resizeObserverRef = useRef(null);

  // Fix for ResizeObserver loop limit exceeded error
  useEffect(() => {
    // Ignore ResizeObserver loop errors
    const errorHandler = (e) => {
      if (e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
        e.message === 'ResizeObserver loop limit exceeded') {
        e.stopImmediatePropagation();
        return false;
      }
    };

    window.addEventListener('error', errorHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  // Optimized caching strategy - load from cache first, then fetch fresh
  useEffect(() => {
    const fetchDueDatesData = async () => {
      const token = getSessionToken();
      if (!token) {
        console.log('DueDateCalendar: No session token found');
        setError('Authentication required');
        setLoading(false);
        return;
      }

      if (propDueDatesData) {
        console.log('DueDateCalendar: Using propDueDatesData', propDueDatesData);
        setDueDates(propDueDatesData);
        setLoading(false);
        return;
      }

      if (investorId && dueDatesCacheService.isCacheValid(investorId)) {
        const cachedData = dueDatesCacheService.getDueDatesData(investorId);
        if (cachedData) {
          console.log('DueDateCalendar: Using cached data', cachedData);
          setDueDates(cachedData);
          setLoading(false);

          try {
            console.log('DueDateCalendar: Triggering background refresh');
            const freshResult = await dashboardAPI.getInvestorDueDates(investorId, false);
            console.log('DueDateCalendar: Background refresh result', freshResult);
            if (freshResult.success) {
              setDueDates(freshResult.data);
              setError(null);
            }
          } catch (err) {
            console.error('Background refresh failed:', err);
          }
          return;
        }
      }

      setLoading(true);
      try {
        let response;
        console.log('DueDateCalendar: Fetching fresh data for investorId:', investorId);
        if (investorId) {
          response = await dashboardAPI.getInvestorDueDates(investorId, false);
        } else {
          response = await portfolioAPI.getDueDatesData();
        }

        console.log('DueDateCalendar: API Response:', response);

        if (response.success) {
          const data = response.data || response;
          console.log('DueDateCalendar: Parsed data:', data);
          if (investorId && data) {
            dueDatesCacheService.saveDueDatesData(data, investorId);
          }
          setDueDates(data);
          setError(null);
          setLoading(false);
        } else {
          console.warn('DueDateCalendar: API returned success=false', response);
          setError(response.error || 'Failed to load due dates data');
          setLoading(false);
        }
      } catch (err) {
        console.error('Due dates fetch error:', err);
        setError(err.message || 'Failed to load due dates data');
        setLoading(false);
      }
    };

    fetchDueDatesData();
  }, [propDueDatesData, investorId]);

  // Listen for due dates refresh events
  useEffect(() => {
    const handleDueDatesRefresh = (event) => {
      if (investorId) {
        // Refresh the due dates data
        const freshData = dueDatesCacheService.getDueDatesData(investorId);
        if (freshData) {
          setDueDates(freshData);
        }
      }
    };

    window.addEventListener('dueDates:refreshed', handleDueDatesRefresh);
    return () => window.removeEventListener('dueDates:refreshed', handleDueDatesRefresh);
  }, [investorId]);

  const formatDate = (dateString) => {
    // Handle different date formats
    let date;
    if (typeof dateString === 'string') {
      // Handle ISO date strings
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        // Handle other date formats
        date = new Date(dateString);
      }
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      // Fallback to current date if invalid
      return 'Not set';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Not set';
    }

    return date.toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (dateString) => {
    // Handle different date formats
    let date;
    if (typeof dateString === 'string') {
      // Handle ISO date strings
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        // Handle other date formats
        date = new Date(dateString);
      }
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      // Fallback to current date if invalid
      return 'Not set';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Not set';
    }

    return date.toLocaleDateString('en-NG');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount || 0).replace('NGN', '₦');
  };

  if (loading && !dueDates) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <div className="text-center">
            <Loader text="Loading payment schedule..." size="small" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !dueDates) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Schedule</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where dueDates is still null
  if (!dueDates) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Data</h3>
            <p className="text-gray-500 mb-4">Payment schedule information is not available at this time.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract data with proper fallbacks
  const lastDueDate = dueDates.last_due_date || dueDates.data?.last_due_date || 'Not set';
  const nextDueDate = dueDates.next_due_date || dueDates.data?.next_due_date || 'Not set';
  // Prefer explicit due_dates.amount_due but fall back to provided fallbackSpendingBalance when amount_due is missing
  const rawAmountDue = dueDates.amount_due ?? dueDates.data?.amount_due;
  const amountDue = (typeof rawAmountDue === 'number' && rawAmountDue !== 0) ? rawAmountDue : (fallbackSpendingBalance || rawAmountDue || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 w-full max-w-md my-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Payment Schedule</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
            <Calendar className="text-blue-500 mr-3 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm text-gray-500">Last Interest Deposit Date</p>
              <p className="font-semibold text-gray-900">
                {formatDate(lastDueDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <Clock className="text-green-500 mr-3 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm text-gray-500">Next Interest Deposit Date</p>
              <p className="font-semibold text-gray-900">
                {formatDate(nextDueDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-purple-50 rounded-lg">
            <Wallet className="text-purple-500 mr-3 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm text-gray-500">Spending Account Balance</p>
              <p className="font-semibold text-gray-900">
                {formatCurrency(amountDue)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">How It Works</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <span className="text-green-600 text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Weekly Interest</p>
                  <p className="text-sm text-gray-600">Interest is calculated weekly based on your investment</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <span className="text-green-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Auto-Deposit</p>
                  <p className="text-sm text-gray-600">Interest is automatically deposited to your spending account on due dates</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <span className="text-green-600 text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Flexible Withdrawals</p>
                  <p className="text-sm text-gray-600">Withdraw from your spending account anytime</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DueDateCalendar;
