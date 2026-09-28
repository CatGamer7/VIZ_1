import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Explorer from './pages/Explorer'
import Normality from './pages/Normality'
import Correlation from './pages/Correlation'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div
        className="container py-4"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        <Routes>
          <Route path="/" element={<Explorer />} />
          <Route path="/normality" element={<Normality />} />
          <Route path="/correlation" element={<Correlation />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
