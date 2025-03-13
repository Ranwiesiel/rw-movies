import { useEffect, useState } from 'react'
import Input from '../components/Input'
import ListItem from '../components/ListItem'
import Container from '../components/Container'
import { LIST_MOVIES } from '../utils/Endpoint'

const Movie = () => {
  const [movies, setMovies] = useState([]) // Initialize as empty array
  const [keyword, setKeyword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setIsLoading(true)
    fetch(LIST_MOVIES)
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP error! Status: ${r.status}`)
        }
        return r.json()
      })
      .then((response) => {
        if (response && response.results) {
          setMovies(response.results)
        } else {
          // Handle the case when data is not in the expected format
          console.error('Unexpected API response format:', response)
          setMovies([])
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching movies:', err)
        setError(err.message)
        setIsLoading(false)
      })
  }, [])

  // Safely filter movies, ensuring we're working with an array
  const filteredMovie = Array.isArray(movies) 
    ? movies.filter((movie) => 
        movie && movie.title && movie.title.toLowerCase().includes(keyword.toLowerCase()))
    : []

  return (
    <>
      <div style={{
         background: `linear-gradient(rgba(0,0,0,.3), rgba(0,0,0,.3)), url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1925&q=80')`,
         backgroundPosition: 'center',
         backgroundSize: 'cover'
      }}>
        <Container>
          <div className='min-h-[50vh] flex flex-col justify-center'>
            <h1 className='text-white w-3/4 mx-auto text-2xl sm:text-4xl font-bold text-center'>
              Discovery Movie
            </h1>
            <div className='w-[80%] sm:w-1/2 mx-auto py-6'>
              <Input onInput={(e) => setKeyword(e.target.value)} placeholder="Search Movie.." />
            </div>
          </div>
        </Container>
      </div>
      <Container>
        {isLoading && (
          <div className='py-12 text-center'>
            <p>Loading movies...</p>
          </div>
        )}
        
        {error && (
          <div className='py-12 text-center text-red-500'>
            <p>Error: {error}</p>
          </div>
        )}
        
        {!isLoading && !error && (
          <div className='py-12 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4'>
            {filteredMovie.length > 0 ? (
              filteredMovie.map((movie, index) => (
                <ListItem 
                  key={index} 
                  // coverUrl={movie.poster_path} 
                  id={movie.id} 
                  title={movie.title || 'Untitled'} 
                  rating={movie.vote_average || 'N/A'}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <p>No movies found</p>
              </div>
            )}
          </div>
        )}
      </Container>
    </>
  )
}

export default Movie