import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './components/Layout'
import Predict from './pages/Predict'
import PlayerStats from './pages/PlayerStats'
import TeamStats from './pages/TeamStats'
import PlayerCategories from './pages/PlayerCategories'
import PlayerForm from './pages/PlayerForm'
import { api } from './api/client'

// ─── LOGIN WORKAROUND ────────────────────────────────────────────────────────
// Auto-login with default credentials on app startup so the backend API token
// is always set. Remove this block and restore PrivateRoute below for production.
function useAutoLogin() {
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      api.login('admin', 'admin123')
        .then(res => {
          localStorage.setItem('token', res.token)
          localStorage.setItem('username', res.username)
        })
        .catch(() => {/* backend may not be running yet */})
    }
  }, [])
}

function PrivateRoute({ children }) {
  // WORKAROUND: auth gate bypassed — always render children
  // Original check (restore for production):
  // const token = localStorage.getItem('token')
  // return token ? children : <Navigate to="/login" replace />
  return children
}
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  useAutoLogin()

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
          <Route path="predict"      element={<Predict />} />
          <Route path="player-stats" element={<PlayerStats />} />
          <Route path="team-stats"   element={<TeamStats />} />
          <Route path="categories"   element={<PlayerCategories />} />
          <Route path="form"         element={<PlayerForm />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
