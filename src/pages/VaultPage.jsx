// src/pages/VaultPage.jsx
import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEvaluations, useSettings } from '../hooks/useStorage'
import { formatMoney } from '../lib/utils'
import { ShieldCheck, TrendingUp, Landmark, Gem, HeartHandshake, Briefcase, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const pageTransition = { 
  initial: { opacity: 0, y: 15 }, 
  animate: { opacity: 1, y: 0 }, 
  exit: { opacity: 0, y: -15 }, 
  transition: { duration: 0.3 } 
}

const INVESTMENT_ROUTES = [
  { icon: Gem, label: "Digital Gold/Silver", desc: "Preserve value in physical assets via micro-savings apps." },
  { icon: Landmark, label: "Shariah Mutual Funds", desc: "Pool money into professionally managed, interest-free portfolios." },
  { icon: HeartHandshake, label: "Sadaqah Jariyah", desc: "Invest in your Akhirah through sustainable charity projects." },
  { icon: Briefcase, label: "Trade Capital", desc: "Use small savings to fund a micro-business or inventory for trade." },
]

export default function VaultPage() {
  const { settings } = useSettings()
  const { evaluations } = useEvaluations()
  const navigate = useNavigate()

  const divertedItems = useMemo(() => {
    return evaluations.filter(e => e.diverted).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [evaluations])

  const stats = useMemo(() => {
    const capital = divertedItems.reduce((sum, item) => sum + item.price, 0)
    const projected = divertedItems.reduce((sum, item) => sum + (item.projected_5yr || (item.price * Math.pow(1.08, 5))), 0)
    return { capital, projected }
  }, [divertedItems])

  return (
    <motion.div {...pageTransition} className="max-w-4xl mx-auto px-4 md:px-8 pt-6 pb-28 md:pb-12 scroll-area">
      
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-display text-3xl text-zinc-100 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-wali-gold" /> Wali's Vault
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Your preserved wealth and conquered desires.</p>
        </div>
      </div>

      {/* Hero Stats (The Screenshot Elements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="card p-6 border-wali-green/20 bg-wali-green/5">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Redirected Capital</p>
          <h2 className="text-4xl font-display text-wali-green">{formatMoney(stats.capital, settings.currency)}</h2>
          <p className="text-xs text-zinc-500 mt-2">Capital preserved from impulse buys.</p>
        </div>
        <div className="card p-6 border-wali-gold/20 bg-wali-gold/5">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">5-Year Projection</p>
          <h2 className="text-4xl font-display text-wali-gold">{formatMoney(stats.projected, settings.currency)}</h2>
          <p className="text-xs text-zinc-500 mt-2">Potential growth at 8% Halal return.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left: The "Trophy Room" (Diverted Items) */}
        <div className="md:col-span-7 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">Conquered Nafs</h3>
          <AnimatePresence mode="popLayout">
            {divertedItems.length > 0 ? (
              divertedItems.map(item => (
                <motion.div 
                  key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="card p-4 flex justify-between items-center border-zinc-800 bg-zinc-900/20"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{item.name}</p>
                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">Avoided on {new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-400">{formatMoney(item.price, settings.currency)}</p>
                    <p className="text-[10px] text-wali-gold font-bold">Projected: {formatMoney(item.projected_5yr, settings.currency)}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl">
                <p className="text-zinc-600 text-sm italic">The vault is currently empty.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Shariah Investment Guidance */}
        <div className="md:col-span-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">Diversion Routes</h3>
          <div className="space-y-3">
            {INVESTMENT_ROUTES.map((route, i) => (
              <div key={i} className="card p-4 border-zinc-800 bg-zinc-950/50 group hover:border-wali-gold/30 transition-colors">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-wali-gold shrink-0 group-hover:scale-110 transition-transform">
                    <route.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-200 mb-1">{route.label}</p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">{route.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  )
}