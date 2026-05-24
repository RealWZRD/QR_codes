import * as XLSX from 'xlsx'
import type { FeedbackRow, ShopType } from '../types/feedback'

/** Parse "DD.MM.YYYY" or Excel serial → Date (UTC noon to avoid TZ drift). */
function parseDate(v: unknown): Date | null {
  if (v == null || v === '') return null
  if (v instanceof Date) return v
  if (typeof v === 'number') {
    // Excel serial: days since 1899-12-30
    const epoch = Date.UTC(1899, 11, 30)
    return new Date(epoch + v * 86400000)
  }
  const s = String(v).trim()
  // DD.MM.YYYY
  const m = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/)
  if (m) {
    const [, dd, mm, yy] = m
    const year = yy.length === 2 ? 2000 + +yy : +yy
    return new Date(Date.UTC(year, +mm - 1, +dd, 12))
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
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
  const H = {
    date: findHeader(headers, 'дата') ?? 'Дата відгуку',
    phone: findHeader(headers, 'телефон') ?? 'Телефон',
    rating: findHeader(headers, 'рейтинг') ?? 'Рейтинг',
    nps: findHeader(headers, 'nps') ?? 'Оцінка NPS',
    location: findHeader(headers, 'об') ?? 'Об`єкт',
    visit: findHeader(headers, 'параметр') ?? findHeader(headers, 'візит') ?? '',
    comment: findHeader(headers, 'коментар') ?? 'Коментар в ТА',
    contact: findHeader(headers, 'radio') ?? findHeader(headers, 'зв') ?? '',
    rm: findHeader(headers, 'рм') ?? 'РМ',
    tm: findHeader(headers, 'тм') ?? 'ТМ',
    shop: findHeader(headers, 'фм') ?? 'ФМ/ФФМ'
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
