/**
 * Cache Service for Due Dates Data
 * Fast loading with selective storage
 */

// Cache key for due dates data
const DUE_DATES_CACHE_KEY = 'due_dates_data';
// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Get cache metadata for due dates
 */
const getCacheMetadata = (investorId) => {
  try {
    const metadataStr = localStorage.getItem(`${DUE_DATES_CACHE_KEY}_${investorId}_metadata`);
    return metadataStr ? JSON.parse(metadataStr) : null;
  } catch (error) {
    console.error('Due dates metadata read error:', error);
    return null;
  }
};

/**
 * Save cache metadata for due dates
 */
const saveCacheMetadata = (metadata, investorId) => {
  try {
    localStorage.setItem(`${DUE_DATES_CACHE_KEY}_${investorId}_metadata`, JSON.stringify(metadata));
    return true;
  } catch (error) {
    console.error('Due dates metadata save error:', error);
    return false;
  }
};

/**
 * Check if due dates cache is still valid
 */
const isCacheValid = (investorId) => {
  const metadata = getCacheMetadata(investorId);
  if (!metadata || !metadata.lastUpdate) return false;

  const timeSinceUpdate = Date.now() - metadata.lastUpdate;
  return timeSinceUpdate < CACHE_DURATION;
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
 * Due Dates Cache Service
 */
export const dueDatesCacheService = {
  /**
   * Save due dates data to cache
   */
  saveDueDatesData: (data, investorId) => {
    try {
      const now = Date.now();

      // Store due dates data in localStorage
      const cacheKey = `${DUE_DATES_CACHE_KEY}_${investorId}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));

      // Store metadata separately
      const metadata = {
        lastUpdate: now,
        cacheAge: 0,
        hasData: true,
        investorId: investorId
      };
      saveCacheMetadata(metadata, investorId);

      return true;
    } catch (error) {
      console.error('Due dates cache save error:', error);
      return false;
    }
  },

  /**
   * Get due dates data from cache
   */
  getDueDatesData: (investorId) => {
    try {
      // Check if cache is still valid
      if (!isCacheValid(investorId)) return null;

      const metadata = getCacheMetadata(investorId);
      if (!metadata || !metadata.hasData || metadata.investorId !== investorId) return null;

      // Get due dates data
      const cacheKey = `${DUE_DATES_CACHE_KEY}_${investorId}`;
      const dataStr = localStorage.getItem(cacheKey);
      if (!dataStr) return null;
      
      const data = JSON.parse(dataStr);

      // Combine data with cache metadata
      return {
        ...data,
        _cached: true,
        _lastUpdate: metadata.lastUpdate,
        _timeAgo: getTimeAgo(metadata.lastUpdate),
        _cacheAge: Date.now() - metadata.lastUpdate
      };
    } catch (error) {
      console.error('Due dates cache get error:', error);
      return null;
    }
  },

  /**
   * Check if cache is valid
   */
  isCacheValid: (investorId) => {
    return isCacheValid(investorId);
  },

  /**
   * Get time since last update
   */
  getLastUpdateTime: (investorId) => {
    const metadata = getCacheMetadata(investorId);
    if (!metadata || !metadata.lastUpdate) return null;
    return getTimeAgo(metadata.lastUpdate);
  },

  /**
   * Clear cache
   */
  clearCache: (investorId) => {
    try {
      const cacheKey = `${DUE_DATES_CACHE_KEY}_${investorId}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${DUE_DATES_CACHE_KEY}_${investorId}_metadata`);
      return true;
    } catch (error) {
      console.error('Due dates cache clear error:', error);
      return false;
    }
  }
};

export default dueDatesCacheService;