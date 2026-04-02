import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useEvaluations, useSettings } from '../hooks/useStorage'
import { VerdictBadge, CategoryPill, EmptyState } from '../components/UI'
import { formatMoney } from '../lib/utils'
import { Trash2, ExternalLink } from 'lucide-react'

const pageTransition = { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -15 }, transition: { duration: 0.3, ease: 'easeOut' } }

function HistoryItem({ entry, onDelete, onMarkBought, currency }) {
  const [remaining, setRemaining] = useState(0)
  
  const isApproved = entry.verdict === 'approve'
  const expiresAt = new Date(entry.createdAt).getTime() + ((entry.cooling_hours || 0) * 3_600_000)
  const isLocked = !isApproved && entry.cooling_hours > 0 && Date.now() < expiresAt

  useEffect(() => {
    if (!isLocked) return
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt, isLocked])

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(entry.name + ' best price Bangladesh')}`

  return (
    <div className="card p-5 animate-fade-up hover:border-zinc-700/50 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-zinc-100 font-medium text-sm truncate">{entry.name}</p>
          <p className="text-zinc-500 text-[11px] mt-1 font-medium">{new Date(entry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className="text-zinc-200 text-sm font-bold tracking-wide">{formatMoney(entry.price, currency)}</p>
          <VerdictBadge verdict={entry.verdict} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/60">
        <CategoryPill category={entry.category_class || entry.category} />
        <button onClick={() => onDelete(entry.id)} className="text-zinc-600 hover:text-red-400 p-1.5 rounded-md hover:bg-red-400/10 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-800/60 h-[68px] flex flex-col justify-center">
        {isLocked ? (
          <div className="bg-zinc-950 rounded-lg p-2.5 border border-zinc-800 text-center">
            <p className="text-wali-gold font-display text-lg tracking-widest leading-none">
              {String(Math.floor(remaining / 3600000)).padStart(2, '0')}:
              {String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0')}:
              {String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}
            </p>
          </div>
        ) : entry.purchased ? (
          <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800 text-center">
             <span className="text-wali-green text-[11px] font-bold uppercase tracking-widest flex justify-center items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-wali-green" /> Marked as Purchased
             </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 h-full">
            <button onClick={() => onMarkBought(entry)} className="flex-1 h-full rounded-lg bg-wali-green text-white text-[11px] font-bold uppercase tracking-wider hover:bg-wali-green/90 transition-colors">
              Mark Bought
            </button>
            <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="h-full px-4 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center" title="Google Search">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const { evaluations, removeEvaluation, updateEvaluation } = useEvaluations()
  const { settings, updateSettings } = useSettings()

  const handleMarkBought = (entry) => {
    updateEvaluation(entry.id, { purchased: true })
    updateSettings({ spentSoFar: settings.spentSoFar + entry.price })
  }

  return (
    <motion.div {...pageTransition} className="max-w-5xl mx-auto px-4 md:px-10 lg:px-12 pt-6 md:pt-12 pb-28 md:pb-12 scroll-area">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-zinc-100">History</h1>
          <p className="text-zinc-400 text-sm mt-1">Your past evaluations and reflection periods</p>
        </div>

        {evaluations.length === 0 ? (
          <EmptyState icon="📋" title="No evaluations yet" subtitle="Your history and reflection timers will appear here." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluations.map(entry => (
              <HistoryItem key={entry.id} entry={entry} onDelete={removeEvaluation} onMarkBought={handleMarkBought} currency={settings.currency} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}