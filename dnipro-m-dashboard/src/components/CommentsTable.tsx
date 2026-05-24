import { useMemo, useState } from 'react'
import type { FeedbackRow } from '../types/feedback'
import { Search, Phone as PhoneIcon, MessageSquare } from 'lucide-react'

export default function CommentsTable({ rows }: { rows: FeedbackRow[] }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const withComments = useMemo(
    () => rows.filter(r => r.comment).sort((a, b) => b.date.getTime() - a.date.getTime()),
    [rows]
  )

  const filtered = useMemo(() => {
    if (!query) return withComments
    const q = query.toLowerCase()
    return withComments.filter(r =>
      r.comment.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      r.rm.toLowerCase().includes(q) ||
      r.tm.toLowerCase().includes(q)
    )
  }, [withComments, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const npsTone = (nps: number) =>
    nps >= 9 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : nps >= 7 ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-red-50 text-red-700 border-red-200'

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h3 className="card-title">Коментарі клієнтів</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            {filtered.length} з {withComments.length} відгуків з коментарями
          </p>
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder="Пошук у коментарях, локації, менеджерах…"
            className="input pl-9"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-12 text-ink-400">
          <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
          <div className="text-sm">Немає коментарів за цими фільтрами</div>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(r => (
            <div key={r.id} className="border border-ink-200 rounded-lg p-3 hover:border-ink-400 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-1.5 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`chip border ${npsTone(r.nps)}`}>NPS {r.nps}</span>
                  <span className="text-[11px] text-ink-500 num">{r.dateRaw}</span>
                  <span className="text-[11px] text-ink-700">{r.location}</span>
                  {r.contactBack && (
                    <span className="chip bg-accent-soft text-amber-900 border border-amber-200">
                      <PhoneIcon size={10} /> Зв'язатись
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-ink-500 text-right">
                  <div>{r.tm}</div>
                  <div className="text-ink-400">{r.shopType}</div>
                </div>
              </div>
              <p className="text-sm text-ink-800 leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="btn-ghost">← Попередня</button>
          <span className="text-ink-500 num">Сторінка {safePage} з {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="btn-ghost">Наступна →</button>
        </div>
      )}
    </div>
  )
}
