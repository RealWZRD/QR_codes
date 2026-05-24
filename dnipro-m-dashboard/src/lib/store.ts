import { create } from 'zustand'
import type { FeedbackRow, Filters } from '../types/feedback'

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
  contactBackOnly: false,
  withCommentsOnly: false
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

/** Apply filters to rows. */
export function applyFilters(rows: FeedbackRow[], f: Filters): FeedbackRow[] {
  return rows.filter(r => {
    if (f.dateFrom && r.date < f.dateFrom) return false
    if (f.dateTo && r.date > new Date(f.dateTo.getTime() + 86400000 - 1)) return false
    if (f.rms.length && !f.rms.includes(r.rm)) return false
    if (f.tms.length && !f.tms.includes(r.tm)) return false
    if (f.shopTypes.length && !f.shopTypes.includes(r.shopType)) return false
    if (r.nps < f.npsMin || r.nps > f.npsMax) return false
    if (f.contactBackOnly && !r.contactBack) return false
    if (f.withCommentsOnly && !r.comment) return false
    return true
  })
}
