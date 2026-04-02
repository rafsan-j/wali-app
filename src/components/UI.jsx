import { clsx } from 'clsx'
import { formatMoney } from '../lib/utils'
import { CheckCircle2, AlertTriangle, XCircle, LayoutDashboard, History, FolderOpen } from 'lucide-react'

export function LoadingDots() {
  return (
    <span className="flex items-center gap-1.5">
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
    <span className={clsx(cls, 'text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md font-semibold')}>
      {label} — {category}
    </span>
  )
}

export function VerdictBadge({ verdict }) {
  const map = {
    approve:    { cls: 'badge-approve',    label: 'Permitted',   Icon: CheckCircle2 },
    caution:    { cls: 'badge-caution',    label: 'Caution',     Icon: AlertTriangle },
    discourage: { cls: 'badge-discourage', label: 'Discouraged', Icon: XCircle },
  }
  const { cls, label, Icon } = map[verdict] || map.caution
  return (
    <span className={clsx(cls, 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-bold border')}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  )
}

export function BudgetBar({ spent, limit, currency = '৳' }) {
  const pct   = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
  const over  = pct > 85
  const left  = Math.max(0, limit - spent)
  return (
    <div>
      <div className="flex justify-between text-xs text-zinc-400 mb-2 font-medium">
        <span>{formatMoney(left, currency)} remaining</span>
        <span className={over ? 'text-wali-warn' : 'text-zinc-500'}>{pct}% used</span>
      </div>
      <div className="h-1.5 bg-zinc-950 shadow-inner rounded-full overflow-hidden border border-zinc-800">
        <div
          className={clsx('h-full rounded-full transition-all duration-700 ease-out', over ? 'bg-wali-warn' : 'bg-wali-green')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, subtitle }) {
  // Gracefully map the old emoji strings to professional Lucide icons
  let RenderIcon = FolderOpen;
  if (icon === '📊') RenderIcon = LayoutDashboard;
  if (icon === '📋') RenderIcon = History;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
      <div className="mb-4 text-zinc-700">
        <RenderIcon className="w-12 h-12 stroke-[1.5]" />
      </div>
      <p className="text-zinc-300 font-medium mb-1 tracking-wide">{title}</p>
      <p className="text-zinc-500 text-xs">{subtitle}</p>
    </div>
  )
}

export function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card p-4 md:p-5 hover:border-zinc-700/50 transition-colors">
      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
      <p className={clsx('text-2xl md:text-3xl font-display tracking-tight', accent || 'text-zinc-100')}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  )
}