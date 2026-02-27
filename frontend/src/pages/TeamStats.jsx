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

const RANK_COLORS = [
  '#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899',
  '#14b8a6', '#6366f1', '#f97316', '#10b981', '#ef4444',
]

const TOOLTIP = {
  contentStyle: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#111827' },
}

export default function TeamStats() {
  const [data, setData]       = useState([])
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
  }))

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Team Stats &amp; Rankings</h1>
        <p className="text-gray-500 text-sm">Win rates and performance across all international teams</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Spinner size={10} /></div>
      ) : (
        <>
          {/* Podium — top 3 */}
          <div className="grid grid-cols-3 gap-4">
            {data.slice(0, 3).map((t, i) => (
              <div key={t.team} className={`card text-center ${
                i === 0 ? 'border-amber-300 bg-amber-50'
                : i === 1 ? 'border-gray-300 bg-gray-50'
                : 'border-orange-200 bg-orange-50'
              }`}>
                <div className="text-3xl mb-1">{['🥇', '🥈', '🥉'][i]}</div>
                <div className="text-2xl">{FLAG[t.team] || '🏏'}</div>
                <p className="font-bold text-gray-900 mt-2 text-sm">{t.team}</p>
                <p className="text-2xl font-black text-teal-600 mt-1">{t.win_rate}%</p>
                <p className="text-xs text-gray-500 mt-1">{t.wins}W / {t.total_matches}M</p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="card">
            <p className="text-sm font-semibold text-gray-700 mb-4">Win Rate by Team (min. 10 matches)</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} unit="%" />
                <Tooltip {...TOOLTIP} formatter={(v, _, p) => [`${v}%`, p.payload.fullName]} labelFormatter={() => ''} />
                <Bar dataKey="win_rate" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="win_rate" position="top" formatter={v => `${v}%`} style={{ fill: '#6b7280', fontSize: 11 }} />
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={RANK_COLORS[i % RANK_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rankings table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Full Rankings</p>
            </div>
            <div className="divide-y divide-gray-100">
              {data.map((t, i) => (
                <div key={t.team} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <span className={`text-sm font-black w-6 text-center ${
                    i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-500' : 'text-gray-300'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-lg">{FLAG[t.team] || '🏏'}</span>
                  <span className="flex-1 font-medium text-gray-800 text-sm">{t.team}</span>
                  <div className="w-32">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${t.win_rate}%`, background: RANK_COLORS[i % RANK_COLORS.length] }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-800 w-10 text-right">{t.win_rate}%</span>
                  <span className="text-xs text-gray-400 w-20 text-right">{t.wins}W / {t.total_matches}M</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
