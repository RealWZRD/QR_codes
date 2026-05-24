import type { KPIBundle } from '../lib/metrics'
import { MessageSquare, Phone, Star, TrendingUp, Users, Activity, UserCheck, UserX } from 'lucide-react'
import NpsHelp from './NpsHelp'

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
  const authPct = k.total ? (k.authorized / k.total) * 100 : 0
  const unauthPct = k.total ? (k.unauthorized / k.total) * 100 : 0
  return (
    <div className="space-y-2">
    <div className="flex items-center justify-between">
      <h2 className="text-[11px] uppercase tracking-[0.14em] font-medium text-ink-500">
        Ключові показники
      </h2>
      <NpsHelp />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card label="Усього відгуків" value={k.total.toLocaleString('uk-UA')}
        icon={MessageSquare} tone="neutral" />
      <Card label="Середній NPS" value={k.avgNps.toFixed(2)} sub={`з 10`}
        icon={Activity} tone={k.avgNps >= 9 ? 'good' : k.avgNps >= 7 ? 'warn' : 'danger'} />
      <Card label="NPS Score" value={`${k.npsScore.toFixed(0)}`} sub="% промоутерів − % детракторів"
        icon={TrendingUp} tone={k.npsScore >= 50 ? 'good' : k.npsScore >= 0 ? 'warn' : 'danger'} />
      <Card label="Середній рейтинг" value={k.avgRating.toFixed(2)} sub="зірок з 5"
        icon={Star} tone="neutral" />
      <Card label="Авторизовані" value={k.authorized.toLocaleString('uk-UA')}
        sub={`${authPct.toFixed(1)}% — лишили телефон`} icon={UserCheck} tone="good" />
      <Card label="Неавторизовані" value={k.unauthorized.toLocaleString('uk-UA')}
        sub={`${unauthPct.toFixed(1)}% — без телефону`} icon={UserX} tone="neutral" />
      <Card label="Зв'язатись" value={k.contactBackCount.toLocaleString('uk-UA')}
        sub={`${k.contactBackPct.toFixed(1)}% від усіх`} icon={Phone} tone="warn" />
      <Card label="З коментарями" value={k.commentsCount.toLocaleString('uk-UA')}
        sub={`${((k.commentsCount / Math.max(k.total,1)) * 100).toFixed(1)}% від усіх`}
        icon={Users} tone="neutral" />
    </div>
    </div>
  )
}
