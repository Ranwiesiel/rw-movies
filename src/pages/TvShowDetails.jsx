import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Container from '../components/Container';
import SeasonEpisodes from '../components/SeasonEpisodes';
import { BASE_API } from '../utils/Endpoint';

const TvShowDetails = () => {
  const { id } = useParams();
  const [tvShow, setTvShow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTvShowDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Always use the details endpoint for full TV show information
        const response = await fetch(`${BASE_API}/tv/${id}/details`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setTvShow(data);
      } catch (err) {
        console.error('Error fetching TV show details:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTvShowDetails();
  }, [id]);

  if (isLoading) {
    return (
      <Container>
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading TV show details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="py-20 text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded max-w-md mx-auto">
            <p className="font-bold mb-2">Error loading TV show details</p>
            <p>{error}</p>
            <Link to="/tv-shows" className="mt-4 inline-block bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 px-4 rounded">
              Back to TV Shows
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  if (!tvShow) {
    return (
      <Container>
        <div className="py-20 text-center">
          <p className="text-gray-600">TV show not found</p>
          <Link to="/tv-shows" className="mt-4 inline-block bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded">
            Back to TV Shows
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <>
      {/* Hero section with background image */}
      <div 
        style={{
          background: tvShow.backdrop_path 
            ? `linear-gradient(rgba(0,0,0,.7), rgba(0,0,0,.8)), url('https://image.tmdb.org/t/p/original${tvShow.backdrop_path}')`
            : 'linear-gradient(rgba(0,0,0,.7), rgba(0,0,0,.8))',
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
        className="py-12"
      >
        <Container>
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Poster */}
            <div className="w-64 flex-shrink-0 mx-auto md:mx-0">
              {tvShow.poster_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w500${tvShow.poster_path}`}
                  alt={tvShow.name}
                  className="w-full rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">No poster available</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{tvShow.name}</h1>
              
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {tvShow.first_air_date && (
                  <span className="text-gray-300">
                    {new Date(tvShow.first_air_date).getFullYear()}
                  </span>
                )}
                
                {tvShow.vote_average > 0 && (
                  <div className="flex items-center gap-1 bg-yellow-500 text-yellow-900 px-2 py-1 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium">{tvShow.vote_average.toFixed(1)}</span>
                  </div>
                )}
                
                {tvShow.number_of_seasons && (
                  <span className="text-gray-300">
                    {tvShow.number_of_seasons} {tvShow.number_of_seasons === 1 ? 'Season' : 'Seasons'}
                  </span>
                )}
                
                {tvShow.status && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    tvShow.status === 'Ended' 
                      ? 'bg-gray-700 text-gray-300' 
                      : tvShow.status === 'Returning Series' 
                        ? 'bg-green-700 text-green-100'
                        : 'bg-blue-700 text-blue-100'
                  }`}>
                    {tvShow.status}
                  </span>
                )}
              </div>
              
              {tvShow.genres && tvShow.genres.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {tvShow.genres.map(genre => (
                      <span 
                        key={genre.id}
                        className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {tvShow.overview && (
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2">Overview</h3>
                  <p className="text-gray-300">{tvShow.overview}</p>
                </div>
              )}
              
              {tvShow.created_by && tvShow.created_by.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-1">Created by</h3>
                  <p className="text-gray-300">
                    {tvShow.created_by.map(person => person.name).join(', ')}
                  </p>
                </div>
              )}
              
              <Link 
                to="/tv-shows" 
                className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                Back to All TV Shows
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* Content section */}
      <Container>
        <div className="py-8">
          {/* Seasons and Episodes */}
          {tvShow.seasons && tvShow.seasons.length > 0 && (
            <SeasonEpisodes 
              tvId={tvShow.id} 
              seasons={tvShow.seasons.filter(season => season.season_number > 0)} 
            />
          )}
          
          {/* Additional information */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Networks */}
            {tvShow.networks && tvShow.networks.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-xl font-semibold mb-4">Networks</h3>
                <div className="flex flex-wrap gap-4">
                  {tvShow.networks.map(network => (
                    <div key={network.id} className="flex flex-col items-center">
                      {network.logo_path ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w200${network.logo_path}`} 
                          alt={network.name}
                          className="h-12 object-contain"
                        />
                      ) : (
                        <span className="text-gray-800 font-medium">{network.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Production Companies */}
            {tvShow.production_companies && tvShow.production_companies.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-xl font-semibold mb-4">Production Companies</h3>
                <div className="flex flex-wrap gap-4">
                  {tvShow.production_companies.map(company => (
                    <div key={company.id} className="flex flex-col items-center">
                      {company.logo_path ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w200${company.logo_path}`} 
                          alt={company.name}
                          className="h-10 object-contain mb-2"
                        />
                      ) : (
                        <div className="h-10 flex items-center">
                          <span className="text-gray-800 font-medium">{company.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
};

export default TvShowDetails;