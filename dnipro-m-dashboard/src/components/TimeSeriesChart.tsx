import { useMemo, useState } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart
} from 'recharts'
import type { FeedbackRow } from '../types/feedback'
import {
  buildDailySeries, buildWeeklySeries, buildMonthlySeries, buildDailySeriesByGroup
} from '../lib/metrics'
import { useStore } from '../lib/store'

type Granularity = 'day' | 'week' | 'month'
type GroupMode = 'none' | 'rm' | 'tm'

const RM_PALETTE = [
  '#FFD400', '#0a0a0a', '#16a34a', '#dc2626', '#0ea5e9',
  '#a855f7', '#f97316', '#14b8a6', '#ec4899', '#84cc16',
  '#6366f1', '#eab308', '#8b5cf6', '#22c55e', '#f43f5e',
  '#06b6d4', '#a3e635', '#fb923c', '#d946ef', '#65a30d'
]

const MONTHS_UK_SHORT = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру']

/** ISO week key (YYYY-Www) для дати в форматі YYYY-MM-DD. */
function isoWeekKey(ymd: string): string {
  const dt = new Date(ymd + 'T00:00:00Z')
  const dayNum = (dt.getUTCDay() + 6) % 7
  dt.setUTCDate(dt.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((dt.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7)
  return `${dt.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export default function TimeSeriesChart({ rows }: { rows: FeedbackRow[] }) {
  const [gran, setGran] = useState<Granularity>('day')
  const [groupMode, setGroupMode] = useState<GroupMode>('none')
  const { filters } = useStore()

  const allRms = useMemo(
    () => Array.from(new Set(rows.map(r => r.rm).filter(Boolean))).sort(),
    [rows]
  )
  const allTms = useMemo(
    () => Array.from(new Set(rows.map(r => r.tm).filter(Boolean))).sort(),
    [rows]
  )

  // Який ключ і список груп показувати:
  //  1) явний groupMode 'rm'/'tm' → усі РМ/ТМ
  //  2) інакше — пріоритет: ≥2 РМ у фільтрі → РМ; інакше ≥2 ТМ у фільтрі → ТМ
  //  3) інакше — single mode
  let groupKey: 'rm' | 'tm' = 'rm'
  let activeGroups: string[] = []
  if (groupMode === 'rm') { groupKey = 'rm'; activeGroups = allRms }
  else if (groupMode === 'tm') { groupKey = 'tm'; activeGroups = allTms }
  else if (filters.rms.length > 1) { groupKey = 'rm'; activeGroups = filters.rms }
  else if (filters.tms.length > 1) { groupKey = 'tm'; activeGroups = filters.tms }

  const multi = activeGroups.length > 1
  const isAllGroups = groupMode !== 'none'
  const groupLabel = groupKey === 'tm' ? 'ТМ' : 'РМ'

  // --- Single-mode ---
  const daily = useMemo(() => buildDailySeries(rows), [rows])
  const weekly = useMemo(() => buildWeeklySeries(daily), [daily])
  const monthly = useMemo(() => buildMonthlySeries(rows), [rows])
  const singleData = gran === 'day'
    ? daily.map(d => ({ x: d.dateLabel, count: d.count, avgNps: d.avgNps }))
    : gran === 'week'
    ? weekly.map(w => ({ x: w.week.replace(/^\d{4}-/, ''), count: w.count, avgNps: w.avgNps }))
    : monthly.map(m => ({ x: m.label, count: m.count, avgNps: m.avgNps }))

  // --- Multi-mode: окремий line на кожну групу ---
  const multiDaily = useMemo(
    () => multi ? buildDailySeriesByGroup(rows, groupKey, activeGroups) : [],
    [rows, multi, groupKey, activeGroups]
  )
  const multiData = useMemo(() => {
    if (!multi) return []
    if (gran === 'day') return multiDaily
    // згорнути по тижнях/місяцях
    const map = new Map<string, Record<string, number>>()
    const order = new Map<string, string>() // key → display x
    for (const p of multiDaily) {
      const ymd = p.sort as string
      let key: string, x: string
      if (gran === 'week') {
        key = isoWeekKey(ymd)
        x = key.replace(/^\d{4}-/, '')
      } else {
        key = ymd.slice(0, 7) // YYYY-MM
        const [y, m] = key.split('-')
        x = `${MONTHS_UK_SHORT[+m - 1]} ${y.slice(2)}`
      }
      if (!map.has(key)) map.set(key, {})
      order.set(key, x)
      const acc = map.get(key)!
      for (const g of activeGroups) acc[g] = (acc[g] || 0) + (Number(p[g]) || 0)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, acc]) => ({ x: order.get(key) ?? key, sort: key, ...acc }))
  }, [multi, multiDaily, gran, activeGroups])

  const xAxisAngle = gran === 'week' || gran === 'month' ? -20 : 0
  const xAxisHeight = gran === 'week' || gran === 'month' ? 50 : 30

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
        <div>
          <h3 className="card-title">Динаміка в часі</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            {multi
              ? `Кількість відгуків — окрема лінія на кожного з ${activeGroups.length} ${isAllGroups ? groupLabel : `обраних ${groupLabel}`}`
              : 'Кількість відгуків та середній NPS'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={groupMode}
            onChange={e => setGroupMode(e.target.value as GroupMode)}
            className="input py-1 text-xs w-auto"
            title="Розбити динаміку на окремі лінії по РМ або ТМ"
          >
            <option value="none">Без групування</option>
            <option value="rm" disabled={allRms.length < 2}>Усі РМ ({allRms.length})</option>
            <option value="tm" disabled={allTms.length < 2}>Усі ТМ ({allTms.length})</option>
          </select>
          <div className="flex gap-1 bg-ink-100 rounded-lg p-0.5">
            {([
              ['day', 'По днях'],
              ['week', 'По тижнях'],
              ['month', 'По місяцях']
            ] as const).map(([g, lbl]) => (
              <button
                key={g}
                onClick={() => setGran(g)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  gran === g ? 'bg-white text-ink-900 shadow-card' : 'text-ink-500 hover:text-ink-900'
                }`}
              >{lbl}</button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={multi ? 340 : 300}>
        {multi ? (
          <LineChart data={multiData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="x" tickLine={false} axisLine={{ stroke: '#d4d4d4' }}
              angle={xAxisAngle} textAnchor={xAxisAngle ? 'end' : 'middle'} height={xAxisHeight} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#0a0a0a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
              itemStyle={{ color: '#fafafa' }}
              labelStyle={{ color: '#a3a3a3' }}
              itemSorter={(item: any) => -(Number(item.value) || 0)}
            />
            {activeGroups.map((g, i) => (
              <Line
                key={g}
                type="monotone"
                dataKey={g}
                stroke={RM_PALETTE[i % RM_PALETTE.length]}
                strokeWidth={2}
                dot={{ r: 2.5 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        ) : (
          <ComposedChart data={singleData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="gCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0a0a0a" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#0a0a0a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="x" tickLine={false} axisLine={{ stroke: '#d4d4d4' }}
              angle={xAxisAngle} textAnchor={xAxisAngle ? 'end' : 'middle'} height={xAxisHeight} />
            <YAxis yAxisId="left" tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 10]}
              tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#0a0a0a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
              itemStyle={{ color: '#fafafa' }}
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
        )}
      </ResponsiveContainer>

      {/* Скролл-легенда для multi-mode — щоб 37 ТМ не розтягували сторінку */}
      {multi && (
        <div className="mt-3 pt-3 border-t border-ink-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-ink-500 font-medium">
              {activeGroups.length} ліній · прокрути ↓
            </span>
            <span className="text-[10px] text-ink-400">
              Колір збігається з лінією на графіку
            </span>
          </div>
          <div className="max-h-24 overflow-y-auto pr-2 border border-ink-200 rounded-lg p-2 bg-ink-50/40">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-1">
              {activeGroups.map((g, i) => (
                <div
                  key={g}
                  className="flex items-center gap-1.5 text-[11px] text-ink-700 min-w-0"
                  title={g}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ background: RM_PALETTE[i % RM_PALETTE.length] }}
                  />
                  <span className="truncate">{g}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
