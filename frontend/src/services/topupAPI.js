// topupAPI.js
// API service for top-up related endpoints

import { dashboardAPI } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class TopUpAPI {
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
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Network error - dispatch event to show NetworkError component
        window.dispatchEvent(new CustomEvent('network:error'));
        throw error;
      }
      throw error;
    }
  }

  // Initiate a top-up request
  async initiateTopUp(amount) {
    return this.fetchWithAuth('/topup/initiate', {
      method: 'POST',
      body: JSON.stringify({ amount: parseFloat(amount) })
    });
  }

  // Get top-up history
  async getTopUpHistory() {
    return this.fetchWithAuth('/topup/history');
  }
}

// Create a singleton instance
const topupAPI = new TopUpAPI();

// Export the instance
export default topupAPI;
