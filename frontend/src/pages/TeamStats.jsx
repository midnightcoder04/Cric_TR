import { useState, useEffect } from 'react'
import { api } from '../api/client'
import Spinner from '../components/Spinner'
import { Trophy } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts'

const FLAG = {
  India: '🇮🇳', Australia: '🇦🇺', England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  Pakistan: '🇵🇰', 'South Africa': '🇿🇦', 'New Zealand': '🇳🇿',
  'Sri Lanka': '🇱🇰', Bangladesh: '🇧🇩', 'West Indies': '🌴',
  Zimbabwe: '🇿🇼', Ireland: '🇮🇪',
}

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#b45309', '#14b8a6', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1']

const CHART_TOOLTIP_STYLE = {
  background: '#262626',
  border: '1px solid #404040',
  borderRadius: 8,
  color: '#e5e5e5',
}

export default function TeamStats() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.teamStats()
      .then(d => {
        const sorted = (d || [])
          .filter(t => t.total_matches >= 10)
          .sort((a, b) => b.win_rate - a.win_rate)
          .slice(0, 12)
        setData(sorted)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const chartData = data.map((t, i) => ({
    name: t.team.length > 12 ? t.team.split(' ').map(w => w[0]).join('') : t.team,
    fullName: t.team,
    win_rate: t.win_rate,
    wins: t.wins,
    total: t.total_matches,
    rank: i + 1,
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="text-teal-400" size={22} />
        <h1 className="text-2xl font-bold text-neutral-100">Team Stats & Rankings</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={10} /></div>
      ) : (
        <>
          {/* Top 3 podium */}
          <div className="grid grid-cols-3 gap-4">
            {data.slice(0, 3).map((t, i) => (
              <div
                key={t.team}
                className={`card text-center ${
                  i === 0 ? 'border-amber-500/40 bg-amber-900/10'
                  : i === 1 ? 'border-neutral-400/30 bg-neutral-700/20'
                  : 'border-amber-700/30 bg-amber-950/10'
                }`}
              >
                <div className="text-3xl mb-1">{['🥇', '🥈', '🥉'][i]}</div>
                <div className="text-2xl">{FLAG[t.team] || '🏏'}</div>
                <p className="font-bold text-neutral-100 mt-2">{t.team}</p>
                <p className="text-2xl font-black text-teal-400 mt-1">{t.win_rate}%</p>
                <p className="text-xs text-neutral-400 mt-1">{t.wins} wins / {t.total_matches} matches</p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="card">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Win Rate by Team (min. 10 matches)
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="name" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#a3a3a3', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(val, _, props) => [`${val}%`, props.payload.fullName]}
                  labelFormatter={() => ''}
                />
                <Bar dataKey="win_rate" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="win_rate" position="top" formatter={v => `${v}%`} style={{ fill: '#a3a3a3', fontSize: 11 }} />
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={RANK_COLORS[i % RANK_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Full ranking table */}
          <div className="card">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Full Rankings</p>
            <div className="space-y-2">
              {data.map((t, i) => (
                <div key={t.team} className="flex items-center gap-4 px-3 py-3 rounded-xl bg-neutral-900/50 hover:bg-neutral-900 transition-colors">
                  <span className={`text-lg font-black w-8 text-center ${
                    i === 0 ? 'text-amber-400' : i === 1 ? 'text-neutral-300' : i === 2 ? 'text-amber-600' : 'text-neutral-500'
                  }`}>#{i + 1}</span>
                  <span className="text-xl">{FLAG[t.team] || '🏏'}</span>
                  <span className="flex-1 font-semibold text-neutral-100">{t.team}</span>
                  <div className="text-right">
                    <div className="w-40 bg-neutral-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${t.win_rate}%`, background: RANK_COLORS[i % RANK_COLORS.length] }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-neutral-100 w-12 text-right">{t.win_rate}%</span>
                  <span className="text-xs text-neutral-500 w-24 text-right">{t.wins}W / {t.total_matches}M</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
