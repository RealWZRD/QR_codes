import { useMemo } from 'react'
import type { FeedbackRow } from '../types/feedback'
import { buildRatingDist } from '../lib/metrics'
import { Star } from 'lucide-react'
import { useStore, multiToggle } from '../lib/store'

export default function RatingDistChart({ rows }: { rows: FeedbackRow[] }) {
  const { filters, setFilters } = useStore()
  const data = useMemo(() => buildRatingDist(rows), [rows])
  const total = data.reduce((s, d) => s + d.count, 0)
  const max = Math.max(...data.map(d => d.count), 1)

  const clickRating = (r: number, e: React.MouseEvent) => {
    setFilters({ ratings: multiToggle(filters.ratings, r, e.shiftKey) })
  }

  return (
    <div className="card p-5">
      <h3 className="card-title">Розподіл рейтингів</h3>
      <p className="text-xs text-ink-500 mt-0.5 mb-4">
        Скільки зірок ставлять клієнти
        <span className="ml-2 text-ink-400">· клік = тільки цей рейтинг, Shift+клік = додати/прибрати</span>
        {filters.ratings.length > 0 && (
          <span className="ml-2 text-ink-900 font-medium">
            · обрано: {filters.ratings.map(r => `${r}★`).join(', ')}
          </span>
        )}
      </p>
      <div className="space-y-2.5">
        {data.map(d => {
          const pct = total ? (d.count / total) * 100 : 0
          const barPct = (d.count / max) * 100
          const isPositive = d.rating >= 4
          const isActive = filters.ratings.includes(d.rating)
          const dimmed = filters.ratings.length > 0 && !isActive
          return (
            <div
              key={d.rating}
              onClick={(e) => clickRating(d.rating, e)}
              className={`flex items-center gap-3 cursor-pointer rounded-md px-1 py-0.5 transition-colors ${
                isActive ? 'bg-accent-soft' : 'hover:bg-ink-50'
              } ${dimmed ? 'opacity-50' : ''}`}
              title={`Клік: тільки ${d.rating}★. Shift+клік: додати/прибрати ${d.rating}★ у мульти-вибір.`}
            >
              <div className="flex items-center gap-0.5 w-16 num">
                <span className="font-medium text-sm">{d.rating}</span>
                <Star size={12} className={isPositive ? 'fill-accent text-accent' : 'fill-ink-300 text-ink-300'} />
              </div>
              <div className="flex-1 h-7 bg-ink-100 rounded-md overflow-hidden relative">
                <div
                  className={`h-full transition-all ${isPositive ? 'bg-ink-900' : 'bg-red-500'}`}
                  style={{ width: `${barPct}%` }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-ink-700">
                  {d.count.toLocaleString('uk-UA')}
                </span>
              </div>
              <div className="w-12 text-right text-xs text-ink-500 num">{pct.toFixed(1)}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
