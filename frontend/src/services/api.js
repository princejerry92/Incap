/*
API service for making authenticated requests to the backend
* Now with smart caching for instant dashboard loads
*/

import dashboardAPI from './dashboardAPI';
import portfolioAPI from './portfolioAPI';
import withdrawalAPI from './withdrawalAPI';
import topupAPI from './topupAPI';
import notificationsAPI from './notificationsAPI';
import referralAPI from './referralAPI';
import customerCareAPI from './customerCareAPI';

// Get session token from localStorage
export const getSessionToken = () => {
  return localStorage.getItem('session_token');
};

// Set session token in localStorage
export const setSessionToken = (token) => {
  localStorage.setItem('session_token', token);
  // Also set it on the dashboard API instance
  dashboardAPI.setToken(token);
  // Also set it on the portfolio API instance
  portfolioAPI.setToken(token);
  // Also set it on the withdrawal API instance
  withdrawalAPI.setToken(token);
  // Also set it on the top-up API instance
  topupAPI.setToken(token);
  // Also set it on the notifications API instance
  notificationsAPI.setToken(token);
  // Also set it on the referral API instance
  referralAPI.setToken(token);
  // Also set it on the customer care API instance
  customerCareAPI.setToken(token);
};

// Clear session token from localStorage
export const clearSessionToken = () => {
  const token = localStorage.getItem('session_token');
  if (token) {
    const sessions = JSON.parse(localStorage.getItem('all_sessions') || '[]');
    const updatedSessions = sessions.filter(s => s.token !== token);
    localStorage.setItem('all_sessions', JSON.stringify(updatedSessions));
  }
  localStorage.removeItem('session_token');
  // Also clear it on the dashboard API instance
  dashboardAPI.setToken(null);
  // Also clear it on the portfolio API instance
  portfolioAPI.setToken(null);
  // Also clear it on the withdrawal API instance
  withdrawalAPI.setToken(null);
  // Also clear it on the top-up API instance
  topupAPI.setToken(null);
  // Also clear it on the notifications API instance
  notificationsAPI.setToken(null);
  // Also clear it on the referral API instance
  referralAPI.setToken(null);
  // Also clear it on the customer care API instance
  customerCareAPI.setToken(null);
};

// Initialize APIs with token if available
const token = getSessionToken();
if (token) {
  dashboardAPI.setToken(token);
  portfolioAPI.setToken(token);
  withdrawalAPI.setToken(token);
  topupAPI.setToken(token);
  notificationsAPI.setToken(token);
  referralAPI.setToken(token);
  customerCareAPI.setToken(token);
}

// Validate session quickly using a lightweight endpoint
export const validateSession = async () => {
  try {
    // dashboardAPI exposes fetchWithAuth on the instance
    if (!dashboardAPI || !dashboardAPI.fetchWithAuth) {
      throw new Error('dashboardAPI not initialized');
    }
    const resp = await dashboardAPI.fetchWithAuth('/auth/verify-session');
    return resp;
  } catch (err) {
    throw err;
  }
};

// Export all APIs
export {
  dashboardAPI,
  portfolioAPI,
  withdrawalAPI,
  topupAPI,
  notificationsAPI,
  referralAPI,
  customerCareAPI
};
