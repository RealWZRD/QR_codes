export type ShopType = 'ФМ' | 'ФФМ' | 'Невідомо'

export interface FeedbackRow {
  id: number
  date: Date            // parsed Date
  dateRaw: string       // original "DD.MM.YYYY"
  phone: string
  rating: number        // 1..5
  nps: number           // 0..10
  location: string      // СМ
  visitResult: number   // дублює rating
  comment: string
  contactBack: boolean  // "Так, зв'язуйтесь"
  rm: string            // регіональний менеджер
  tm: string            // територіальний менеджер
  shopType: ShopType
}

export interface Filters {
  dateFrom: Date | null
  dateTo: Date | null
  rms: string[]            // empty = all
  tms: string[]
  shopTypes: ShopType[]
  npsMin: number
  npsMax: number
  contactBackOnly: boolean
  withCommentsOnly: boolean
  weekdays: number[]       // 0..6 (UTC getUTCDay), empty = all
  ratings: number[]        // 1..5, empty = all
  cities: string[]         // canonical city names (normalizeCity), empty = all
  locations: string[]      // full "Об'єкт" string, для drill-down зі звіту
}
