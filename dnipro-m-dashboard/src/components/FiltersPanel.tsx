import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import type { ShopType } from '../types/feedback'
import { RotateCcw, X, ChevronDown } from 'lucide-react'

function MultiSelect({
  label, options, value, onChange
}: {
  label: string; options: string[]; value: string[];
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => options.filter(o => o.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  )
  const toggle = (o: string) =>
    onChange(value.includes(o) ? value.filter(v => v !== o) : [...value, o])

  return (
    <div className="relative">
      <div className="label mb-1.5">{label}</div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="input flex items-center justify-between text-left"
      >
        <span className="truncate">
          {value.length === 0
            ? <span className="text-ink-400">Усі ({options.length})</span>
            : `${value.length} обрано`}
        </span>
        <ChevronDown size={16} className={`text-ink-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 left-0 right-0 max-h-72 overflow-auto bg-white border border-ink-200 rounded-lg shadow-pop p-2">
            <input
              autoFocus
              placeholder="Пошук…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input mb-2 text-xs"
            />
            {value.length > 0 && (
              <button
                onClick={() => onChange([])}
                className="w-full text-left text-xs text-ink-500 hover:text-ink-900 mb-1 px-2 py-1"
              >Очистити</button>
            )}
            {filtered.length === 0 && (
              <div className="text-xs text-ink-400 px-2 py-3 text-center">Нічого не знайдено</div>
            )}
            {filtered.map(o => (
              <label key={o}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-ink-50 rounded cursor-pointer text-sm">
                <input
                  type="checkbox"
                  className="accent-ink-900"
                  checked={value.includes(o)}
                  onChange={() => toggle(o)} />
                <span className="truncate">{o}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function FiltersPanel() {
  const { rows, filters, setFilters, resetFilters } = useStore()

  const rms = useMemo(
    () => Array.from(new Set(rows.map(r => r.rm).filter(Boolean))).sort(),
    [rows]
  )
  const tms = useMemo(
    () => Array.from(new Set(rows.map(r => r.tm).filter(Boolean))).sort(),
    [rows]
  )
  const shopTypes: ShopType[] = ['ФМ', 'ФФМ', 'Невідомо']

  const toIso = (d: Date | null) =>
    d ? `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}` : ''

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="card-title">Фільтри</h3>
        <button onClick={resetFilters} className="btn-ghost text-xs">
          <RotateCcw size={13} /> Скинути
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <div className="label mb-1.5">Від</div>
          <input
            type="date"
            className="input"
            value={toIso(filters.dateFrom)}
            onChange={e => {
              const v = e.target.value
              setFilters({ dateFrom: v ? new Date(v + 'T00:00:00Z') : null })
            }}
          />
        </div>
        <div>
          <div className="label mb-1.5">До</div>
          <input
            type="date"
            className="input"
            value={toIso(filters.dateTo)}
            onChange={e => {
              const v = e.target.value
              setFilters({ dateTo: v ? new Date(v + 'T00:00:00Z') : null })
            }}
          />
        </div>
        <MultiSelect
          label="Регіональні менеджери (РМ)"
          options={rms}
          value={filters.rms}
          onChange={v => setFilters({ rms: v })}
        />
        <MultiSelect
          label="Територіальні менеджери (ТМ)"
          options={tms}
          value={filters.tms}
          onChange={v => setFilters({ tms: v })}
        />

        <div className="lg:col-span-2">
          <div className="label mb-1.5">Тип точки</div>
          <div className="flex gap-2 flex-wrap">
            {shopTypes.map(t => {
              const active = filters.shopTypes.includes(t)
              return (
                <button
                  key={t}
                  onClick={() => setFilters({
                    shopTypes: active
                      ? filters.shopTypes.filter(s => s !== t)
                      : [...filters.shopTypes, t]
                  })}
                  className={`filter-chip ${active ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                >{t}</button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="label mb-1.5">NPS від</div>
          <input type="number" min={0} max={10} className="input"
            value={filters.npsMin}
            onChange={e => setFilters({ npsMin: +e.target.value || 0 })} />
        </div>
        <div>
          <div className="label mb-1.5">NPS до</div>
          <input type="number" min={0} max={10} className="input"
            value={filters.npsMax}
            onChange={e => setFilters({ npsMax: +e.target.value || 10 })} />
        </div>

        <div className="lg:col-span-4 flex flex-wrap gap-3 pt-1">
          <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
            <input type="checkbox"
              className="accent-ink-900"
              checked={filters.contactBackOnly}
              onChange={e => setFilters({ contactBackOnly: e.target.checked })} />
            Тільки ті, хто просив зв'язатись
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
            <input type="checkbox"
              className="accent-ink-900"
              checked={filters.withCommentsOnly}
              onChange={e => setFilters({ withCommentsOnly: e.target.checked })} />
            Тільки з коментарями
          </label>
        </div>
      </div>

      {/* Active filter chips summary */}
      {(filters.rms.length || filters.tms.length || filters.shopTypes.length ||
        filters.contactBackOnly || filters.withCommentsOnly ||
        filters.weekday !== null || filters.rating !== null) ? (
        <div className="mt-4 pt-3 border-t border-ink-200 flex flex-wrap gap-1.5">
          {filters.rms.map(r => (
            <span key={'r'+r} className="chip bg-ink-100">
              РМ: {r.split(' ').slice(0,2).join(' ')}
              <button onClick={() => setFilters({ rms: filters.rms.filter(x => x !== r) })}>
                <X size={11} />
              </button>
            </span>
          ))}
          {filters.tms.map(t => (
            <span key={'t'+t} className="chip bg-ink-100">
              ТМ: {t.split(' ').slice(0,2).join(' ')}
              <button onClick={() => setFilters({ tms: filters.tms.filter(x => x !== t) })}>
                <X size={11} />
              </button>
            </span>
          ))}
          {filters.shopTypes.map(s => (
            <span key={'s'+s} className="chip bg-ink-100">
              {s}
              <button onClick={() => setFilters({ shopTypes: filters.shopTypes.filter(x => x !== s) })}>
                <X size={11} />
              </button>
            </span>
          ))}
          {filters.weekday !== null && (
            <span className="chip bg-accent-soft border border-amber-200">
              День: {['Нд','Пн','Вт','Ср','Чт','Пт','Сб'][filters.weekday]}
              <button onClick={() => setFilters({ weekday: null })}>
                <X size={11} />
              </button>
            </span>
          )}
          {filters.rating !== null && (
            <span className="chip bg-accent-soft border border-amber-200">
              Рейтинг: {filters.rating} ★
              <button onClick={() => setFilters({ rating: null })}>
                <X size={11} />
              </button>
            </span>
          )}
        </div>
      ) : null}
    </div>
  )
}
