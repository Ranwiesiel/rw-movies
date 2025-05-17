import { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MovieContext } from "../contexts/MovieContext";
import { SEARCH_MOVIES, getHeaders } from "../utils/Endpoint";

export default function Search() {
  const { dispatch } = useContext(MovieContext);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = async () => {
    if (searchTerm.trim() === "") return;
    
    // Save current location pathname before navigating
    const currentPath = location.pathname + location.search;
    // Don't save search pages as previous location
    if (!currentPath.includes('/search/') && !currentPath.includes(`/${searchTerm.trim()}`)) {
      localStorage.setItem("previousLocation", currentPath);
    }
    
    // Use the TV search route if we're in the TV section
    if (location.pathname.startsWith('/tv')) {
      navigate(`/tv/search/${searchTerm.trim()}`);
    } else {
      // Use the movie search route
      navigate(`/${searchTerm.trim()}`);
    }
    
    dispatch({ type: "SET_LOADING", payload: true });
    
    // Check if we have this search cached in localStorage
    const cachedResult = localStorage.getItem(`search-${searchTerm}`);
    const cachedTimestamp = localStorage.getItem(`search-${searchTerm}-timestamp`);
    const cacheExpiry = 30 * 60 * 1000; // 30 minutes
    
    if (cachedResult && cachedTimestamp && 
        (Date.now() - parseInt(cachedTimestamp)) < cacheExpiry) {
      dispatch({ type: "SEARCH_MOVIES", payload: JSON.parse(cachedResult) });
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }
    
    try {
      const searchUrl = SEARCH_MOVIES(searchTerm, 1);
      const response = await fetch(searchUrl, {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        // Cache the search results
        localStorage.setItem(`search-${searchTerm}`, JSON.stringify(data.results));
        localStorage.setItem(`search-${searchTerm}-timestamp`, Date.now().toString());
        dispatch({ type: "SEARCH_MOVIES", payload: data.results });
      } else {
        dispatch({ type: "SEARCH_MOVIES", payload: [] });
      }
    } catch (error) {
      console.error("Error searching movies:", error);
      dispatch({ type: "SEARCH_MOVIES", payload: [] });
    }
    
    dispatch({ type: "SET_LOADING", payload: false });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search for movies..."
        className="search-input"
      />
      <button onClick={handleSearch} className="search-button">
        Search
      </button>
    </div>
  );
}
