/**
 * Optimized Cache Service for Dashboard Data
 * Fast loading with selective encryption and lazy decryption
 */

import CryptoJS from 'crypto-js';

// Cache keys - separate sensitive and non-sensitive data
const CACHE_KEYS = {
  // Non-sensitive financial data (plain storage)
  FINANCIAL_DATA: 'dashboard_financial_plain',
  // Sensitive user data (encrypted)
  USER_DATA: 'dashboard_user_encrypted',
  // Metadata (plain storage for instant access)
  METADATA: 'dashboard_metadata_plain',
  // Analytics data (plain storage for fast access)
  ANALYTICS_DATA: 'dashboard_analytics_plain',
  // Affiliate network data (plain storage - not sensitive)
  AFFILIATE_DATA: 'affiliate_network_plain',
  // Affiliate metadata (plain storage for instant access)
  AFFILIATE_METADATA: 'affiliate_metadata_plain'
};

// Cache duration (5 minutes)
const CACHE_DURATION = 4 * 60 * 1000;
// Background refresh threshold (10 minutes to reduce server load)
const BACKGROUND_REFRESH_THRESHOLD = 10 * 60 * 1000;
// Minimum interval between background fetches (5 minutes cooldown)
const MIN_BACKGROUND_FETCH_INTERVAL = 5 * 60 * 1000;

// Track user activity for smarter background refresh
let lastUserActivity = Date.now();
// Background fetch control variables
let isBackgroundFetchRunning = false;
let lastBackgroundFetch = 0;

/**
 * Generate encryption key based on session token
 */
const getEncryptionKey = () => {
  const sessionToken = localStorage.getItem('session_token');
  if (!sessionToken) {
    throw new Error('No session token found');
  }
  // Use first 32 chars of session token as encryption key
  return sessionToken.substring(0, 32);
};

/**
 * Encrypt sensitive data only
 */
const encryptSensitiveData = (data) => {
  try {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      key
    ).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

/**
 * Decrypt sensitive data (lazy decryption)
 */
const decryptSensitiveData = (encryptedData) => {
  try {
    // Handle case where data might not be encrypted
    if (!encryptedData) return null;
    
    // Check if the data starts with "U2FsdGVkX1" which indicates it's encrypted
    if (!encryptedData.startsWith('U2FsdGVkX1')) {
      // Data is not encrypted, try to parse it as JSON
      try {
        return JSON.parse(encryptedData);
      } catch (parseError) {
        console.warn('Non-encrypted data is not valid JSON:', encryptedData);
        return null;
      }
    }
    
    const key = getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
    
    // Handle empty decrypted string
    if (!decryptedStr) {
      console.warn('Decryption resulted in empty string');
      return null;
    }
    
    return JSON.parse(decryptedStr);
  } catch (error) {
    console.error('Decryption error:', error);
    // Return null if decryption fails
    return null;
  }
};

/**
 * Get cache metadata (instant access, no decryption)
 */
const getCacheMetadata = () => {
  try {
    const metadataStr = localStorage.getItem(CACHE_KEYS.METADATA);
    return metadataStr ? JSON.parse(metadataStr) : null;
  } catch (error) {
    console.error('Metadata read error:', error);
    return null;
  }
};

/**
 * Save cache metadata
 */
const saveCacheMetadata = (metadata) => {
  try {
    localStorage.setItem(CACHE_KEYS.METADATA, JSON.stringify(metadata));
    return true;
  } catch (error) {
    console.error('Metadata save error:', error);
    return false;
  }
};

/**
 * Check if cache is still valid (simple timestamp check)
 */
const isCacheValid = () => {
  const metadata = getCacheMetadata();
  if (!metadata || !metadata.lastUpdate) return false;

  const timeSinceUpdate = Date.now() - metadata.lastUpdate;
  return timeSinceUpdate < CACHE_DURATION;
};

/**
 * Check if user is active (within last 30 seconds)
 */
const isUserActive = () => {
  return (Date.now() - lastUserActivity) < 30000; // 30 seconds
};

/**
 * Update user activity timestamp
 */
const updateUserActivity = () => {
  lastUserActivity = Date.now();
};

// Listen for user activity to track when to refresh
if (typeof window !== 'undefined') {
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, updateUserActivity, { passive: true });
  });
}

/**
 * Check if background refresh should be triggered
 * Only refresh if cache is stale AND user is active AND no background fetch is running AND cooldown period has passed
 */
const shouldTriggerBackgroundRefresh = () => {
  const metadata = getCacheMetadata();
  if (!metadata || !metadata.lastUpdate) return true;

  const timeSinceUpdate = Date.now() - metadata.lastUpdate;
  const timeSinceLastBgFetch = Date.now() - lastBackgroundFetch;

  // Only refresh in background if cache is stale, user is active, no current fetch running, and cooldown period has passed
  return timeSinceUpdate > BACKGROUND_REFRESH_THRESHOLD &&
         isUserActive() &&
         !isBackgroundFetchRunning &&
         timeSinceLastBgFetch > MIN_BACKGROUND_FETCH_INTERVAL;
};

/**
 * Get time ago string
 */
const getTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

/**
 * Optimized Cache Service
 */
export const cacheService = {
  /**
   * Save dashboard data to cache (selective encryption)
   */
  saveDashboardData: (data) => {
    try {
      const now = Date.now();

      // Separate sensitive and non-sensitive data
      const { user, investment, transactions, summary, investments, analytics, goals } = data;

      // Store financial data in plain localStorage (fast access)
      const financialData = {
        investment,
        transactions,
        summary,
        investments,
        goals  // Include goals data
      };
      localStorage.setItem(CACHE_KEYS.FINANCIAL_DATA, JSON.stringify(financialData));

      // Store analytics data in plain localStorage (fast access)
      if (analytics) {
        localStorage.setItem(CACHE_KEYS.ANALYTICS_DATA, JSON.stringify(analytics));
      }

      // Encrypt only sensitive user data
      const sensitiveData = { user };
      const encryptedUser = encryptSensitiveData(sensitiveData);
      if (encryptedUser) {
        localStorage.setItem(CACHE_KEYS.USER_DATA, encryptedUser);
      }

      // Store metadata separately (instant access)
      const metadata = {
        lastUpdate: now,
        cacheAge: 0,
        hasData: true
      };
      saveCacheMetadata(metadata);

      return true;
    } catch (error) {
      console.error('Cache save error:', error);
      return false;
    }
  },

  /**
   * Save analytics data to cache
   */
  saveAnalyticsData: (data) => {
    try {
      localStorage.setItem(CACHE_KEYS.ANALYTICS_DATA, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Analytics cache save error:', error);
      return false;
    }
  },

  /**
   * Get analytics data from cache
   */
  getAnalyticsData: () => {
    try {
      const analyticsStr = localStorage.getItem(CACHE_KEYS.ANALYTICS_DATA);
      return analyticsStr ? JSON.parse(analyticsStr) : null;
    } catch (error) {
      console.error('Analytics cache get error:', error);
      return null;
    }
  },

  /**
   * Get dashboard data from cache (lazy decryption)
   */
  getDashboardData: () => {
    try {
      const metadata = getCacheMetadata();
      if (!metadata || !metadata.hasData) return null;

      // Get financial data instantly (no decryption)
      const financialStr = localStorage.getItem(CACHE_KEYS.FINANCIAL_DATA);
      if (!financialStr) return null;
      const financialData = JSON.parse(financialStr);

      // Get analytics data instantly (no decryption)
      const analyticsData = cacheService.getAnalyticsData();

      // Lazy decrypt sensitive user data only when needed
      const encryptedUser = localStorage.getItem(CACHE_KEYS.USER_DATA);
      let userData = null;
      if (encryptedUser) {
        const decrypted = decryptSensitiveData(encryptedUser);
        userData = decrypted?.user || null;
      }

      // Combine data with cache metadata
      return {
        ...financialData,
        analytics: analyticsData,
        user: userData,
        _cached: true,
        _lastUpdate: metadata.lastUpdate,
        _timeAgo: getTimeAgo(metadata.lastUpdate),
        _cacheAge: Date.now() - metadata.lastUpdate
      };
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Check if cache is valid
   */
  isCacheValid: () => {
    return isCacheValid();
  },

  /**
   * Check if background refresh should be triggered
   */
  shouldTriggerBackgroundRefresh: () => {
    return shouldTriggerBackgroundRefresh();
  },

  /**
   * Get time since last update
   */
  getLastUpdateTime: () => {
    const metadata = getCacheMetadata();
    if (!metadata || !metadata.lastUpdate) return null;
    return getTimeAgo(metadata.lastUpdate);
  },

  /**
   * Clear cache
   */
  clearCache: () => {
    try {
      localStorage.removeItem(CACHE_KEYS.FINANCIAL_DATA);
      localStorage.removeItem(CACHE_KEYS.USER_DATA);
      localStorage.removeItem(CACHE_KEYS.METADATA);
      localStorage.removeItem(CACHE_KEYS.ANALYTICS_DATA);
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  },

  /**
   * Clear all cache and local storage data
   */
  clearAll: () => {
    try {
      // Clear all cache keys
      localStorage.removeItem(CACHE_KEYS.FINANCIAL_DATA);
      localStorage.removeItem(CACHE_KEYS.USER_DATA);
      localStorage.removeItem(CACHE_KEYS.METADATA);
      localStorage.removeItem(CACHE_KEYS.ANALYTICS_DATA);
      localStorage.removeItem(CACHE_KEYS.AFFILIATE_DATA);
      localStorage.removeItem(CACHE_KEYS.AFFILIATE_METADATA);

      // Clear any other related data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('dashboard_') || key.startsWith('notifications_') || key.startsWith('affiliate_'))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));

      return true;
    } catch (error) {
      console.error('Cache clear all error:', error);
      return false;
    }
  },

  /**
   * Simple data change detection (timestamp-based, no complex comparison)
   */
  hasDataChanged: (newData, oldData) => {
    // Simplified: just check if timestamps differ significantly
    // More complex logic can be added if needed, but keep it fast
    if (!oldData || !newData) return true;

    // Quick balance check
    const oldBalance = oldData.investment?.total_balance || 0;
    const newBalance = newData.investment?.total_balance || 0;

    return Math.abs(oldBalance - newBalance) > 0.01; // Allow for small floating point differences
  },

  /**
   * Update specific fields without full reload (optimized)
   */
  updateCachedField: (fieldPath, value) => {
    try {
      const cached = cacheService.getDashboardData();
      if (!cached) return false;

      // Parse field path (e.g., "investment.total_balance")
      const paths = fieldPath.split('.');
      let obj = cached;

      for (let i = 0; i < paths.length - 1; i++) {
        if (!obj[paths[i]]) obj[paths[i]] = {};
        obj = obj[paths[i]];
      }

      obj[paths[paths.length - 1]] = value;

      return cacheService.saveDashboardData(cached);
    } catch (error) {
      console.error('Cache update error:', error);
      return false;
    }
  },

  /**
   * Start background fetch (prevents overlapping fetches)
   */
  startBackgroundFetch: () => {
    isBackgroundFetchRunning = true;
    lastBackgroundFetch = Date.now();
  },

  /**
   * End background fetch
   */
  endBackgroundFetch: () => {
    isBackgroundFetchRunning = false;
  },

  /**
   * Check if background fetch is running
   */
  isBackgroundFetchRunning: () => {
    return isBackgroundFetchRunning;
  },

  /**
   * Save affiliate network data to cache
   */
  saveAffiliateData: (data) => {
    try {
      const now = Date.now();

      // Store affiliate data in plain localStorage (not sensitive)
      localStorage.setItem(CACHE_KEYS.AFFILIATE_DATA, JSON.stringify(data));

      // Store affiliate metadata separately (instant access)
      const metadata = {
        lastUpdate: now,
        cacheAge: 0,
        hasData: true
      };
      localStorage.setItem(CACHE_KEYS.AFFILIATE_METADATA, JSON.stringify(metadata));

      return true;
    } catch (error) {
      console.error('Affiliate cache save error:', error);
      return false;
    }
  },

  /**
   * Get affiliate network data from cache
   */
  getAffiliateData: () => {
    try {
      const metadataStr = localStorage.getItem(CACHE_KEYS.AFFILIATE_METADATA);
      if (!metadataStr) return null;

      const metadata = JSON.parse(metadataStr);
      if (!metadata.hasData) return null;

      // Get affiliate data instantly
      const affiliateStr = localStorage.getItem(CACHE_KEYS.AFFILIATE_DATA);
      if (!affiliateStr) return null;

      const affiliateData = JSON.parse(affiliateStr);

      // Combine data with cache metadata
      return {
        ...affiliateData,
        _cached: true,
        _lastUpdate: metadata.lastUpdate,
        _timeAgo: getTimeAgo(metadata.lastUpdate),
        _cacheAge: Date.now() - metadata.lastUpdate
      };
    } catch (error) {
      console.error('Affiliate cache get error:', error);
      return null;
    }
  },

  /**
   * Check if affiliate cache is valid
   */
  isAffiliateCacheValid: () => {
    try {
      const metadataStr = localStorage.getItem(CACHE_KEYS.AFFILIATE_METADATA);
      if (!metadataStr) return false;

      const metadata = JSON.parse(metadataStr);
      if (!metadata.lastUpdate) return false;

      const timeSinceUpdate = Date.now() - metadata.lastUpdate;
      return timeSinceUpdate < CACHE_DURATION;
    } catch (error) {
      console.error('Affiliate cache validation error:', error);
      return false;
    }
  },

  /**
   * Clear affiliate cache
   */
  clearAffiliateCache: () => {
    try {
      localStorage.removeItem(CACHE_KEYS.AFFILIATE_DATA);
      localStorage.removeItem(CACHE_KEYS.AFFILIATE_METADATA);
      return true;
    } catch (error) {
      console.error('Affiliate cache clear error:', error);
      return false;
    }
  },

  /**
   * Update affiliate cache field (for point balance updates)
   */
  updateAffiliateCachedField: (fieldPath, value) => {
    try {
      const cached = cacheService.getAffiliateData();
      if (!cached) return false;

      // Parse field path (e.g., "points_balance")
      const paths = fieldPath.split('.');
      let obj = cached;

      for (let i = 0; i < paths.length - 1; i++) {
        if (!obj[paths[i]]) obj[paths[i]] = {};
        obj = obj[paths[i]];
      }

      obj[paths[paths.length - 1]] = value;

      return cacheService.saveAffiliateData(cached);
    } catch (error) {
      console.error('Affiliate cache update error:', error);
      return false;
    }
  }
};

export default cacheService;
