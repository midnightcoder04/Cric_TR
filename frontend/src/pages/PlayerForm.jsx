import { useState, useEffect } from 'react'
import { api } from '../api/client'
import Spinner from '../components/Spinner'
import { TrendingUp, Search, X, Plus } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

const FORMATS = ['All', 'T20', 'ODI', 'Test']
const COLORS   = ['#0d9488', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']

const TOOLTIP = {
  contentStyle: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#111827' },
}

const impactColor = s =>
  s >= 70 ? '#0d9488' : s >= 50 ? '#3b82f6' : s >= 30 ? '#f59e0b' : '#ef4444'

export default function PlayerForm() {
  const [fmt, setFmt]               = useState('All')
  const [allPlayers, setAllPlayers] = useState([])
  const [selected, setSelected]     = useState([])
  const [formData, setFormData]     = useState([])
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [t20, odi, test] = await Promise.all([
          api.indiaPlayers('t20'), api.indiaPlayers('odi'), api.indiaPlayers('test'),
        ])
        const all = [...new Set([...(t20.players||[]), ...(odi.players||[]), ...(test.players||[])])].sort()
        setAllPlayers(all)
      } catch {}
    }
    load()
  }, [])

  useEffect(() => {
    if (selected.length === 0) { setFormData([]); return }
    setLoading(true)
    api.playerForm(selected, fmt === 'All' ? null : fmt.toLowerCase(), 5)
      .then(d => setFormData(d || []))
      .catch(() => setFormData([]))
      .finally(() => setLoading(false))
  }, [selected, fmt])

  function addPlayer(name) {
    if (!selected.includes(name) && selected.length < 5) setSelected(s => [...s, name])
    setSearch(''); setShowDropdown(false)
  }
  function removePlayer(name) { setSelected(s => s.filter(p => p !== name)) }

  const filtered = allPlayers.filter(p =>
    p.toLowerCase().includes(search.toLowerCase()) && !selected.includes(p)
  ).slice(0, 8)

  const chartData = (() => {
    const byPlayer = {}
    for (const p of selected) {
      byPlayer[p] = formData.filter(d => d.player === p).sort((a, b) => new Date(a.date) - new Date(b.date))
    }
    const maxLen = Math.max(...Object.values(byPlayer).map(a => a.length), 0)
    return Array.from({ length: maxLen }, (_, i) => {
      const row = { match: `M${i + 1}` }
      for (const [p, matches] of Object.entries(byPlayer)) {
        if (matches[i]) row[p] = matches[i].impact_score
      }
      return row
    })
  })()

  const tableByPlayer = {}
  for (const p of selected) {
    tableByPlayer[p] = formData.filter(d => d.player === p).sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Player Form</h1>
        <p className="text-gray-500 text-sm">Compare recent match performance across up to 5 players</p>
      </div>

      {/* Format filter */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {FORMATS.map(f => (
          <button key={f} onClick={() => setFmt(f)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${fmt === f ? 'tab-active' : 'tab-inactive'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Player selector */}
      <div className="card-sm space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Players (max 5)</p>
        <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
          {selected.map((p, i) => (
            <span key={p}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border"
              style={{ background: COLORS[i] + '15', borderColor: COLORS[i] + '50', color: COLORS[i] }}
            >
              {p}
              <button onClick={() => removePlayer(p)} className="hover:opacity-70 ml-0.5">
                <X size={12} />
              </button>
            </span>
          ))}

          {selected.length < 5 && (
            <div className="relative">
              <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-150">
                <Search size={12} className="text-gray-400" />
                <input
                  className="bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 w-32"
                  placeholder="Add player…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                />
              </div>
              {showDropdown && search && filtered.length > 0 && (
                <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-56 overflow-hidden">
                  {filtered.map(p => (
                    <button key={p} onClick={() => addPlayer(p)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 text-left">
                      <Plus size={12} className="text-teal-600" />{p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selected.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-48 text-center">
          <TrendingUp size={40} className="text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">Select players to view their recent form</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20"><Spinner size={10} /></div>
      ) : (
        <>
          {/* Line chart */}
          <div className="card">
            <p className="text-sm font-semibold text-gray-700 mb-4">Impact Score — Last 5 Matches</p>
            {chartData.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">No match data found for selected players / format</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="match" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip {...TOOLTIP} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#6b7280' }} />
                  {selected.map((p, i) => (
                    <Line key={p} type="monotone" dataKey={p} stroke={COLORS[i]} strokeWidth={2.5}
                      dot={{ r: 4, fill: COLORS[i], strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Per-player tables */}
          {selected.map((p, i) => {
            const matches = tableByPlayer[p] || []
            return (
              <div key={p} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                  <h3 className="font-semibold text-gray-900 text-sm">{p}</h3>
                  <span className="text-xs text-gray-400">— Last {matches.length} {fmt === 'All' ? '' : fmt} matches</span>
                </div>
                {matches.length === 0 ? (
                  <p className="text-gray-400 text-sm px-6 py-4">No data available</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {['Date', 'Format', 'Venue', 'Impact', 'Bat', 'Bowl', 'Runs', 'Wkts', 'SR', 'Eco'].map(h => (
                            <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${
                              h === 'Date' || h === 'Format' || h === 'Venue' ? 'text-left' : 'text-right'
                            }`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {matches.map((m, mi) => (
                          <tr key={mi} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-500 text-xs">{m.date.slice(0, 10)}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 uppercase">{m.format}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{m.venue}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-bold text-sm" style={{ color: impactColor(m.impact_score) }}>{m.impact_score}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">{m.bat_score}</td>
                            <td className="px-4 py-3 text-right text-gray-700">{m.bowl_score}</td>
                            <td className="px-4 py-3 text-right text-gray-700">{m.runs}</td>
                            <td className="px-4 py-3 text-right text-gray-700">{m.wickets}</td>
                            <td className="px-4 py-3 text-right text-gray-500">{m.strike_rate}</td>
                            <td className="px-4 py-3 text-right text-gray-500">{m.economy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
