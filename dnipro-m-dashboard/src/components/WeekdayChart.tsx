import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts'
import { ArrowDownWideNarrow, RotateCcw } from 'lucide-react'
import type { FeedbackRow } from '../types/feedback'
import { buildWeekdayDist } from '../lib/metrics'
import { useStore } from '../lib/store'

export default function WeekdayChart({ rows }: { rows: FeedbackRow[] }) {
  const [sortByCount, setSortByCount] = useState(false)
  const { filters, setFilters } = useStore()

  const base = useMemo(() => buildWeekdayDist(rows), [rows])
  const data = useMemo(
    () => sortByCount ? [...base].sort((a, b) => b.count - a.count) : base,
    [base, sortByCount]
  )

  const max = Math.max(...data.map(d => d.count), 1)

  // weekdayIdx за getUTCDay (0=Нд, 1=Пн, ..., 6=Сб) — у buildWeekdayDist idx 0..6 — це Пн..Нд,
  // отже мапимо назад до getUTCDay:
  const idxToUtcDay = [1, 2, 3, 4, 5, 6, 0]

  const toggleWeekday = (idx: number) => {
    const utcDay = idxToUtcDay[idx]
    setFilters({ weekday: filters.weekday === utcDay ? null : utcDay })
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="card-title">По днях тижня</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            Коли клієнти найчастіше залишають відгуки
            {filters.weekday !== null && (
              <span className="ml-2 text-ink-900 font-medium">
                · фільтр активний (натисни знову, щоб скинути)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setSortByCount(v => !v)}
          className={`btn-ghost text-xs ${sortByCount ? 'bg-ink-100 text-ink-900' : ''}`}
          title={sortByCount ? 'Повернути порядок ПН → НД' : 'Сортувати від більшого до меншого'}
        >
          {sortByCount ? <><RotateCcw size={13} /> Порядок ПН → НД</> : <><ArrowDownWideNarrow size={13} /> Сортувати</>}
        </button>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="dayShort" tickLine={false} axisLine={{ stroke: '#d4d4d4' }} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            contentStyle={{ background: '#0a0a0a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
            itemStyle={{ color: '#fafafa' }}
            labelStyle={{ color: '#a3a3a3' }}
            labelFormatter={(_: any, p: any) => p?.[0]?.payload?.day ?? ''}
            formatter={(v: any, _n, p: any) => [`${v} відгуків · NPS ${p.payload.avgNps || '–'}`, 'Підсумок'] as [any, string]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} onClick={(_d, i) => toggleWeekday(i)} cursor="pointer">
            {data.map((d, i) => {
              const isActive = filters.weekday === idxToUtcDay[d.idx]
              const isMax = d.count === max && !filters.weekday
              const fill = isActive ? '#FFD400' : (isMax ? '#FFD400' : '#0a0a0a')
              const opacity = filters.weekday !== null && !isActive ? 0.35 : (isMax ? 1 : 0.9)
              return <Cell key={i} fill={fill} opacity={opacity} />
            })}
            <LabelList
              dataKey="count"
              position="top"
              style={{ fill: '#111111', fontSize: 12, fontWeight: 600 }}
              formatter={(v: any) => v ? v.toLocaleString('uk-UA') : ''}
            />
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
