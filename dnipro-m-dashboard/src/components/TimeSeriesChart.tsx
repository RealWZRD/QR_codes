import { useMemo, useState } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import type { FeedbackRow } from '../types/feedback'
import { buildDailySeries, buildWeeklySeries } from '../lib/metrics'

type Granularity = 'day' | 'week'

export default function TimeSeriesChart({ rows }: { rows: FeedbackRow[] }) {
  const [gran, setGran] = useState<Granularity>('day')
  const daily = useMemo(() => buildDailySeries(rows), [rows])
  const weekly = useMemo(() => buildWeeklySeries(daily), [daily])

  const data = gran === 'day'
    ? daily.map(d => ({ x: d.dateLabel, count: d.count, avgNps: d.avgNps }))
    : weekly.map(w => ({ x: w.week.replace(/^\d{4}-/, ''), count: w.count, avgNps: w.avgNps }))

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
        <div>
          <h3 className="card-title">Динаміка в часі</h3>
          <p className="text-xs text-ink-500 mt-0.5">Кількість відгуків та середній NPS</p>
        </div>
        <div className="flex gap-1 bg-ink-100 rounded-lg p-0.5">
          {(['day', 'week'] as const).map(g => (
            <button
              key={g}
              onClick={() => setGran(g)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                gran === g ? 'bg-white text-ink-900 shadow-card' : 'text-ink-500 hover:text-ink-900'
              }`}
            >{g === 'day' ? 'По днях' : 'По тижнях'}</button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="gCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a0a0a" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#0a0a0a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="x" tickLine={false} axisLine={{ stroke: '#d4d4d4' }} />
          <YAxis yAxisId="left" tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 10]}
            tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: '#0a0a0a', border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 12
            }}
            labelStyle={{ color: '#a3a3a3' }}
            formatter={(v: any, n: string) =>
              [v, n === 'count' ? 'К-ть відгуків' : 'Середній NPS']
            }
          />
          <Legend wrapperStyle={{ paddingTop: 8 }}
            formatter={(v) => v === 'count' ? 'К-ть відгуків' : 'Середній NPS'} />
          <Area yAxisId="left" type="monotone" dataKey="count"
            stroke="#0a0a0a" strokeWidth={1.5} fill="url(#gCount)" />
          <Line yAxisId="right" type="monotone" dataKey="avgNps"
            stroke="#FFD400" strokeWidth={2.5}
            dot={{ r: 3, fill: '#FFD400', stroke: '#0a0a0a', strokeWidth: 1 }}
            activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
