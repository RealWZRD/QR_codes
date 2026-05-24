import { useMemo, useState } from 'react'
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
import ReportView from './components/ReportView'
import FileUploader from './components/FileUploader'
import { BarChart3, Table2 } from 'lucide-react'

type View = 'dashboard' | 'report'

export default function App() {
  const { rows, filters, loaded } = useStore()
  const [view, setView] = useState<View>('dashboard')

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters])
  const kpi = useMemo(() => calcKPI(filtered), [filtered])

  if (!loaded) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header compact={false} view={view} setView={setView} />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <FileUploader />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header compact view={view} setView={setView} />
      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-5">
        <FiltersPanel />
        <KPICards k={kpi} />

        {view === 'dashboard' ? (
          <>
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
          </>
        ) : (
          <ReportView rows={filtered} />
        )}

        <footer className="text-center text-xs text-ink-400 py-6 border-t border-ink-200">
          QR Feedback · {filtered.length} з {rows.length} записів після фільтрації
        </footer>
      </main>
    </div>
  )
}

function Header({ compact, view, setView }: { compact: boolean; view: View; setView: (v: View) => void }) {
  return (
    <header className={`bg-ink-950 text-white ${compact ? 'sticky top-0 z-30' : ''}`}>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-accent flex items-center justify-center rounded-md flex-shrink-0">
            <span className="font-display text-xl font-bold text-ink-950">D</span>
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-semibold tracking-tight leading-tight truncate">
              QR Feedback
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400">
              Аналітика відгуків
            </div>
          </div>
        </div>

        {compact && (
          <nav className="flex items-center gap-1 bg-ink-900 rounded-lg p-0.5">
            <TabBtn active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<BarChart3 size={14} />}>
              Дашборд
            </TabBtn>
            <TabBtn active={view === 'report'} onClick={() => setView('report')} icon={<Table2 size={14} />}>
              Звіт
            </TabBtn>
          </nav>
        )}

        {compact && <FileUploader compact />}
      </div>
    </header>
  )
}

function TabBtn({ active, onClick, icon, children }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        active
          ? 'bg-accent text-ink-950'
          : 'text-ink-300 hover:text-white hover:bg-ink-800'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
