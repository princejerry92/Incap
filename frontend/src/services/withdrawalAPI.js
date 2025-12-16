// withdrawalAPI.js
// API service for withdrawal-related endpoints

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class WithdrawalAPI {
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

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { detail: `HTTP error! status: ${response.status}` };
      }
      
      // Create a more descriptive error message
      const errorMessage = errorData.detail || errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Request a withdrawal
  async requestWithdrawal(amount, pin) {
    try {
      // Validate inputs before sending request
      if (!amount || amount <= 0) {
        throw new Error('Invalid withdrawal amount');
      }
      
      if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
        throw new Error('Invalid PIN format');
      }
      
      return await this.fetchWithAuth('/withdrawal/request', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount),
          pin: pin
        })
      });
    } catch (error) {
      console.error('Withdrawal API error:', error);
      throw error;
    }
  }

  // Get withdrawal status
  async getWithdrawalStatus(transactionId) {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }
    
    return this.fetchWithAuth(`/withdrawal/status/${transactionId}`);
  }
}

// Create a singleton instance
const withdrawalAPI = new WithdrawalAPI();

// Export the instance
export default withdrawalAPI;