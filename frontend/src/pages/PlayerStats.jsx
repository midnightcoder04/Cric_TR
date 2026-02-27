import { useState, useEffect } from 'react'
import { api } from '../api/client'
import Spinner from '../components/Spinner'
import { BarChart2, Search, Award, TrendingUp } from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts'

const FORMATS = ['T20', 'ODI', 'Test']

const TOOLTIP = {
  contentStyle: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#111827' },
}

function StatBox({ label, value, unit = '' }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">
        {value ?? '—'}
        {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
      </p>
    </div>
  )
}

export default function PlayerStats() {
  const [fmt, setFmt]           = useState('T20')
  const [batting, setBatting]   = useState([])
  const [bowling, setBowling]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [tab, setTab]           = useState('batting')

  useEffect(() => {
    async function load() {
      setLoading(true); setSelected(null)
      try {
        const [batRes, bowlRes] = await Promise.all([
          api.battingStats(fmt.toLowerCase()),
          api.bowlingStats(fmt.toLowerCase()),
        ])
        setBatting(batRes || []); setBowling(bowlRes || [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [fmt])

  const filteredBat  = batting.filter(p => p.player?.toLowerCase().includes(search.toLowerCase()))
  const filteredBowl = bowling.filter(p => p.player?.toLowerCase().includes(search.toLowerCase()))

  const selectedBat  = batting.find(p => p.player === selected)
  const selectedBowl = bowling.find(p => p.player === selected)

  const radarData = selected ? [
    { stat: 'Avg',     bat: selectedBat?.career_avg ?? 0, bowl: 100 - Math.min((selectedBowl?.career_avg ?? 100), 100) },
    { stat: 'SR/Eco',  bat: Math.min((selectedBat?.career_sr ?? 0) / 2, 100), bowl: Math.max(100 - (selectedBowl?.career_economy ?? 10) * 10, 0) },
    { stat: 'Form',    bat: Math.min((selectedBat?.form_sr_short ?? 0) / 2, 100), bowl: Math.max(100 - (selectedBowl?.form_eco_short ?? 10) * 10, 0) },
    { stat: 'Wickets', bat: 0, bowl: Math.min((selectedBowl?.career_wickets ?? 0) / 3, 100) },
    { stat: 'Innings', bat: Math.min((selectedBat?.total_innings ?? 0), 100), bowl: Math.min((selectedBowl?.total_innings ?? 0), 100) },
  ] : []

  const pitchBarData = selectedBat ? [
    { pitch: 'Flat',     sr: selectedBat.sr_on_flat     ?? 0 },
    { pitch: 'Spin',     sr: selectedBat.sr_on_spin     ?? 0 },
    { pitch: 'Seam',     sr: selectedBat.sr_on_seam     ?? 0 },
    { pitch: 'Pace',     sr: selectedBat.sr_on_pace     ?? 0 },
    { pitch: 'Balanced', sr: selectedBat.sr_on_balanced ?? 0 },
  ] : []

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Player Statistics</h1>
        <p className="text-gray-500 text-sm">View detailed performance metrics for all players</p>
      </div>

      {/* Format tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {FORMATS.map(f => (
          <button key={f} onClick={() => setFmt(f)}
            className={`px-5 py-2 rounded-lg text-sm transition-all ${fmt === f ? 'tab-active' : 'tab-inactive'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Spinner size={10} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player list */}
          <div className="lg:col-span-1 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9" placeholder="Search player…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Sub-tab */}
            <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
              {['batting', 'bowling'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-y-auto max-h-[520px] divide-y divide-gray-100">
                {(tab === 'batting' ? filteredBat : filteredBowl).map(p => (
                  <button key={p.player} onClick={() => setSelected(p.player)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      selected === p.player ? 'bg-teal-50 border-l-2 border-teal-600' : 'hover:bg-gray-50'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.player}</p>
                      <p className="text-xs text-gray-400">{p.total_innings} innings</p>
                    </div>
                    <span className="text-sm font-bold text-teal-600">
                      {tab === 'batting' ? (p.career_avg?.toFixed(1) ?? '—') : (p.career_economy?.toFixed(1) ?? '—')}
                    </span>
                  </button>
                ))}
                {(tab === 'batting' ? filteredBat : filteredBowl).length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">No players found</p>
                )}
              </div>
            </div>
          </div>

          {/* Stats panel */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="card flex flex-col items-center justify-center h-64 text-center">
                <TrendingUp size={40} className="text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">Select a player to view their statistics</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Player header */}
                <div className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selected}</h2>
                      <p className="text-sm text-gray-500">{fmt} Statistics</p>
                    </div>
                    <div className="p-2 bg-teal-50 rounded-lg">
                      <Award className="w-5 h-5 text-teal-600" />
                    </div>
                  </div>

                  {selectedBat && (
                    <>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Batting</p>
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        <StatBox label="Career Avg" value={selectedBat.career_avg?.toFixed(1)} />
                        <StatBox label="Career SR"  value={selectedBat.career_sr?.toFixed(1)} />
                        <StatBox label="Form Avg (5)" value={selectedBat.form_avg_short?.toFixed(1)} />
                        <StatBox label="Form SR (5)"  value={selectedBat.form_sr_short?.toFixed(1)} />
                      </div>
                    </>
                  )}

                  {selectedBowl && (
                    <>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bowling</p>
                      <div className="grid grid-cols-4 gap-3">
                        <StatBox label="Wickets"      value={selectedBowl.career_wickets?.toFixed(0)} />
                        <StatBox label="Economy"      value={selectedBowl.career_economy?.toFixed(2)} />
                        <StatBox label="Avg"          value={selectedBowl.career_avg?.toFixed(1)} />
                        <StatBox label="Form Eco (5)" value={selectedBowl.form_eco_short?.toFixed(2)} />
                      </div>
                    </>
                  )}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Profile Radar</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="stat" tick={{ fill: '#6b7280', fontSize: 11 }} />
                        {selectedBat  && <Radar name="Batting" dataKey="bat"  stroke="#0d9488" fill="#0d9488" fillOpacity={0.2} />}
                        {selectedBowl && <Radar name="Bowling" dataKey="bowl" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />}
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {selectedBat && (
                    <div className="card">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">SR by Pitch Type</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={pitchBarData} margin={{ left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="pitch" tick={{ fill: '#6b7280', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                          <Tooltip {...TOOLTIP} />
                          <Bar dataKey="sr" fill="#0d9488" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
