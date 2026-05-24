import { useRef, useState } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, RotateCw } from 'lucide-react'
import { useStore } from '../lib/store'
import { parseFeedbackXlsx } from '../lib/parseExcel'

export default function FileUploader({ compact = false }: { compact?: boolean }) {
  const { setRows, fileName } = useStore()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)

  async function handle(files: FileList | null) {
    if (!files || !files[0]) return
    setBusy(true); setErr(null)
    try {
      const buf = await files[0].arrayBuffer()
      const rows = await parseFeedbackXlsx(buf)
      if (rows.length === 0) {
        setErr('Не вдалося знайти жодного рядка з валідною датою у файлі.')
      } else {
        setRows(rows, files[0].name)
      }
    } catch (e: any) {
      setErr(`Помилка обробки файлу: ${e?.message ?? 'невідома'}`)
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }

  async function loadSample() {
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/sample-data.xlsx')
      if (!res.ok) throw new Error('Не знайдено sample-data.xlsx')
      const buf = await res.arrayBuffer()
      const rows = await parseFeedbackXlsx(buf)
      setRows(rows, 'sample-data.xlsx (приклад)')
    } catch (e: any) {
      setErr(`Не вдалося завантажити приклад: ${e?.message}`)
    } finally {
      setBusy(false)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="file"
          accept=".xlsx,.xlsm,.xls,.csv"
          onChange={e => handle(e.target.files)}
          className="hidden"
        />
        {fileName && (
          <span className="hidden md:flex items-center gap-1.5 text-xs text-ink-500">
            <FileSpreadsheet size={13} />
            <span className="truncate max-w-[180px]">{fileName}</span>
          </span>
        )}
        <button onClick={() => ref.current?.click()} disabled={busy} className="btn-primary text-sm">
          {busy
            ? <><RotateCw size={14} className="animate-spin" /> Обробка…</>
            : <><Upload size={14} /> Завантажити Excel</>}
        </button>
      </div>
    )
  }

  return (
    <div className="card p-10 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="inline-flex p-4 bg-accent-soft rounded-2xl mb-4">
          <FileSpreadsheet size={36} className="text-ink-900" />
        </div>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 mb-2">
          Аналітика відгуків
        </h2>
        <p className="text-ink-500 mb-6">
          Завантажте Excel із даними анкети QR-кодів. Потрібний аркуш — <code className="font-mono text-xs bg-ink-100 px-1.5 py-0.5 rounded">data_source</code>.
        </p>

        <label
          onDragOver={e => { e.preventDefault() }}
          onDrop={e => { e.preventDefault(); handle(e.dataTransfer.files) }}
          className="block border-2 border-dashed border-ink-300 rounded-xl p-8 cursor-pointer hover:border-ink-900 hover:bg-ink-50 transition-colors"
        >
          <input
            ref={ref}
            type="file"
            accept=".xlsx,.xlsm,.xls,.csv"
            onChange={e => handle(e.target.files)}
            className="hidden"
          />
          <Upload size={28} className="mx-auto mb-2 text-ink-400" />
          <div className="font-medium text-ink-900">Перетягніть файл сюди або клацніть для вибору</div>
          <div className="text-xs text-ink-500 mt-1">.xlsx, .xlsm, .xls, .csv</div>
        </label>

        <div className="my-4 flex items-center gap-3 text-xs text-ink-400">
          <div className="flex-1 h-px bg-ink-200" />
          <span>або</span>
          <div className="flex-1 h-px bg-ink-200" />
        </div>

        <button
          onClick={loadSample}
          disabled={busy}
          className="btn-ghost border border-ink-300"
        >
          {busy
            ? <><RotateCw size={14} className="animate-spin" /> Завантаження…</>
            : <>Завантажити приклад (data_QRs.xlsx)</>}
        </button>

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
