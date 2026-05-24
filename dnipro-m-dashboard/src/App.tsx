import { useMemo } from 'react'
import { useStore, applyFilters } from './lib/store'
import { calcKPI } from './lib/metrics'
import FiltersPanel from './components/FiltersPanel'
import KPICards from './components/KPICards'
import TimeSeriesChart from './components/TimeSeriesChart'
import WeekdayChart from './components/WeekdayChart'
import TopGroupChart from './components/TopGroupChart'
import { ShopTypeDonut, ContactBackDonut } from './components/ShopTypeDonut'
import RatingDistChart from './components/RatingDistChart'
import CommentsTable from './components/CommentsTable'
import FileUploader from './components/FileUploader'

export default function App() {
  const { rows, filters, loaded } = useStore()

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters])
  const kpi = useMemo(() => calcKPI(filtered), [filtered])

  if (!loaded) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header compact={false} />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <FileUploader />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header compact />
      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-5">
        <FiltersPanel />
        <KPICards k={kpi} />
        <TimeSeriesChart rows={filtered} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <WeekdayChart rows={filtered} />
          <RatingDistChart rows={filtered} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ShopTypeDonut rows={filtered} />
          <ContactBackDonut rows={filtered} />
        </div>

        <TopGroupChart rows={filtered} />

        <CommentsTable rows={filtered} />

        <footer className="text-center text-xs text-ink-400 py-6 border-t border-ink-200">
          Dnipro-M · Аналітика відгуків QR · {filtered.length} з {rows.length} записів після фільтрації
        </footer>
      </main>
    </div>
  )
}

function Header({ compact }: { compact: boolean }) {
  return (
    <header className={`bg-ink-950 text-white ${compact ? 'sticky top-0 z-30' : ''}`}>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent flex items-center justify-center rounded-md">
            <span className="font-display text-xl font-bold text-ink-950">D</span>
          </div>
          <div>
            <div className="font-display text-base font-semibold tracking-tight leading-tight">
              Dnipro-M · Аналітика
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400">
              Відгуки QR · Dashboard
            </div>
          </div>
        </div>
        {compact && <FileUploader compact />}
      </div>
    </header>
  )
}
