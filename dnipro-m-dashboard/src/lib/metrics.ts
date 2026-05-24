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
}

export function calcKPI(rows: FeedbackRow[]): KPIBundle {
  const total = rows.length
  if (!total) {
    return {
      total: 0, avgNps: 0, avgRating: 0,
      promoters: 0, passives: 0, detractors: 0, npsScore: 0,
      contactBackCount: 0, contactBackPct: 0, commentsCount: 0
    }
  }
  let npsSum = 0, ratingSum = 0, prom = 0, pas = 0, det = 0, cb = 0, com = 0
  for (const r of rows) {
    npsSum += r.nps
    ratingSum += r.rating
    if (r.nps >= 9) prom++
    else if (r.nps >= 7) pas++
    else det++
    if (r.contactBack) cb++
    if (r.comment) com++
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
    commentsCount: com
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
}

export function buildDailySeries(rows: FeedbackRow[]): DailySeries[] {
  const buckets = new Map<string, { sum: number; n: number; p: number; d: number; date: Date }>()
  for (const r of rows) {
    const y = r.date.getUTCFullYear()
    const m = String(r.date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(r.date.getUTCDate()).padStart(2, '0')
    const key = `${y}-${m}-${d}`
    if (!buckets.has(key)) buckets.set(key, { sum: 0, n: 0, p: 0, d: 0, date: r.date })
    const b = buckets.get(key)!
    b.sum += r.nps
    b.n += 1
    if (r.nps >= 9) b.p += 1
    else if (r.nps <= 6) b.d += 1
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => ({
      date: key,
      dateLabel: `${key.slice(8, 10)}.${key.slice(5, 7)}`,
      count: b.n,
      avgNps: +(b.sum / b.n).toFixed(2),
      promoters: b.p,
      detractors: b.d
    }))
}

export interface WeeklySeries { week: string; count: number; avgNps: number }
export function buildWeeklySeries(daily: DailySeries[]): WeeklySeries[] {
  const buckets = new Map<string, { sum: number; n: number; total: number }>()
  for (const d of daily) {
    // ISO week computation
    const dt = new Date(d.date + 'T00:00:00Z')
    const dayNum = (dt.getUTCDay() + 6) % 7
    dt.setUTCDate(dt.getUTCDate() - dayNum + 3)
    const firstThursday = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4))
    const week = 1 + Math.round(((dt.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7)
    const key = `${dt.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
    if (!buckets.has(key)) buckets.set(key, { sum: 0, n: 0, total: 0 })
    const b = buckets.get(key)!
    b.sum += d.avgNps * d.count
    b.n += d.count
    b.total += d.count
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => ({
      week: key,
      count: b.total,
      avgNps: +(b.sum / b.n).toFixed(2)
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

/** Top N city extraction (city = part before first comma). */
export function buildCityAgg(rows: FeedbackRow[]): GroupAgg[] {
  const m = new Map<string, { sum: number; rs: number; n: number; p: number; d: number }>()
  for (const r of rows) {
    const city = (r.location.split(',')[0] || '').trim()
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
