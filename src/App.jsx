import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Movie from './pages/Movie';
import TvShows from './pages/TvShows';
import TvShowDetails from './pages/TvShowDetails';
import Navigation from './components/Navigation';

const App = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path='/' element={<Movie />} />
          <Route path='/tv-shows' element={<TvShows />} />
          <Route path='/tv-shows/:id' element={<TvShowDetails />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;