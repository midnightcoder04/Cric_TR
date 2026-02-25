import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import RoleBadge from '../components/RoleBadge'
import Spinner from '../components/Spinner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { Crosshair, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react'

const FORMATS = ['T20', 'ODI', 'Test']
const FMT_KEY = { T20: 't20', ODI: 'odi', Test: 'test' }

const SCORE_COLOR = (s) => {
  if (s >= 70) return '#22c55e'
  if (s >= 50) return '#3b82f6'
  if (s >= 30) return '#f59e0b'
  return '#ef4444'
}

export default function Predict() {
  const [fmt, setFmt] = useState('T20')
  const [indiaPlayers, setIndiaPlayers] = useState([])
  const [opponents, setOpponents] = useState([])
  const [opponent, setOpponent] = useState('')
  const [oppPlayers, setOppPlayers] = useState([])
  const [venues, setVenues] = useState([])
  const [venue, setVenue] = useState('')
  const [pitch, setPitch] = useState('flat')
  const [battingFirst, setBattingFirst] = useState(true)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingInit, setLoadingInit] = useState(true)
  const [error, setError] = useState('')

  // Load static data once
  useEffect(() => {
    async function init() {
      try {
        const [oppsRes, venuesRes] = await Promise.all([api.opponents(), api.venues()])
        setOpponents(oppsRes.opponents || [])
        setVenues(venuesRes.venues || [])
        if (oppsRes.opponents?.length) setOpponent(oppsRes.opponents[0])
        if (venuesRes.venues?.length) setVenue(venuesRes.venues[0])
      } catch {}
      setLoadingInit(false)
    }
    init()
  }, [])

  // Load India squad when format changes
  useEffect(() => {
    api.indiaPlayers(FMT_KEY[fmt])
      .then(r => setIndiaPlayers(r.players || []))
      .catch(() => setIndiaPlayers([]))
  }, [fmt])

  // Load opponent players when opponent changes
  useEffect(() => {
    if (!opponent) return
    api.opponentPlayers(opponent)
      .then(r => setOppPlayers(r.players || []))
      .catch(() => setOppPlayers([]))
  }, [opponent])

  async function handlePredict() {
    if (!venue || !pitch || !opponent) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await api.predict({
        format: FMT_KEY[fmt],
        venue,
        pitch_type: pitch,
        batting_first: battingFirst,
        opponent,
      })
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size={10} />
      </div>
    )
  }

  const chartData = result
    ? result.all_players.slice(0, 15).map(p => ({
        name: p.name.split(' ').slice(-1)[0],
        fullName: p.name,
        score: p.score,
        selected: p.selected,
      }))
    : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Crosshair className="text-pitch-400" size={22} />
        <h1 className="text-2xl font-bold text-white">Predict Playing XI</h1>
      </div>

      {/* Format tabs */}
      <div className="flex gap-1 bg-slate-900 p-1 rounded-xl w-fit">
        {FORMATS.map(f => (
          <button
            key={f}
            onClick={() => { setFmt(f); setResult(null) }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              fmt === f ? 'tab-active shadow' : 'tab-inactive'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* India squad */}
        <div className="col-span-3 card space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            🇮🇳 India Squad — {fmt}
          </p>
          <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
            {indiaPlayers.length === 0 ? (
              <p className="text-slate-500 text-sm">No players loaded</p>
            ) : indiaPlayers.map(p => (
              <div key={p} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-pitch-500 flex-shrink-0" />
                <span className="text-sm text-slate-200">{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Config */}
        <div className="col-span-5 space-y-4">
          <div className="card space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Match Setup</p>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Venue</label>
              <div className="relative">
                <select
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  className="select pr-8"
                >
                  {venues.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Pitch Type</label>
              <select value={pitch} onChange={e => setPitch(e.target.value)} className="select">
                {['flat', 'spin', 'seam', 'pace', 'balanced'].map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Toss Decision</label>
              <div className="flex gap-2">
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    onClick={() => setBattingFirst(v)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      battingFirst === v
                        ? 'bg-pitch-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {v ? 'Bat First' : 'Bowl First'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePredict}
              disabled={loading || !venue}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner size={4} />
                  <span>Predicting…</span>
                </>
              ) : (
                <>
                  <Crosshair size={16} />
                  <span>Run Prediction</span>
                </>
              )}
            </button>

            {error && (
              <div className="flex items-start gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 text-red-300 text-sm">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Results: Selected XI */}
          {result && (
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-pitch-400" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Selected XI — Total Impact: {result.total_score}
                </p>
              </div>
              <div className="space-y-1.5">
                {result.selected_xi.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 px-2 py-2 rounded-lg bg-pitch-950/30 border border-pitch-800/30">
                    <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium text-slate-100">{p.name}</span>
                    <RoleBadge role={p.role} />
                    <span
                      className="text-sm font-bold w-10 text-right"
                      style={{ color: SCORE_COLOR(p.score) }}
                    >
                      {p.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Opponent */}
        <div className="col-span-4 space-y-4">
          <div className="card space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Opponent</p>
            <div className="grid grid-cols-2 gap-2">
              {opponents.map(c => (
                <button
                  key={c}
                  onClick={() => { setOpponent(c); setResult(null) }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                    opponent === c
                      ? 'bg-blue-600/30 border border-blue-500/50 text-blue-300'
                      : 'bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Opponent squad */}
          {opponent && (
            <div className="card space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {opponent} Players
              </p>
              <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                {oppPlayers.map(p => (
                  <div key={p} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-700/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-sm text-slate-200">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {result && (
        <div className="card space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Squad Impact Scores — Top 15
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={(val, _, props) => [val, props.payload.fullName]}
                labelFormatter={() => ''}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.selected ? '#22c55e' : '#3b82f6'} opacity={entry.selected ? 1 : 0.5} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-pitch-500 inline-block" /> Selected XI</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 opacity-50 inline-block" /> Not selected</span>
          </div>
        </div>
      )}

      {/* Full squad table */}
      {result && (
        <div className="card space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Squad Rankings</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-700">
                  <th className="text-left pb-2 w-8">#</th>
                  <th className="text-left pb-2">Player</th>
                  <th className="text-left pb-2">Role</th>
                  <th className="text-right pb-2">Score</th>
                  <th className="text-right pb-2">Range</th>
                  <th className="text-center pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.all_players.map((p, i) => (
                  <tr key={p.name} className={`border-b border-slate-800/50 ${p.selected ? 'bg-pitch-900/10' : ''}`}>
                    <td className="py-2 text-slate-500">{i + 1}</td>
                    <td className="py-2 font-medium text-slate-200">{p.name}</td>
                    <td className="py-2"><RoleBadge role={p.role} /></td>
                    <td className="py-2 text-right font-bold" style={{ color: SCORE_COLOR(p.score) }}>{p.score}</td>
                    <td className="py-2 text-right text-slate-500 text-xs">{p.confidence_lo}–{p.confidence_hi}</td>
                    <td className="py-2 text-center">
                      {p.selected && <span className="text-xs text-pitch-400 font-semibold">✓ XI</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
