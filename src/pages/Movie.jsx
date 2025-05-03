import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Input from '../components/Input'
import ListItem from '../components/ListItem'
import Container from '../components/Container'
import Pagination from '../components/Pagination'
import { PAGINATED_MOVIES } from '../utils/Endpoint'

// Utility for managing localStorage limits
const storageManager = {
  // Check if localStorage is available and has space
  isStorageAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  // Safely store an item with error handling
  safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('localStorage quota exceeded. Clearing old cache data...');
      if (e.name === 'QuotaExceededError' || e.code === 22 || 
          e.code === 1014 || // Firefox
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        this.clearOldCache();
        // Try one more time after clearing
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (e2) {
          console.error('Still cannot store data after clearing cache:', e2);
          return false;
        }
      }
      return false;
    }
  },
  
  // Clear old cache items to make space
  clearOldCache() {
    const keysToCheck = [];
    // Collect all cache keys and timestamps
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if ((key.startsWith('cached') || key.startsWith('searchCache_')) && !key.endsWith('_timestamp')) {
        const timestampKey = key + '_timestamp';
        const timestamp = localStorage.getItem(timestampKey);
        if (timestamp) {
          keysToCheck.push({
            key: key,
            timestampKey: timestampKey,
            time: parseInt(timestamp, 10)
          });
        }
      }
    }
    
    // Sort by timestamp (oldest first)
    keysToCheck.sort((a, b) => a.time - b.time);
    
    // Remove oldest 30% of items
    const removeCount = Math.ceil(keysToCheck.length * 0.3);
    for (let i = 0; i < removeCount && i < keysToCheck.length; i++) {
      localStorage.removeItem(keysToCheck[i].key);
      localStorage.removeItem(keysToCheck[i].timestampKey);
    }
  }
};

const Movie = () => {
  const [movies, setMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // Default to 1 to avoid undefined
  const [goToPageInput, setGoToPageInput] = useState('');
  const searchInputRef = useRef(null);

  // Fetch movies for pagination display with page validation
  const fetchMovies = useCallback((pageNum = 1) => {
    setIsLoading(true);
    setError(null);
    
    // TMDB API has a limitation of 500 pages maximum
    // Even though it may report much higher total page counts
    const MAX_API_PAGE = 500;
    
    // Validate page number before making API request
    const validatedPage = Math.min(pageNum, MAX_API_PAGE);
    
    // Use the new PAGINATED_MOVIES function
    const apiUrl = PAGINATED_MOVIES(validatedPage);
    
    console.log("Fetching movies from:", apiUrl);
    
    fetch(apiUrl)
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP error! Status: ${r.status}`);
        }
        return r.json();
      })
      .then((response) => {
        console.log("API Response:", response);
        
        if (response && Array.isArray(response.results)) {
          // Check if results are empty despite successful response
          if (response.results.length === 0) {
            setError("No movies found for this page. The API may have reached its pagination limit.");
            setMovies([]);
            setIsLoading(false);
            return;
          }
          
          setMovies(response.results);
          
          // Ensure totalPages is a valid number
          const reportedPages = response.total_pages ? Number(response.total_pages) : 
                              (response.total_results ? Math.ceil(Number(response.total_results) / 20) : 1);
                              
          const actualTotalPages = !isNaN(reportedPages) && reportedPages > 0 
            ? Math.min(reportedPages, MAX_API_PAGE) 
            : 1; // Default to 1 if invalid
          
          setTotalPages(actualTotalPages);
          
          // If requested page exceeds actual available pages, adjust the current page
          if (pageNum > actualTotalPages) {
            console.warn(`Requested page ${pageNum} exceeds available pages ${actualTotalPages}. Setting to last available page.`);
            setPage(actualTotalPages);
          }
          
          // Cache the results in localStorage
          const cacheData = {
            page: validatedPage,
            results: response.results,
            totalPages: actualTotalPages
          };
          storageManager.safeSet('cachedMovies', JSON.stringify(cacheData));
          storageManager.safeSet('cachedMoviesTimestamp', new Date().getTime().toString());
          
          // Pre-cache images for better UI experience
          response.results.forEach(movie => {
            if (movie.poster_path) {
              const img = new Image();
              img.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
            }
          });
        } else {
          console.error('Unexpected API response format:', response);
          setError('Unexpected API response format. The server might be down or the API format has changed.');
          setMovies([]);
          setTotalPages(1); // Set to 1 to avoid "undefined" in the UI
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching movies:', err);
        setError(`Failed to connect to the movie server. Please check your internet connection or try again later. (${err.message})`);
        setMovies([]);
        setTotalPages(1); // Set to 1 to avoid "undefined" in the UI
        setIsLoading(false);
      });
  }, []);

  // Check for cached data on component mount
  useEffect(() => {
    // Load cached data from localStorage if available
    const cachedMoviesData = localStorage.getItem('cachedMovies');
    const cachedTimestamp = localStorage.getItem('cachedMoviesTimestamp');
    const cacheExpiry = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    if (cachedMoviesData && cachedTimestamp) {
      const currentTime = new Date().getTime();
      if (currentTime - parseInt(cachedTimestamp) < cacheExpiry) {
        try {
          const parsedData = JSON.parse(cachedMoviesData);
          if (parsedData.page === page) {
            console.log("Using cached movie data");
            setMovies(parsedData.results);
            setTotalPages(parsedData.totalPages);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error("Error parsing cached data", err);
          // Continue with normal fetch if cache parsing fails
        }
      }
    }
    
    // If no valid cache, fetch fresh data
    fetchMovies(page);
  }, [page, fetchMovies]);

  // Update fetchAllMovies function to use PAGINATED_MOVIES
  const fetchAllMovies = useCallback(async () => {
    // First check if we have a cached search result
    const cachedSearchData = localStorage.getItem(`searchCache_${searchTerm.toLowerCase()}`);
    const cachedTimestamp = localStorage.getItem(`searchCache_${searchTerm.toLowerCase()}_timestamp`);
    const cacheExpiry = 60 * 60 * 1000; // 1 hour in milliseconds
    
    if (cachedSearchData && cachedTimestamp && searchTerm) {
      const currentTime = new Date().getTime();
      if (currentTime - parseInt(cachedTimestamp) < cacheExpiry) {
        try {
          const parsedData = JSON.parse(cachedSearchData);
          setAllMovies(parsedData);
          setIsSearching(false);
          return;
        } catch (err) {
          console.error("Error parsing cached search data", err);
          // Continue with search if cache parsing fails
        }
      }
    }
    
    // If no valid cache or no search term, proceed with fetching
    setIsSearching(true);
    setError(null);
    
    try {
      let allResults = [];
      let currentPage = 1;
      let hasMorePages = true;
      const fetchLimit = 100; // Increased limit to fetch more pages
      
      while (hasMorePages && currentPage <= fetchLimit) {
        const apiUrl = PAGINATED_MOVIES(currentPage);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.results && data.results.length > 0) {
          allResults = [...allResults, ...data.results];
          currentPage++;
          
          // Update UI periodically to show progress
          if (currentPage % 5 === 0) {
            setAllMovies(prevMovies => [...prevMovies, ...data.results]);
          }
          
          // Pre-cache images as we fetch
          data.results.forEach(movie => {
            if (movie.poster_path) {
              const img = new Image();
              img.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
            }
          });
          
          // Check if we've reached the last page
          if (!data.total_pages || data.page >= data.total_pages) {
            hasMorePages = false;
          }
        } else {
          hasMorePages = false;
        }
      }
      
      setAllMovies(allResults);
      
      // Cache search results
      if (searchTerm) {
        storageManager.safeSet(`searchCache_${searchTerm.toLowerCase()}`, JSON.stringify(allResults));
        storageManager.safeSet(`searchCache_${searchTerm.toLowerCase()}_timestamp`, new Date().getTime().toString());
      }
      
      setIsSearching(false);
    } catch (err) {
      console.error('Error fetching all movies for search:', err);
      setError(err.message);
      setIsSearching(false);
    }
  }, [searchTerm]);

  // Handle input change (just updates the keyword state without searching)
  const handleInputChange = (e) => {
    setKeyword(e.target.value);
  };

  // Execute search on button click or Enter key
  const executeSearch = () => {
    setSearchTerm(keyword);
    
    // If search is cleared, reset to pagination view
    if (!keyword) {
      setAllMovies([]);
      fetchMovies(page);
      return;
    }
    
    if (allMovies.length === 0) {
      fetchAllMovies();
    }
  };

  // Handle Enter key press in search input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  // Effect to trigger search when searchTerm changes
  useEffect(() => {
    if (searchTerm && allMovies.length === 0) {
      fetchAllMovies();
    }
  }, [searchTerm, allMovies.length, fetchAllMovies]);

  // Update the setPage function to add validation
  const handlePageChange = (newPage) => {
    // Make sure page is within valid range
    if (newPage >= 1) {
      if (newPage > totalPages) {
        console.warn(`Page ${newPage} exceeds total pages ${totalPages}. Setting to last page.`);
        setPage(totalPages);
      } else {
        setPage(newPage);
      }
    } else {
      setPage(1);
    }
  };

  // Filter based on searchTerm
  const filteredMovies = useMemo(() => {
    return searchTerm
      ? allMovies.filter((movie) => 
          movie && 
          movie.title && 
          movie.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : movies;
  }, [searchTerm, allMovies, movies]);
  
  // Add function to clear local storage cache (for development/testing)
  const clearCache = () => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('cached') || key.startsWith('searchCache_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    alert('Cache cleared successfully');
  };
    
  return (
    <>
      <div style={{
         background: `linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.7)), url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1925&q=80')`,
         backgroundPosition: 'center',
         backgroundSize: 'cover'
      }}>
        <Container>
          <div className='min-h-[50vh] flex flex-col justify-center'>
            <h1 className='text-white w-full mx-auto text-3xl sm:text-5xl font-bold text-center mb-4'>
              Discover Movies
            </h1>
            <p className='text-gray-200 text-center mb-8 max-w-2xl mx-auto'>
              Find the latest and greatest movies from around the world. Search for your favorites or discover new titles to watch.
            </p>
            <div className='w-[90%] sm:w-2/3 lg:w-1/2 mx-auto py-6'>
              <div className="flex gap-2">
                <Input 
                  onInput={handleInputChange}
                  placeholder="Search for a movie..." 
                  value={keyword}
                  className="shadow-lg flex-grow"
                  ref={searchInputRef}
                  onKeyPress={handleKeyPress}
                />
                <button 
                  onClick={executeSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
                >
                  Search
                </button>
              </div>
              {import.meta.env.DEV && (
                <div className="text-right mt-2">
                  <button 
                    onClick={clearCache}
                    className="text-xs text-gray-300 underline hover:text-white"
                  >
                    Clear cache (dev only)
                  </button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>

      <Container>
        {/* Loading states */}
        {(isLoading || isSearching) && (
          <div className='py-16 text-center'>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>
              {isSearching 
                ? `Searching across all movies (${allMovies.length} loaded so far)...` 
                : "Loading movies..."}
            </p>
          </div>
        )}
        
        {/* Error state */}
        {error && !isLoading && !isSearching && (
          <div className='py-12 text-center'>
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
              <p className="font-bold">Error loading movies</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => searchTerm ? fetchAllMovies() : fetchMovies(page)} 
                className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 px-4 rounded text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {/* Movies grid */}
        {!isLoading && !isSearching && !error && (
          <>
            <div className='py-8'>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">
                  {searchTerm 
                    ? `Search results for "${searchTerm}" (${filteredMovies.length} movies)` 
                    : 'Popular Movies'}
                </h2>
                {!searchTerm && (
                  <p className="text-gray-600">
                    {page > totalPages ? (
                      <span className="text-red-600">Page {page} exceeds maximum of {totalPages}</span>
                    ) : (
                      `Page ${page} of ${totalPages}`
                    )}
                  </p>
                )}
              </div>
              
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                {filteredMovies.length > 0 ? (
                  filteredMovies.map((movie) => (
                    <ListItem 
                      key={movie.id}
                      posterPath={movie.poster_path}
                      id={movie.id}
                      title={movie.title || 'Untitled'}
                      rating={movie.vote_average || 0}
                      releaseDate={movie.release_date}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-16">
                    <p className="text-gray-600 mb-2">No movies found</p>
                    {searchTerm && (
                      <button 
                        onClick={() => {
                          setKeyword('');
                          setSearchTerm('');
                          fetchMovies(1);
                        }} 
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Pagination component */}
              {!searchTerm && filteredMovies.length > 0 && (
                <Pagination 
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={filteredMovies.length}
                />
              )}
            </div>
          </>
        )}
      </Container>
    </>
  )
}

export default Movie