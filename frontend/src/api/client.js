const BASE = ''  // proxied by vite to localhost:8000

function getToken() {
  return localStorage.getItem('token')
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    window.location.href = '/login'
    return
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }

  return res.json()
}

export const api = {
  // Auth
  login:  (u, p) => request('POST', '/auth/login',  { username: u, password: p }),
  logout: ()     => request('POST', '/auth/logout'),
  me:     ()     => request('GET',  '/auth/me'),

  // Players
  indiaPlayers:    (fmt)     => request('GET', `/players/india/${fmt}`),
  opponents:       ()        => request('GET', '/players/opponents'),
  opponentPlayers: (country) => request('GET', `/players/opponents/${encodeURIComponent(country)}`),
  venues:          ()        => request('GET', '/players/venues'),
  pitchTypes:      ()        => request('GET', '/players/pitch-types'),

  // Prediction
  predict: (body) => request('POST', '/predict', body),

  // Stats
  battingStats:     (fmt)     => request('GET', `/stats/batting/${fmt}`),
  bowlingStats:     (fmt)     => request('GET', `/stats/bowling/${fmt}`),
  teamStats:        ()        => request('GET', '/stats/teams'),
  playerCategories: (fmt)     => request('GET', `/stats/categories/${fmt}`),
  playerForm:       (players, fmt, n = 5) => {
    const qs = new URLSearchParams({ players: players.join(','), n })
    if (fmt) qs.set('fmt', fmt)
    return request('GET', `/stats/form?${qs}`)
  },
}
