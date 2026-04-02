import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { motion } from 'framer-motion'
import { useEvaluations, useSettings } from '../hooks/useStorage'
import { StatCard, EmptyState } from '../components/UI'
import { formatMoney } from '../lib/utils'

const PIE_COLORS = ['#1D9E75', '#D85A30', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1']

// Reusable page transition settings
export const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -15 },
  transition: { duration: 0.3, ease: 'easeOut' }
}

function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800/90 backdrop-blur-md border border-zinc-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label || payload[0].name}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.color }} className="font-medium">
          {p.name}: {formatMoney(Math.round(p.value), currency)}
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

  // NEW: Aggregate spending intent by category for the Pie Chart
  const categoryData = useMemo(() => {
    const counts = {}
    evaluations.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + (e.price || 0)
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [evaluations])

  if (evaluations.length === 0) {
    return (
      <motion.div {...pageTransition} className="max-w-xl mx-auto px-4 md:px-6 pt-6 pb-28">
        <h1 className="font-display text-3xl text-zinc-100 mb-1">Dashboard</h1>
        <p className="text-zinc-400 text-sm mb-6">Wealth vs. image</p>
        <EmptyState icon="📊" title="No data yet" subtitle="Your financial patterns will appear here." />
      </motion.div>
    )
  }

  return (
    // Max-w-xl makes it gracefully wider on PC
    <motion.div {...pageTransition} className="max-w-xl mx-auto px-4 md:px-6 pt-6 pb-28 scroll-area">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-zinc-100">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Wealth vs. image</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
        <StatCard label="Redirected" value={`${formatMoney(stats.redirected, settings.currency)}`} sub="Capital preserved" accent="text-wali-green" />
        <StatCard label="5-year projection" value={`${formatMoney(stats.projected5yr, settings.currency)}`} sub="At 8% Halal return" accent="text-wali-green" />
        <StatCard label="Resistance rate" value={`${stats.resistRate}%`} sub="Discouraged" />
        <StatCard label="Total items" value={stats.total} sub="Evaluations" />
      </div>

      <div className="card p-4 md:p-6 mb-4 hover:border-zinc-700/50 transition-colors">
        <p className="section-label">This month</p>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-3xl font-display text-zinc-100">
              {formatMoney(settings.spentSoFar, settings.currency)}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              of {formatMoney(settings.monthlyLimit, settings.currency)} limit
            </p>
          </div>
          <p className={settings.spentSoFar > settings.monthlyLimit ? 'text-wali-warn text-sm font-medium' : 'text-wali-green text-sm font-medium'}>
            {formatMoney(Math.abs(settings.monthlyLimit - settings.spentSoFar), settings.currency)}{' '}
            {settings.spentSoFar > settings.monthlyLimit ? 'over' : 'left'}
          </p>
        </div>
      </div>

      {/* Grid wrapper for charts on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="card p-4 md:p-6 hover:border-zinc-700/50 transition-colors">
          <p className="section-label">Wants vs. needs (6mo)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barSize={10} barGap={4} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip currency={settings.currency} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="wants" name="Wants" radius={[4, 4, 0, 0]} fill="#D85A30" opacity={0.8} />
              <Bar dataKey="needs" name="Needs" radius={[4, 4, 0, 0]} fill="#1D9E75" opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4 md:p-6 hover:border-zinc-700/50 transition-colors">
          <p className="section-label">Spending by Category</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={categoryData}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={75}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip currency={settings.currency} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}