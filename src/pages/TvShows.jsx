import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useSearchParams, useLocation, useNavigate, useParams } from 'react-router-dom'
import SEO from '../utils/SEO'
import Input from '../components/Input'
import ListItem from '../components/ListItem'
import Container from '../components/Container'
import Pagination from '../components/Pagination'
import BackToTop from '../components/BackToTop'
import { PAGINATED_TV_SHOWS, SEARCH_TV_SHOWS, BASE_IMG_URL, getHeaders } from '../utils/Endpoint'

const storageManager = {
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
  
  clearOldCache() {
    const keysToCheck = [];
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
    
    keysToCheck.sort((a, b) => a.time - b.time);
    
    const removeCount = Math.ceil(keysToCheck.length * 0.3);
    for (let i = 0; i < removeCount && i < keysToCheck.length; i++) {
      localStorage.removeItem(keysToCheck[i].key);
      localStorage.removeItem(keysToCheck[i].timestampKey);
    }
  }
};

const TvShows = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { searchTerm: urlSearchTerm } = useParams();
  
  // Get search term from either URL path parameter or query parameter
  const initialSearchTerm = urlSearchTerm || searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  
  const [tvShows, setTvShows] = useState([])
  const [keyword, setKeyword] = useState(initialSearchTerm)
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(1)
  const [isSearchMode, setIsSearchMode] = useState(!!initialSearchTerm)
  const [allResults, setAllResults] = useState([])
  const [loadedPages, setLoadedPages] = useState(new Set([1]))
  const searchInputRef = useRef(null)

  // UI enhancement - Add search icon for input
  const searchIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  // Back button function to return to previous page
  const handleBackNavigation = () => {
    const previousLocation = localStorage.getItem("previousLocation");
    
    // Reset search state
    setKeyword('');
    setSearchTerm('');
    setIsSearchMode(false);
    
    if (previousLocation && !previousLocation.includes(searchTerm)) {
      // Navigate to previous location
      navigate(previousLocation);
    } else {
      // If no valid previous location is stored, go to TV home
      setPage(1);
      navigate("/tv");
    }
    
    // Clear the previous location from storage
    localStorage.removeItem("previousLocation");
  };

  // Update URL when search term or page changes
  useEffect(() => {
    if (searchTerm) {
      // Use the explicit TV search route structure
      if (page > 1) {
        navigate(`/tv/search/${searchTerm}?page=${page}`, { replace: true });
      } else {
        navigate(`/tv/search/${searchTerm}`, { replace: true });
      }
    } else {
      // Regular TV shows browsing with pagination
      if (page !== 1) {
        navigate(`/tv?page=${page}`, { replace: true });
      } else {
        // Default TV shows route, no query params
        navigate('/tv', { replace: true });
      }
    }
  }, [searchTerm, page, navigate]);

  // Initialize from URL parameters when component mounts
  useEffect(() => {
    if (initialSearchTerm) {
      setKeyword(initialSearchTerm);
      setSearchTerm(initialSearchTerm);
      setIsSearchMode(true);
    }
  }, [initialSearchTerm]);

  const fetchTvShows = useCallback((pageNum = 1) => {
    setIsLoading(true)
    setError(null)
    
    const MAX_API_PAGE = 500; // TMDB API limit
    const validatedPage = Math.min(pageNum, MAX_API_PAGE);
    const apiUrl = PAGINATED_TV_SHOWS(validatedPage)
    
    console.log("Fetching TV shows from:", apiUrl);
    
    const cachedKey = `cachedTvShows_${validatedPage}`;
    const cachedTvShowsData = localStorage.getItem(cachedKey);
    const cachedTimestamp = localStorage.getItem(`${cachedKey}_timestamp`);
    const cacheExpiry = 30 * 60 * 1000; // 30 minutes
    
    if (cachedTvShowsData && cachedTimestamp) {
      const currentTime = new Date().getTime();
      if (currentTime - parseInt(cachedTimestamp) < cacheExpiry) {
        try {
          const parsedData = JSON.parse(cachedTvShowsData);
          console.log("Using cached TV shows data");
          setTvShows(parsedData.results);
          setTotalPages(parsedData.total_pages > MAX_API_PAGE ? MAX_API_PAGE : parsedData.total_pages);
          setIsLoading(false);
          return;
        } catch (err) {
          console.error("Error parsing cached data", err);
        }
      }
    }
    
    fetch(apiUrl, {
      headers: getHeaders()
    })
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP error! Status: ${r.status}`)
        }
        return r.json()
      })
      .then((response) => {
        console.log("API Response:", response);
        
        if (response && Array.isArray(response.results)) {
          if (response.results.length === 0) {
            setError("No TV shows found for this page. The API may have reached its pagination limit.");
            setTvShows([]);
            setIsLoading(false);
            return;
          }
          
          setTvShows(response.results)
          
          const reportedPages = response.total_pages || 1;
          const actualTotalPages = Math.min(reportedPages, MAX_API_PAGE);
          
          setTotalPages(actualTotalPages);
          
          if (pageNum > actualTotalPages) {
            console.warn(`Requested page ${pageNum} exceeds available pages ${actualTotalPages}. Setting to last available page.`);
            setPage(actualTotalPages);
          }
          
          const cacheData = {
            results: response.results,
            total_pages: response.total_pages
          };
          storageManager.safeSet(cachedKey, JSON.stringify(cacheData));
          storageManager.safeSet(`${cachedKey}_timestamp`, new Date().getTime().toString());
          
          // Preload images for better UX
          response.results.forEach(show => {
            if (show.poster_path) {
              const img = new Image();
              img.loading = 'lazy'; // Enable lazy loading
              img.src = `${BASE_IMG_URL}${show.poster_path}`;
            }
          });
        } else {
          console.error('Unexpected API response format:', response)
          setError('Unexpected API response format. The server might be down or the API format has changed.');
          setTvShows([])
          setTotalPages(1)
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching TV shows:', err)
        setError(`Failed to connect to the TV shows server. Please check your internet connection or try again later. (${err.message})`)
        setTvShows([])
        setTotalPages(1)
        setIsLoading(false)
      })
  }, [])

  const searchTvShows = useCallback((query, pageNum = 1, appendResults = false) => {
    if (!query.trim()) return;
    
    if (appendResults) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setAllResults([]);
      setLoadedPages(new Set([1]));
    }
    setError(null);
    
    const cachedKey = `searchCache_tvShow_${query.toLowerCase()}_${pageNum}`;
    const cachedData = localStorage.getItem(cachedKey);
    const cachedTimestamp = localStorage.getItem(`${cachedKey}_timestamp`);
    const cacheExpiry = 30 * 60 * 1000; // 30 minutes
    
    if (cachedData && cachedTimestamp) {
      const currentTime = new Date().getTime();
      if (currentTime - parseInt(cachedTimestamp) < cacheExpiry) {
        try {
          const parsedData = JSON.parse(cachedData);
          console.log("Using cached search data for page", pageNum);
          
          if (appendResults) {
            setAllResults(prev => [...prev, ...parsedData.results]);
            setTvShows(prev => [...prev, ...parsedData.results]);
            setLoadedPages(prev => new Set([...prev, pageNum]));
            setIsLoadingMore(false);
          } else {
            setTvShows(parsedData.results);
            setAllResults(parsedData.results);
          }
          
          setTotalPages(Math.min(parsedData.total_pages, 500));
          
          if (!appendResults) {
            setIsLoading(false);
          }
          return;
        } catch (err) {
          console.error("Error parsing cached search data", err);
        }
      }
    }
    
    const searchUrl = SEARCH_TV_SHOWS(query, pageNum);
    console.log("Searching TV shows from:", searchUrl);
    
    fetch(searchUrl, {
      headers: getHeaders()
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data && Array.isArray(data.results)) {
          if (appendResults) {
            setAllResults(prev => [...prev, ...data.results]);
            setTvShows(prev => [...prev, ...data.results]);
            setLoadedPages(prev => new Set([...prev, pageNum]));
          } else {
            setTvShows(data.results);
            setAllResults(data.results);
          }
          
          setTotalPages(Math.min(data.total_pages, 500));
          
          storageManager.safeSet(cachedKey, JSON.stringify(data));
          storageManager.safeSet(`${cachedKey}_timestamp`, new Date().getTime().toString());
          
          // Preload images
          data.results.forEach(show => {
            if (show.poster_path) {
              const img = new Image();
              img.loading = 'lazy'; // Enable lazy loading
              img.src = `${BASE_IMG_URL}${show.poster_path}`;
            }
          });
        } else {
          if (!appendResults) {
            setTvShows([]);
            setAllResults([]);
            setTotalPages(1);
          }
          console.error('Unexpected search response format:', data);
          setError('Unexpected search response format. The server might be down or the API format has changed.');
        }
        
        if (appendResults) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('Error searching TV shows:', err);
        setError(`Failed to search TV shows. Please check your internet connection or try again later. (${err.message})`);
        if (!appendResults) {
          setTvShows([]);
          setAllResults([]);
          setTotalPages(1);
          setIsLoading(false);
        }
        setIsLoadingMore(false);
      });
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setIsSearchMode(true);
      searchTvShows(searchTerm, page);
    } else {
      setIsSearchMode(false);
      fetchTvShows(page);
    }
  }, [page, searchTerm, fetchTvShows, searchTvShows]);

  const handleInputChange = (e) => {
    setKeyword(e.target.value);
  };

  const executeSearch = () => {
    if (keyword.trim()) {
      setSearchTerm(keyword.trim());
      setPage(1); // Reset to page 1 on new search
    } else {
      setSearchTerm('');
      navigate('/tv', { replace: true });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  const handlePageChange = (newPage) => {
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

  // Function to load more search results
  const loadMoreResults = () => {
    const nextPage = Math.max(...Array.from(loadedPages)) + 1;
    if (nextPage <= totalPages) {
      searchTvShows(searchTerm, nextPage, true);
    }
  };

  return (
    <>
      <SEO 
        title="Discover TV Shows"
        description="Find popular series, anime, and TV shows from around the world. Explore trending shows or search for your favorites."
        keywords="tv shows, series, popular tv shows, tv series, anime"
      />
      
      <BackToTop />
      
      <div style={{
         background: `linear-gradient(rgba(0,0,0,.6), rgba(0,0,0,.8)), url('https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80')`,
         backgroundPosition: 'center',
         backgroundSize: 'cover',
         backgroundAttachment: 'fixed'
      }}>
        <Container>
          <div className='min-h-[40vh] md:min-h-[50vh] flex flex-col justify-center py-8 md:py-0'>
            <h1 className='text-white w-full mx-auto text-2xl sm:text-3xl md:text-5xl font-bold text-center mb-2 md:mb-4'>
              Discover TV Shows
            </h1>
            <p className='text-gray-200 text-center mb-4 md:mb-8 max-w-2xl mx-auto px-4 text-sm md:text-base'>
              Find popular series, anime, and TV shows from around the world. Explore trending shows or search for your favorites.
            </p>
            <div className='w-[95%] sm:w-[90%] md:w-2/3 lg:w-1/2 mx-auto py-3 md:py-6'>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input 
                  onInput={handleInputChange}
                  placeholder="Search for a TV show..." 
                  value={keyword}
                  className="shadow-lg flex-grow mb-2 sm:mb-0"
                  ref={searchInputRef}
                  onKeyPress={handleKeyPress}
                  icon={searchIcon}
                />
                <button 
                  onClick={executeSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center"
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
        {isLoading && (
          <div className='py-8 md:py-16 text-center'>
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">
              {isSearchMode 
                ? `Searching for "${searchTerm}"...` 
                : "Loading TV shows..."}
            </p>
          </div>
        )}
        
        {error && !isLoading && (
          <div className='py-6 md:py-12 text-center'>
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-lg max-w-md mx-auto shadow-sm">
              <p className="font-bold mb-1">Error loading TV shows</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => searchTerm ? searchTvShows(searchTerm, page) : fetchTvShows(page)} 
                className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 px-4 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {!isLoading && !error && (
          <>
            <div className='py-6 md:py-8'>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 md:mb-6 px-2 sm:px-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 sm:mb-0 flex items-center">
                  {searchTerm 
                    ? (
                      <>
                        <span className="text-blue-600 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </span>
                        Results for "{searchTerm}"
                        <button 
                          onClick={handleBackNavigation} 
                          className="ml-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded-full flex items-center transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Back
                        </button>
                      </> 
                    ) 
                    : (
                      <>
                        <span className="text-blue-600 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </span>
                        Popular TV Shows
                      </>
                    )}
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                  {isSearchMode && totalPages > 1 
                    ? <span className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>{tvShows.length} results (Page {page} of {totalPages})</span>
                    : page > totalPages 
                      ? <span className="text-red-600">Page {page} exceeds maximum of {totalPages}</span> 
                      : <span className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>Page {page} of {totalPages}</span>
                  }
                </p>
              </div>
              
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 px-2 sm:px-0'>
                {tvShows.length > 0 ? (
                  tvShows.map((show) => (
                    <ListItem 
                      key={show.id}
                      posterPath={show.poster_path}
                      id={show.id}
                      title={show.name || 'Untitled'}
                      rating={show.vote_average || 0}
                      releaseDate={show.first_air_date}
                      type="tv"
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 md:py-16">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 14a7 7 0 110-14 7 7 0 010 14z" />
                    </svg>
                    <p className="text-gray-600 mb-3">No TV shows found</p>
                    {searchTerm && (
                      <button 
                        onClick={() => {
                          setKeyword('');
                          setSearchTerm('');
                          setPage(1);
                        }} 
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded transition-colors"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {isSearchMode && tvShows.length > 0 && loadedPages.size < totalPages ? (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={loadMoreResults}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow transition-colors flex items-center space-x-2"
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                        <span>Loading more...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        <span>Load More Results</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                tvShows.length > 0 && (
                  <div className="px-2 sm:px-0 mt-6">
                    <Pagination 
                      page={page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      itemsPerPage={tvShows.length}
                    />
                  </div>
                )
              )}
              
              {isSearchMode && loadedPages.size > 1 && (
                <div className="text-center text-sm text-gray-500 mt-4">
                  {loadedPages.size} of {totalPages} pages loaded ({tvShows.length} shows)
                </div>
              )}
            </div>
          </>
        )}
      </Container>
    </>
  )
}

export default TvShows