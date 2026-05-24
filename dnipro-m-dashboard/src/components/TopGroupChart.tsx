import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import type { FeedbackRow } from '../types/feedback'
import { groupBy, buildCityAgg, type GroupAgg } from '../lib/metrics'

type Mode = 'rm' | 'tm' | 'city'
type SortBy = 'count' | 'avgNps'

export default function TopGroupChart({ rows }: { rows: FeedbackRow[] }) {
  const [mode, setMode] = useState<Mode>('rm')
  const [sortBy, setSortBy] = useState<SortBy>('count')
  const [limit, setLimit] = useState(10)

  const data = useMemo<GroupAgg[]>(() => {
    let g: GroupAgg[]
    if (mode === 'rm') g = groupBy(rows, 'rm')
    else if (mode === 'tm') g = groupBy(rows, 'tm')
    else g = buildCityAgg(rows)
    return g.sort((a, b) => b[sortBy] - a[sortBy]).slice(0, limit)
  }, [rows, mode, sortBy, limit])

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h3 className="card-title">Рейтинг {mode === 'rm' ? 'регіональних менеджерів' : mode === 'tm' ? 'територіальних менеджерів' : 'міст'}</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            Сортування: {sortBy === 'count' ? 'за к-тю відгуків' : 'за середнім NPS'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-ink-100 rounded-lg p-0.5">
            {([
              ['rm', 'РМ'],
              ['tm', 'ТМ'],
              ['city', 'Міста']
            ] as const).map(([m, l]) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-3 py-1 text-xs rounded-md ${mode === m ? 'bg-white shadow-card' : 'text-ink-500'}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-ink-100 rounded-lg p-0.5">
            <button onClick={() => setSortBy('count')}
              className={`px-3 py-1 text-xs rounded-md ${sortBy === 'count' ? 'bg-white shadow-card' : 'text-ink-500'}`}>
              За об'ємом
            </button>
            <button onClick={() => setSortBy('avgNps')}
              className={`px-3 py-1 text-xs rounded-md ${sortBy === 'avgNps' ? 'bg-white shadow-card' : 'text-ink-500'}`}>
              За NPS
            </button>
          </div>
          <select className="input py-1 text-xs w-auto" value={limit}
            onChange={e => setLimit(+e.target.value)}>
            {[5, 10, 15, 20].map(n => <option key={n} value={n}>Топ {n}</option>)}
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 60, left: 4, bottom: 4 }}>
          <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" width={170}
            tick={{ fontSize: 11, fill: '#404040' }}
            tickLine={false} axisLine={false}
            tickFormatter={v => v.length > 22 ? v.slice(0, 22) + '…' : v} />
          <Tooltip
            contentStyle={{ background: '#0a0a0a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
            formatter={(v: any, n: string) => {
              if (n === sortBy) return [v, sortBy === 'count' ? 'К-ть' : 'NPS']
              return [v, n]
            }}
            labelStyle={{ color: '#a3a3a3' }} />
          <Bar dataKey={sortBy} radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((d, i) => {
              const tone = sortBy === 'avgNps'
                ? (d.avgNps >= 9 ? '#16a34a' : d.avgNps >= 7 ? '#f59e0b' : '#dc2626')
                : (i === 0 ? '#FFD400' : '#0a0a0a')
              return <Cell key={i} fill={tone} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
