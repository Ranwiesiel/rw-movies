import { useState, useEffect, memo } from 'react';

const BackToTop = memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Show button when user scrolls down 300px with throttling
  const toggleVisibility = () => {
    const currentScrollPos = window.pageYOffset;
    
    // Add a slight delay for better performance
    if (!isAnimating) {
      setIsAnimating(true);
      
      // Subtle animation timing
      setTimeout(() => {
        if (currentScrollPos > 300) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
        setIsAnimating(false);
      }, 100);
    }
  };

  // Scroll to top function with smooth animation and tracking
  const scrollToTop = () => {
    // Track scroll to top action (commented out - implement if analytics are added)
    // if (typeof window.gtag === 'function') {
    //   window.gtag('event', 'scroll_to_top', { page_location: window.location.href });
    // }
    
    // Add animation class for button press effect
    const button = document.getElementById('back-to-top-button');
    if (button) {
      button.classList.add('scale-95');
      setTimeout(() => {
        button.classList.remove('scale-95');
      }, 200);
    }
    
    // Perform smooth scroll
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Handle keyboard accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  };

  useEffect(() => {
    // Throttle scroll events for better performance
    let timeout;
    
    const throttledToggleVisibility = () => {
      if (timeout) {
        window.cancelAnimationFrame(timeout);
      }
      
      timeout = window.requestAnimationFrame(toggleVisibility);
    };
    
    window.addEventListener('scroll', throttledToggleVisibility);
    
    // Check initial scroll position
    throttledToggleVisibility();
    
    // Clean up event listener
    return () => {
      window.removeEventListener('scroll', throttledToggleVisibility);
      if (timeout) {
        window.cancelAnimationFrame(timeout);
      }
    };
  }, []);

  return (
    <button
      id="back-to-top-button"
      onClick={scrollToTop}
      onKeyDown={handleKeyDown}
      className={`fixed bottom-6 right-6 z-50 p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg 
        transition-all duration-500 ease-in-out hover:shadow-xl active:shadow-inner
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-75 pointer-events-none'}`}
      aria-label="Back to top"
      title="Back to top"
      tabIndex={isVisible ? 0 : -1} // Only focusable when visible
    >
      <span className="sr-only">Scroll to top of page</span>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-6 w-6" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M5 15l7-7 7 7" 
        />
      </svg>
      
      {/* Visual feedback ripple effect */}
      <span className="absolute inset-0 rounded-full bg-white opacity-30 transform scale-0 transition-transform animate-ripple"></span>
    </button>
  );
});

BackToTop.displayName = 'BackToTop';

export default BackToTop;