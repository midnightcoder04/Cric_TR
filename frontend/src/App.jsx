import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './components/Layout'
import Predict from './pages/Predict'
import PlayerStats from './pages/PlayerStats'
import TeamStats from './pages/TeamStats'
import PlayerCategories from './pages/PlayerCategories'
import PlayerForm from './pages/PlayerForm'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/predict" replace />} />
          <Route path="predict" element={<Predict />} />
          <Route path="player-stats" element={<PlayerStats />} />
          <Route path="team-stats" element={<TeamStats />} />
          <Route path="categories" element={<PlayerCategories />} />
          <Route path="form" element={<PlayerForm />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
