// src/components/HistoryItemCard.jsx
import { Link } from 'react-router-dom'
import { formatMoney } from '../lib/utils'
import { VerdictBadge } from './UI'
import { CalendarDays, ExternalLink, PiggyBank, CheckCircle2, ChevronRight, FileText } from 'lucide-react'
import { useSettings, useEvaluations } from '../hooks/useStorage'

export default function HistoryItemCard({ entry, currency }) {
  const { settings, updateSettings } = useSettings()
  const { updateEvaluation } = useEvaluations()

  const date = new Date(entry.createdAt).toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric' 
  })

  const isBought = entry.purchased
  const progressPercent = Math.min(100, Math.max(0, ((entry.saved_amount || 0) / entry.price) * 100))

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(entry.name + ' best price')}`
  const darazUrl = `https://www.daraz.com.bd/catalog/?q=${encodeURIComponent(entry.name)}`

  // NEW: The Mark as Bought logic
  function handleMarkBought(e) {
    e.preventDefault() // Prevents the link wrapper from triggering
    if (window.confirm(`Mark "${entry.name}" as bought? This will deduct ${formatMoney(entry.price, currency)} from your budget.`)) {
      updateEvaluation(entry.id, { purchased: true })
      updateSettings({ spentSoFar: settings.spentSoFar + entry.price })
    }
  }

  return (
    <div className="card p-0 flex flex-col border-zinc-800 hover:border-zinc-700 transition-all bg-zinc-900/40 relative overflow-hidden group shadow-md">
      
      {/* Clickable Main Area -> Goes to Detail Page */}
      <Link to={`/item/${entry.id}`} className="p-4 md:p-5 block hover:bg-zinc-800/30 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-3 mb-1">
              <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${
                entry.necessity >= 8 ? 'bg-wali-green/10 text-wali-green border-wali-green/20' : 
                entry.necessity >= 5 ? 'bg-wali-gold/10 text-wali-gold border-wali-gold/20' : 
                'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}>
                Necessity: {entry.necessity}/10
              </span>
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" /> {date}
              </span>
            </div>
            
            <h3 className={`text-lg font-display truncate ${isBought ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
              {entry.name}
            </h3>
            
            <div className="flex items-center gap-2">
              <p className="text-sm text-zinc-400 line-clamp-1 italic">
                "{entry.reason || 'No reason provided'}"
              </p>
              {entry.note && <FileText className="w-3.5 h-3.5 text-wali-gold shrink-0" />}
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
            <p className={`text-xl font-bold tracking-tight ${isBought ? 'text-zinc-600' : 'text-zinc-200'}`}>
              {formatMoney(entry.price, currency)}
            </p>
            <VerdictBadge verdict={entry.verdict} />
          </div>
        </div>

        {/* Persistent Progress Bar */}
        {settings.enableSinkingFunds && !isBought && (entry.saved_amount > 0) && (
          <div className="mt-4">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1">
                <PiggyBank className="w-3 h-3"/> Savings Progress
              </span>
              <span className="text-xs font-medium text-zinc-300">
                {formatMoney(entry.saved_amount, currency)} <span className="text-zinc-600">/ {formatMoney(entry.price, currency)}</span>
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${progressPercent >= 100 ? 'bg-wali-green' : 'bg-wali-gold'}`} 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>
        )}
      </Link>

      {/* Quick Actions Bar (Only if not bought) */}
      {!isBought && (
        <div className="flex border-t border-zinc-800/60 bg-zinc-950/30 divide-x divide-zinc-800/60">
          {entry.url ? (
            <a href={entry.url} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 text-xs font-medium text-zinc-300 hover:bg-zinc-800/50 transition-colors flex items-center justify-center gap-1.5">
              Buy Link <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <>
              <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors flex items-center justify-center gap-1.5">
                Google <ExternalLink className="w-3 h-3"/>
              </a>
              <a href={darazUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors flex items-center justify-center gap-1.5">
                Daraz <ExternalLink className="w-3 h-3"/>
              </a>
            </>
          )}
          
          {/* NEW: The Mark as Bought Button */}
          <button onClick={handleMarkBought} className="flex-1 py-3 text-xs font-medium text-wali-green hover:bg-wali-green/10 transition-colors flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Bought
          </button>
          
          <Link to={`/item/${entry.id}`} className="px-4 py-3 text-xs font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors flex items-center justify-center gap-1">
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Fully Funded Badge */}
      {progressPercent >= 100 && !isBought && settings.enableSinkingFunds && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-wali-green bg-wali-green/10 px-2 py-1 rounded border border-wali-green/20 shadow-sm pointer-events-none">
          <CheckCircle2 className="w-3 h-3" /> Funded
        </div>
      )}
    </div>
  )
}