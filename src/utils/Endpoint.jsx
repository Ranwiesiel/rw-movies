// Use the direct URL to your API server
export const BASE_API = 'https://imdb.sesatnime.serv00.net/api'
export const TV_SEASON_EPISODES = (seriesId, seasonNumber) => `${BASE_API}/tv/${seriesId}/season/${seasonNumber}`

// Add pagination support for movies
export const PAGINATED_MOVIES = (page = 1) => `${BASE_API}/movies?page=${page}&limit=20`

// Add pagination support for TV shows
export const PAGINATED_TV_SHOWS = (page = 1) => `${BASE_API}/tvs?page=${page}&limit=20`