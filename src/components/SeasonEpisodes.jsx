import { useState, useEffect, useCallback, useMemo } from 'react';
import { TV_SEASON_EPISODES, BASE_IMG_URL, getHeaders } from '../utils/Endpoint';

const SeasonEpisodes = ({ tvId, seasons }) => {
  const [seasonData, setSeasonData] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(2000);

  const fetchSeasonEpisodes = useCallback(async (skipCache = false) => {
    if (!tvId || !selectedSeason) return;

    setIsLoading(true);
    setError(null);

    if (!skipCache) {
      setActiveEpisode(null);
      setShowPlayer(false); // Reset player state when changing season
    }

    try {
      // Check for cached season data first (unless skipCache is true)
      if (!skipCache) {
        const cacheKey = `tvShow_${tvId}_season_${selectedSeason}`;
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
        const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

        if (cachedData && cachedTimestamp) {
          const currentTime = new Date().getTime();
          if (currentTime - parseInt(cachedTimestamp) < cacheExpiry) {
            try {
              const parsedData = JSON.parse(cachedData);
              console.log("Using cached season data");
              setSeasonData(parsedData);
              setIsLoading(false);
              return;
            } catch (err) {
              console.error("Error parsing cached season data", err);
            }
          }
        }
      }

      // Use the dedicated TV season episodes endpoint with authorization headers
      const response = await fetch(TV_SEASON_EPISODES(tvId, selectedSeason), {
        headers: getHeaders()
      });

      // Handle different error statuses differently
      if (!response.ok) {
        if (response.status === 429) {
          // API rate limit exceeded
          throw new Error('API rate limit exceeded. Please try again in a few moments.');
        } else if (response.status === 401) {
          // Authentication issue
          throw new Error('Authentication failed. Please check your API token.');
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }

      const data = await response.json();

      // Reset retry count on successful request
      setRetryCount(0);
      setRetryDelay(2000);

      setSeasonData(data);

      // Cache the season data
      const cacheKey = `tvShow_${tvId}_season_${selectedSeason}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(`${cacheKey}_timestamp`, new Date().getTime().toString());

      // Preload episode images
      if (data.episodes) {
        data.episodes.forEach(episode => {
          if (episode.still_path) {
            const img = new Image();
            img.src = `${BASE_IMG_URL}${episode.still_path}`;
          }
        });
      }
    } catch (err) {
      console.error('Error fetching season episodes:', err);

      // Check if it's a quota exceeded error and we haven't tried too many times
      if (err.message.includes('rate limit exceeded') && retryCount < 3) {
        setError(`The API rate limit was exceeded. Retrying in ${retryDelay / 1000} seconds... (Attempt ${retryCount + 1}/3)`);

        // Try again with exponential backoff
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          setRetryDelay(prev => prev * 2); // Double the delay with each retry
          fetchSeasonEpisodes(true); // Skip cache on retry
        }, retryDelay);
      } else {
        // For other errors or if we've tried too many times
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tvId, selectedSeason, retryCount, retryDelay]);

  useEffect(() => {
    fetchSeasonEpisodes(false);
  }, [tvId, selectedSeason, fetchSeasonEpisodes]);

  // Function to manually retry loading episodes
  const handleRetry = () => {
    setRetryCount(0);
    setRetryDelay(2000);
    fetchSeasonEpisodes(true); // Skip cache when manually retrying
  };

  // Function to toggle episode details
  const toggleEpisodeDetails = (episodeNumber) => {
    if (activeEpisode === episodeNumber) {
      setActiveEpisode(null);
      setShowPlayer(false);
    } else {
      setActiveEpisode(episodeNumber);
      setShowPlayer(false); // Reset player state when viewing a different episode
    }
  };

  // Function to start watching an episode (load the player)
  const startWatchingEpisode = () => {
    setShowPlayer(true);
  };

  // Use useMemo to prevent unnecessary recalculations
  const sortedSeasons = useMemo(() => {
    return [...seasons].sort((a, b) => a.season_number - b.season_number);
  }, [seasons]);

  // More efficient episode rendering using memo pattern
  const renderEpisodes = useMemo(() => {
    if (!seasonData?.episodes) return null;

    return seasonData.episodes.map((episode) => (
      <div
        key={episode.id}
        className={`border rounded-md transition-all duration-300 hover:shadow-md ${
          activeEpisode === episode.episode_number
            ? 'border-blue-400 bg-blue-50 shadow-md'
            : 'border-gray-200 hover:border-blue-200'
        }`}
      >
        {/* Episode header (always visible) */}
        <div className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Episode thumbnail */}
          <div className="sm:w-36 flex-shrink-0">
            {episode.still_path ? (
              <img
                src={`${BASE_IMG_URL}${episode.still_path}`}
                alt={`${episode.name || `Episode ${episode.episode_number}`} thumbnail`}
                className="w-full h-auto rounded object-cover shadow-sm"
                loading="lazy"
              />
            ) : (
              <div className="bg-gray-200 rounded w-full h-20 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No image</span>
              </div>
            )}
          </div>

          {/* Episode info */}
          <div className="flex-grow">
            <h5 className="font-medium">
              {episode.episode_number}. {episode.name || `Episode ${episode.episode_number}`}
            </h5>
            <p className="text-sm text-gray-600 mt-1">
              {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'No air date'}
              {episode.runtime ? ` • ${episode.runtime} min` : ''}
            </p>
            {episode.overview && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {episode.overview}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-2 sm:mt-0">
            {episode.vote_average > 0 && (
              <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 h-fit">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{episode.vote_average.toFixed(1)}</span>
              </div>
            )}
            <button
              onClick={() => toggleEpisodeDetails(episode.episode_number)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              {activeEpisode === episode.episode_number ? 'Hide Details' : 'Details'}
            </button>
            <button
              onClick={() => {
                toggleEpisodeDetails(episode.episode_number);
                if (activeEpisode !== episode.episode_number) {
                  // Wait for the details section to expand, then show player
                  setTimeout(() => startWatchingEpisode(), 100);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Watch
            </button>
          </div>
        </div>

        {/* Episode expanded details */}
        {activeEpisode === episode.episode_number && (
          <div className="border-t border-gray-200 p-4 bg-blue-50/50">
            {/* Embed player - only load when explicitly requested */}
            {showPlayer && (
              <div className="mb-4">
                <h6 className="font-medium text-gray-900 mb-2">Watch Episode:</h6>
                <div className="aspect-video overflow-hidden rounded-lg shadow-lg bg-black">
                  <iframe
                    src={`https://embed.su/embed/tv/${tvId}/${selectedSeason}/${episode.episode_number}`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    className="w-full h-full"
                    title={`${seasonData.name || 'Season'} ${selectedSeason} Episode ${episode.episode_number}`}
                  ></iframe>
                </div>
                <p className="text-xs text-gray-500 mt-2">If the video doesn't load, try clicking the play button again</p>
              </div>
            )}

            {!showPlayer && (
              <button
                onClick={startWatchingEpisode}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded font-medium mb-4 flex items-center gap-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play Episode
              </button>
            )}

            {episode.overview && (
              <div className="mb-3">
                <h6 className="font-medium text-gray-900 mb-1">Overview:</h6>
                <p className="text-gray-700">
                  {episode.overview}
                </p>
              </div>
            )}

            {episode.guest_stars && episode.guest_stars.length > 0 && (
              <div className="mb-3">
                <h6 className="font-medium text-gray-900 mb-1">Guest Stars:</h6>
                <p className="text-sm text-gray-600">
                  {episode.guest_stars
                    .slice(0, 5)
                    .map(star => star.name)
                    .join(', ')}
                  {episode.guest_stars.length > 5 ? ` and ${episode.guest_stars.length - 5} more...` : ''}
                </p>
              </div>
            )}

            {episode.crew && episode.crew.length > 0 && (
              <div>
                <h6 className="font-medium text-gray-900 mb-1">Director:</h6>
                <p className="text-sm text-gray-600">
                  {episode.crew
                    .filter(member => member.job === 'Director')
                    .map(director => director.name)
                    .join(', ') || 'Not listed'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    ));
  }, [seasonData?.episodes, activeEpisode, tvId, selectedSeason]);

  if (!seasons || seasons.length === 0) {
    return <div className="text-center py-4">No seasons information available</div>;
  }

  return (
    <div className="mt-6 bg-white rounded-lg shadow-md p-4">
      <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Seasons & Episodes
      </h3>

      {/* Season selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Season:</label>
        <div className="flex flex-wrap gap-2">
          {sortedSeasons.map((season) => (
            <button
              key={season.season_number}
              onClick={() => setSelectedSeason(season.season_number)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 
                ${selectedSeason === season.season_number 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Season {season.season_number}
            </button>
          ))}
        </div>
      </div>

      {/* Episodes list */}
      <div>
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-600">Loading episodes...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="mb-2">{error}</p>
            {!error.includes('Retrying in') && (
              <button
                onClick={handleRetry}
                className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-1.5 px-3 rounded text-sm transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && seasonData && seasonData.episodes && (
          <div>
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded mb-4 border border-gray-100">
              <h4 className="font-medium">
                {seasonData.name || `Season ${seasonData.season_number}`} • {seasonData.episodes.length} Episodes
              </h4>
              {seasonData.air_date && (
                <span className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded-full">
                  First aired: {new Date(seasonData.air_date).toLocaleDateString()}
                </span>
              )}
            </div>

            {seasonData.overview && (
              <p className="text-gray-600 text-sm mb-4 bg-blue-50/30 p-3 rounded-md border-l-2 border-blue-400">
                {seasonData.overview}
              </p>
            )}

            <div className="space-y-3 mt-4">
              {renderEpisodes}
            </div>
          </div>
        )}

        {!isLoading && !error && (!seasonData || !seasonData.episodes || seasonData.episodes.length === 0) && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600">No episode information available for this season</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonEpisodes;