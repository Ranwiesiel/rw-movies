import { useContext, useState } from "react";
import { MovieContext } from "../contexts/MovieContext";

export default function Search() {
  const { dispatch } = useContext(MovieContext);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = async () => {
    if (searchTerm.trim() === "") return;
    
    dispatch({ type: "SET_LOADING", payload: true });
    
    // Check if we have this search cached in localStorage
    const cachedResult = localStorage.getItem(`search-${searchTerm}`);
    
    if (cachedResult) {
      dispatch({ type: "SEARCH_MOVIES", payload: JSON.parse(cachedResult) });
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }
    
    try {
      const response = await fetch(`https://www.omdbapi.com/?s=${searchTerm}&apikey=5f3ce003`);
      const data = await response.json();
      
      if (data.Response === "True") {
        // Cache the search results
        localStorage.setItem(`search-${searchTerm}`, JSON.stringify(data.Search));
        dispatch({ type: "SEARCH_MOVIES", payload: data.Search });
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
