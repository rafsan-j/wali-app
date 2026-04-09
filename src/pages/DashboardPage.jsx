// src/pages/DashboardPage.jsx
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSettings, useEvaluations } from '../hooks/useStorage'
import { formatMoney } from '../lib/utils'
import { Scale, PiggyBank, History, ChevronRight, AlertTriangle, TrendingUp, ShieldCheck, BarChart3, PieChart, TrendingDown } from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.4 } }
}

// Helper for SVG Donut Chart
function createDonutSegments(data) {
  let accumulatedPercent = 0
  return data.map(segment => {
    const dasharray = `${segment.percent} 100`
    const dashoffset = -accumulatedPercent
    accumulatedPercent += segment.percent
    return { ...segment, dasharray, dashoffset }
  })
}

export default function DashboardPage() {
  const { settings } = useSettings()
  const { evaluations } = useEvaluations()

  // --- 1. BUDGET STATS ---
  const limit = settings.monthlyLimit || 0
  const spent = settings.spentSoFar || 0
  const remaining = Math.max(0, limit - spent)
  const percentUsed = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
  const progressColor = percentUsed > 90 ? 'bg-red-500' : percentUsed > 75 ? 'bg-wali-warn' : 'bg-wali-green'

  // --- 2. ACTIVE GOALS (To-Buy Preview) ---
  const activeItems = useMemo(() => {
    return evaluations
      .filter(e => !e.purchased && !e.diverted)
      .sort((a, b) => (a.custom_order ?? 999) - (b.custom_order ?? 999))
      .slice(0, 3) 
  }, [evaluations])

  // --- 3. RECENT PURCHASES ---
  const recentPurchases = useMemo(() => {
    return evaluations
      .filter(e => e.purchased)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
  }, [evaluations])

  // --- 4. VAULT WIDGET ---
  const divertedCapital = useMemo(() => {
    return evaluations
      .filter(e => e.diverted)
      .reduce((sum, evalItem) => sum + evalItem.price, 0)
  }, [evaluations])

  // --- 5. ANALYTICS: WANTS VS NEEDS ---
  const purchasedItems = useMemo(() => evaluations.filter(e => e.purchased), [evaluations])

  const sixMonthData = useMemo(() => {
    const data = []
    const now = new Date()
    let maxAmount = 0

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      data.push({ label: d.toLocaleString('en-US', { month: 'short' }), month: d.getMonth(), year: d.getFullYear(), needs: 0, wants: 0 })
    }

    purchasedItems.forEach(item => {
      const itemDate = new Date(item.createdAt)
      const targetMonth = data.find(m => m.month === itemDate.getMonth() && m.year === itemDate.getFullYear())
      if (targetMonth) {
        if (item.necessity >= 7) targetMonth.needs += item.price
        else targetMonth.wants += item.price
      }
    })

    data.forEach(d => {
      const total = d.needs + d.wants
      if (total > maxAmount) maxAmount = total
    })

    return { data, maxAmount: maxAmount || 1 }
  }, [purchasedItems])

  // --- 6. ANALYTICS: CATEGORY SPENDING ---
  const categoryData = useMemo(() => {
    const totals = {}
    let grandTotal = 0

    purchasedItems.forEach(item => {
      const cat = item.category || 'other'
      totals[cat] = (totals[cat] || 0) + item.price
      grandTotal += item.price
    })

    if (grandTotal === 0) return []

    const colors = ['#1d9e75', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#f97316', '#14b8a6', '#64748b']
    const sorted = Object.keys(totals)
      .map((key, index) => ({ label: key.charAt(0).toUpperCase() + key.slice(1), amount: totals[key], percent: (totals[key] / grandTotal) * 100, color: colors[index % colors.length] }))
      .sort((a, b) => b.amount - a.amount)

    return createDonutSegments(sorted)
  }, [purchasedItems])

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto px-4 md:px-8 pt-6 pb-28 md:pb-12 scroll-area">
      
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <h1 className="font-display text-3xl text-zinc-100 tracking-wide">Assalamu Alaikum.</h1>
        <p className="text-zinc-400 text-sm mt-1">Here is your financial overview for this cycle.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* --- MAIN HERO: Budget Tracker --- */}
        <motion.div variants={item} className="md:col-span-8 card p-6 md:p-8 border-zinc-800 bg-zinc-900/40 relative overflow-hidden group">
          <div className={`absolute -right-20 -top-20 w-64 h-64 blur-[100px] opacity-10 rounded-full pointer-events-none transition-colors ${progressColor}`} />
          
          <div className="flex justify-between items-start mb-2 relative z-10">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Remaining Budget</p>
            {percentUsed > 90 && (
              <span className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-400/10 px-2 py-1 rounded border border-red-400/20 font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3" /> Critical
              </span>
            )}
          </div>
          
          <h2 className="text-5xl md:text-6xl font-display tracking-tight text-zinc-100 mb-6 relative z-10">
            {formatMoney(remaining, settings.currency)}
          </h2>

          <div className="space-y-2 relative z-10">
            <div className="flex justify-between text-xs font-medium text-zinc-400">
              <span>Spent: {formatMoney(spent, settings.currency)}</span>
              <span>Limit: {formatMoney(limit, settings.currency)}</span>
            </div>
            <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div className={`h-full transition-all duration-1000 ${progressColor}`} style={{ width: `${percentUsed}%` }} />
            </div>
          </div>
        </motion.div>

        {/* --- QUICK ACTION: Evaluate --- */}
        <motion.div variants={item} className="md:col-span-4 flex flex-col">
          <Link to="/evaluate" className="flex-1 card p-6 border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-950 hover:border-wali-green/50 transition-all flex flex-col items-center justify-center text-center group min-h-[160px]">
            <div className="w-14 h-14 rounded-full bg-wali-green/10 flex items-center justify-center text-wali-green mb-4 group-hover:scale-110 group-hover:bg-wali-green/20 transition-all">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg text-zinc-200">Evaluate Purchase</h3>
            <p className="text-xs text-zinc-500 mt-1">Consult Wali before buying.</p>
          </Link>
        </motion.div>

        {/* --- VAULT SNAPSHOT --- */}
        <motion.div variants={item} className="md:col-span-12">
          <Link to="/vault" className="card p-5 border-wali-gold/20 bg-wali-gold/5 flex flex-col md:flex-row justify-between items-center gap-4 group hover:border-wali-gold/40 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-wali-gold/10 flex items-center justify-center text-wali-gold shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Wali's Vault</p>
                <p className="text-sm text-zinc-300">You have preserved <span className="text-wali-gold font-bold">{formatMoney(divertedCapital, settings.currency)}</span> from impulse buys.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-wali-gold text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              Enter Vault <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </motion.div>

        {/* --- ANALYTICS: WANTS VS NEEDS --- */}
        <motion.div variants={item} className="md:col-span-12 lg:col-span-6 card p-6 border-zinc-800 bg-zinc-900/20 flex flex-col min-h-[350px]">
          <div className="flex items-center gap-2 mb-8">
            <BarChart3 className="w-5 h-5 text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Wants vs. Needs (6MO)</h2>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 md:gap-4 relative px-2">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              {[...Array(4)].map((_, i) => (<div key={i} className="w-full border-b border-dashed border-zinc-500 flex-1"></div>))}
            </div>
            {sixMonthData.data.map((m, index) => {
              const needsHeight = (m.needs / sixMonthData.maxAmount) * 100
              const wantsHeight = (m.wants / sixMonthData.maxAmount) * 100
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-3 z-10 group">
                  <div className="w-full max-w-[32px] h-[200px] flex flex-col justify-end gap-1">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-zinc-800 text-zinc-200 text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap transition-opacity">
                      Needs: {formatMoney(m.needs, settings.currency)}<br/>Wants: {formatMoney(m.wants, settings.currency)}
                    </div>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${wantsHeight}%` }} transition={{ duration: 0.8, delay: index * 0.1 }} className="w-full bg-wali-warn/80 rounded-t-sm" />
                    <motion.div initial={{ height: 0 }} animate={{ height: `${needsHeight}%` }} transition={{ duration: 0.8, delay: index * 0.1 }} className="w-full bg-wali-green rounded-t-sm" />
                  </div>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase">{m.label}</span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-zinc-800/50">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-wali-green"></div><span className="text-xs text-zinc-400 font-medium">Needs</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-wali-warn/80"></div><span className="text-xs text-zinc-400 font-medium">Wants</span></div>
          </div>
        </motion.div>

        {/* --- ANALYTICS: CATEGORY DONUT --- */}
        <motion.div variants={item} className="md:col-span-12 lg:col-span-6 card p-6 border-zinc-800 bg-zinc-900/20 flex flex-col min-h-[350px]">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Spending By Category</h2>
          </div>
          {categoryData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-8 flex-1 justify-center">
              <div className="relative w-40 h-40 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#27272a" strokeWidth="3"></circle>
                  {categoryData.map((cat, i) => (
                    <motion.circle key={i} initial={{ strokeDasharray: `0 100` }} animate={{ strokeDasharray: cat.dasharray }} transition={{ duration: 1, ease: "easeOut", delay: 0.2 }} cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke={cat.color} strokeWidth="4" strokeDashoffset={cat.dashoffset} className="hover:stroke-[5px] transition-all cursor-pointer"></motion.circle>
                  ))}
                </svg>
              </div>
              <div className="flex-1 w-full space-y-3">
                {categoryData.slice(0, 5).map((cat, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                      <span className="text-zinc-300 font-medium truncate max-w-[100px]">{cat.label}</span>
                    </div>
                    <span className="text-zinc-400 font-bold">{Math.round(cat.percent)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
               <TrendingDown className="w-10 h-10 mb-3 opacity-20" />
               <p className="text-sm">No purchase data to analyze yet.</p>
             </div>
          )}
        </motion.div>

        {/* --- ACTIVE GOALS (To-Buy Preview) --- */}
        <motion.div variants={item} className="md:col-span-12 lg:col-span-6 card p-0 border-zinc-800 bg-zinc-900/20 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-800/60 flex justify-between items-center bg-zinc-900/40">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-wali-gold" />
              <h3 className="font-medium text-zinc-200">Top Priorities</h3>
            </div>
            <Link to="/to-buy" className="text-xs text-zinc-500 hover:text-wali-gold flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="p-5 flex-1 flex flex-col justify-center">
            {activeItems.length > 0 ? (
              <div className="space-y-4">
                {activeItems.map(activeItem => {
                  const itemProgress = activeItem.price > 0 ? Math.min(100, ((activeItem.saved_amount || 0) / activeItem.price) * 100) : 0
                  return (
                    <div key={activeItem.id}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-zinc-300 truncate pr-4">{activeItem.name}</span>
                        <span className="text-zinc-500 font-medium shrink-0">{formatMoney(activeItem.price, settings.currency)}</span>
                      </div>
                      <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
                        <div className="h-full bg-wali-gold transition-all duration-500" style={{ width: `${itemProgress}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Your To-Buy list is empty.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* --- RECENT HISTORY --- */}
        <motion.div variants={item} className="md:col-span-12 lg:col-span-6 card p-0 border-zinc-800 bg-zinc-900/20 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-800/60 flex justify-between items-center bg-zinc-900/40">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-400" />
              <h3 className="font-medium text-zinc-200">Recent Purchases</h3>
            </div>
            <Link to="/history" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
              View Log <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="p-0 flex-1 flex flex-col justify-center divide-y divide-zinc-800/50">
            {recentPurchases.length > 0 ? (
              recentPurchases.map(historyItem => (
                <div key={historyItem.id} className="p-4 flex justify-between items-center hover:bg-zinc-800/20 transition-colors">
                  <div className="truncate pr-4">
                    <p className="text-sm text-zinc-300 truncate">{historyItem.name}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {new Date(historyItem.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-zinc-400 shrink-0">
                    {formatMoney(historyItem.price, settings.currency)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-zinc-500">
                <p className="text-sm">No recent purchases.</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </motion.div>
  )
}