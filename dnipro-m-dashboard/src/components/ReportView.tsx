import { useMemo, useState } from 'react'
import type { FeedbackRow } from '../types/feedback'
import { buildDailySeries, buildWeeklySeries, buildMonthlySeries } from '../lib/metrics'
import { useStore, multiToggle } from '../lib/store'
import { TrendingUp, TrendingDown, Minus, MapPin } from 'lucide-react'

interface ReportRow {
  label: string
  count: number
  avgNps: number
  promoters: number
  detractors: number
  contactBack: number
  npsScore: number // (prom - det) / count * 100
}

/** Зміна vs попередній рядок (нижчий індекс — старіший). higherIsBetter керує семантикою кольору. */
function Delta({ curr, prev, kind = 'count', precision = 0 }: {
  curr: number; prev: number | null; kind?: 'count' | 'nps' | 'score'; precision?: number
}) {
  if (prev === null || prev === undefined) {
    return <span className="text-ink-300 num">—</span>
  }
  const diff = curr - prev
  if (diff === 0) {
    return <span className="text-ink-400 num inline-flex items-center gap-1"><Minus size={11} /> 0</span>
  }
  const up = diff > 0
  // higherIsBetter: для count і score — так; для nps — так.
  const good = up
  const cls = good
    ? 'text-emerald-700 bg-emerald-50'
    : 'text-red-700 bg-red-50'
  const Icon = up ? TrendingUp : TrendingDown
  const absStr = kind === 'nps' ? Math.abs(diff).toFixed(precision || 2)
              : kind === 'score' ? Math.abs(diff).toFixed(precision || 1)
              : Math.abs(diff).toLocaleString('uk-UA')
  // Відсоткова зміна — лише для count і має сенс при prev > 0
  let pct: string | null = null
  if ((kind === 'count' || kind === 'score') && prev > 0) {
    pct = ((diff / Math.abs(prev)) * 100).toFixed(1)
  }
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded num text-xs font-medium ${cls}`}>
      <Icon size={11} />
      {up ? '+' : '−'}{absStr}
      {pct !== null && <span className="opacity-70 ml-0.5">({up ? '+' : ''}{pct}%)</span>}
    </span>
  )
}

function ReportTable({ title, subtitle, data }: { title: string; subtitle: string; data: ReportRow[] }) {
  // Малюємо від нових до старих — найсвіжіший зверху
  const ordered = [...data].reverse()
  // Для дельти попередній період — це data[i-1] у вихідному (хронологічному) порядку,
  // тобто рядок одразу ПІД поточним у reversed-таблиці.
  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-ink-200">
        <h3 className="card-title">{title}</h3>
        <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>
      </div>
      {data.length === 0 ? (
        <div className="p-8 text-center text-sm text-ink-400">Немає даних за обраними фільтрами</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-[11px] uppercase tracking-wider text-ink-500">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Період</th>
                <th className="text-right px-3 py-2.5 font-medium">К-ть</th>
                <th className="text-right px-3 py-2.5 font-medium">Δ vs попер.</th>
                <th className="text-right px-3 py-2.5 font-medium">Сер. NPS</th>
                <th className="text-right px-3 py-2.5 font-medium">Δ NPS</th>
                <th className="text-right px-3 py-2.5 font-medium">NPS Score</th>
                <th className="text-right px-3 py-2.5 font-medium">Δ Score</th>
                <th className="text-right px-4 py-2.5 font-medium">Пром / Детр</th>
                <th className="text-right px-4 py-2.5 font-medium">Зв'яза&shy;тись</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((row, i) => {
                // prev у хронології = ordered[i+1]
                const prev: ReportRow | null = ordered[i + 1] ?? null
                return (
                  <tr key={row.label} className="border-t border-ink-100 hover:bg-ink-50/60">
                    <td className="px-4 py-2.5 font-medium text-ink-900">{row.label}</td>
                    <td className="px-3 py-2.5 text-right num text-ink-900">{row.count.toLocaleString('uk-UA')}</td>
                    <td className="px-3 py-2.5 text-right"><Delta curr={row.count} prev={prev?.count ?? null} kind="count" /></td>
                    <td className="px-3 py-2.5 text-right num text-ink-700">{row.avgNps.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right"><Delta curr={row.avgNps} prev={prev?.avgNps ?? null} kind="nps" precision={2} /></td>
                    <td className="px-3 py-2.5 text-right num text-ink-700">{row.npsScore.toFixed(0)}</td>
                    <td className="px-3 py-2.5 text-right"><Delta curr={row.npsScore} prev={prev?.npsScore ?? null} kind="score" precision={0} /></td>
                    <td className="px-4 py-2.5 text-right num text-xs text-ink-500">
                      <span className="text-emerald-700">{row.promoters}</span>
                      {' / '}
                      <span className="text-red-700">{row.detractors}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right num text-xs text-ink-500">{row.contactBack}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function toReportRow(x: {
  count: number; avgNps: number; promoters: number; detractors: number; contactBack: number
}): Omit<ReportRow, 'label'> {
  const score = x.count ? ((x.promoters - x.detractors) / x.count) * 100 : 0
  return { ...x, npsScore: score }
}

interface LocationRow {
  location: string
  count: number
  avgNps: number
  avgRating: number
  promoters: number
  detractors: number
  contactBack: number
}

function buildLocationAgg(rows: FeedbackRow[]): LocationRow[] {
  const m = new Map<string, { nps: number; rat: number; n: number; p: number; d: number; cb: number }>()
  for (const r of rows) {
    const key = r.location.trim()
    if (!key) continue
    if (!m.has(key)) m.set(key, { nps: 0, rat: 0, n: 0, p: 0, d: 0, cb: 0 })
    const b = m.get(key)!
    b.nps += r.nps
    b.rat += r.rating
    b.n += 1
    if (r.nps >= 9) b.p += 1
    else if (r.nps <= 6) b.d += 1
    if (r.contactBack) b.cb += 1
  }
  return Array.from(m.entries())
    .map(([location, b]) => ({
      location,
      count: b.n,
      avgNps: +(b.nps / b.n).toFixed(2),
      avgRating: +(b.rat / b.n).toFixed(2),
      promoters: b.p,
      detractors: b.d,
      contactBack: b.cb
    }))
    .sort((a, b) => b.count - a.count)
}

const PAGE_SIZE = 30

function LocationTable({ data }: { data: LocationRow[] }) {
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [query, setQuery] = useState('')
  const { filters, setFilters } = useStore()

  const filtered = useMemo(() => {
    if (!query) return data
    const q = query.toLowerCase()
    return data.filter(r => r.location.toLowerCase().includes(q))
  }, [data, query])

  const visible = filtered.slice(0, limit)
  const hasMore = visible.length < filtered.length

  const clickRow = (location: string, e: React.MouseEvent) => {
    setFilters({ locations: multiToggle(filters.locations, location, e.shiftKey) })
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-ink-200">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="card-title">По об'єктах</h3>
            <p className="text-xs text-ink-500 mt-0.5">
              {filtered.length.toLocaleString('uk-UA')} {filtered.length === 1 ? 'об\'єкт' : 'об\'єктів'} ·
              показано {visible.length.toLocaleString('uk-UA')}
              <span className="ml-2 text-ink-400">· клік = фільтр на весь дашборд, Shift+клік = додати</span>
              {filters.locations.length > 0 && (
                <span className="ml-2 text-ink-900 font-medium">· обрано: {filters.locations.length}</span>
              )}
            </p>
          </div>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setLimit(PAGE_SIZE) }}
            placeholder="Пошук об'єкта…"
            className="input text-xs max-w-xs"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-ink-400">Немає об'єктів за обраними фільтрами</div>
      ) : (
        <>
          <div className="max-h-[560px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-[11px] uppercase tracking-wider text-ink-500 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Об'єкт</th>
                  <th className="text-right px-3 py-2.5 font-medium">Відгуків</th>
                  <th className="text-right px-3 py-2.5 font-medium">Сер. NPS</th>
                  <th className="text-right px-3 py-2.5 font-medium">Рейтинг</th>
                  <th className="text-right px-3 py-2.5 font-medium">Пром / Детр</th>
                  <th className="text-right px-4 py-2.5 font-medium">Зв'язатись</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(row => {
                  const isActive = filters.locations.includes(row.location)
                  return (
                    <tr
                      key={row.location}
                      onClick={(e) => clickRow(row.location, e)}
                      className={`border-t border-ink-100 cursor-pointer transition-colors ${
                        isActive ? 'bg-accent-soft hover:bg-accent-soft/80' : 'hover:bg-ink-50/60'
                      }`}
                      title="Клік: тільки цей об'єкт. Shift+клік: додати/прибрати у мульти-вибір."
                    >
                      <td className="px-4 py-2.5 text-ink-900 max-w-[420px]">
                        <div className="flex items-start gap-1.5">
                          <MapPin size={12} className="mt-1 text-ink-400 flex-shrink-0" />
                          <span className="truncate" title={row.location}>{row.location}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right num font-medium text-ink-900">{row.count.toLocaleString('uk-UA')}</td>
                      <td className="px-3 py-2.5 text-right num text-ink-700">{row.avgNps.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right num text-ink-700">{row.avgRating.toFixed(2)} ★</td>
                      <td className="px-3 py-2.5 text-right num text-xs text-ink-500">
                        <span className="text-emerald-700">{row.promoters}</span>
                        {' / '}
                        <span className="text-red-700">{row.detractors}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right num text-xs text-ink-500">{row.contactBack}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="p-3 border-t border-ink-200 flex items-center justify-center gap-2 bg-ink-50/40">
              <button
                onClick={() => setLimit(l => l + PAGE_SIZE)}
                className="btn-ghost border border-ink-300 text-xs"
              >
                Показати ще {Math.min(PAGE_SIZE, filtered.length - limit)}
              </button>
              <button
                onClick={() => setLimit(filtered.length)}
                className="btn-ghost text-xs"
              >
                Прогрузити всі ({filtered.length.toLocaleString('uk-UA')})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ReportView({ rows }: { rows: FeedbackRow[] }) {
  const [period, setPeriod] = useState<'week' | 'month' | 'both'>('both')

  const daily = useMemo(() => buildDailySeries(rows), [rows])
  const weeklyRaw = useMemo(() => buildWeeklySeries(daily), [daily])
  const monthlyRaw = useMemo(() => buildMonthlySeries(rows), [rows])
  const locations = useMemo(() => buildLocationAgg(rows), [rows])

  const weekly: ReportRow[] = weeklyRaw.map(w => ({ label: w.label, ...toReportRow(w) }))
  const monthly: ReportRow[] = monthlyRaw.map(m => ({ label: m.label, ...toReportRow(m) }))

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Табличний звіт</h2>
            <p className="text-xs text-ink-500 mt-1">
              Порівняння періодів: к-ть відгуків, середній NPS, NPS Score (промоутери − детрактори), запити на зворотний зв'язок.
              <br />
              <span className="text-emerald-700 font-medium">Зелене</span> — покращення відносно попереднього періоду; <span className="text-red-700 font-medium">червоне</span> — погіршення. Усе зважено на поточні фільтри дашборду.
            </p>
          </div>
          <div className="flex gap-1 bg-ink-100 rounded-lg p-0.5">
            {([
              ['both', 'Обидва'],
              ['week', 'По тижнях'],
              ['month', 'По місяцях']
            ] as const).map(([k, l]) => (
              <button key={k} onClick={() => setPeriod(k)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  period === k ? 'bg-white text-ink-900 shadow-card' : 'text-ink-500 hover:text-ink-900'
                }`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {(period === 'both' || period === 'month') && (
        <ReportTable
          title="По місяцях"
          subtitle={`${monthly.length} ${monthly.length === 1 ? 'місяць' : monthly.length < 5 ? 'місяці' : 'місяців'}. Найсвіжіший зверху.`}
          data={monthly}
        />
      )}
      {(period === 'both' || period === 'week') && (
        <ReportTable
          title="По тижнях"
          subtitle={`${weekly.length} ${weekly.length === 1 ? 'тиждень' : weekly.length < 5 ? 'тижні' : 'тижнів'}. Найсвіжіший зверху.`}
          data={weekly}
        />
      )}

      <LocationTable data={locations} />
    </div>
  )
}
