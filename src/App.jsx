import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Movie from './pages/Movie'

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