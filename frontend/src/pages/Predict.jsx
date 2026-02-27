import { useState, useEffect } from 'react'
import { api } from '../api/client'
import RoleBadge from '../components/RoleBadge'
import Spinner from '../components/Spinner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { Crosshair, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react'

const FORMATS = ['T20', 'ODI', 'Test']
const FMT_KEY = { T20: 't20', ODI: 'odi', Test: 'test' }

const SCORE_COLOR = s =>
  s >= 70 ? '#0d9488' : s >= 50 ? '#3b82f6' : s >= 30 ? '#f59e0b' : '#ef4444'

const TOOLTIP = {
  contentStyle: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#111827' },
}

export default function Predict() {
  const [fmt, setFmt]               = useState('T20')
  const [indiaPlayers, setIndiaPlayers] = useState([])
  const [opponents, setOpponents]   = useState([])
  const [opponent, setOpponent]     = useState('')
  const [oppPlayers, setOppPlayers] = useState([])
  const [venues, setVenues]         = useState([])
  const [venue, setVenue]           = useState('')
  const [pitch, setPitch]           = useState('flat')
  const [battingFirst, setBattingFirst] = useState(true)
  const [result, setResult]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [loadingInit, setLoadingInit] = useState(true)
  const [error, setError]           = useState('')

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

  useEffect(() => {
    api.indiaPlayers(FMT_KEY[fmt]).then(r => setIndiaPlayers(r.players || [])).catch(() => setIndiaPlayers([]))
  }, [fmt])

  useEffect(() => {
    if (!opponent) return
    api.opponentPlayers(opponent).then(r => setOppPlayers(r.players || [])).catch(() => setOppPlayers([]))
  }, [opponent])

  async function handlePredict() {
    if (!venue || !pitch || !opponent) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await api.predict({ format: FMT_KEY[fmt], venue, pitch_type: pitch, batting_first: battingFirst, opponent })
      setResult(res)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  if (loadingInit) return (
    <div className="flex items-center justify-center h-full">
      <Spinner size={10} />
    </div>
  )

  const chartData = result
    ? result.all_players.slice(0, 15).map(p => ({
        name: p.name.split(' ').slice(-1)[0], fullName: p.name, score: p.score, selected: p.selected,
      }))
    : []

  return (
    <div className="p-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Predict Playing XI</h1>
        <p className="text-gray-500 text-sm">Select format, venue and opponent to generate the optimal team</p>
      </div>

      {/* Format tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {FORMATS.map(f => (
          <button key={f} onClick={() => { setFmt(f); setResult(null) }}
            className={`px-5 py-2 rounded-lg text-sm transition-all ${fmt === f ? 'tab-active' : 'tab-inactive'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* India squad */}
        <div className="col-span-3 card-sm space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">🇮🇳 India Squad — {fmt}</p>
          <div className="space-y-0.5 max-h-[480px] overflow-y-auto">
            {indiaPlayers.length === 0
              ? <p className="text-gray-400 text-sm py-4 text-center">No players loaded</p>
              : indiaPlayers.map(p => (
                <div key={p} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{p}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Config */}
        <div className="col-span-5 space-y-4">
          <div className="card-sm space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Match Setup</p>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Venue</label>
              <select value={venue} onChange={e => setVenue(e.target.value)} className="select">
                {venues.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Pitch Type</label>
              <select value={pitch} onChange={e => setPitch(e.target.value)} className="select">
                {['flat', 'spin', 'seam', 'pace', 'balanced'].map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Toss Decision</label>
              <div className="flex gap-2">
                {[true, false].map(v => (
                  <button key={String(v)} onClick={() => setBattingFirst(v)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      battingFirst === v
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {v ? 'Bat First' : 'Bowl First'}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handlePredict} disabled={loading || !venue} className="btn-primary w-full justify-center">
              {loading ? <><Spinner size={4} light /><span>Predicting…</span></> : <><Crosshair size={16} /><span>Run Prediction</span></>}
            </button>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 text-sm">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />{error}
              </div>
            )}
          </div>

          {/* Selected XI result */}
          {result && (
            <div className="card-sm space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-teal-600" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Selected XI — Impact: {result.total_score}
                </p>
              </div>
              <div className="space-y-1">
                {result.selected_xi.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-teal-50 border border-teal-100">
                    <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800">{p.name}</span>
                    <RoleBadge role={p.role} />
                    <span className="text-sm font-bold w-8 text-right" style={{ color: SCORE_COLOR(p.score) }}>{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Opponent */}
        <div className="col-span-4 space-y-4">
          <div className="card-sm space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Opponent</p>
            <div className="grid grid-cols-2 gap-1.5">
              {opponents.map(c => (
                <button key={c} onClick={() => { setOpponent(c); setResult(null) }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium text-left border transition-colors ${
                    opponent === c
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {opponent && (
            <div className="card-sm space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{opponent} Squad</p>
              <div className="space-y-0.5 max-h-[280px] overflow-y-auto">
                {oppPlayers.map(p => (
                  <div key={p} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{p}</span>
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
          <p className="text-sm font-semibold text-gray-700">Squad Impact Scores — Top 15</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip {...TOOLTIP} formatter={(v, _, p) => [v, p.payload.fullName]} labelFormatter={() => ''} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((e, i) => (
                  <Cell key={i} fill={e.selected ? '#0d9488' : '#93c5fd'} opacity={e.selected ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-600 inline-block" /> Selected XI</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-300 inline-block" /> Not selected</span>
          </div>
        </div>
      )}

      {/* Full table */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Full Squad Rankings</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Player</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Range</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.all_players.map((p, i) => (
                  <tr key={p.name} className={`hover:bg-gray-50 transition ${p.selected ? 'bg-teal-50/50' : ''}`}>
                    <td className="px-6 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-6 py-3"><RoleBadge role={p.role} /></td>
                    <td className="px-6 py-3 text-right font-bold" style={{ color: SCORE_COLOR(p.score) }}>{p.score}</td>
                    <td className="px-6 py-3 text-right text-gray-400 text-xs">{p.confidence_lo}–{p.confidence_hi}</td>
                    <td className="px-6 py-3 text-center">
                      {p.selected && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                          ✓ XI
                        </span>
                      )}
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
