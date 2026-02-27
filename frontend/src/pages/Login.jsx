import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Eye, EyeOff } from 'lucide-react'
import { api } from '../api/client'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    // ORIGINAL AUTH — still functional if backend is running
    try {
      const res = await api.login(form.username, form.password)
      localStorage.setItem('token', res.token)
      localStorage.setItem('username', res.username)
      navigate('/predict')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function handleQuickAccess() {
    // WORKAROUND: bypass login — token is auto-set by App.jsx startup hook
    localStorage.setItem('username', 'Admin')
    navigate('/predict')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl mb-4">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CricketAI</h1>
            <p className="text-gray-500 text-sm mt-1">Analytics &amp; Prediction Engine</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <input
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="admin"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900
                           focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500
                           placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500
                             placeholder:text-gray-400 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Quick access workaround */}
          <button
            onClick={handleQuickAccess}
            className="w-full py-2.5 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600
                       font-medium rounded-lg transition-colors text-sm"
          >
            Continue without login
          </button>

          {/* Credentials hint */}
          <div className="mt-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1">Default credentials</p>
            <p className="text-xs text-gray-500">
              Username: <span className="font-mono font-semibold text-gray-700">admin</span>
              &nbsp;·&nbsp;
              Password: <span className="font-mono font-semibold text-gray-700">admin123</span>
            </p>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-5">
          Cricket Analytics &amp; AI Prediction Platform
        </p>
      </div>
    </div>
  )
}
