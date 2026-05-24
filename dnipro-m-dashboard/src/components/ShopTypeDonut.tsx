import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { FeedbackRow, ShopType } from '../types/feedback'
import { buildShopTypeDist, buildContactBackDist } from '../lib/metrics'
import { useStore, multiToggle } from '../lib/store'

const COLORS_SHOP: Record<string, string> = {
  'ФМ': '#0a0a0a',
  'ФФМ': '#FFD400',
  'Невідомо': '#d4d4d4'
}
const COLORS_CONTACT = ['#FFD400', '#e5e5e5']

interface DonutDatum { name: string; value: number; avgNps?: number }

function Donut({
  title, subtitle, data, colors, activeNames, onSliceClick
}: {
  title: string
  subtitle?: string
  data: DonutDatum[]
  colors: string[] | ((name: string) => string)
  activeNames?: string[]
  onSliceClick?: (name: string, shift: boolean) => void
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const isActive = (name: string) => activeNames?.includes(name) ?? false
  const hasActive = (activeNames?.length ?? 0) > 0
  const colorOf = (name: string, fallbackIdx: number) =>
    typeof colors === 'function' ? colors(name) : colors[fallbackIdx % colors.length]

  return (
    <div className="card p-5">
      <h3 className="card-title">{title}</h3>
      <p className="text-xs text-ink-500 mt-0.5">
        {subtitle}
        {onSliceClick && (
          <span className="ml-2 text-ink-400">· клік = фільтр, Shift+клік = додати</span>
        )}
      </p>
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
              cursor={onSliceClick ? 'pointer' : 'default'}
              onClick={(d: any, _i: number, e: any) => {
                if (!onSliceClick) return
                const name = d?.name ?? d?.payload?.name
                const shift = !!(e?.shiftKey || (e?.nativeEvent && e.nativeEvent.shiftKey))
                if (name) onSliceClick(name, shift)
              }}
            >
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={colorOf(d.name, i)}
                  opacity={hasActive && !isActive(d.name) ? 0.3 : 1}
                  stroke={isActive(d.name) ? '#0a0a0a' : 'none'}
                  strokeWidth={isActive(d.name) ? 2 : 0}
                />
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
        {data.map((d, i) => {
          const pct = total ? ((d.value / total) * 100) : 0
          const color = colorOf(d.name, i)
          const active = isActive(d.name)
          return (
            <div
              key={d.name}
              onClick={(e) => onSliceClick && onSliceClick(d.name, e.shiftKey)}
              className={`flex items-center justify-between text-sm rounded px-1.5 py-0.5 transition-colors ${
                onSliceClick ? 'cursor-pointer hover:bg-ink-50' : ''
              } ${active ? 'bg-accent-soft' : ''} ${hasActive && !active ? 'opacity-50' : ''}`}
              title={onSliceClick ? `Клік: тільки «${d.name}». Shift+клік: мульти-вибір.` : undefined}
            >
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
  const { filters, setFilters } = useStore()
  return (
    <Donut
      title="ФМ vs ФФМ"
      subtitle="Розподіл відгуків по типу точки"
      data={data}
      colors={(name) => COLORS_SHOP[name] ?? '#a3a3a3'}
      activeNames={filters.shopTypes}
      onSliceClick={(name, shift) => {
        const next = multiToggle(filters.shopTypes, name as ShopType, shift)
        setFilters({ shopTypes: next })
      }}
    />
  )
}

export function ContactBackDonut({ rows }: { rows: FeedbackRow[] }) {
  const data = useMemo(() => buildContactBackDist(rows), [rows])
  const { filters, setFilters } = useStore()

  // Маппимо назву сегмента в статус
  const nameToStatus = (name: string): 'yes' | 'no' =>
    name.toLowerCase().includes('так') ? 'yes' : 'no'
  const statusToName = (s: 'yes' | 'no') =>
    s === 'yes' ? "Так, зв'язуйтесь" : 'Не зазначено'

  const activeNames = filters.contactBackStatus === 'all' ? [] : [statusToName(filters.contactBackStatus)]

  return (
    <Donut
      title="Запит на зворотний зв'язок (Radio)"
      subtitle="Хто просив, щоб з ними зв'язалися"
      data={data}
      colors={COLORS_CONTACT}
      activeNames={activeNames}
      onSliceClick={(name) => {
        // Для donut з 2 сегментів shift не має сенсу — просто toggle.
        const target = nameToStatus(name)
        setFilters({
          contactBackStatus: filters.contactBackStatus === target ? 'all' : target
        })
      }}
    />
  )
}
