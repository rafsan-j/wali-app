import { clsx } from 'clsx'

export function LoadingDots() {
  return (
    <span className="flex items-center gap-1">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </span>
  )
}

export function CategoryPill({ category }) {
  const map = {
    Dharuriyyat: { cls: 'pill-dharuriyyat', label: 'Necessity' },
    Hajiyyat:    { cls: 'pill-hajiyyat',    label: 'Complement' },
    Tahsiniyyat: { cls: 'pill-tahsiniyyat', label: 'Embellishment' },
  }
  const { cls, label } = map[category] || { cls: 'pill-hajiyyat', label: category }
  return (
    <span className={clsx(cls, 'font-medium')}>
      {label} — {category}
    </span>
  )
}

export function VerdictBadge({ verdict }) {
  const map = {
    approve:    { cls: 'badge-approve',    label: 'Permitted',  icon: '✓' },
    caution:    { cls: 'badge-caution',    label: 'Caution',    icon: '◐' },
    discourage: { cls: 'badge-discourage', label: 'Discouraged', icon: '✗' },
  }
  const { cls, label, icon } = map[verdict] || map.caution
  return (
    <span className={clsx(cls, 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border')}>
      <span>{icon}</span>
      {label}
    </span>
  )
}

export function BudgetBar({ spent, limit }) {
  const pct   = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
  const over  = pct > 85
  const left  = Math.max(0, limit - spent)
  return (
    <div>
      <div className="flex justify-between text-xs text-zinc-400 mb-2">
        <span>৳{left.toLocaleString()} remaining</span>
        <span className={over ? 'text-wali-warn' : 'text-zinc-400'}>{pct}% used</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', over ? 'bg-wali-warn' : 'bg-wali-green')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="text-4xl mb-4 opacity-30">{icon}</div>
      <p className="text-zinc-300 font-medium mb-1">{title}</p>
      <p className="text-zinc-500 text-sm">{subtitle}</p>
    </div>
  )
}

export function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={clsx('text-xl font-display', accent || 'text-zinc-100')}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  )
}
