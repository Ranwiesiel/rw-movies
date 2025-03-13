import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Movie from './pages/movie'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Movie/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App