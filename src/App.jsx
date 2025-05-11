import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Movie from './pages/Movie';
import TvShows from './pages/TvShows';
import TvShowDetails from './pages/TvShowDetails';
import MovieDetails from './pages/MovieDetails';
import Navigation from './components/Navigation';

const App = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Navigation />
        <Routes>
          {/* Home and Movie routes */}
          <Route path='/' element={<Movie />} />
          <Route path='/movies' element={<Navigate to="/" replace />} />
          <Route path='/movie/:id' element={<MovieDetails />} />
          
          {/* TV Show routes - explicit ordering matters */}
          <Route path='/tv' element={<TvShows />} />
          <Route path='/tv/search/:searchTerm' element={<TvShows />} />
          <Route path='/tv/:id' element={<TvShowDetails />} />
          
          {/* Simplified search routes for movies */}
          <Route path='/:searchTerm' element={<Movie />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;