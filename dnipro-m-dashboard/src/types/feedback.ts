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
  weekday: number | null   // 0..6 (UTC getUTCDay; 0=Нд, 1=Пн, ..., 6=Сб)
  rating: number | null    // 1..5 (round) — drill-down з RatingDistChart
}
