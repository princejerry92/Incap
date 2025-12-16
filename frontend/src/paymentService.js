import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class PaymentService {
  async getPaystackConfig() {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/config`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Paystack config:', error);
      throw error;
    }
  }

  async initializePayment(paymentData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/payments/initialize`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error initializing payment:', error);
      throw error;
    }
  }

  async verifyPayment(reference) {
    try {
      const response = await axios.post(`${API_BASE_URL}/payments/verify`, { reference });
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  async listTransactions(page = 1, perPage = 50) {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/transactions`, {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }
  
  // New method to get pending investors (for debugging)
  async getPendingInvestors() {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/pending-investors`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending investors:', error);
      throw error;
    }
  }
}

export default new PaymentService();