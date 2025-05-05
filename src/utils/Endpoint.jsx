// TMDB API configuration
export const API_TOKEN = process.env.TMDB_API_TOKEN; // Retrieve the TMDB API token from an environment variable
export const BASE_API = 'https://api.themoviedb.org/3'
export const BASE_IMG_URL = 'https://image.tmdb.org/t/p/w500'

// Common headers for all requests
export const getHeaders = () => {
  return {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  }
}

// TV Show endpoints
export const TV_SEASON_EPISODES = (seriesId, seasonNumber) => 
  `${BASE_API}/tv/${seriesId}/season/${seasonNumber}`

// Add pagination support for movies
export const PAGINATED_MOVIES = (page = 1) => 
  `${BASE_API}/movie/popular?page=${page}&language=en-US`

// Add pagination support for TV shows
export const PAGINATED_TV_SHOWS = (page = 1) => 
  `${BASE_API}/tv/popular?page=${page}&language=en-US`

// Search endpoints
export const SEARCH_MOVIES = (query, page = 1) => 
  `${BASE_API}/search/movie?language=en-US&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`

export const SEARCH_TV_SHOWS = (query, page = 1) => 
  `${BASE_API}/search/tv?language=en-US&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`

// Get details by ID
export const MOVIE_DETAILS = (id) => 
  `${BASE_API}/movie/${id}?language=en-US&append_to_response=credits,videos`

export const TV_DETAILS = (id) => 
  `${BASE_API}/tv/${id}?language=en-US&append_to_response=credits,videos`