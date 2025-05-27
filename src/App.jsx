import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useEffect } from 'react';
import Movie from './pages/Movie';
import TvShows from './pages/TvShows';
import TvShowDetails from './pages/TvShowDetails';
import MovieDetails from './pages/MovieDetails';
import Navigation from './components/Navigation';
import StorageMonitor from './components/StorageMonitor';
import { maintainStorage, getStorageInfo } from './utils/StorageHandler';
import './style/index.css'


const App = () => {
  // Initialize storage maintenance on app start
  useEffect(() => {
    const runStorageMaintenance = () => {
      try {
        // Run maintenance check
        const maintenanceRan = maintainStorage(75); // Run when 75% full
        
        if (import.meta.env.DEV) {
          // In development, log storage info
          const storageInfo = getStorageInfo();
          if (storageInfo) {
            console.log('📦 Storage Status:', {
              localStorage: `${Math.round(storageInfo.localStorage.used / 1024)}KB used`,
              totalItems: storageInfo.localStorage.keys.length,
              maintenanceRan
            });
          }
        }
      } catch (error) {
        console.warn('Storage maintenance failed:', error);
      }
    };

    // Run maintenance on app start
    runStorageMaintenance();

    // Set up periodic maintenance (every 10 minutes)
    const maintenanceInterval = setInterval(runStorageMaintenance, 10 * 60 * 1000);

    return () => clearInterval(maintenanceInterval);
  }, []);  return (
    <HelmetProvider>
      <BrowserRouter>
        <Navigation />
        <Routes>
          {/* Home and Movie routes */}
          <Route path='/' element={<Movie />} />
          <Route path='/movies' element={<Navigate to="/" replace />} />
          <Route path='/movie/:id' element={<MovieDetails />} />
          
          {/* TV Show routes */}
          <Route path='/tv' element={<TvShows />} />
          <Route path='/tv/:id' element={<TvShowDetails />} />
        </Routes>
        
        {/* Storage Monitor for development */}
        <StorageMonitor />
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;