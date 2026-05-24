import type { KPIBundle } from '../lib/metrics'
import { MessageSquare, Phone, Star, TrendingUp, Users, Activity } from 'lucide-react'

interface Props { k: KPIBundle }

function Card({ label, value, sub, icon: Icon, tone = 'neutral' }: {
  label: string; value: React.ReactNode; sub?: React.ReactNode
  icon: any; tone?: 'neutral' | 'good' | 'warn' | 'danger'
}) {
  const toneRing = {
    neutral: 'bg-ink-100 text-ink-700',
    good: 'bg-emerald-50 text-emerald-700',
    warn: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700'
  }[tone]
  return (
    <div className="card p-5 relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <div className="label">{label}</div>
          <div className="mt-2 font-display text-3xl font-semibold tracking-tight num text-ink-900">
            {value}
          </div>
          {sub && <div className="mt-1 text-xs text-ink-500 num">{sub}</div>}
        </div>
        <div className={`p-2 rounded-lg ${toneRing}`}><Icon size={18} /></div>
      </div>
      <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-accent opacity-0 group-hover:opacity-10 transition-opacity blur-2xl" />
    </div>
  )
}

export default function KPICards({ k }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <Card label="Усього відгуків" value={k.total.toLocaleString('uk-UA')}
        icon={MessageSquare} tone="neutral" />
      <Card label="Середній NPS" value={k.avgNps.toFixed(2)} sub={`з 10`}
        icon={Activity} tone={k.avgNps >= 9 ? 'good' : k.avgNps >= 7 ? 'warn' : 'danger'} />
      <Card label="NPS Score" value={`${k.npsScore.toFixed(0)}`} sub="промоутери − детрактори"
        icon={TrendingUp} tone={k.npsScore >= 50 ? 'good' : k.npsScore >= 0 ? 'warn' : 'danger'} />
      <Card label="Середній рейтинг" value={k.avgRating.toFixed(2)} sub="зірок з 5"
        icon={Star} tone="neutral" />
      <Card label="Зв'язатись" value={k.contactBackCount.toLocaleString('uk-UA')}
        sub={`${k.contactBackPct.toFixed(1)}% від усіх`} icon={Phone} tone="warn" />
      <Card label="З коментарями" value={k.commentsCount.toLocaleString('uk-UA')}
        sub={`${((k.commentsCount / Math.max(k.total,1)) * 100).toFixed(1)}% від усіх`}
        icon={Users} tone="neutral" />
    </div>
  )
}
