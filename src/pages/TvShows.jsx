import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import SEO from '../utils/SEO'
import Input from '../components/Input'
import ListItem from '../components/ListItem'
import Container from '../components/Container'
import Pagination from '../components/Pagination'
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
  const [tvShows, setTvShows] = useState([])
  const [keyword, setKeyword] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const searchInputRef = useRef(null)

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

  const searchTvShows = useCallback((query, pageNum = 1) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
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
          console.log("Using cached search data");
          setTvShows(parsedData.results);
          setTotalPages(Math.min(parsedData.total_pages, 500)); // TMDB API limit
          setIsLoading(false);
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
          setTvShows(data.results);
          setTotalPages(Math.min(data.total_pages, 500));
          
          // Cache search results
          storageManager.safeSet(cachedKey, JSON.stringify(data));
          storageManager.safeSet(`${cachedKey}_timestamp`, new Date().getTime().toString());
          
          // Preload images
          data.results.forEach(show => {
            if (show.poster_path) {
              const img = new Image();
              img.src = `${BASE_IMG_URL}${show.poster_path}`;
            }
          });
        } else {
          setTvShows([]);
          setTotalPages(1);
          console.error('Unexpected search response format:', data);
          setError('Unexpected search response format. The server might be down or the API format has changed.');
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error searching TV shows:', err);
        setError(`Failed to search TV shows. Please check your internet connection or try again later. (${err.message})`);
        setTvShows([]);
        setTotalPages(1);
        setIsLoading(false);
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
      setSearchTerm(keyword);
      setPage(1); // Reset to first page for new searches
    } else {
      setSearchTerm('');
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

  return (
    <>
      <SEO 
        title="Discover TV Shows"
        description="Find popular series, anime, and TV shows from around the world. Explore trending shows or search for your favorites."
        keywords="tv shows, series, popular tv shows, tv series, anime"
      />
      
      <div style={{
         background: `linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.7)), url('https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80')`,
         backgroundPosition: 'center',
         backgroundSize: 'cover'
      }}>
        <Container>
          <div className='min-h-[50vh] flex flex-col justify-center'>
            <h1 className='text-white w-full mx-auto text-3xl sm:text-5xl font-bold text-center mb-4'>
              Discover TV Shows
            </h1>
            <p className='text-gray-200 text-center mb-8 max-w-2xl mx-auto'>
              Find popular series, anime, and TV shows from around the world. Explore trending shows or search for your favorites.
            </p>
            <div className='w-[90%] sm:w-2/3 lg:w-1/2 mx-auto py-6'>
              <div className="flex gap-2">
                <Input 
                  onInput={handleInputChange} 
                  placeholder="Search for a TV show..." 
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
        {isLoading && (
          <div className='py-16 text-center'>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>
              {isSearchMode 
                ? `Searching for "${searchTerm}"...` 
                : "Loading TV shows..."}
            </p>
          </div>
        )}
        
        {error && !isLoading && (
          <div className='py-12 text-center'>
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
              <p className="font-bold">Error loading TV shows</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => searchTerm ? searchTvShows(searchTerm, page) : fetchTvShows(page)} 
                className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 px-4 rounded text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {!isLoading && !error && (
          <>
            <div className='py-8'>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">
                  {searchTerm 
                    ? `Search results for "${searchTerm}" (${tvShows.length} TV shows)` 
                    : 'Popular TV Shows'}
                </h2>
                <p className="text-gray-600">
                  {page > totalPages ? (
                    <span className="text-red-600">Page {page} exceeds maximum of {totalPages}</span>
                  ) : (
                    `Page ${page} of ${totalPages}`
                  )}
                </p>
              </div>
              
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
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
                  <div className="col-span-full text-center py-16">
                    <p className="text-gray-600 mb-2">No TV shows found</p>
                    {searchTerm && (
                      <button 
                        onClick={() => {
                          setKeyword('');
                          setSearchTerm('');
                          setPage(1);
                        }} 
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {tvShows.length > 0 && (
                <Pagination 
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={tvShows.length}
                />
              )}
            </div>
          </>
        )}
      </Container>
    </>
  )
}

export default TvShows