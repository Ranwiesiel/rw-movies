import { useState, useEffect, memo } from 'react';

const Pagination = memo(({ 
  page, 
  totalPages, 
  onPageChange,
  itemsPerPage = 20
}) => {
  // State for "Go to page" input
  const [goToPageInput, setGoToPageInput] = useState('');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Go to specific page with validation
  const goToPage = (pageNum) => {
    const pageNumber = Number(pageNum);
    
    if (isAnimating) return;
    setIsAnimating(true);
    
    // Make sure the page number is valid
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
      animateScrollToTop();
    } else if (pageNumber > totalPages) {
      // If user tries to access a page beyond total, go to the last page
      onPageChange(totalPages);
      animateScrollToTop();
    }
    
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Handle previous page button
  const handlePrevPage = () => {
    if (page > 1 && !isAnimating) {
      setIsAnimating(true);
      onPageChange(page - 1);
      animateScrollToTop();
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  // Handle next page button
  const handleNextPage = () => {
    if (page < totalPages && !isAnimating) {
      setIsAnimating(true);
      onPageChange(page + 1);
      animateScrollToTop();
      setTimeout(() => setIsAnimating(false), 500);
    }
  };
  
  // Smooth scroll to top with progress feedback
  const animateScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Update window width state on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    // Use fewer buttons on small screens
    const maxVisible = windowWidth < 640 ? 3 : 7; 
    
    // Calculate range of pages to display
    let startPage, endPage;
    
    if (totalPages <= maxVisible) {
      // If total pages less than max visible, show all pages
      startPage = 1;
      endPage = totalPages;
    } else {
      // Calculate middle pages based on current page
      const middlePoint = Math.floor(maxVisible / 2);
      
      if (page <= middlePoint + 1) {
        // Near the start
        startPage = 1;
        endPage = maxVisible;
      } else if (page >= totalPages - middlePoint) {
        // Near the end
        startPage = totalPages - maxVisible + 1;
        endPage = totalPages;
      } else {
        // In the middle
        startPage = page - middlePoint;
        endPage = page + middlePoint;
      }
    }
    
    // First page button (always show)
    if (startPage > 1) {
      buttons.push(
        <button 
          key={1}
          onClick={() => goToPage(1)}
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-md bg-white border border-gray-300 
                     text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 
                     transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
          aria-label="Go to first page"
        >
          1
        </button>
      );
      
      // Show ellipsis if needed
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="hidden sm:flex px-1 sm:px-2 py-1 items-center">
            <span className="w-4 sm:w-6 text-center">•••</span>
          </span>
        );
      }
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button 
          key={i}
          onClick={() => goToPage(i)}
          className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-md transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-offset-1
                      ${page === i 
                        ? 'bg-blue-600 text-white border border-blue-600 font-medium shadow-md hover:bg-blue-700 focus:ring-blue-400' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 focus:ring-blue-400'}`}
          aria-label={`Go to page ${i}`}
          aria-current={page === i ? "page" : undefined}
          disabled={isAnimating}
        >
          {i}
        </button>
      );
    }
    
    // Last page button (always show)
    if (endPage < totalPages) {
      // Show ellipsis if needed
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="hidden sm:flex px-1 sm:px-2 py-1 items-center">
            <span className="w-4 sm:w-6 text-center">•••</span>
          </span>
        );
      }
      
      buttons.push(
        <button 
          key={totalPages}
          onClick={() => goToPage(totalPages)}
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-md bg-white border border-gray-300 
                     text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 
                     transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
          aria-label="Go to last page"
          disabled={isAnimating}
        >
          {totalPages}
        </button>
      );
    }
    
    return buttons;
  };

  // Handle input change for "Go to page" field
  const handleGoToPageChange = (e) => {
    // Only allow numeric input
    const value = e.target.value.replace(/[^0-9]/g, '');
    setGoToPageInput(value);
  };

  // Handle form submission for "Go to page"
  const handleGoToPageSubmit = (e) => {
    e.preventDefault();
    if (goToPageInput) {
      const pageNum = parseInt(goToPageInput, 10);
      goToPage(pageNum);
      // Clear the input after submission
      setGoToPageInput('');
    }
  };

  return (
    <div className="flex flex-col items-center mt-6 sm:mt-12 space-y-3 sm:space-y-4">
      <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2">
        <button 
          onClick={handlePrevPage}
          disabled={page === 1 || isAnimating}
          className={`flex items-center justify-center px-2 sm:px-4 py-2 rounded-md transition-all duration-200 
                     ${page === 1 || isAnimating
                       ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                       : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow border border-transparent'}`}
          aria-label="Previous page"
          title="Previous page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="ml-0 sm:ml-1 hidden sm:inline">Prev</span>
        </button>
        
        <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2">
          {renderPaginationButtons()}
        </div>
        
        <button 
          onClick={handleNextPage}
          disabled={page === totalPages || isAnimating}
          className={`flex items-center justify-center px-2 sm:px-4 py-2 rounded-md transition-all duration-200
                     ${page === totalPages || isAnimating
                       ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                       : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow border border-transparent'}`}
          aria-label="Next page"
          title="Next page"
        >
          <span className="mr-0 sm:mr-1 hidden sm:inline">Next</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Go to page input - hidden on smallest screens */}
      <div className="hidden sm:flex items-center justify-center mt-0 sm:mt-2">
        <form 
          onSubmit={handleGoToPageSubmit} 
          className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-200 shadow-sm hover:border-gray-300 transition-all duration-200"
        >
          <span className="text-xs sm:text-sm text-gray-600">Go to:</span>
          <input 
            type="text" 
            value={goToPageInput} 
            onChange={handleGoToPageChange} 
            placeholder={`1-${totalPages}`}
            aria-label={`Go to page (1-${totalPages})`}
            className="border border-gray-300 rounded-md px-2 sm:px-3 py-1 w-12 sm:w-16 text-center 
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-300 outline-none transition-all duration-200"
            maxLength={String(totalPages).length}
            disabled={isAnimating}
          />
          <button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-3 py-1 rounded-md transition-all duration-200 
                       flex items-center shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
            title="Go to specified page"
            disabled={!goToPageInput || isAnimating}
          >
            <span>Go</span>
          </button>
        </form>
      </div>
      
      <div className="text-xs sm:text-sm text-gray-500 text-center">
        {page > totalPages ? (
          <span className="text-red-500">Page {page} exceeds total. Showing last page ({totalPages})</span>
        ) : (
          <div className="flex items-center space-x-1">
            <span>Page {page} of {totalPages}</span>
            <span className="text-gray-400">•</span>
            <span>Showing items {Math.min((page - 1) * itemsPerPage + 1, totalPages * itemsPerPage)} - {Math.min(page * itemsPerPage, totalPages * itemsPerPage)}</span>
          </div>
        )}
      </div>
      
      {/* Add global animation style */}
      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        `}
      </style>
    </div>
  );
});

Pagination.displayName = 'Pagination';

export default Pagination;