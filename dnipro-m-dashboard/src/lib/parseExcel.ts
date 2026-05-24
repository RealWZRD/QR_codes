import * as XLSX from 'xlsx'
import type { FeedbackRow, ShopType } from '../types/feedback'

/** Parse "DD.MM.YYYY" / "DD.MM.YYYY HH:MM" / Excel serial → Date (UTC noon, час відкидаємо). */
function parseDate(v: unknown): Date | null {
  if (v == null || v === '') return null
  if (v instanceof Date) {
    // нормалізуємо в UTC-полудень — час відкидаємо
    return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate(), 12))
  }
  if (typeof v === 'number') {
    // Excel serial: days since 1899-12-30; обрізаємо дробову частину (час)
    const epoch = Date.UTC(1899, 11, 30)
    return new Date(epoch + Math.floor(v) * 86400000)
  }
  // Беремо тільки першу "лексему" — якщо є час "DD.MM.YYYY  HH:MM" або ISO "YYYY-MM-DDTHH:MM"
  const datePart = String(v).trim().split(/[\sT]+/)[0]
  // DD.MM.YYYY
  const m = datePart.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/)
  if (m) {
    const [, dd, mm, yy] = m
    const year = yy.length === 2 ? 2000 + +yy : +yy
    return new Date(Date.UTC(year, +mm - 1, +dd, 12))
  }
  // YYYY-MM-DD
  const iso = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) {
    const [, yy, mm, dd] = iso
    return new Date(Date.UTC(+yy, +mm - 1, +dd, 12))
  }
  const d = new Date(datePart)
  return isNaN(d.getTime()) ? null : new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12))
}

function parseRating(v: unknown): number {
  if (typeof v === 'number') return v
  if (v == null) return 0
  const s = String(v).replace(',', '.').trim()
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

function parseShopType(v: unknown): ShopType {
  const s = String(v ?? '').trim().toUpperCase()
  if (s === 'ФМ') return 'ФМ'
  if (s === 'ФФМ') return 'ФФМ'
  return 'Невідомо'
}

function parseContactBack(v: unknown): boolean {
  const s = String(v ?? '').trim().toLowerCase()
  return s.startsWith('так')
}

/** Resilient header lookup — accommodates minor heading variations. */
function findHeader(headers: string[], ...keywords: string[]): string | null {
  for (const h of headers) {
    const low = h.toLowerCase()
    if (keywords.every(k => low.includes(k.toLowerCase()))) return h
  }
  return null
}

/**
 * Якщо явної "ФМ/ФФМ" колонки немає (як у новому форматі, де ФМ/ФФМ
 * випадково лежить у "Коментар в ТА") — детектуємо її по контенту:
 * шукаємо колонку, де ≥50% значень — це "ФМ" або "ФФМ".
 */
function detectShopTypeColumn(headers: string[], rows: Record<string, unknown>[]): string | null {
  const sample = rows.slice(0, Math.min(200, rows.length))
  if (!sample.length) return null
  let best: { h: string; ratio: number } | null = null
  for (const h of headers) {
    let hit = 0, nonEmpty = 0
    for (const r of sample) {
      const s = String(r[h] ?? '').trim().toUpperCase()
      if (!s) continue
      nonEmpty++
      if (s === 'ФМ' || s === 'ФФМ') hit++
    }
    if (nonEmpty < 5) continue
    const ratio = hit / nonEmpty
    if (ratio >= 0.5 && (!best || ratio > best.ratio)) best = { h, ratio }
  }
  return best?.h ?? null
}

export async function parseFeedbackXlsx(file: ArrayBuffer): Promise<FeedbackRow[]> {
  const wb = XLSX.read(file, { type: 'array', cellDates: true })
  // Prefer 'data_source' sheet if present, otherwise first sheet
  const sheetName =
    wb.SheetNames.find(n => n.toLowerCase().includes('data_source')) ??
    wb.SheetNames.find(n => n.toLowerCase().includes('data')) ??
    wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
  if (rows.length === 0) return []

  const headers = Object.keys(rows[0])

  // Колонка ФМ/ФФМ:
  //  1) шукаємо за назвою ("фм"),
  //  2) АЛЕ якщо знайшлось "Коментар…" (нове сміття) — відкидаємо,
  //  3) інакше детектуємо по контенту.
  let shopHeader = findHeader(headers, 'фм')
  if (shopHeader && /коментар|текст/i.test(shopHeader)) shopHeader = null
  if (!shopHeader) shopHeader = detectShopTypeColumn(headers, rows)

  // Коментар: новий формат тримає його в колонці "Текст".
  // Якщо немає — fallback на "коментар", АЛЕ не на ту що ми вже використали як shop.
  let commentHeader = findHeader(headers, 'текст')
  if (!commentHeader) {
    const candidate = findHeader(headers, 'коментар')
    if (candidate && candidate !== shopHeader) commentHeader = candidate
  }

  const H = {
    date: findHeader(headers, 'дата') ?? 'Дата відгуку',
    phone: findHeader(headers, 'телефон') ?? 'Телефон',
    rating: findHeader(headers, 'рейтинг') ?? 'Рейтинг',
    nps: findHeader(headers, 'nps') ?? 'Оцінка NPS',
    location: findHeader(headers, 'об') ?? 'Об`єкт',
    visit: findHeader(headers, 'параметр') ?? findHeader(headers, 'візит') ?? '',
    comment: commentHeader ?? '',
    contact: findHeader(headers, 'radio') ?? findHeader(headers, 'зв') ?? '',
    rm: findHeader(headers, 'рм') ?? '',
    tm: findHeader(headers, 'тм') ?? '',
    shop: shopHeader ?? ''
  }

  const out: FeedbackRow[] = []
  rows.forEach((r, idx) => {
    const date = parseDate(r[H.date])
    if (!date) return // skip rows without a parseable date
    out.push({
      id: idx,
      date,
      dateRaw: String(r[H.date] ?? ''),
      phone: String(r[H.phone] ?? ''),
      rating: parseRating(r[H.rating]),
      nps: Number(r[H.nps]) || 0,
      location: String(r[H.location] ?? '').trim(),
      visitResult: Number(r[H.visit]) || 0,
      comment: String(r[H.comment] ?? '').trim(),
      contactBack: parseContactBack(r[H.contact]),
      rm: String(r[H.rm] ?? '').trim(),
      tm: String(r[H.tm] ?? '').trim(),
      shopType: parseShopType(r[H.shop])
    })
  })
  return out
}
