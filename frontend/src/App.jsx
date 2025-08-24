import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/navigation/Layout'
import Dashboard from './components/dashboard/Dashboard'
import HealthCheck from './components/HealthCheck'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="health" element={<HealthCheck />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App