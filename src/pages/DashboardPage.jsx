// src/pages/DashboardPage.jsx
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSettings, useEvaluations } from '../hooks/useStorage'
import { formatMoney } from '../lib/utils'
import { Scale, PiggyBank, History, ChevronRight, AlertTriangle, TrendingUp } from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.4 } }
}

export default function DashboardPage() {
  const { settings } = useSettings()
  const { evaluations } = useEvaluations()

  // 1. Calculate Budget Stats
  const limit = settings.monthlyLimit || 0
  const spent = settings.spentSoFar || 0
  const remaining = Math.max(0, limit - spent)
  const percentUsed = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
  
  // Dynamic color for the budget progress bar
  const progressColor = percentUsed > 90 ? 'bg-red-500' : percentUsed > 75 ? 'bg-wali-warn' : 'bg-wali-green'

  // 2. Calculate Active Goals (To-Buy List snapshot)
  const activeItems = useMemo(() => {
    return evaluations
      .filter(e => !e.purchased)
      .sort((a, b) => (a.custom_order ?? 999) - (b.custom_order ?? 999))
      .slice(0, 3) // Get top 3 priority items
  }, [evaluations])

  // Calculate total savings progress across all active items
  const totalSaved = activeItems.reduce((sum, item) => sum + (item.saved_amount || 0), 0)
  const totalTarget = activeItems.reduce((sum, item) => sum + item.price, 0)
  const totalSavingsPercent = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  // 3. Calculate Recent Purchases
  const recentPurchases = useMemo(() => {
    return evaluations
      .filter(e => e.purchased)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3) // Get last 3
  }, [evaluations])

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto px-4 md:px-8 pt-6 pb-28 md:pb-12 scroll-area">
      
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <h1 className="font-display text-3xl text-zinc-100 tracking-wide">Assalamu Alaikum.</h1>
        <p className="text-zinc-400 text-sm mt-1">Here is your financial overview for this cycle.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* --- MAIN HERO: Budget Tracker --- */}
        <motion.div variants={item} className="md:col-span-8 card p-6 md:p-8 border-zinc-800 bg-zinc-900/40 relative overflow-hidden group">
          {/* Decorative background blur */}
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

        {/* --- ACTIVE GOALS (To-Buy Preview) --- */}
        <motion.div variants={item} className="md:col-span-6 card p-0 border-zinc-800 bg-zinc-900/20 overflow-hidden flex flex-col">
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
                {activeItems.map(item => {
                  const itemProgress = item.price > 0 ? Math.min(100, ((item.saved_amount || 0) / item.price) * 100) : 0
                  return (
                    <div key={item.id}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-zinc-300 truncate pr-4">{item.name}</span>
                        <span className="text-zinc-500 font-medium shrink-0">{formatMoney(item.price, settings.currency)}</span>
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
        <motion.div variants={item} className="md:col-span-6 card p-0 border-zinc-800 bg-zinc-900/20 overflow-hidden flex flex-col">
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
              recentPurchases.map(item => (
                <div key={item.id} className="p-4 flex justify-between items-center hover:bg-zinc-800/20 transition-colors">
                  <div className="truncate pr-4">
                    <p className="text-sm text-zinc-300 truncate">{item.name}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-zinc-400 shrink-0">
                    {formatMoney(item.price, settings.currency)}
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