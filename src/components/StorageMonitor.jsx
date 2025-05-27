import { useState, useEffect } from 'react';
import { getStorageInfo, cleanStorageByPattern, clearAllCache, maintainStorage } from '../utils/StorageHandler';

const StorageMonitor = () => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [lastCleanup, setLastCleanup] = useState(null);

  const updateStorageInfo = () => {
    const info = getStorageInfo();
    setStorageInfo(info);
  };

  useEffect(() => {
    updateStorageInfo();
    // Update every 5 seconds when visible
    let interval;
    if (isVisible) {
      interval = setInterval(updateStorageInfo, 5000);
    }
    return () => clearInterval(interval);
  }, [isVisible]);

  const handleCleanImages = () => {
    const result = cleanStorageByPattern('image_', 3 * 24 * 60 * 60 * 1000); // 3 days
    setLastCleanup(`Images: ${result.cleanedCount} items, ${Math.round(result.freedBytes / 1024)}KB freed`);
    updateStorageInfo();
  };

  const handleCleanMovieCache = () => {
    const result = cleanStorageByPattern('cachedMovieDetails_', 24 * 60 * 60 * 1000); // 1 day
    setLastCleanup(`Movies: ${result.cleanedCount} items, ${Math.round(result.freedBytes / 1024)}KB freed`);
    updateStorageInfo();
  };

  const handleCleanTvCache = () => {
    const result = cleanStorageByPattern('tvShow_', 24 * 60 * 60 * 1000); // 1 day
    setLastCleanup(`TV Shows: ${result.cleanedCount} items, ${Math.round(result.freedBytes / 1024)}KB freed`);
    updateStorageInfo();
  };

  const handleFullMaintenance = () => {
    const ranMaintenance = maintainStorage(50); // Lower threshold for manual maintenance
    setLastCleanup(ranMaintenance ? 'Full maintenance completed' : 'No maintenance needed');
    updateStorageInfo();
  };

  const handleClearAll = () => {
    if (confirm('Clear all cache? This will preserve user settings.')) {
      clearAllCache(true);
      setLastCleanup('All cache cleared');
      updateStorageInfo();
    }
  };

  // Only show in development mode
  if (!import.meta.env.DEV) return null;

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Storage Monitor (Dev Only)"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
          </svg>
        </button>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-xl max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Storage Monitor</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {storageInfo && (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>localStorage:</strong> {formatBytes(storageInfo.localStorage.used)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {storageInfo.localStorage.keys.length} items stored
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={handleCleanImages}
                  className="w-full text-left bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs"
                >
                  Clean Old Images (3+ days)
                </button>
                <button
                  onClick={handleCleanMovieCache}
                  className="w-full text-left bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs"
                >
                  Clean Movie Cache (1+ day)
                </button>
                <button
                  onClick={handleCleanTvCache}
                  className="w-full text-left bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs"
                >
                  Clean TV Cache (1+ day)
                </button>
                <button
                  onClick={handleFullMaintenance}
                  className="w-full text-left bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs"
                >
                  Run Full Maintenance
                </button>
                <button
                  onClick={handleClearAll}
                  className="w-full text-left bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs"
                >
                  Clear All Cache
                </button>
              </div>

              {lastCleanup && (
                <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900 p-2 rounded">
                  {lastCleanup}
                </div>
              )}

              <button
                onClick={updateStorageInfo}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
              >
                Refresh Info
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StorageMonitor;
