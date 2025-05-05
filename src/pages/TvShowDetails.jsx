import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../utils/SEO';
import Container from '../components/Container';
import SeasonEpisodes from '../components/SeasonEpisodes';
import { BASE_API, TV_DETAILS, BASE_IMG_URL, getHeaders } from '../utils/Endpoint';

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
        const cachedKey = `tvShowDetails_${id}`;
        const cachedData = localStorage.getItem(cachedKey);
        const cachedTimestamp = localStorage.getItem(`${cachedKey}_timestamp`);
        const cacheExpiry = 60 * 60 * 1000; // 1 hour
        
        if (cachedData && cachedTimestamp) {
          const currentTime = new Date().getTime();
          if (currentTime - parseInt(cachedTimestamp) < cacheExpiry) {
            try {
              const parsedData = JSON.parse(cachedData);
              console.log("Using cached TV show details");
              setTvShow(parsedData);
              setIsLoading(false);
              return;
            } catch (err) {
              console.error("Error parsing cached data", err);
            }
          }
        }
        
        // Use the TV_DETAILS endpoint function with authorization headers
        const response = await fetch(TV_DETAILS(id), {
          headers: getHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setTvShow(data);
        
        // Cache the details
        localStorage.setItem(cachedKey, JSON.stringify(data));
        localStorage.setItem(`${cachedKey}_timestamp`, new Date().getTime().toString());
        
        // Preload images for better UX
        if (data.backdrop_path) {
          const backdropImg = new Image();
          backdropImg.src = `https://image.tmdb.org/t/p/original${data.backdrop_path}`;
        }
        if (data.poster_path) {
          const posterImg = new Image();
          posterImg.src = `${BASE_IMG_URL}${data.poster_path}`;
        }
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
      <>
        <SEO
          title="Loading TV Show"
          description="Loading TV show details..."
        />
        <Container>
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading TV show details...</p>
          </div>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SEO
          title="Error | TV Show Details"
          description="There was an error loading the TV show details."
        />
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
      </>
    );
  }

  if (!tvShow) {
    return (
      <>
        <SEO
          title="TV Show Not Found"
          description="The requested TV show could not be found."
        />
        <Container>
          <div className="py-20 text-center">
            <p className="text-gray-600">TV show not found</p>
            <Link to="/tv-shows" className="mt-4 inline-block bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded">
              Back to TV Shows
            </Link>
          </div>
        </Container>
      </>
    );
  }

  // Generate a list of keywords based on show data
  const generateKeywords = () => {
    const keywords = [
      tvShow.name,
      'tv show',
      'series'
    ];
    
    if (tvShow.genres) {
      tvShow.genres.forEach(genre => keywords.push(genre.name.toLowerCase()));
    }
    
    if (tvShow.created_by && tvShow.created_by.length) {
      keywords.push(...tvShow.created_by.map(person => person.name));
    }
    
    if (tvShow.networks && tvShow.networks.length) {
      keywords.push(...tvShow.networks.map(network => network.name));
    }
    
    return keywords.join(', ');
  };

  // Generate a description based on the TV show data
  const generateDescription = () => {
    let description = tvShow.overview || `Details about ${tvShow.name}`;
    if (description.length > 155) {
      description = description.substring(0, 152) + '...';
    }
    return description;
  };

  return (
    <>
      <SEO
        title={tvShow.name}
        description={generateDescription()}
        keywords={generateKeywords()}
        image={tvShow.poster_path ? `${BASE_IMG_URL}${tvShow.poster_path}` : undefined}
      />
      
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
                  src={`${BASE_IMG_URL}${tvShow.poster_path}`}
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
                    <span className="font-medium">{tvShow.vote_average}/10</span>
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
              
              {tvShow.tagline && (
                <div className="mb-3">
                  <p className="text-gray-300 italic">"{tvShow.tagline}"</p>
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
          {/* Cast information */}
          {tvShow.credits && tvShow.credits.cast && tvShow.credits.cast.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Top Cast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tvShow.credits.cast.slice(0, 6).map(person => (
                  <div key={person.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {person.profile_path ? (
                      <img 
                        src={`${BASE_IMG_URL}${person.profile_path}`} 
                        alt={person.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-800">{person.name}</h3>
                      <p className="text-sm text-gray-600">{person.character}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        
          {/* Seasons and Episodes */}
          {tvShow.seasons && tvShow.seasons.length > 0 && (
            <SeasonEpisodes 
              tvId={tvShow.id} 
              seasons={tvShow.seasons.filter(season => season.season_number > 0)} 
            />
          )}
          
          {/* Videos section */}
          {tvShow.videos && tvShow.videos.results && tvShow.videos.results.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Videos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tvShow.videos.results.slice(0, 2).map(video => (
                  <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <iframe
                      title={video.name}
                      className="w-full aspect-video"
                      src={`https://www.youtube.com/embed/${video.key}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-800">{video.name}</h3>
                      <p className="text-sm text-gray-600">{video.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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