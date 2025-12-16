// referralAPI.js
// API service for referral-related endpoints

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ReferralAPI {
  constructor() {
    this.token = null;
    this.baseURL = API_BASE_URL;
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
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
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

  // Get user's referral code
  async getReferralCode() {
    return this.fetchWithAuth('/referral/code');
  }

  // Validate a referral code
  async validateReferralCode(code) {
    return this.fetchWithAuth('/referral/validate', {
      method: 'POST',
      body: JSON.stringify({ referral_code: code })
    });
  }

  // Get referral statistics
  async getReferralStats() {
    return this.fetchWithAuth('/referral/stats');
  }

  // Get user points balance
  async getUserPoints() {
    return this.fetchWithAuth('/referral/points');
  }

  // Redeem points
  async redeemPoints(amount) {
    return this.fetchWithAuth('/referral/redeem', {
      method: 'POST',
      body: JSON.stringify({ amount: parseInt(amount) })
    });
  }

  // Get referral downlines
  async getDownlines() {
    return this.fetchWithAuth('/referral/downlines');
  }

  // Award points (admin/internal use)
  async awardPoints(userId, amount, reason) {
    return this.fetchWithAuth('/referral/award-points', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        amount: parseInt(amount),
        reason: reason
      })
    });
  }

  // Calculate redemption value
  calculateRedemptionValue(points) {
    // 1 point = ₦500
    return points * 500;
  }

  // Calculate points needed for amount
  calculatePointsNeeded(amount) {
    // ₦500 = 1 point
    return Math.ceil(amount / 500);
  }

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount || 0).replace('NGN', '₦');
  }
}

// Create a singleton instance
const referralAPI = new ReferralAPI();

// Export the instance
export default referralAPI;
