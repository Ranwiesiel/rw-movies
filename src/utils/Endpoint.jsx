// TMDB API configuration
export const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4NjEzNWFmODI3YWNkMzZkMDBjZDg4ZjViZmFlMWZmZSIsIm5iZiI6MTczNzI5NzI3OS4xOCwic3ViIjoiNjc4ZDBkN2YyZTQxNjM0ZTUyNjUxNmRmIiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.0o0QAcGKjRuF688zRKizLpbCzRdIQq9EOs9MdiJEYn4' // Replace with your actual TMDB API read access token
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