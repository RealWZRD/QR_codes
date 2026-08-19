import { useRef, useState } from 'react'
import { FileDown, Upload, AlertCircle, RotateCw, CheckCircle2, FileSpreadsheet } from 'lucide-react'
import { buildQrReport, downloadBlob } from '../lib/qrReport'
import { useStore } from '../lib/store'

interface DoneInfo {
  fileName: string
  total: number
}

/**
 * Окрема можливість: закинути Excel-вигрузку і одразу отримати
 * готовий тижневий QR-звіт (.xlsx) — як Python-скрипт qr_core.py.
 */
export default function ExcelReportMaker() {
  const { rawBuffer, fileName: loadedName } = useStore()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState<DoneInfo | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  async function generate(buf: ArrayBuffer) {
    setBusy(true); setErr(null); setDone(null)
    try {
      const { blob, fileName, total } = await buildQrReport(buf)
      downloadBlob(blob, fileName)
      setDone({ fileName, total })
    } catch (e: any) {
      setErr(e?.message ?? 'Невідома помилка обробки файлу')
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files[0]) return
    const buf = await files[0].arrayBuffer()
    await generate(buf)
  }

  return (
    <div className="card p-8 max-w-2xl mx-auto w-full">
      <div className="text-center">
        <div className="inline-flex p-3.5 bg-accent-soft rounded-2xl mb-3">
          <FileDown size={30} className="text-ink-900" />
        </div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900 mb-1.5">
          Готовий Excel-звіт
        </h2>
        <p className="text-sm text-ink-500 mb-5">
          Закиньте файл вигрузки — і одразу отримаєте готовий тижневий звіт
          (.xlsx) із підсумками, розподілами NPS, салонами, РМ/ТМ та кольоровими шкалами.
        </p>

        <label
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          className={`block border-2 border-dashed rounded-xl p-7 cursor-pointer transition-colors ${
            dragOver ? 'border-ink-900 bg-ink-50' : 'border-ink-300 hover:border-ink-900 hover:bg-ink-50'
          }`}
        >
          <input
            ref={ref}
            type="file"
            accept=".xlsx,.xlsm,.xls"
            onChange={e => handleFiles(e.target.files)}
            className="hidden"
          />
          {busy ? (
            <>
              <RotateCw size={26} className="mx-auto mb-2 text-ink-400 animate-spin" />
              <div className="font-medium text-ink-900">Будую звіт…</div>
            </>
          ) : (
            <>
              <Upload size={26} className="mx-auto mb-2 text-ink-400" />
              <div className="font-medium text-ink-900">Перетягніть файл вигрузки сюди або клацніть для вибору</div>
              <div className="text-xs text-ink-500 mt-1">.xlsx, .xlsm, .xls — звіт скачається автоматично</div>
            </>
          )}
        </label>

        {rawBuffer && loadedName && (
          <button
            onClick={() => generate(rawBuffer.slice(0))}
            disabled={busy}
            className="btn-ghost border border-ink-300 text-sm mt-4 inline-flex items-center gap-2"
          >
            <FileSpreadsheet size={15} />
            Створити звіт із вже завантаженого файлу
            <span className="text-ink-400 truncate max-w-[200px]">({loadedName})</span>
          </button>
        )}

        {done && (
          <div className="mt-4 text-sm flex items-start gap-2 text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-left">
            <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
            <span>
              Готово! Створено <span className="font-medium">{done.fileName}</span> — відгуків: {done.total.toLocaleString('uk-UA')}.
              Файл збережено у «Завантаження».
            </span>
          </div>
        )}

        {err && (
          <div className="mt-4 text-sm flex items-start gap-2 text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 text-left">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{err}</span>
          </div>
        )}
      </div>
    </div>
  )
}
