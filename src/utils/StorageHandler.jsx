// Utility to handle storage operations safely with quota management for mobile devices

// Simple LZString-like compression for storage efficiency
const compress = (data) => {
  try {
    return btoa(encodeURIComponent(data));
  } catch (e) {
    return data;
  }
};

const decompress = (data) => {
  try {
    return decodeURIComponent(atob(data));
  } catch (e) {
    return data;
  }
};

// Check if storage is available
const isStorageAvailable = (type) => {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

// Estimate storage usage
export const getStorageUsage = () => {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    total += key.length + value.length;
  }
  return total / 1024; // KB
};

// Clear least recently used items until we free up enough space
const clearLRUItems = (bytesNeeded = 200 * 1024) => { // Default to freeing 200KB
  // We'll use a timestamp-based approach for LRU
  const items = [];
  
  // Collect all items with their metadata
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('__meta_')) continue;
    
    // Get metadata if available
    const metaKey = `__meta_${key}`;
    let lastAccessed = Date.now();
    try {
      const meta = JSON.parse(localStorage.getItem(metaKey) || '{}');
      lastAccessed = meta.lastAccessed || lastAccessed;
    } catch (e) {
      // No valid metadata, use default
    }
    
    items.push({
      key,
      lastAccessed,
      size: (localStorage.getItem(key) || '').length + key.length
    });
  }
  
  // Sort by last accessed (oldest first)
  items.sort((a, b) => a.lastAccessed - b.lastAccessed);
  
  let freedBytes = 0;
  for (const item of items) {
    // Skip critical app data you never want to delete
    if (item.key.includes('user_settings') || item.key.includes('auth_token')) continue;
    
    localStorage.removeItem(item.key);
    localStorage.removeItem(`__meta_${item.key}`); // Remove metadata too
    freedBytes += item.size;
    
    if (freedBytes >= bytesNeeded) break;
  }
  
  return freedBytes;
};

// Update metadata for an item
const updateMetadata = (key) => {
  try {
    const metaKey = `__meta_${key}`;
    const meta = {
      lastAccessed: Date.now()
    };
    localStorage.setItem(metaKey, JSON.stringify(meta));
  } catch (e) {
    // Metadata update failed, but that's okay
  }
};

// Safely set item with quota handling
export const safeSetItem = (key, value, useCompression = true) => {
  if (!key) return false;
  
  // Check storage availability
  const localAvailable = isStorageAvailable('localStorage');
  const sessionAvailable = isStorageAvailable('sessionStorage');
  
  if (!localAvailable && !sessionAvailable) {
    console.warn('No storage available');
    return false;
  }
  
  try {
    // Prepare value
    let serializedValue = JSON.stringify(value);
    
    // Optional compression for large items (>10KB)
    if (useCompression && serializedValue.length > 10240) {
      serializedValue = compress(serializedValue);
    }
    
    // Try to store in localStorage
    if (localAvailable) {
      try {
        localStorage.setItem(key, serializedValue);
        updateMetadata(key);
        return true;
      } catch (error) {
        // Check for quota errors - different browsers report different error types
        const isQuotaError = 
          error.name === 'QuotaExceededError' || 
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          error.code === 22 ||
          error.code === 1014 ||
          (error.message && error.message.includes('quota'));
        
        if (isQuotaError) {
          console.warn('Storage quota exceeded. Clearing old items.');
          
          // Try selective clearing rather than clearing everything
          const bytesFreed = clearLRUItems();
          console.info(`Freed ${bytesFreed} bytes of storage`);
          
          // Try again after clearing
          try {
            localStorage.setItem(key, serializedValue);
            updateMetadata(key);
            return true;
          } catch (e) {
            // If still fails, try sessionStorage
            if (sessionAvailable) {
              sessionStorage.setItem(key, serializedValue);
              return true;
            }
          }
        }
      }
    }
    
    // Fallback to sessionStorage if localStorage failed or is unavailable
    if (sessionAvailable) {
      sessionStorage.setItem(key, serializedValue);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to set item in storage:', error);
    return false;
  }
};

// Safely get item with fallbacks
export const safeGetItem = (key) => {
  if (!key) return null;
  
  try {
    // Try localStorage first
    let serializedValue = null;
    
    try {
      serializedValue = localStorage.getItem(key);
      // Update last accessed time
      if (serializedValue) {
        updateMetadata(key);
      }
    } catch (e) {
      // If localStorage fails, try sessionStorage
      console.warn('Error accessing localStorage, trying sessionStorage');
      serializedValue = sessionStorage.getItem(key);
    }
    
    if (!serializedValue) return null;
    
    // Try to decompress if it appears to be compressed
    if (serializedValue.match(/^[A-Za-z0-9+/=]+$/)) {
      try {
        const decompressed = decompress(serializedValue);
        serializedValue = decompressed;
      } catch (e) {
        // Not compressed or decompression failed, use as-is
      }
    }
    
    return JSON.parse(serializedValue);
  } catch (error) {
    console.error('Failed to get item from storage:', error);
    return null;
  }
};

// Remove an item safely
export const safeRemoveItem = (key) => {
  if (!key) return;
  
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(`__meta_${key}`); // Remove metadata too
  } catch (e) {
    // If localStorage fails, try sessionStorage
    try {
      sessionStorage.removeItem(key);
    } catch (innerError) {
      console.error('Failed to remove item from any storage:', innerError);
    }
  }
};

// Clear all cached data (use sparingly)
export const clearAllCache = (preserveUserData = true) => {
  try {
    if (preserveUserData) {
      // Save important user data
      const userSettings = safeGetItem('user_settings');
      const authToken = safeGetItem('auth_token');
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Restore important data
      if (userSettings) safeSetItem('user_settings', userSettings);
      if (authToken) safeSetItem('auth_token', authToken);
    } else {
      localStorage.clear();
      sessionStorage.clear();
    }
    return true;
  } catch (e) {
    console.error('Failed to clear cache:', e);
    return false;
  }
};

// Get detailed storage information
export const getStorageInfo = () => {
  try {
    const info = {
      localStorage: {
        available: isStorageAvailable('localStorage'),
        used: 0,
        keys: [],
        quota: null
      },
      sessionStorage: {
        available: isStorageAvailable('sessionStorage'),
        used: 0,
        keys: [],
        quota: null
      }
    };

    // Get localStorage info
    if (info.localStorage.available) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        info.localStorage.used += key.length + value.length;
        info.localStorage.keys.push({
          key,
          size: key.length + value.length,
          isMetadata: key.startsWith('__meta_')
        });
      }
    }

    // Get sessionStorage info
    if (info.sessionStorage.available) {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        info.sessionStorage.used += key.length + value.length;
        info.sessionStorage.keys.push({
          key,
          size: key.length + value.length
        });
      }
    }

    // Try to estimate quota (this is approximate)
    try {
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(estimate => {
          info.localStorage.quota = estimate.quota;
        });
      }
    } catch (e) {
      // Quota estimation not available
    }

    return info;
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return null;
  }
};

// Clean storage by category (useful for maintenance)
export const cleanStorageByPattern = (pattern, maxAge = null) => {
  let cleanedCount = 0;
  let freedBytes = 0;

  try {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.includes(pattern)) {
        let shouldRemove = true;
        
        // Check age if maxAge is specified
        if (maxAge) {
          const timestampKey = `${key}_timestamp`;
          const timestamp = safeGetItem(timestampKey);
          if (timestamp) {
            const age = Date.now() - timestamp;
            shouldRemove = age > maxAge;
          }
        }
        
        if (shouldRemove) {
          const value = localStorage.getItem(key);
          freedBytes += key.length + (value ? value.length : 0);
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove the keys
    keysToRemove.forEach(key => {
      safeRemoveItem(key);
      cleanedCount++;
    });
    
    return { cleanedCount, freedBytes };
  } catch (error) {
    console.error('Failed to clean storage by pattern:', error);
    return { cleanedCount: 0, freedBytes: 0 };
  }
};

// Backup and restore functions for critical data
export const backupCriticalData = () => {
  try {
    const criticalKeys = ['user_settings', 'auth_token', 'theme'];
    const backup = {};
    
    criticalKeys.forEach(key => {
      const value = safeGetItem(key);
      if (value !== null) {
        backup[key] = value;
      }
    });
    
    return backup;
  } catch (error) {
    console.error('Failed to backup critical data:', error);
    return {};
  }
};

export const restoreCriticalData = (backup) => {
  try {
    let restoredCount = 0;
    
    Object.entries(backup).forEach(([key, value]) => {
      if (safeSetItem(key, value)) {
        restoredCount++;
      }
    });
    
    return restoredCount;
  } catch (error) {
    console.error('Failed to restore critical data:', error);
    return 0;
  }
};

// Check if storage is getting full and automatically clean if needed
export const maintainStorage = (thresholdPercent = 80) => {
  try {
    const storageInfo = getStorageInfo();
    if (!storageInfo || !storageInfo.localStorage.available) return false;
    
    // Rough estimate: localStorage usually has ~5-10MB limit
    const estimatedQuota = 5 * 1024 * 1024; // 5MB in bytes
    const usagePercent = (storageInfo.localStorage.used / estimatedQuota) * 100;
    
    if (usagePercent > thresholdPercent) {
      console.log(`Storage usage at ${usagePercent.toFixed(1)}%, cleaning old data...`);
      
      // Clean old cached images first (they're usually the largest)
      const imageCleanup = cleanStorageByPattern('image_', 7 * 24 * 60 * 60 * 1000); // 7 days
      
      // Clean old movie/tv data
      const movieCleanup = cleanStorageByPattern('cachedMovieDetails_', 24 * 60 * 60 * 1000); // 1 day
      const tvCleanup = cleanStorageByPattern('tvShow_', 24 * 60 * 60 * 1000); // 1 day
      
      const totalFreed = imageCleanup.freedBytes + movieCleanup.freedBytes + tvCleanup.freedBytes;
      const totalCleaned = imageCleanup.cleanedCount + movieCleanup.cleanedCount + tvCleanup.cleanedCount;
      
      console.log(`Maintenance complete: Cleaned ${totalCleaned} items, freed ${Math.round(totalFreed / 1024)}KB`);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Storage maintenance failed:', error);
    return false;
  }
};