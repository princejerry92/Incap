// customerCareAPI.js
// API service for customer care related endpoints

import { dashboardAPI } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class CustomerCareAPI {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async fetchWithAuth(url, options = {}) {
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

  // Submit a customer query
  async submitQuery(category, message, attachmentFile) {
    const formData = new FormData();
    formData.append('category', category);
    formData.append('message', message);
    
    if (attachmentFile) {
      formData.append('attachment', attachmentFile);
    }

    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/customer-care/submit`, {
        method: 'POST',
        body: formData,
        headers: headers,
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

  // Get user queries
  async getUserQueries() {
    return this.fetchWithAuth('/customer-care/queries');
  }
}

// Create a singleton instance
const customerCareAPI = new CustomerCareAPI();

// Export the instance
export default customerCareAPI;
