import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { FeedbackRow } from '../types/feedback'
import { buildWeekdayDist } from '../lib/metrics'

export default function WeekdayChart({ rows }: { rows: FeedbackRow[] }) {
  const data = useMemo(() => buildWeekdayDist(rows), [rows])
  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="card p-5">
      <h3 className="card-title">По днях тижня</h3>
      <p className="text-xs text-ink-500 mt-0.5 mb-3">Коли клієнти найчастіше залишають відгуки</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="dayShort" tickLine={false} axisLine={{ stroke: '#d4d4d4' }} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#0a0a0a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
            labelFormatter={(_: any, p: any) => p?.[0]?.payload?.day ?? ''}
            formatter={(v: any) => [v, 'К-ть відгуків'] as [any, string]} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i}
                fill={d.count === max ? '#FFD400' : '#0a0a0a'}
                opacity={d.count === max ? 1 : 0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 text-[11px] text-ink-500 grid grid-cols-7 gap-1">
        {data.map(d => (
          <div key={d.idx} className="text-center num">
            NPS <span className="text-ink-700 font-semibold">{d.avgNps || '–'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
