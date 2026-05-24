import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { FeedbackRow } from '../types/feedback'
import { buildShopTypeDist, buildContactBackDist } from '../lib/metrics'

const COLORS_SHOP: Record<string, string> = {
  'ФМ': '#0a0a0a',
  'ФФМ': '#FFD400',
  'Невідомо': '#d4d4d4'
}
const COLORS_CONTACT = ['#FFD400', '#e5e5e5']

function Donut({
  title, data, colors, totalLabel
}: {
  title: string
  data: { name: string; value: number; avgNps?: number }[]
  colors: string[] | ((name: string) => string)
  totalLabel?: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="card p-5">
      <h3 className="card-title">{title}</h3>
      {totalLabel && <p className="text-xs text-ink-500 mt-0.5">{totalLabel}</p>}
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d, i) => (
                <Cell key={i}
                  fill={typeof colors === 'function' ? colors(d.name) : colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#0a0a0a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
              itemStyle={{ color: '#fafafa' }}
              labelStyle={{ color: '#a3a3a3' }}
              formatter={(v: any, _n, p: any) => {
                const pct = total ? ((v / total) * 100).toFixed(1) : '0'
                return [`${v} (${pct}%)`, p.payload.name]
              }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="font-display text-2xl font-semibold num">{total.toLocaleString('uk-UA')}</div>
          <div className="text-[10px] uppercase tracking-wider text-ink-500">усього</div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {data.map(d => {
          const pct = total ? ((d.value / total) * 100) : 0
          const color = typeof colors === 'function' ? colors(d.name) : colors[data.indexOf(d) % colors.length]
          return (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span className="text-ink-700">{d.name}</span>
              </span>
              <span className="num text-ink-900 font-medium">
                {d.value.toLocaleString('uk-UA')}
                <span className="text-ink-500 font-normal ml-1.5">{pct.toFixed(1)}%</span>
                {d.avgNps !== undefined && (
                  <span className="text-[11px] text-ink-500 ml-2">NPS {d.avgNps}</span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ShopTypeDonut({ rows }: { rows: FeedbackRow[] }) {
  const data = useMemo(() => buildShopTypeDist(rows), [rows])
  return (
    <Donut
      title="ФМ vs ФФМ"
      totalLabel="Розподіл відгуків по типу точки"
      data={data}
      colors={(name) => COLORS_SHOP[name] ?? '#a3a3a3'}
    />
  )
}

export function ContactBackDonut({ rows }: { rows: FeedbackRow[] }) {
  const data = useMemo(() => buildContactBackDist(rows), [rows])
  return (
    <Donut
      title="Запит на зворотний зв'язок"
      totalLabel="Хто просив, щоб з ними зв'язалися"
      data={data}
      colors={COLORS_CONTACT}
    />
  )
}
