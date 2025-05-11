import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import SEO from '../utils/SEO';
import Container from '../components/Container';
import BackToTop from '../components/BackToTop';
import { BASE_API, MOVIE_DETAILS, BASE_IMG_URL, getHeaders } from '../utils/Endpoint';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Improved back navigation function
  const handleGoBack = () => {
    // First, check if we have location state from ListItem navigation
    if (location.state && location.state.fromPath) {
      navigate(location.state.fromPath);
    }
    // If no state but we have navigation history, go to main movie page
    else if (location.key) {
      navigate('/');
    }
    // Last resort fallback
    else {
      navigate(-1);
    }
  };
  
  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }
    
    const fetchMovieDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      const cachedKey = `cachedMovieDetails_${id}`;
      const cachedData = localStorage.getItem(cachedKey);
      const cachedTimestamp = localStorage.getItem(`${cachedKey}_timestamp`);
      const cacheExpiry = 30 * 60 * 1000; // 30 minutes
      
      if (cachedData && cachedTimestamp) {
        const currentTime = new Date().getTime();
        if (currentTime - parseInt(cachedTimestamp) < cacheExpiry) {
          try {
            const parsedData = JSON.parse(cachedData);
            console.log("Using cached movie details");
            setMovie(parsedData);
            setIsLoading(false);
            return;
          } catch (err) {
            console.error("Error parsing cached data", err);
          }
        }
      }
      
      try {
        const response = await fetch(MOVIE_DETAILS(id), { headers: getHeaders() });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Movie details:", data);
        
        setMovie(data);
        
        // Cache the data
        localStorage.setItem(cachedKey, JSON.stringify(data));
        localStorage.setItem(`${cachedKey}_timestamp`, new Date().getTime().toString());
        
        // Preload backdrop image
        if (data.backdrop_path) {
          const img = new Image();
          img.src = `${BASE_IMG_URL}${data.backdrop_path}`;
        }
      } catch (err) {
        console.error("Error fetching movie details:", err);
        setError(`Failed to load movie details. Please try again later. (${err.message})`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMovieDetails();
  }, [id, navigate]);
  
  if (isLoading) {
    return (
      <Container>
        <div className='py-16 text-center'>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading movie details...</p>
        </div>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <div className='py-8 text-center'>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <div className="mt-3">
              <button 
                onClick={() => navigate('/')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
              >
                Back to Movies
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </Container>
    );
  }
  
  if (!movie) {
    return (
      <Container>
        <div className='py-8 text-center'>
          <p>Movie not found</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Back to Movies
          </button>
        </div>
      </Container>
    );
  }
  
  // Format runtime from minutes to hours and minutes
  const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };
  
  // Format release date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <>
      <SEO 
        title={`${movie.title || 'Movie Details'}`}
        description={movie.overview || `Details about ${movie.title}`}
        keywords={`movie, ${movie.title}, details, film`}
      />
      
      {/* Back to top button */}
      <BackToTop />
      
      {/* Hero Section with Backdrop */}
      <div 
        className="relative bg-gray-900 text-white" 
        style={{
          background: movie.backdrop_path
            ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(${BASE_IMG_URL}${movie.backdrop_path})`
            : 'linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.9))',
          backgroundSize: 'cover',
          backgroundPosition: 'center top'
        }}
      >
        <Container>
          <div className="py-12 md:py-16">
            <div className="flex flex-col md:flex-row">
              {/* Poster */}
              <div className="w-full md:w-1/3 lg:w-1/4 flex justify-center md:justify-start mb-6 md:mb-0">
                <div className="w-48 md:w-56 lg:w-64 rounded-lg overflow-hidden shadow-lg">
                  {movie.poster_path ? (
                    <img 
                      src={`${BASE_IMG_URL}${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="w-full pt-[150%] bg-gray-800 flex items-center justify-center">
                      <span className="text-gray-400">No poster available</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Details */}
              <div className="w-full md:w-2/3 lg:w-3/4 md:pl-6 lg:pl-8">
                <div className="flex flex-col">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                    {movie.title}
                    {movie.release_date && (
                      <span className="text-gray-400 font-normal text-xl md:text-2xl ml-2">
                        ({new Date(movie.release_date).getFullYear()})
                      </span>
                    )}
                  </h1>
                  
                  {movie.tagline && (
                    <p className="text-gray-400 italic mb-4">{movie.tagline}</p>
                  )}
                  
                  {/* Meta info */}
                  <div className="flex flex-wrap gap-y-2 mb-6 text-sm md:text-base text-gray-300">
                    {movie.release_date && (
                      <div className="mr-4">
                        <span className="block md:inline text-gray-400">Release Date:</span> {formatDate(movie.release_date)}
                      </div>
                    )}
                    
                    {movie.runtime && (
                      <div className="mr-4">
                        <span className="block md:inline text-gray-400">Runtime:</span> {formatRuntime(movie.runtime)}
                      </div>
                    )}
                    
                    {movie.vote_average > 0 && (
                      <div>
                        <span className="block md:inline text-gray-400">Rating:</span> {movie.vote_average.toFixed(1)}/10
                      </div>
                    )}
                  </div>
                  
                  {/* Genres */}
                  {movie.genres && movie.genres.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {movie.genres.map(genre => (
                          <span 
                            key={genre.id}
                            className="inline-block bg-blue-600 bg-opacity-30 text-blue-100 rounded-full px-3 py-1 text-sm"
                          >
                            {genre.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Overview */}
                  {movie.overview && (
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold mb-2">Overview</h2>
                      <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
                    </div>
                  )}
                  
                  {/* Additional info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                    {movie.production_companies && movie.production_companies.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-1">Production</h3>
                        <p className="text-gray-300">
                          {movie.production_companies.map(company => company.name).join(', ')}
                        </p>
                      </div>
                    )}
                    
                    {movie.production_countries && movie.production_countries.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-1">Country</h3>
                        <p className="text-gray-300">
                          {movie.production_countries.map(country => country.name).join(', ')}
                        </p>
                      </div>
                    )}
                    
                    {movie.budget > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-1">Budget</h3>
                        <p className="text-gray-300">
                          ${movie.budget.toLocaleString()}
                        </p>
                      </div>
                    )}
                    
                    {movie.revenue > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-1">Revenue</h3>
                        <p className="text-gray-300">
                          ${movie.revenue.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Back button */}
                  <div className="mt-4">
                    <button 
                      onClick={handleGoBack}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-colors"
                    >
                      Back to Movies
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
      
      {/* Additional content sections */}
      <Container>
        {movie.videos && movie.videos.results && movie.videos.results.length > 0 && (
          <div className="py-8">
            <h2 className="text-2xl font-bold mb-4">Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {movie.videos.results.slice(0, 3).map(video => (
                <div key={video.id} className="aspect-video bg-gray-900 rounded overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${video.key}`}
                    title={video.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Movie Player */}
        <div className="py-8">
          <h2 className="text-2xl font-bold mb-4">Watch Movie</h2>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="aspect-video mb-4 bg-gray-900 rounded overflow-hidden">
              <iframe
                src={`https://embed.su/embed/movie/${movie.id}`}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                className="w-full h-full"
                title={`${movie.title} Player`}
              ></iframe>
            </div>
            <p className="text-gray-700 text-sm">
              If the player doesn't load correctly, please try refreshing the page or check back later.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
};

export default MovieDetails;