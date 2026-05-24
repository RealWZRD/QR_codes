import type { FeedbackRow } from '../types/feedback'

export interface KPIBundle {
  total: number
  avgNps: number
  avgRating: number
  promoters: number       // NPS 9-10
  passives: number        // NPS 7-8
  detractors: number      // NPS 0-6
  npsScore: number        // %prom - %detr
  contactBackCount: number
  contactBackPct: number
  commentsCount: number
  authorized: number      // лишили телефон
  unauthorized: number    // без телефону
}

export function calcKPI(rows: FeedbackRow[]): KPIBundle {
  const total = rows.length
  if (!total) {
    return {
      total: 0, avgNps: 0, avgRating: 0,
      promoters: 0, passives: 0, detractors: 0, npsScore: 0,
      contactBackCount: 0, contactBackPct: 0, commentsCount: 0,
      authorized: 0, unauthorized: 0
    }
  }
  let npsSum = 0, ratingSum = 0, prom = 0, pas = 0, det = 0, cb = 0, com = 0, auth = 0
  for (const r of rows) {
    npsSum += r.nps
    ratingSum += r.rating
    if (r.nps >= 9) prom++
    else if (r.nps >= 7) pas++
    else det++
    if (r.contactBack) cb++
    if (r.comment) com++
    if (r.phone && r.phone.trim()) auth++
  }
  return {
    total,
    avgNps: npsSum / total,
    avgRating: ratingSum / total,
    promoters: prom,
    passives: pas,
    detractors: det,
    npsScore: ((prom - det) / total) * 100,
    contactBackCount: cb,
    contactBackPct: (cb / total) * 100,
    commentsCount: com,
    authorized: auth,
    unauthorized: total - auth
  }
}

const WEEKDAYS_UK = ['НД', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']
const WEEKDAYS_UK_FULL = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота']

export interface DailySeries {
  date: string         // YYYY-MM-DD
  dateLabel: string    // DD.MM
  count: number
  avgNps: number
  promoters: number
  detractors: number
  contactBack: number
  unauthorized: number  // без телефону
}

export function buildDailySeries(rows: FeedbackRow[]): DailySeries[] {
  const buckets = new Map<string, { sum: number; n: number; p: number; d: number; cb: number; ua: number; date: Date }>()
  for (const r of rows) {
    const y = r.date.getUTCFullYear()
    const m = String(r.date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(r.date.getUTCDate()).padStart(2, '0')
    const key = `${y}-${m}-${d}`
    if (!buckets.has(key)) buckets.set(key, { sum: 0, n: 0, p: 0, d: 0, cb: 0, ua: 0, date: r.date })
    const b = buckets.get(key)!
    b.sum += r.nps
    b.n += 1
    if (r.nps >= 9) b.p += 1
    else if (r.nps <= 6) b.d += 1
    if (r.contactBack) b.cb += 1
    if (!r.phone || !r.phone.trim()) b.ua += 1
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => ({
      date: key,
      dateLabel: `${key.slice(8, 10)}.${key.slice(5, 7)}`,
      count: b.n,
      avgNps: +(b.sum / b.n).toFixed(2),
      promoters: b.p,
      detractors: b.d,
      contactBack: b.cb,
      unauthorized: b.ua
    }))
}

const MONTHS_UK_SHORT = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру']

export interface MonthlySeries {
  month: string       // "YYYY-MM"
  label: string       // "Січ 2026"
  count: number
  avgNps: number
  promoters: number
  detractors: number
  contactBack: number
  unauthorized: number
}

export function buildMonthlySeries(rows: FeedbackRow[]): MonthlySeries[] {
  const buckets = new Map<string, { sum: number; n: number; p: number; d: number; cb: number; ua: number; y: number; m: number }>()
  for (const r of rows) {
    const y = r.date.getUTCFullYear()
    const m = r.date.getUTCMonth() // 0..11
    const key = `${y}-${String(m + 1).padStart(2, '0')}`
    if (!buckets.has(key)) buckets.set(key, { sum: 0, n: 0, p: 0, d: 0, cb: 0, ua: 0, y, m })
    const b = buckets.get(key)!
    b.sum += r.nps
    b.n += 1
    if (r.nps >= 9) b.p += 1
    else if (r.nps <= 6) b.d += 1
    if (r.contactBack) b.cb += 1
    if (!r.phone || !r.phone.trim()) b.ua += 1
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => ({
      month: key,
      label: `${MONTHS_UK_SHORT[b.m]} ${b.y}`,
      count: b.n,
      avgNps: +(b.sum / b.n).toFixed(2),
      promoters: b.p,
      detractors: b.d,
      contactBack: b.cb,
      unauthorized: b.ua
    }))
}

export interface WeeklySeries {
  week: string         // YYYY-Www
  label: string        // "Тиж 21, 19–25.05"
  count: number
  avgNps: number
  promoters: number
  detractors: number
  contactBack: number
  unauthorized: number
}
export function buildWeeklySeries(daily: DailySeries[]): WeeklySeries[] {
  const buckets = new Map<string, { sum: number; n: number; total: number; p: number; d: number; cb: number; ua: number; firstDate: string; lastDate: string }>()
  for (const d of daily) {
    // ISO week computation
    const dt = new Date(d.date + 'T00:00:00Z')
    const dayNum = (dt.getUTCDay() + 6) % 7
    dt.setUTCDate(dt.getUTCDate() - dayNum + 3)
    const firstThursday = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4))
    const week = 1 + Math.round(((dt.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7)
    const key = `${dt.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
    if (!buckets.has(key)) buckets.set(key, { sum: 0, n: 0, total: 0, p: 0, d: 0, cb: 0, ua: 0, firstDate: d.date, lastDate: d.date })
    const b = buckets.get(key)!
    b.sum += d.avgNps * d.count
    b.n += d.count
    b.total += d.count
    b.p += d.promoters
    b.d += d.detractors
    b.cb += d.contactBack
    b.ua += d.unauthorized
    if (d.date < b.firstDate) b.firstDate = d.date
    if (d.date > b.lastDate) b.lastDate = d.date
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => ({
      week: key,
      label: `Тиж ${key.slice(-2)}, ${b.firstDate.slice(8, 10)}.${b.firstDate.slice(5, 7)}–${b.lastDate.slice(8, 10)}.${b.lastDate.slice(5, 7)}`,
      count: b.total,
      avgNps: b.n ? +(b.sum / b.n).toFixed(2) : 0,
      promoters: b.p,
      detractors: b.d,
      contactBack: b.cb,
      unauthorized: b.ua
    }))
}

export interface WeekdayBucket { day: string; dayShort: string; idx: number; count: number; avgNps: number }
export function buildWeekdayDist(rows: FeedbackRow[]): WeekdayBucket[] {
  const buckets: { sum: number; n: number }[] = Array.from({ length: 7 }, () => ({ sum: 0, n: 0 }))
  for (const r of rows) {
    const wd = r.date.getUTCDay()
    buckets[wd].sum += r.nps
    buckets[wd].n += 1
  }
  // Reorder: Mon..Sun
  const order = [1, 2, 3, 4, 5, 6, 0]
  return order.map((wd, i) => ({
    day: WEEKDAYS_UK_FULL[wd],
    dayShort: WEEKDAYS_UK[wd],
    idx: i,
    count: buckets[wd].n,
    avgNps: buckets[wd].n ? +(buckets[wd].sum / buckets[wd].n).toFixed(2) : 0
  }))
}

export interface GroupAgg { name: string; count: number; avgNps: number; avgRating: number; promPct: number; detPct: number }

export function groupBy(rows: FeedbackRow[], key: keyof FeedbackRow): GroupAgg[] {
  const m = new Map<string, { sum: number; ratingSum: number; n: number; p: number; d: number }>()
  for (const r of rows) {
    const k = String(r[key] ?? '').trim()
    if (!k) continue
    if (!m.has(k)) m.set(k, { sum: 0, ratingSum: 0, n: 0, p: 0, d: 0 })
    const b = m.get(k)!
    b.sum += r.nps
    b.ratingSum += r.rating
    b.n += 1
    if (r.nps >= 9) b.p += 1
    else if (r.nps <= 6) b.d += 1
  }
  return Array.from(m.entries()).map(([name, b]) => ({
    name,
    count: b.n,
    avgNps: +(b.sum / b.n).toFixed(2),
    avgRating: +(b.ratingSum / b.n).toFixed(2),
    promPct: +((b.p / b.n) * 100).toFixed(1),
    detPct: +((b.d / b.n) * 100).toFixed(1)
  }))
}

/**
 * Multi-word Ukrainian city whitelist — щоб не зрізалися до першого слова,
 * коли роздільник коми в адресі відсутній.
 */
const MULTI_WORD_CITIES = [
  'Кривий Ріг', 'Біла Церква', 'Жовті Води', 'Новий Буг', 'Новий Розділ',
  'Велика Димерка', 'Велика Олександрівка', 'Старий Любар', 'Нова Водолага',
  'Горішні Плавні', 'Зимна Вода', 'Кам\'янець-Подільський',
  'Могилів-Подільський', 'Івано-Франківськ', 'Петропавлівська Борщагівка'
]

/** Typo / синонім → canonical. Ключі та значення в нижньому регістрі. */
const CITY_TYPOS: Record<string, string> = {
  'біла цервка': 'Біла Церква',
  'петр борщагівка': 'Петропавлівська Борщагівка',
  'київ видубичі': 'Київ'
}

/**
 * Нормалізує "Об'єкт" → канонічна назва міста.
 *  1) перший сегмент до коми (як було)
 *  2) якщо сегмент починається з відомого мульти-словного міста — повертаємо це місто
 *  3) typo-мапа
 *  4) інакше — перше слово
 */
export function normalizeCity(location: string): string {
  const raw = (location || '').trim()
  if (!raw) return ''
  const firstSeg = (raw.split(',')[0] || '').trim()
  const low = firstSeg.toLowerCase()

  for (const city of MULTI_WORD_CITIES) {
    if (low.startsWith(city.toLowerCase())) return city
  }
  if (CITY_TYPOS[low]) return CITY_TYPOS[low]
  for (const key of Object.keys(CITY_TYPOS)) {
    if (low.startsWith(key)) return CITY_TYPOS[key]
  }
  // single-word fallback — захищає від "Кривий ріг просп. ..." (без коми)
  const firstWord = firstSeg.split(/\s+/)[0]
  return firstWord
}

/** Top N city extraction with normalization. */
export function buildCityAgg(rows: FeedbackRow[]): GroupAgg[] {
  const m = new Map<string, { sum: number; rs: number; n: number; p: number; d: number }>()
  for (const r of rows) {
    const city = normalizeCity(r.location)
    if (!city) continue
    if (!m.has(city)) m.set(city, { sum: 0, rs: 0, n: 0, p: 0, d: 0 })
    const b = m.get(city)!
    b.sum += r.nps
    b.rs += r.rating
    b.n += 1
    if (r.nps >= 9) b.p += 1
    else if (r.nps <= 6) b.d += 1
  }
  return Array.from(m.entries()).map(([name, b]) => ({
    name,
    count: b.n,
    avgNps: +(b.sum / b.n).toFixed(2),
    avgRating: +(b.rs / b.n).toFixed(2),
    promPct: +((b.p / b.n) * 100).toFixed(1),
    detPct: +((b.d / b.n) * 100).toFixed(1)
  }))
}

/**
 * Daily series розбита по групах (для multi-line TimeSeries по РМ).
 * Повертає { x: dateLabel, sort: yyyy-mm-dd, [groupKey]: count, ... }
 * де groupKey — кожне значення з `groups` (наприклад, ім'я РМ).
 */
export interface MultiSeriesPoint { x: string; sort: string; [groupKey: string]: number | string }

export function buildDailySeriesByGroup(
  rows: FeedbackRow[],
  groupKey: keyof FeedbackRow,
  groups: string[]
): MultiSeriesPoint[] {
  const groupSet = new Set(groups)
  // dateKey -> Map<group, count>
  const buckets = new Map<string, Map<string, number>>()
  for (const r of rows) {
    const g = String(r[groupKey] ?? '').trim()
    if (!groupSet.has(g)) continue
    const y = r.date.getUTCFullYear()
    const mo = String(r.date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(r.date.getUTCDate()).padStart(2, '0')
    const key = `${y}-${mo}-${d}`
    if (!buckets.has(key)) buckets.set(key, new Map())
    const inner = buckets.get(key)!
    inner.set(g, (inner.get(g) || 0) + 1)
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, inner]) => {
      const row: MultiSeriesPoint = {
        x: `${key.slice(8, 10)}.${key.slice(5, 7)}`,
        sort: key
      }
      for (const g of groups) row[g] = inner.get(g) || 0
      return row
    })
}

export function buildShopTypeDist(rows: FeedbackRow[]) {
  const m = new Map<string, { n: number; sum: number }>()
  for (const r of rows) {
    const k = r.shopType
    if (!m.has(k)) m.set(k, { n: 0, sum: 0 })
    const b = m.get(k)!
    b.n += 1
    b.sum += r.nps
  }
  return Array.from(m.entries()).map(([name, b]) => ({
    name,
    value: b.n,
    avgNps: +(b.sum / b.n).toFixed(2)
  }))
}

export function buildRatingDist(rows: FeedbackRow[]) {
  const buckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of rows) {
    const k = Math.round(r.rating)
    if (k >= 1 && k <= 5) buckets[k] += 1
  }
  return [5, 4, 3, 2, 1].map(k => ({ rating: k, count: buckets[k] }))
}

export function buildContactBackDist(rows: FeedbackRow[]) {
  let yes = 0, no = 0
  for (const r of rows) (r.contactBack ? yes++ : no++)
  return [
    { name: "Так, зв'язуйтесь", value: yes },
    { name: 'Не зазначено', value: no }
  ]
}
