// notificationsAPI.js
// API service for notification-related endpoints

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
class NotificationsAPI {
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
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      throw error;
    }
  }

  // Get user notifications
  async getNotifications(limit = 50, since = null) {
    let url = `/notifications?limit=${limit}`;
    if (since) {
      url += `&since=${encodeURIComponent(since)}`;
    }
    return this.fetchWithAuth(url);
  }

  // Mark a notification as read
  async markAsRead(notificationId) {
    return this.fetchWithAuth('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notification_id: notificationId }),
    });
  }

  // Mark all notifications as read
  async markAllAsRead() {
    return this.fetchWithAuth('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  // Delete a notification
  async deleteNotification(notificationId) {
    return this.fetchWithAuth(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // Clear all notifications
  async clearAllNotifications() {
    return this.fetchWithAuth('/notifications', {
      method: 'DELETE',
    });
  }

  // Create a new notification (for programmatic creation)
  async createNotification(data) {
    return this.fetchWithAuth('/notifications/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Create singleton instance
const notificationsAPI = new NotificationsAPI();

export default notificationsAPI;
