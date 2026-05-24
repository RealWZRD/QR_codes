import { create } from 'zustand'
import type { FeedbackRow, Filters } from '../types/feedback'
import { normalizeCity } from './metrics'

interface DataStore {
  rows: FeedbackRow[]
  filters: Filters
  loaded: boolean
  fileName: string | null
  setRows: (rows: FeedbackRow[], fileName?: string) => void
  setFilters: (patch: Partial<Filters>) => void
  resetFilters: () => void
}

const initialFilters: Filters = {
  dateFrom: null,
  dateTo: null,
  rms: [],
  tms: [],
  shopTypes: [],
  npsMin: 0,
  npsMax: 10,
  contactBackStatus: 'all',
  authStatus: 'all',
  withCommentsOnly: false,
  weekdays: [],
  ratings: [],
  cities: [],
  locations: []
}

export const useStore = create<DataStore>((set) => ({
  rows: [],
  loaded: false,
  fileName: null,
  filters: initialFilters,
  setRows: (rows, fileName) => {
    const dates = rows.map(r => r.date.getTime())
    const min = dates.length ? new Date(Math.min(...dates)) : null
    const max = dates.length ? new Date(Math.max(...dates)) : null
    set({
      rows,
      loaded: rows.length > 0,
      fileName: fileName ?? null,
      filters: { ...initialFilters, dateFrom: min, dateTo: max }
    })
  },
  setFilters: (patch) => set(s => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set(s => {
    const dates = s.rows.map(r => r.date.getTime())
    const min = dates.length ? new Date(Math.min(...dates)) : null
    const max = dates.length ? new Date(Math.max(...dates)) : null
    return { filters: { ...initialFilters, dateFrom: min, dateTo: max } }
  })
}))

/**
 * Multi-select toggle для drill-down кліків.
 *  - звичайний клік: тільки `value` (заміна). Якщо вже єдиний обраний — скидаємо.
 *  - shift+click: toggle у мульті-наборі.
 */
export function multiToggle<T>(current: T[], value: T, shift: boolean): T[] {
  if (shift) {
    return current.includes(value)
      ? current.filter(x => x !== value)
      : [...current, value]
  }
  if (current.length === 1 && current[0] === value) return []
  return [value]
}

/** Apply filters to rows. */
export function applyFilters(rows: FeedbackRow[], f: Filters): FeedbackRow[] {
  return rows.filter(r => {
    if (f.dateFrom && r.date < f.dateFrom) return false
    if (f.dateTo && r.date > new Date(f.dateTo.getTime() + 86400000 - 1)) return false
    if (f.rms.length && !f.rms.includes(r.rm)) return false
    if (f.tms.length && !f.tms.includes(r.tm)) return false
    if (f.shopTypes.length && !f.shopTypes.includes(r.shopType)) return false
    if (r.nps < f.npsMin || r.nps > f.npsMax) return false
    if (f.contactBackStatus === 'yes' && !r.contactBack) return false
    if (f.contactBackStatus === 'no' && r.contactBack) return false
    if (f.authStatus !== 'all') {
      const hasPhone = !!(r.phone && r.phone.trim())
      if (f.authStatus === 'authorized' && !hasPhone) return false
      if (f.authStatus === 'unauthorized' && hasPhone) return false
    }
    if (f.withCommentsOnly && !r.comment) return false
    if (f.weekdays.length && !f.weekdays.includes(r.date.getUTCDay())) return false
    if (f.ratings.length && !f.ratings.includes(Math.round(r.rating))) return false
    if (f.cities.length && !f.cities.includes(normalizeCity(r.location))) return false
    if (f.locations.length && !f.locations.includes(r.location)) return false
    return true
  })
}
