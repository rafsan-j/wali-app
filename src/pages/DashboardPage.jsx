import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { useEvaluations, useSettings } from '../hooks/useStorage'
import { StatCard, EmptyState } from '../components/UI'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill }} className="font-medium">
          {p.name}: ৳{Math.round(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { evaluations } = useEvaluations()
  const { settings }    = useSettings()

  const stats = useMemo(() => {
    const discouraged = evaluations.filter(e => e.verdict === 'discourage')
    const approved    = evaluations.filter(e => e.verdict === 'approve')

    const spentOnWants = discouraged.reduce((s, e) => s + (e.price || 0), 0)
    const spentOnNeeds = approved.reduce((s, e) => s + (e.price || 0), 0)
    const redirected   = discouraged.reduce((s, e) => s + (e.price || 0), 0)
    const projected5yr = Math.round(redirected * Math.pow(1.08, 5))
    const resistRate   = evaluations.length > 0
      ? Math.round((discouraged.length / evaluations.length) * 100) : 0

    return { spentOnWants, spentOnNeeds, redirected, projected5yr, resistRate, total: evaluations.length }
  }, [evaluations])

  // Monthly chart — last 6 months
  const monthlyData = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-GB', { month: 'short' })
      const entries = evaluations.filter(e => e.createdAt?.startsWith(key))
      const wants = entries.filter(e => e.verdict === 'discourage').reduce((s, e) => s + (e.price || 0), 0)
      const needs = entries.filter(e => e.verdict === 'approve').reduce((s, e) => s + (e.price || 0), 0)
      months.push({ label, wants, needs })
    }
    return months
  }, [evaluations])

  if (evaluations.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 pt-6 pb-28">
        <h1 className="font-display text-3xl text-zinc-100 mb-1">Dashboard</h1>
        <p className="text-zinc-400 text-sm mb-6">Wealth vs. image</p>
        <EmptyState
          icon="📊"
          title="No data yet"
          subtitle="Your financial patterns will appear here after you make evaluations"
        />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28 scroll-area">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-zinc-100">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Wealth vs. image</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        <StatCard
          label="Redirected to investment"
          value={`৳${stats.redirected.toLocaleString()}`}
          sub="Capital preserved"
          accent="text-wali-green"
        />
        <StatCard
          label="5-year projection"
          value={`৳${stats.projected5yr.toLocaleString()}`}
          sub="At 8% Halal return"
          accent="text-wali-green"
        />
        <StatCard
          label="Resistance rate"
          value={`${stats.resistRate}%`}
          sub="Discouraged purchases"
        />
        <StatCard
          label="Total evaluations"
          value={stats.total}
          sub="Moments of reflection"
        />
      </div>

      {/* Budget overview */}
      <div className="card p-4 mb-4">
        <p className="section-label">This month</p>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-2xl font-display text-zinc-100">
              {settings.currency}{settings.spentSoFar.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              of {settings.currency}{settings.monthlyLimit.toLocaleString()} limit
            </p>
          </div>
          <p className={
            settings.spentSoFar > settings.monthlyLimit
              ? 'text-wali-warn text-sm font-medium'
              : 'text-wali-green text-sm font-medium'
          }>
            {settings.currency}{Math.abs(settings.monthlyLimit - settings.spentSoFar).toLocaleString()}{' '}
            {settings.spentSoFar > settings.monthlyLimit ? 'over' : 'left'}
          </p>
        </div>
      </div>

      {/* Wants vs needs chart */}
      <div className="card p-4 mb-4">
        <p className="section-label">Wants vs. needs — last 6 months</p>
        <div className="flex items-center gap-4 mb-4">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-wali-warn/70 inline-block" />
            Wants
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-wali-green/70 inline-block" />
            Needs
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData} barSize={12} barGap={4}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="wants" name="Wants" radius={[3, 3, 0, 0]} fill="#D85A30" opacity={0.7} />
            <Bar dataKey="needs" name="Needs" radius={[3, 3, 0, 0]} fill="#1D9E75" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Investment projection visual */}
      <div className="card p-4">
        <p className="section-label">If redirected capital was invested</p>
        <div className="space-y-3">
          {[1, 3, 5, 10].map(yr => {
            const fv = Math.round(stats.redirected * Math.pow(1.08, yr))
            const pct = Math.min(100, Math.round((fv / (stats.redirected * Math.pow(1.08, 10))) * 100))
            return (
              <div key={yr}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400">{yr} year{yr > 1 ? 's' : ''}</span>
                  <span className="text-zinc-200 font-medium">৳{fv.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full">
                  <div
                    className="h-full bg-wali-green rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, opacity: 0.4 + (yr / 10) * 0.6 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-zinc-600 mt-3">Based on 8% annual return — Halal ETF / Mudarabah benchmark</p>
      </div>
    </div>
  )
}
