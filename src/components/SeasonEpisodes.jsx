import { useState, useEffect } from 'react';
import { TV_SEASON_EPISODES } from '../utils/Endpoint';

const SeasonEpisodes = ({ tvId, seasons }) => {
  const [seasonData, setSeasonData] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);

  useEffect(() => {
    const fetchSeasonEpisodes = async () => {
      if (!tvId || !selectedSeason) return;
      
      setIsLoading(true);
      setError(null);
      setActiveEpisode(null); // Reset active episode when changing season
      
      try {
        // Use the dedicated TV season episodes endpoint
        const response = await fetch(TV_SEASON_EPISODES(tvId, selectedSeason));
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setSeasonData(data);
      } catch (err) {
        console.error('Error fetching season episodes:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSeasonEpisodes();
  }, [tvId, selectedSeason]);

  if (!seasons || seasons.length === 0) {
    return <div className="text-center py-4">No seasons information available</div>;
  }

  // Function to open episode in embed.su player
  const openEpisodePlayer = (episodeNumber) => {
    const embedUrl = `https://embed.su/embed/tv/${tvId}/${selectedSeason}/${episodeNumber}`;
    
    // Set active episode or toggle off if clicking the same one
    setActiveEpisode(activeEpisode === episodeNumber ? null : episodeNumber);
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow-md p-4">
      <h3 className="text-xl font-semibold mb-4">Seasons & Episodes</h3>
      
      {/* Season selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Season:</label>
        <div className="flex flex-wrap gap-2">
          {seasons.map((season) => (
            <button
              key={season.season_number}
              onClick={() => setSelectedSeason(season.season_number)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors 
                ${selectedSeason === season.season_number 
                  ? 'bg-blue-500 text-white' 
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
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>Error loading episodes: {error}</p>
          </div>
        )}
        
        {!isLoading && !error && seasonData && seasonData.episodes && (
          <div>
            <h4 className="font-medium mb-2">
              {seasonData.name || `Season ${seasonData.season_number}`} • {seasonData.episodes.length} Episodes
            </h4>
            
            <div className="space-y-3 mt-4">
              {seasonData.episodes.map((episode) => (
                <div 
                  key={episode.id} 
                  className={`border rounded-md p-3 transition-colors ${
                    activeEpisode === episode.episode_number
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">
                        {episode.episode_number}. {episode.name}
                      </h5>
                      <p className="text-sm text-gray-600 mt-1">
                        {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'No air date'}
                        {episode.runtime ? ` • ${episode.runtime} min` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                        {episode.vote_average.toFixed(1)}/10
                      </div>
                      <button 
                        onClick={() => openEpisodePlayer(episode.episode_number)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          activeEpisode === episode.episode_number
                            ? 'bg-red-500 text-white' 
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {activeEpisode === episode.episode_number ? 'Close' : 'Watch'}
                      </button>
                    </div>
                  </div>
                  
                  {activeEpisode === episode.episode_number && (
                    <div className="mt-4 aspect-video overflow-hidden rounded-lg shadow-lg bg-black">
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
                  )}
                  
                  {episode.still_path && !activeEpisode === episode.episode_number && (
                    <div className="mt-3">
                      <img 
                        src={`https://image.tmdb.org/t/p/w300${episode.still_path}`} 
                        alt={`${episode.name} still`}
                        className="w-full h-auto rounded object-cover"
                      />
                    </div>
                  )}
                  
                  {episode.overview && (
                    <p className="text-sm text-gray-700 mt-2">
                      {episode.overview}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && !error && (!seasonData || !seasonData.episodes || seasonData.episodes.length === 0) && (
          <div className="text-center py-4 text-gray-600">
            No episode information available for this season
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonEpisodes;