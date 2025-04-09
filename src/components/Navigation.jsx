import { Link, useLocation } from 'react-router-dom'
import Container from './Container'

const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav className="bg-white shadow-md py-4 sticky top-0 z-10">
      <Container>
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-600 mb-3 sm:mb-0">
            RanwUse
          </Link>
          
          <div className="flex space-x-6">
            <Link 
              to="/" 
              className={`font-medium ${location.pathname === '/' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
            >
              Movies
            </Link>
            <Link 
              to="/tv-shows" 
              className={`font-medium ${location.pathname === '/tv-shows' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
            >
              TV Shows
            </Link>
          </div>
        </div>
      </Container>
    </nav>
  )
}

export default Navigation