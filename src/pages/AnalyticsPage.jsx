// src/pages/AnalyticsPage.jsx
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useEvaluations, useSettings } from '../hooks/useStorage'
import { formatMoney } from '../lib/utils'
import { BarChart3, PieChart, TrendingDown } from 'lucide-react'

const pageTransition = { 
  initial: { opacity: 0, y: 15 }, 
  animate: { opacity: 1, y: 0 }, 
  exit: { opacity: 0, y: -15 }, 
  transition: { duration: 0.3, ease: 'easeOut' } 
}

// Helper to generate SVG Donut Chart slices
function createDonutSegments(data) {
  let accumulatedPercent = 0
  return data.map(item => {
    const dasharray = `${item.percent} 100`
    const dashoffset = -accumulatedPercent
    accumulatedPercent += item.percent
    return { ...item, dasharray, dashoffset }
  })
}

export default function AnalyticsPage() {
  const { settings } = useSettings()
  const { evaluations } = useEvaluations()

  // Only analyze items that were actually purchased
  const purchasedItems = useMemo(() => evaluations.filter(e => e.purchased), [evaluations])

  // --- CHART 1: WANTS VS NEEDS (Last 6 Months) ---
  const sixMonthData = useMemo(() => {
    const data = []
    const now = new Date()
    let maxAmount = 0

    // Initialize the last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      data.push({ 
        label: d.toLocaleString('en-US', { month: 'short' }), 
        month: d.getMonth(), 
        year: d.getFullYear(), 
        needs: 0, 
        wants: 0 
      })
    }

    // Populate data
    purchasedItems.forEach(item => {
      const itemDate = new Date(item.createdAt)
      const targetMonth = data.find(m => m.month === itemDate.getMonth() && m.year === itemDate.getFullYear())
      
      if (targetMonth) {
        // Assume necessity >= 7 is a "Need", otherwise it's a "Want"
        if (item.necessity >= 7) targetMonth.needs += item.price
        else targetMonth.wants += item.price
      }
    })

    // Find max for scaling the chart height
    data.forEach(d => {
      const total = d.needs + d.wants
      if (total > maxAmount) maxAmount = total
    })

    return { data, maxAmount: maxAmount || 1 } // prevent division by zero
  }, [purchasedItems])


  // --- CHART 2: SPENDING BY CATEGORY ---
  const categoryData = useMemo(() => {
    const totals = {}
    let grandTotal = 0

    purchasedItems.forEach(item => {
      const cat = item.category || 'other'
      totals[cat] = (totals[cat] || 0) + item.price
      grandTotal += item.price
    })

    if (grandTotal === 0) return []

    // Map to array, calculate percentage, and assign brand colors
    const colors = ['#1d9e75', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#f97316', '#14b8a6', '#64748b']
    
    const sorted = Object.keys(totals)
      .map((key, index) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        amount: totals[key],
        percent: (totals[key] / grandTotal) * 100,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount)

    return createDonutSegments(sorted)
  }, [purchasedItems])

  return (
    <motion.div {...pageTransition} className="max-w-4xl mx-auto px-4 md:px-8 pt-6 pb-28 md:pb-12 scroll-area">
      
      <div className="mb-8">
        <h1 className="font-display text-3xl text-zinc-100">Analytics</h1>
        <p className="text-zinc-400 text-sm mt-1">Visualize your spending behavior and habits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- WANTS VS NEEDS BAR CHART --- */}
        <div className="card p-6 border-zinc-800 bg-zinc-900/20 flex flex-col min-h-[350px]">
          <div className="flex items-center gap-2 mb-8">
            <BarChart3 className="w-5 h-5 text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Wants vs. Needs (6MO)</h2>
          </div>

          <div className="flex-1 flex items-end justify-between gap-2 md:gap-4 relative px-2">
            
            {/* Y-Axis Lines (Background) */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-full border-b border-dashed border-zinc-500 flex-1"></div>
              ))}
            </div>

            {/* Bars */}
            {sixMonthData.data.map((m, index) => {
              const needsHeight = (m.needs / sixMonthData.maxAmount) * 100
              const wantsHeight = (m.wants / sixMonthData.maxAmount) * 100
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-3 z-10 group">
                  <div className="w-full max-w-[32px] h-[200px] flex flex-col justify-end gap-1">
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-zinc-800 text-zinc-200 text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap transition-opacity">
                      Needs: {formatMoney(m.needs, settings.currency)}<br/>
                      Wants: {formatMoney(m.wants, settings.currency)}
                    </div>
                    
                    {/* Wants Bar (Top/Orange) */}
                    <motion.div 
                      initial={{ height: 0 }} animate={{ height: `${wantsHeight}%` }} transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="w-full bg-wali-warn/80 rounded-t-sm"
                    />
                    {/* Needs Bar (Bottom/Green) */}
                    <motion.div 
                      initial={{ height: 0 }} animate={{ height: `${needsHeight}%` }} transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="w-full bg-wali-green rounded-t-sm"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase">{m.label}</span>
                </div>
              )
            })}
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-zinc-800/50">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-wali-green"></div><span className="text-xs text-zinc-400 font-medium">Needs</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-wali-warn/80"></div><span className="text-xs text-zinc-400 font-medium">Wants</span></div>
          </div>
        </div>

        {/* --- SPENDING BY CATEGORY DONUT CHART --- */}
        <div className="card p-6 border-zinc-800 bg-zinc-900/20 flex flex-col min-h-[350px]">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Spending By Category</h2>
          </div>

          {categoryData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-8 flex-1 justify-center">
              
              {/* Pure SVG Donut */}
              <div className="relative w-48 h-48 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#27272a" strokeWidth="3"></circle>
                  
                  {/* Data Segments */}
                  {categoryData.map((cat, i) => (
                    <motion.circle
                      key={i}
                      initial={{ strokeDasharray: `0 100` }}
                      animate={{ strokeDasharray: cat.dasharray }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                      cx="18" cy="18" r="15.91549430918954"
                      fill="transparent"
                      stroke={cat.color}
                      strokeWidth="4"
                      strokeDashoffset={cat.dashoffset}
                      className="hover:stroke-[5px] transition-all cursor-pointer"
                    ></motion.circle>
                  ))}
                </svg>
              </div>

              {/* Data List */}
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
        </div>

      </div>
    </motion.div>
  )
}