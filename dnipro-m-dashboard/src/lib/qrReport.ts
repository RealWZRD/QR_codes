/**
 * Генерація готового тижневого QR-звіту (.xlsx) прямо в браузері.
 * Порт логіки qr_core.py (build_report): ті самі блоки, кольорові шкали
 * та розкладка, що й у Python-скрипті на openpyxl.
 */
import * as XLSX from 'xlsx'
import type ExcelJSNS from 'exceljs'

const DAY_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД']

// Стандартна трикольорова шкала Excel: червоний -> жовтий -> зелений
const SCALE_RED = 'FFF8696B'
const SCALE_YELLOW = 'FFFFEB84'
const SCALE_GREEN = 'FF63BE7B'

/** "DD.MM.YYYY [HH:MM]" / Date / Excel serial → UTC-полудень (час відкидаємо). */
function parseDate(v: unknown): Date | null {
  if (v == null || v === '') return null
  if (v instanceof Date) {
    return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate(), 12))
  }
  if (typeof v === 'number') {
    const epoch = Date.UTC(1899, 11, 30, 12)
    return new Date(epoch + Math.floor(v) * 86400000)
  }
  const datePart = String(v).trim().split(/[\sT]+/)[0]
  const m = datePart.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/)
  if (m) {
    const [, dd, mm, yy] = m
    const year = yy.length === 2 ? 2000 + +yy : +yy
    return new Date(Date.UTC(year, +mm - 1, +dd, 12))
  }
  const iso = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) {
    const [, yy, mm, dd] = iso
    return new Date(Date.UTC(+yy, +mm - 1, +dd, 12))
  }
  const d = new Date(datePart)
  return isNaN(d.getTime()) ? null : new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12))
}

function isEmpty(v: unknown): boolean {
  return v == null || String(v).trim() === ''
}

function dateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function ddmm(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export interface QrReportResult {
  blob: Blob
  fileName: string
  total: number
}

export async function buildQrReport(buf: ArrayBuffer): Promise<QrReportResult> {
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })

  // Аркуш із заголовком "Дата відгуку", інакше — перший (як у Python)
  let ws = wb.Sheets[wb.SheetNames[0]]
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name]
    const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, range: 0, blankrows: false })
    const first = (grid[0] ?? []) as unknown[]
    if (first.some(c => c != null && String(c).toLowerCase().includes('дата відгуку'))) {
      ws = sheet
      break
    }
  }

  const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })
  if (grid.length === 0) throw new Error('Файл порожній')
  const header = (grid[0] as unknown[]).map(h => (h == null ? '' : String(h).trim()))
  const data = grid.slice(1).filter(r => (r as unknown[]).some(v => !isEmpty(v))) as unknown[][]

  const col = (name: string): number => {
    const i = header.findIndex(h => h.toLowerCase().includes(name.toLowerCase()))
    if (i === -1) throw new Error(`У вигрузці не знайдено колонку "${name}"`)
    return i
  }

  const iDate = col('Дата відгуку')
  const iPhone = col('Телефон')
  const iNps = col('Оцінка NPS')
  const iObj = header.some(h => h.toLowerCase().includes('об`єкт')) ? col('Об`єкт') : col('Об')
  const iParam = col('Параметр 1')
  const iTa = col('Коментар в ТА')
  const iRadio = col('Radio')
  const iRm = col('РМ')
  const iTm = col('ТМ')

  const total = data.length
  const cntFm = data.filter(r => String(r[iTa] ?? '').trim() === 'ФМ').length
  const cntFfm = data.filter(r => String(r[iTa] ?? '').trim() === 'ФФМ').length
  const cntNoauth = data.filter(r => isEmpty(r[iPhone])).length
  const cntRadio = data.filter(r => !isEmpty(r[iRadio])).length

  const dates: Date[] = []
  for (const r of data) {
    const d = parseDate(r[iDate])
    if (!d) throw new Error(`Не вдалося розпізнати дату відгуку: "${r[iDate]}"`)
    dates.push(d)
  }
  if (!dates.length) throw new Error('У файлі немає жодного рядка з датою відгуку')

  const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const monday = new Date(minDate.getTime() - ((minDate.getUTCDay() + 6) % 7) * 86400000)
  const weekDays = Array.from({ length: 7 }, (_, k) => new Date(monday.getTime() + k * 86400000))
  const dayCounts = new Map<string, number>()
  for (const d of dates) {
    const k = dateKey(d)
    dayCounts.set(k, (dayCounts.get(k) ?? 0) + 1)
  }

  // Розподіли значень (величина -> кількість), сортування за спаданням значення
  const numDist = (idx: number): [unknown, number][] => {
    const m = new Map<string, { val: unknown; cnt: number }>()
    for (const r of data) {
      const v = r[idx]
      if (v == null || String(v).trim() === '') continue
      const key = String(v)
      const b = m.get(key)
      if (b) b.cnt++
      else m.set(key, { val: v, cnt: 1 })
    }
    return Array.from(m.values())
      .sort((a, b) => (Number(b.val) || 0) - (Number(a.val) || 0))
      .map(b => [b.val, b.cnt])
  }

  const nameDist = (idx: number): [string, number][] => {
    const m = new Map<string, number>()
    for (const r of data) {
      if (isEmpty(r[idx])) continue
      const name = String(r[idx]).trim()
      m.set(name, (m.get(name) ?? 0) + 1)
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'uk'))
  }

  const npsDist = numDist(iNps)
  const paramDist = numDist(iParam)
  const objects = nameDist(iObj)
  const rms = nameDist(iRm)
  const tms = nameDist(iTm)

  // ---------- запис звіту ----------
  // exceljs важкий — вантажимо лише коли реально будуємо звіт
  const ExcelJS = (await import('exceljs')).default
  const out = new ExcelJS.Workbook()
  const sheet = out.addWorksheet('Лист1')

  const thin = { style: 'thin' as const }
  const border = { top: thin, left: thin, bottom: thin, right: thin }

  const put = (
    addr: string,
    value: ExcelJSNS.CellValue,
    opts: { bold?: boolean; center?: boolean; bordered?: boolean; numFmt?: string } = {}
  ) => {
    const c = sheet.getCell(addr)
    c.value = value
    c.font = { name: 'Calibri', size: 11, bold: !!opts.bold }
    if (opts.center) c.alignment = { horizontal: 'center' }
    if (opts.bordered !== false) c.border = border
    if (opts.numFmt) c.numFmt = opts.numFmt
  }

  // Блок: загальні підсумки
  put('B2', 'Загальна к-ть відгуків', { bold: true })
  put('C2', total, { bold: true, center: true })
  put('B3', 'К-cть відгуків по ФМ', { bold: true })
  put('C3', cntFm, { bold: true, center: true })
  put('B4', 'К-cть відгуків по ФФМ', { bold: true })
  put('C4', cntFfm, { bold: true, center: true })
  put('B5', 'К-ть неавторизованих відгуків', { bold: true })
  put('C5', cntNoauth, { bold: true, center: true })

  // Блок: Radio
  put('E2', 'Radio Так, зв`язуйтесь', { bold: true, center: true })
  put('F2', total, { bold: true, center: true })
  put('E3', 'Пусті')
  put('F3', total - cntRadio, { center: true })
  put('E4', 'Так, зв`язуйтесь')
  put('F4', cntRadio, { center: true })

  // Блок: дні тижня
  put('B7', 'Дата відгуку', { bold: true, center: true })
  put('C7', total, { bold: true, center: true })
  weekDays.forEach((d, k) => {
    const row = 8 + k
    put(`A${row}`, DAY_LABELS[k], { center: true, bordered: false })
    put(`B${row}`, d, { center: true, numFmt: 'm/d/yyyy' })
    put(`C${row}`, dayCounts.get(dateKey(d)) ?? 0, { center: true })
  })

  // Блок: Оцінка NPS
  put('E7', 'Оцінка NPS', { bold: true, center: true })
  put('F7', total, { bold: true, center: true })
  npsDist.forEach(([val, cnt], k) => {
    put(`E${8 + k}`, val as ExcelJSNS.CellValue, { center: true })
    put(`F${8 + k}`, cnt, { center: true })
  })

  // Блок: Як пройшов сьогоднішній візит
  const r0 = 8 + npsDist.length + 1
  put(`E${r0}`, 'Як пройшов сьогоднішній візит', { bold: true })
  put(`F${r0}`, total, { bold: true, center: true })
  paramDist.forEach(([val, cnt], k) => {
    put(`E${r0 + 1 + k}`, val as ExcelJSNS.CellValue, { center: true })
    put(`F${r0 + 1 + k}`, cnt, { center: true })
  })

  // Блок: Салони майстерності (Об`єкт)
  put('H2', 'Салони майстерності', { bold: true, center: true })
  put('I2', total, { bold: true, center: true })
  objects.forEach(([name, cnt], k) => {
    put(`H${3 + k}`, name)
    put(`I${3 + k}`, cnt, { center: true })
  })

  // Блок: РМ
  put('K2', 'РМ', { bold: true, center: true })
  put('L2', total, { bold: true, center: true })
  rms.forEach(([name, cnt], k) => {
    put(`K${3 + k}`, name)
    put(`L${3 + k}`, cnt, { center: true })
  })

  // Блок: ТМ
  put('N2', 'ТМ', { bold: true, center: true })
  put('O2', total, { bold: true, center: true })
  tms.forEach(([name, cnt], k) => {
    put(`N${3 + k}`, name)
    put(`O${3 + k}`, cnt, { center: true })
  })

  // Трикольорові шкали (червоний -> жовтий -> зелений) на кількісних колонках
  let priority = 1
  const scale = (ref: string) => {
    sheet.addConditionalFormatting({
      ref,
      rules: [{
        type: 'colorScale',
        priority: priority++,
        cfvo: [
          { type: 'min' },
          { type: 'percentile', value: 50 },
          { type: 'max' }
        ],
        color: [{ argb: SCALE_RED }, { argb: SCALE_YELLOW }, { argb: SCALE_GREEN }]
      }]
    })
  }

  scale('C8:C14')
  scale('F3:F4')
  scale(`F8:F${7 + npsDist.length}`)
  scale(`F${r0 + 1}:F${r0 + paramDist.length}`)
  scale(`I3:I${2 + objects.length}`)
  scale(`L3:L${2 + rms.length}`)
  scale(`O3:O${2 + tms.length}`)

  const widths: Record<string, number> = {
    A: 5, B: 12, C: 7, E: 32, F: 7, H: 42, I: 7, K: 34, L: 7, N: 34, O: 7
  }
  for (const [letter, width] of Object.entries(widths)) {
    sheet.getColumn(letter).width = width
  }

  const sunday = weekDays[6]
  const fileName = `QR звіт ${ddmm(monday)}-${ddmm(sunday)}.${sunday.getUTCFullYear()}.xlsx`
  const buffer = await out.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  return { blob, fileName, total }
}

/** Скачує згенерований звіт у браузері. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
