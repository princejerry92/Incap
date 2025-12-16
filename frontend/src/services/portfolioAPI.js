// portfolioAPI.js
// API service for portfolio-related endpoints

import cacheService from './cache';

// Import cacheService methods (available through the default export)
const { startBackgroundFetch, endBackgroundFetch } = cacheService;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class PortfolioAPI {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async fetchWithAuth(url, options = {}) {
    // Check if we have a valid token
    if (!this.token) {
      const sessionToken = localStorage.getItem('session_token');
      if (sessionToken) {
        this.token = sessionToken;
      } else {
        throw new Error('No authentication token available');
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
        
        // Handle specific case for users who haven't selected investment type
        if (response.status === 400 && errorMessage.includes('Invalid investment type')) {
          throw new Error('Please select an investment type to view analytics data');
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Network error - dispatch event to show NetworkError component
        window.dispatchEvent(new CustomEvent('network:error'));
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      throw error;
    }
  }

  // Get available investment options for the user's portfolio
  async getAvailableInvestments() {
    return this.fetchWithAuth('/portfolio/available-investments');
  }

  // Get requirements for a specific investment type
  async getInvestmentRequirements(investmentType, portfolioType = null) {
    let url = `/portfolio/investment-requirements?investment_type=${encodeURIComponent(investmentType)}`;
    if (portfolioType) {
      url += `&portfolio_type=${encodeURIComponent(portfolioType)}`;
    }
    return this.fetchWithAuth(url);
  }

  // Validate if an investment meets the minimum requirements
  async validateInvestment(portfolioType, investmentType, initialBalance) {
    return this.fetchWithAuth('/portfolio/validate-investment', {
      method: 'POST',
      body: JSON.stringify({
        portfolio_type: portfolioType,
        investment_type: investmentType,
        initial_balance: initialBalance
      })
    });
  }

  // Get complete portfolio data for the authenticated user
  async getPortfolioData() {
    return this.fetchWithAuth('/portfolio/portfolio-data');
  }

  // Update the investment type for the authenticated user
  async updateInvestmentType(investmentType) {
    return this.fetchWithAuth('/portfolio/update-investment-type', {
      method: 'POST',
      body: JSON.stringify({
        investment_type: investmentType
      })
    });
  }

  // Get comprehensive goals data for the authenticated user
  async getGoalsData() {
    return this.fetchWithAuth('/portfolio/goals-data');
  }

  // Get due dates data for the authenticated user
  async getDueDatesData() {
    return this.fetchWithAuth('/portfolio/due-dates-data');
  }

  // Get analytics data for investment charts and visualizations
  async getAnalyticsData(useCache = true) {
    // If cache is valid and we're allowed to use it, return cached data
    if (useCache) {
      const cachedData = cacheService.getAnalyticsData();
      if (cachedData) {
        console.debug('[portfolioAPI] cache hit for analytics', cachedData);
        // Check if cached data contains only zeros - if so, invalidate cache
        if (this._isAnalyticsDataAllZeros(cachedData)) {
          console.warn('[portfolioAPI] cached analytics contains all zeros, clearing cache');
          this._clearAnalyticsCache();
        } else {
          // Trigger background refresh if needed
          if (cacheService.shouldTriggerBackgroundRefresh()) {
            // Start background refresh without blocking
            this._backgroundRefreshAnalytics();
          }
          return {
            success: true,
            data: cachedData,
            _cached: true
          };
        }
      } else {
        console.debug('[portfolioAPI] cache miss for analytics');
      }
    }

    try {
      console.debug('[portfolioAPI] fetching /portfolio/analytics-data');
      const response = await this.fetchWithAuth('/portfolio/analytics-data');

      // Save to cache if successful
      if (response && response.success && response.data) {
        console.debug('[portfolioAPI] saving analytics to cache', response.data);
        cacheService.saveAnalyticsData(response.data);
      } else {
        console.warn('[portfolioAPI] unexpected analytics response shape', response);
      }

      return response;
    } catch (error) {
      console.error('[portfolioAPI] analytics fetch error', error);
      // If we have cached data, return it even if API fails
      if (useCache) {
        const cachedData = cacheService.getAnalyticsData();
        if (cachedData) {
          return {
            success: true,
            data: cachedData,
            _cached: true,
            _fromCacheDueToError: true,
            _error: error.message
          };
        }
      }
      throw error;
    }
  }

  // Background refresh for analytics data
  async _backgroundRefreshAnalytics() {
    // Check if background fetch is already running to prevent overlapping
    if (cacheService.isBackgroundFetchRunning()) {
      console.log('Background refresh already running, skipping');
      return;
    }

    try {
      cacheService.startBackgroundFetch();
      const response = await this.fetchWithAuth('/portfolio/analytics-data');
      if (response.success) {
        cacheService.saveAnalyticsData(response.data);

        // Dispatch event to notify UI of updated data
        window.dispatchEvent(new CustomEvent('analytics:refreshed', {
          detail: {
            lastUpdate: Date.now()
          }
        }));
      }
    } catch (error) {
      console.error('Analytics background refresh failed:', error);
      // Even on error, we keep the cached data
    } finally {
      cacheService.endBackgroundFetch();
    }
  }

  // Helper method to check if analytics data contains only zeros
  _isAnalyticsDataAllZeros(data) {
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
  }

  // Helper method to clear analytics cache
  _clearAnalyticsCache() {
    try {
      localStorage.removeItem('dashboard_analytics_plain');
      console.debug('[portfolioAPI] cleared analytics cache');
      return true;
    } catch (error) {
      console.error('[portfolioAPI] failed to clear analytics cache', error);
      return false;
    }
  }
}

// Create a singleton instance
const portfolioAPI = new PortfolioAPI();

// Export the instance
export default portfolioAPI;
