import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import SEO from '../utils/SEO'
import Input from '../components/Input'
import ListItem from '../components/ListItem'
import Container from '../components/Container'
import Pagination from '../components/Pagination'
import BackToTop from '../components/BackToTop'
import { PAGINATED_MOVIES, SEARCH_MOVIES, BASE_IMG_URL, getHeaders } from '../utils/Endpoint'
import { safeSetItem, safeGetItem, safeRemoveItem, clearAllCache } from '../utils/StorageHandler'
import { useTheme } from "../theme/darkMode";




// Scroll position memory
const scrollPositionMemory = {
  positions: {},
  
  savePosition(pageKey) {
    this.positions[pageKey] = window.scrollY;
  },
  
  getPosition(pageKey) {
    return this.positions[pageKey] || 0;
  },
  
  hasPosition(pageKey) {
    return this.positions[pageKey] !== undefined;
  }
};

const Movie = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get search term from query parameter
  const initialSearchTerm = searchParams.get('search') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  
  const [movies, setMovies] = useState([]);
  const [keyword, setKeyword] = useState(initialSearchTerm);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearchMode, setIsSearchMode] = useState(!!initialSearchTerm);
  const [loadedPages, setLoadedPages] = useState(new Set([1]));
  const searchInputRef = useRef(null);
  const [isScrollRestored, setIsScrollRestored] = useState(false);

  // UI enhancement - Add search icon for input
  const searchIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  // Modify handleBackNavigation function to properly reset the search state and URL
  const handleBackNavigation = () => {
    const previousLocation = safeGetItem("previousLocation");
    
    // Reset search state immediately
    setKeyword('');
    setSearchTerm('');
    setIsSearchMode(false);
    
    if (previousLocation && !previousLocation.includes('search=')) {
      // Navigate to previous location with replace option to avoid adding to history stack
      navigate(previousLocation, { replace: true });
    } else {
      // If no valid previous location is stored, go to home with replace option
      setPage(1);
      navigate("/", { replace: true });
    }
    
    // Clear the previous location from storage
    safeRemoveItem("previousLocation");
  };

  // Update URL when search term or page changes
  useEffect(() => {
    // Create a new URLSearchParams object based on the current search params
    const newSearchParams = new URLSearchParams(searchParams);
    
    if (searchTerm) {
      // Add search term to query parameters
      newSearchParams.set('search', searchTerm);
      
      if (page !== 1) {
        newSearchParams.set('page', page.toString());
      } else {
        newSearchParams.delete('page');
      }
    } else {
      // Remove search parameter if not searching
      newSearchParams.delete('search');
      
      if (page !== 1) {
        newSearchParams.set('page', page.toString());
      } else {
        newSearchParams.delete('page');
      }
    }
    
    // Determine if this is a new search action
    const isNewSearch = searchParams.get('search') !== searchTerm && searchTerm !== '';
    
    // Apply the updated search params
    // Only use replace for pagination, not for new searches
    if (isNewSearch) {
      // For new searches, create a new history entry so back button works
      setSearchParams(newSearchParams);
    } else {
      // For pagination or clearing search, replace the current entry
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchTerm, page, setSearchParams, searchParams]);

  const fetchMovies = useCallback((pageNum = 1) => {
    setIsLoading(true);
    setError(null);
    
    const MAX_API_PAGE = 500;
    const validatedPage = Math.min(pageNum, MAX_API_PAGE);
    const apiUrl = PAGINATED_MOVIES(validatedPage);
    const cachedKey = `cachedMovies_${validatedPage}`;
    const cachedMoviesData = safeGetItem(cachedKey);
    const cachedTimestamp = safeGetItem(`${cachedKey}_timestamp`);
    const cacheExpiry = 30 * 60 * 1000;
    
    if (cachedMoviesData && cachedTimestamp) {
      const currentTime = new Date().getTime();
      if (currentTime - parseInt(cachedTimestamp) < cacheExpiry) {
        try {
          console.log("Using cached movie data");
          setMovies(cachedMoviesData.results);
          setTotalPages(cachedMoviesData.total_pages > MAX_API_PAGE ? MAX_API_PAGE : cachedMoviesData.total_pages);
          setIsLoading(false);
          return;
        } catch (err) {
          console.error("Error parsing cached data", err);
        }
      }
    }
    
    console.log("Fetching movies from:", apiUrl);
    
    fetch(apiUrl, { headers: getHeaders() })
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP error! Status: ${r.status}`);
        }
        return r.json();
      })
      .then((response) => {
        console.log("API Response:", response);
        
        if (response && Array.isArray(response.results)) {
          if (response.results.length === 0) {
            setError("No movies found for this page. The API may have reached its pagination limit.");
            setMovies([]);
            setIsLoading(false);
            return;
          }
          
          setMovies(response.results);
          
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
          safeSetItem(cachedKey, cacheData);
          safeSetItem(`${cachedKey}_timestamp`, new Date().getTime());
          
          response.results.forEach(movie => {
            if (movie.poster_path) {
              const img = new Image();
              img.src = `${BASE_IMG_URL}${movie.poster_path}`;
            }
          });
        } else {
          console.error('Unexpected API response format:', response);
          setError('Unexpected API response format. The server might be down or the API format has changed.');
          setMovies([]);
          setTotalPages(1);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching movies:', err);
        setError(`Failed to connect to the movie server. Please check your internet connection or try again later. (${err.message})`);
        setMovies([]);
        setTotalPages(1);
        setIsLoading(false);
      });
  }, []);

  const searchMovies = useCallback((query, pageNum = 1, appendResults = false) => {
    if (!query.trim()) return;
    
    if (appendResults) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setLoadedPages(new Set([1]));
    }
    setError(null);
    
    const cachedKey = `searchCache_movie_${query.toLowerCase()}_${pageNum}`;
    const cachedData = safeGetItem(cachedKey);
    const cachedTimestamp = safeGetItem(`${cachedKey}_timestamp`);
    const cacheExpiry = 30 * 60 * 1000;
    
    if (cachedData && cachedTimestamp) {
      const currentTime = new Date().getTime();
      if (currentTime - parseInt(cachedTimestamp) < cacheExpiry) {
        try {
          console.log("Using cached search data for page", pageNum);
          
          if (appendResults) {
            setMovies(prev => [...prev, ...cachedData.results]);
            setLoadedPages(prev => new Set([...prev, pageNum]));
            setIsLoadingMore(false);
          } else {
            setMovies(cachedData.results);
          }
          
          setTotalPages(Math.min(cachedData.total_pages, 500));
          
          if (!appendResults) {
            setIsLoading(false);
          }
          return;
        } catch (err) {
          console.error("Error parsing cached search data", err);
        }
      }
    }
    
    const searchUrl = SEARCH_MOVIES(query, pageNum);
    console.log("Searching movies from:", searchUrl);
    
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
            setMovies(prev => [...prev, ...data.results]);
            setLoadedPages(prev => new Set([...prev, pageNum]));
          } else {
            setMovies(data.results);
          }
          
          setTotalPages(Math.min(data.total_pages, 500));
          
          safeSetItem(cachedKey, data);
          safeSetItem(`${cachedKey}_timestamp`, new Date().getTime());
          
          // Preload images
          data.results.forEach(movie => {
            if (movie.poster_path) {
              const img = new Image();
              img.src = `${BASE_IMG_URL}${movie.poster_path}`;
            }
          });
        } else {
          if (!appendResults) {
            setMovies([]);
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
        console.error('Error searching movies:', err);
        setError(`Failed to search movies. Please check your internet connection or try again later. (${err.message})`);
        if (!appendResults) {
          setMovies([]);
          setTotalPages(1);
          setIsLoading(false);
        }
        setIsLoadingMore(false);
      });
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setIsSearchMode(true);
      searchMovies(searchTerm, page);
    } else {
      setIsSearchMode(false);
      fetchMovies(page);
    }
  }, [page, searchTerm, fetchMovies, searchMovies]);

  // Initialize from searchParams when component mounts
  useEffect(() => {
    if (initialSearchTerm) {
      setKeyword(initialSearchTerm);
      setSearchTerm(initialSearchTerm);
      setIsSearchMode(true);
    }
  }, [initialSearchTerm]);

  const handleInputChange = (e) => {
    setKeyword(e.target.value);
  };

  const executeSearch = () => {
    if (keyword.trim()) {
      // Set search term to trigger URL update via the effect
      setSearchTerm(keyword.trim());
      setPage(1); // Reset to page 1 on new search
    } else {
      setSearchTerm('');
      setPage(1);
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
        // Save current scroll position before changing page
        const currentPageKey = `${searchTerm || 'browse'}_${page}`;
        scrollPositionMemory.savePosition(currentPageKey);
        
        setPage(newPage);
        setIsScrollRestored(false); // Reset flag for scroll restoration
      }
    } else {
      setPage(1);
    }
  };
  
  // Effect to restore scroll position after page change and data load
  useEffect(() => {
    if (!isLoading && !isScrollRestored) {
      const pageKey = `${searchTerm || 'browse'}_${page}`;
      
      if (scrollPositionMemory.hasPosition(pageKey)) {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          window.scrollTo({
            top: scrollPositionMemory.getPosition(pageKey),
            behavior: 'auto' // Use auto to avoid animation when restoring position
          });
          setIsScrollRestored(true);
        }, 100);
      } else {
        // For new pages, scroll to top
        window.scrollTo(0, 0);
        setIsScrollRestored(true);
      }
    }
  }, [isLoading, page, searchTerm, isScrollRestored]);
  
  // Save scroll position when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      const pageKey = `${searchTerm || 'browse'}_${page}`;
      scrollPositionMemory.savePosition(pageKey);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Save position on component unmount as well
      const pageKey = `${searchTerm || 'browse'}_${page}`;
      scrollPositionMemory.savePosition(pageKey);
    };
  }, [page, searchTerm]);

  const clearCache = () => {
    clearAllCache(true); // Using the StorageHandler utility, preserving user data
    alert('Cache cleared successfully');
  };

  const loadMoreResults = () => {
    const nextPage = Math.max(...Array.from(loadedPages)) + 1;
    if (nextPage <= totalPages) {
      searchMovies(searchTerm, nextPage, true);
    }
  };

  const clearSearch = () => {
    setKeyword('');
    setSearchTerm('');
    setPage(1);
  };
    
  return (
    <div className="bg-white text-black dark:bg-bg dark:text-white">
      <SEO 
        title="Discover Movies"
        description="Find the latest and greatest movies from around the world. Search for your favorites or discover new titles to watch."
        keywords="movies, popular movies, movie search, watch movies"
      />
      
      {/* Back to top button */}
      <BackToTop />
      
      <div style={{
         background: `linear-gradient(rgba(0,0,0,.6), rgba(0,0,0,.8)), url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1925&q=80')`,
         backgroundPosition: 'center',
         backgroundSize: 'cover',
         backgroundAttachment: 'fixed'
      }}>
        <Container>
          <div className='min-h-[40vh] md:min-h-[50vh] flex flex-col justify-center py-8 md:py-0'>
            <h1 className='text-white w-full mx-auto text-2xl sm:text-3xl md:text-5xl font-bold text-center mb-2 md:mb-4'>
              Discover Movies
            </h1>
            <p className='text-gray-200 text-center mb-4 md:mb-8 max-w-2xl mx-auto px-4 text-sm md:text-base'>
              Find the latest and greatest movies from around the world. Search for your favorites or discover new titles to watch.
            </p>
            <div className='w-[95%] sm:w-[90%] md:w-2/3 lg:w-1/2 mx-auto py-3 md:py-6'>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input 
                  onInput={handleInputChange}
                  placeholder="Search for a movie..." 
                  value={keyword}
                  className="shadow-lg flex-grow mb-2 sm:mb-0 text-bg"
                  ref={searchInputRef}
                  onKeyPress={handleKeyPress}
                  icon={searchIcon}
                />
                <button 
                  onClick={executeSearch}
                  className="bg-bluee hover:bg-blueh text-white px-6 py-2.5 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center"
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
      <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-bluee mb-4"></div>
      <p className="text-gray-600 dark:text-gray-300">
        {isSearchMode 
          ? `Searching for "${searchTerm}"...` 
          : "Loading movies..."}
      </p>
    </div>
  )}

  {error && !isLoading && (
    <div className='py-6 md:py-12 text-center'>
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-4 rounded-lg max-w-md mx-auto shadow-sm">
        <p className="font-bold mb-1">Error loading movies</p>
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => searchTerm ? searchMovies(searchTerm, page) : fetchMovies(page)} 
          className="mt-3 bg-red-100 dark:bg-red-700 hover:bg-red-200 dark:hover:bg-red-600 text-red-800 dark:text-white font-semibold py-2 px-4 rounded transition-colors"
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
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 sm:mb-0 flex items-center">
            {searchTerm 
              ? (
                <>
                  <span className="text-bluee mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  Results for "{searchTerm}"
                  <button 
                    onClick={handleBackNavigation} 
                    className="ml-3 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 py-1 px-3 rounded-full flex items-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                </>
              ) 
              : (
                <h1 className="mr-2 text-gray-800 dark:text-white">
                  Popular Movies
                </h1>
              )}
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            {isSearchMode && totalPages > 1 
              ? <span className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-bluee mr-2"></span>{movies.length} results (Page {page} of {totalPages})</span>
              : page > totalPages 
                ? <span className="text-red-600 dark:text-red-400">Page {page} exceeds maximum of {totalPages}</span> 
                : <span className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>Page {page} of {totalPages}</span>
            }
          </p>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 px-2 sm:px-0'>
          {movies.length > 0 ? (
            movies.map((movie) => (
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
            <div className="col-span-full text-center py-12 md:py-16">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 14a7 7 0 110-14 7 7 0 010 14z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-3">No movies found</p>
              {searchTerm && (
                <button 
                  onClick={clearSearch} 
                  className="bg-blue-100 dark:bg-bluee hover:bg-blue-200 dark:hover:bg-blueh text-blue-800 dark:text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>

        {isSearchMode && movies.length > 0 && loadedPages.size < totalPages ? (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMoreResults}
              className="bg-bluee hover:bg-blueh text-white px-6 py-3 rounded-lg shadow transition-colors flex items-center space-x-2"
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
          movies.length > 0 && (
            <div className="px-2 sm:px-0 mt-6">
              <Pagination 
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={movies.length}
              />
            </div>
          )
        )}

        {isSearchMode && loadedPages.size > 1 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            {loadedPages.size} of {totalPages} pages loaded ({movies.length} movies)
          </div>
        )}
      </div>
    </>
  )}
</Container>

    </div>
  )
}

export default Movie