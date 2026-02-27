import { useState, useEffect } from 'react'
import { api } from '../api/client'
import Spinner from '../components/Spinner'
import { BarChart2, Search } from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

const FORMATS = ['T20', 'ODI', 'Test']

const CHART_TOOLTIP_STYLE = {
  background: '#262626',
  border: '1px solid #404040',
  borderRadius: 8,
  color: '#e5e5e5',
}

function StatCard({ label, value, unit = '' }) {
  return (
    <div className="bg-neutral-700/40 rounded-xl p-3 text-center">
      <p className="text-2xl font-bold text-neutral-100">
        {value ?? '—'}
        <span className="text-sm text-neutral-400 ml-1">{unit}</span>
      </p>
      <p className="text-xs text-neutral-400 mt-1">{label}</p>
    </div>
  )
}

export default function PlayerStats() {
  const [fmt, setFmt] = useState('T20')
  const [batting, setBatting] = useState([])
  const [bowling, setBowling] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('batting')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setSelected(null)
      try {
        const [batRes, bowlRes] = await Promise.all([
          api.battingStats(fmt.toLowerCase()),
          api.bowlingStats(fmt.toLowerCase()),
        ])
        setBatting(batRes || [])
        setBowling(bowlRes || [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [fmt])

  const filteredBat = batting.filter(p =>
    p.player?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredBowl = bowling.filter(p =>
    p.player?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedBat  = batting.find(p => p.player === selected)
  const selectedBowl = bowling.find(p => p.player === selected)

  const radarData = selected ? [
    { stat: 'Avg', bat: selectedBat?.career_avg ?? 0, bowl: 100 - Math.min((selectedBowl?.career_avg ?? 100), 100) },
    { stat: 'SR/Eco', bat: Math.min((selectedBat?.career_sr ?? 0) / 2, 100), bowl: Math.max(100 - (selectedBowl?.career_economy ?? 10) * 10, 0) },
    { stat: 'Form', bat: Math.min((selectedBat?.form_sr_short ?? 0) / 2, 100), bowl: Math.max(100 - (selectedBowl?.form_eco_short ?? 10) * 10, 0) },
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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart2 className="text-teal-400" size={22} />
        <h1 className="text-2xl font-bold text-neutral-100">Player Stats</h1>
      </div>

      {/* Format tabs */}
      <div className="flex gap-1 bg-neutral-900 p-1 rounded-xl w-fit">
        {FORMATS.map(f => (
          <button key={f} onClick={() => setFmt(f)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${fmt === f ? 'tab-active shadow' : 'tab-inactive'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={10} /></div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {/* Player list */}
          <div className="col-span-4 card space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                className="input pl-8 text-sm"
                placeholder="Search player…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Sub-tab */}
            <div className="flex gap-1 bg-neutral-900/50 p-0.5 rounded-lg">
              {['batting', 'bowling'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    tab === t
                      ? 'bg-neutral-700 text-neutral-100'
                      : 'text-neutral-400 hover:text-neutral-300'
                  }`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {(tab === 'batting' ? filteredBat : filteredBowl).map(p => (
                <button
                  key={p.player}
                  onClick={() => setSelected(p.player)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selected === p.player
                      ? 'bg-teal-600/20 border border-teal-600/30'
                      : 'hover:bg-neutral-700/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-200 truncate">{p.player}</p>
                    <p className="text-xs text-neutral-500">{p.total_innings} innings</p>
                  </div>
                  <span className="text-sm font-bold text-teal-400">
                    {tab === 'batting'
                      ? (p.career_avg?.toFixed(1) ?? '—')
                      : (p.career_economy?.toFixed(1) ?? '—')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats panel */}
          <div className="col-span-8 space-y-4">
            {!selected ? (
              <div className="card flex flex-col items-center justify-center h-64 text-neutral-500">
                <BarChart2 size={40} className="mb-3 opacity-30" />
                <p>Select a player to view their statistics</p>
              </div>
            ) : (
              <>
                <div className="card">
                  <h2 className="text-lg font-bold text-neutral-100 mb-4">{selected} — {fmt}</h2>

                  {selectedBat && (
                    <>
                      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Batting</p>
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        <StatCard label="Career Avg" value={selectedBat.career_avg?.toFixed(1)} />
                        <StatCard label="Career SR" value={selectedBat.career_sr?.toFixed(1)} />
                        <StatCard label="Form Avg (5)" value={selectedBat.form_avg_short?.toFixed(1)} />
                        <StatCard label="Form SR (5)" value={selectedBat.form_sr_short?.toFixed(1)} />
                      </div>
                    </>
                  )}

                  {selectedBowl && (
                    <>
                      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Bowling</p>
                      <div className="grid grid-cols-4 gap-3">
                        <StatCard label="Wickets" value={selectedBowl.career_wickets?.toFixed(0)} />
                        <StatCard label="Economy" value={selectedBowl.career_economy?.toFixed(2)} />
                        <StatCard label="Avg" value={selectedBowl.career_avg?.toFixed(1)} />
                        <StatCard label="Form Eco (5)" value={selectedBowl.form_eco_short?.toFixed(2)} />
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Radar */}
                  <div className="card">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Profile Radar</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#404040" />
                        <PolarAngleAxis dataKey="stat" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
                        {selectedBat && <Radar name="Batting" dataKey="bat" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.25} />}
                        {selectedBowl && <Radar name="Bowling" dataKey="bowl" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />}
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pitch SR */}
                  {selectedBat && (
                    <div className="card">
                      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Batting SR by Pitch</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={pitchBarData} margin={{ left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                          <XAxis dataKey="pitch" tick={{ fill: '#a3a3a3', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#a3a3a3', fontSize: 10 }} />
                          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                          <Bar dataKey="sr" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
