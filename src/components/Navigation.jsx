import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, memo } from 'react'
import Container from './Container'

const Navigation = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [prevScrollY, setPrevScrollY] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  // Handle scroll effects for navigation (hiding on scroll down, showing on scroll up)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Detect scroll amount and direction
      if (currentScrollY > 100) {
        setIsScrolled(true);
        // Hide nav when scrolling down, show when scrolling up
        if (currentScrollY > prevScrollY && isNavVisible && !isMenuOpen) {
          setIsNavVisible(false);
        } else if (currentScrollY < prevScrollY && !isNavVisible) {
          setIsNavVisible(true);
        }
      } else {
        setIsScrolled(false);
        setIsNavVisible(true);
      }
      
      setPrevScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollY, isNavVisible, isMenuOpen]);
  
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    }
  }, [isMenuOpen]);
  
  // Handle direct navigation to homepage from anywhere
  const goHome = (e) => {
    e.preventDefault(); 
    closeMenu();
    navigate('/');
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Check if current route is in the movies section
  const isMoviePage = location.pathname === '/' || 
                       location.pathname === '/movies' || 
                       location.pathname.startsWith('/movie/') ||
                       (location.pathname.match(/^\/[^/]+$/) && 
                       location.pathname !== '/tv');

  // Check if current route is in the TV shows section
  const isTvShowPage = location.pathname === '/tv' || 
                       location.pathname.startsWith('/tv/');

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);
  
  return (
    <nav 
      className={`bg-white/95 backdrop-blur-md py-4 sticky top-0 z-50 transition-transform duration-300 ${
        isScrolled ? 'shadow-md' : 'shadow-sm'
      } ${!isNavVisible && !isMenuOpen ? '-translate-y-full' : 'translate-y-0'}`}
    >
      <Container>
        <div className="flex justify-between items-center">
          {/* Brand logo/title */}
          <a 
            href="/"
            onClick={goHome}
            className="text-xl font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center group"
            title="Home"
            aria-label="RanwUse Homepage"
          >
            <div className="mr-2 relative overflow-hidden group-hover:scale-110 transform transition-transform duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="2" x2="7" y2="22"></line>
                <line x1="17" y1="2" x2="17" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
              </svg>
            </div>
            <span className="relative">
              RanwUse
              <span className="absolute bottom-[-4px] left-0 w-0 group-hover:w-full h-0.5 bg-blue-500 transition-all duration-300"></span>
            </span>
          </a>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden flex items-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded-md p-1"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen ? "true" : "false"}
          >
            <svg 
              className="w-6 h-6 text-gray-600" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            <a 
              href="/"
              onClick={goHome}
              className={`font-medium transition-all duration-200 relative group py-1 ${
                isMoviePage ? 'text-blue-600' : 'text-gray-700 hover:text-blue-500'
              }`}
              aria-current={isMoviePage ? "page" : undefined}
            >
              <span className="relative z-10">Movies</span>
              <span className={`absolute inset-x-0 bottom-0 h-0.5 transform transition-all duration-300 ${
                isMoviePage 
                ? 'bg-blue-500 w-full' 
                : 'bg-blue-300 w-0 group-hover:w-full'
              }`}></span>
            </a>
            <Link 
              to="/tv" 
              className={`font-medium transition-all duration-200 relative group py-1 ${
                isTvShowPage ? 'text-blue-600' : 'text-gray-700 hover:text-blue-500'
              }`}
              onClick={closeMenu}
              aria-current={isTvShowPage ? "page" : undefined}
            >
              <span className="relative z-10">TV Shows</span>
              <span className={`absolute inset-x-0 bottom-0 h-0.5 transform transition-all duration-300 ${
                isTvShowPage 
                ? 'bg-blue-500 w-full' 
                : 'bg-blue-300 w-0 group-hover:w-full'
              }`}></span>
            </Link>

            {/* Optional - GitHub link */}
            <a
              href="https://github.com/Ranwiesiel/rw-movies "
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-900 p-1"
              title="View on GitHub"
            >
              <span className="sr-only">View on GitHub</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
        
        {/* Mobile navigation menu - Fixed for better visibility and height */}
        <div 
          className={`md:hidden fixed inset-x-0 top-[57px] bg-white/95 backdrop-blur-md z-40 overflow-y-auto transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-10 invisible pointer-events-none'
          }`}
          style={{
            maxHeight: 'calc(100vh - 57px)',
            boxShadow: isMenuOpen ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
          }}
        >
          <div className="py-6 px-4 flex flex-col space-y-6">
            {/* Mobile main nav */}
            <div className="flex flex-col space-y-4">
              <a 
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  closeMenu();
                  navigate('/');
                }}
                className={`font-medium py-4 px-4 rounded-lg transition-all duration-200 ${
                  isMoviePage ? 'bg-blue-50 text-blue-600' : 'text-gray-800 hover:bg-gray-50'
                }`}
              >
                Movies
              </a>
              <Link 
                to="/tv" 
                className={`font-medium py-4 px-4 rounded-lg transition-all duration-200 ${
                  isTvShowPage ? 'bg-blue-50 text-blue-600' : 'text-gray-800 hover:bg-gray-50'
                }`}
                onClick={closeMenu}
              >
                TV Shows
              </Link>
              <a
                href="https://github.com/Ranwiesiel/rw-movies"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="flex items-center font-medium py-4 px-4 rounded-lg text-gray-800 hover:bg-gray-50 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </Container>
    </nav>
  );
});

Navigation.displayName = 'Navigation';
export default Navigation;