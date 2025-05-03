import React from 'react'

const Pagination = ({ 
  page, 
  totalPages, 
  onPageChange,
  itemsPerPage = 20
}) => {
  // Go to specific page with validation
  const goToPage = (pageNum) => {
    const pageNumber = Number(pageNum);
    // Make sure the page number is valid
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
      window.scrollTo(0, 0);
    } else if (pageNumber > totalPages) {
      // If user tries to access a page beyond total, go to the last page
      onPageChange(totalPages);
      window.scrollTo(0, 0);
    }
  };

  // Handle previous page button
  const handlePrevPage = () => {
    if (page > 1) {
      onPageChange(page - 1);
      window.scrollTo(0, 0);
    }
  };

  // Handle next page button
  const handleNextPage = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 7; // Max number of page buttons to show
    
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
          className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Go to first page"
        >
          1
        </button>
      );
      
      // Show ellipsis if needed
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="px-2 py-1 flex items-center">
            <span className="w-6 text-center">...</span>
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
          className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${page === i 
            ? 'bg-blue-600 text-white border border-blue-600 font-medium' 
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          aria-label={`Go to page ${i}`}
          aria-current={page === i ? "page" : undefined}
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
          <span key="ellipsis2" className="px-2 py-1 flex items-center">
            <span className="w-6 text-center">...</span>
          </span>
        );
      }
      
      buttons.push(
        <button 
          key={totalPages}
          onClick={() => goToPage(totalPages)}
          className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Go to last page"
        >
          {totalPages}
        </button>
      );
    }
    
    return buttons;
  };

  // State for "Go to page" input
  const [goToPageInput, setGoToPageInput] = React.useState('');

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
    <div className="flex flex-col items-center mt-12 space-y-4">
      <div className="flex flex-wrap justify-center items-center gap-2">
        <button 
          onClick={handlePrevPage}
          disabled={page === 1}
          className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${page === 1 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          aria-label="Previous page"
          title="Previous page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="ml-1 hidden sm:inline">Prev</span>
        </button>
        
        <div className="flex flex-wrap justify-center items-center gap-2">
          {renderPaginationButtons()}
        </div>
        
        <button 
          onClick={handleNextPage}
          disabled={page === totalPages}
          className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${page === totalPages 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          aria-label="Next page"
          title="Next page"
        >
          <span className="mr-1 hidden sm:inline">Next</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Go to page input */}
      <div className="flex items-center justify-center mt-2">
        <form 
          onSubmit={handleGoToPageSubmit} 
          className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-200"
        >
          <span className="text-sm text-gray-600">Go to:</span>
          <input 
            type="text" 
            value={goToPageInput} 
            onChange={handleGoToPageChange} 
            placeholder={`1-${totalPages}`}
            aria-label={`Go to page (1-${totalPages})`}
            className="border border-gray-300 rounded-md px-3 py-1 w-16 text-center focus:ring-blue-500 focus:border-blue-500"
            maxLength={String(totalPages).length}
          />
          <button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition-colors flex items-center"
            title="Go to specified page"
          >
            <span>Go</span>
          </button>
        </form>
      </div>
      
      <div className="text-sm text-gray-500 text-center">
        {page > totalPages ? (
          <span className="text-red-500">Page number {page} exceeds total pages. Showing last page ({totalPages})</span>
        ) : (
          <span>Showing page {page} of {totalPages} ({itemsPerPage} items per page)</span>
        )}
      </div>
    </div>
  )
}

export default Pagination