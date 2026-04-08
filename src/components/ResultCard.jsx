import { useState, useEffect } from 'react'
import { CategoryPill, VerdictBadge } from './UI'
import { useSettings, useEvaluations, useTimers } from '../hooks/useStorage'
import { clsx } from 'clsx'
import { formatMoney } from '../lib/utils'
import { Info, ArrowLeft, ExternalLink, ShieldAlert, BrainCircuit, Clock } from 'lucide-react'

const MAQASID_DESCRIPTIONS = {
  Dharuriyyat: "Absolute Necessities. Essential for sustaining life, basic work, or Deen.",
  Hajiyyat: "Complements. Improves quality of life and removes hardship.",
  Tahsiniyyat: "Embellishments. Luxury, status signaling, or pure comfort."
}

export default function ResultCard({ entry, onReset, currency = '৳' }) {
  const { settings, updateSettings } = useSettings()
  const { updateEvaluation } = useEvaluations()
  const { timers, setAppTimer } = useTimers()

  const [isBought, setIsBought] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [remaining, setRemaining] = useState(0)

  // Ironclad logic
  const isApproved = entry.verdict === 'approve'
  const isPending = entry.verdict === 'pending' // Added for the offline/rate-limit state
  const expiresAt = new Date(entry.createdAt).getTime() + ((entry.cooling_hours || 0) * 3_600_000)
  const isLocked = !isApproved && entry.cooling_hours > 0 && Date.now() < expiresAt

  useEffect(() => {
    if (!entry) return
    const evaluations = JSON.parse(localStorage.getItem('wali_evaluations') || '[]')
    if (evaluations.find(e => e.id === entry.id)?.purchased) setIsBought(true)

    // Initialize timer globally if it requires a cooling period
    if (entry.cooling_hours > 0 && !timers[entry.id]) {
      setAppTimer(entry.id, expiresAt)
    }
  }, [entry, timers, setAppTimer, expiresAt])

  useEffect(() => {
    if (!isLocked) return
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt, isLocked])

  if (!entry) return null

  const fv = entry.projected_5yr || Math.round((entry.price || 0) * Math.pow(1.08, 5))

  // Dynamic styling based on verdict (added pending state)
  const theme = {
    approve:    { border: 'border-wali-green/30', bg: 'bg-wali-green/5', text: 'text-wali-green' },
    caution:    { border: 'border-wali-gold/30',  bg: 'bg-wali-gold/5',  text: 'text-wali-gold' },
    discourage: { border: 'border-wali-warn/30',  bg: 'bg-wali-warn/5',  text: 'text-wali-warn' },
    pending:    { border: 'border-zinc-700/50',   bg: 'bg-zinc-800/20',  text: 'text-zinc-400' },
  }[entry.verdict] || { border: 'border-zinc-700/50', bg: 'bg-zinc-800/20', text: 'text-zinc-400' }

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(entry.name + ' best price')}`
  const darazUrl = `https://www.daraz.com.bd/catalog/?q=${encodeURIComponent(entry.name)}`

  return (
    <div className="max-w-2xl mx-auto w-full animate-fade-up">
      <button onClick={onReset} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-sm font-medium mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Evaluate another item
      </button>

      <div className={clsx('card p-0 overflow-hidden shadow-2xl border', theme.border)}>
        
        {/* Section 1: The Context Header */}
        <div className={clsx('p-6 md:p-8 border-b border-zinc-800/60 flex justify-between items-start gap-4', theme.bg)}>
          <div>
            <div className="relative inline-flex items-center gap-2 mb-4">
              <CategoryPill category={entry.category_class || entry.category} />
              {!isPending && (
                <>
                  <button 
                    onMouseEnter={() => setShowTooltip(true)} 
                    onMouseLeave={() => setShowTooltip(false)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  {showTooltip && (
                    <div className="absolute left-0 top-full mt-2 w-64 bg-zinc-800 text-zinc-300 text-[11px] p-3 rounded-lg shadow-xl border border-zinc-700 z-10 leading-relaxed font-medium">
                       <span className="font-bold text-wali-green block mb-1 uppercase tracking-wider">{entry.category_class || entry.category}</span>
                       {MAQASID_DESCRIPTIONS[entry.category_class || entry.category] || "Analyzed by Wali's Maqasid engine."}
                    </div>
                  )}
                </>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-display text-zinc-100 leading-tight">{entry.name}</h2>
          </div>
          
          <div className="text-right shrink-0">
            <p className="text-xl md:text-2xl font-bold text-zinc-200 tracking-tight mb-3">
              {formatMoney(entry.price, currency)}
            </p>
            {isPending ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" /> Pending
              </span>
            ) : (
              <VerdictBadge verdict={entry.verdict} />
            )}
          </div>
        </div>

        {/* Section 2: Wali's Counsel (Hidden if pending) */}
        {!isPending && (
          <div className="p-6 md:p-8 bg-zinc-900/40 relative">
            <span className="absolute top-4 left-4 text-7xl font-display text-zinc-800/30 leading-none select-none pointer-events-none">"</span>
            
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest mb-4 relative z-10">Wali's Counsel</p>
            {/* Dynamic AI Argument injected here */}
            <p className="text-lg md:text-xl text-zinc-300 font-display italic leading-relaxed relative z-10">
              "{entry.argument}"
            </p>

            {(entry.israf_flag || entry.nafs_flag) && (
              <div className="flex gap-3 mt-6 relative z-10">
                {entry.israf_flag && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-md bg-wali-warn/10 text-wali-warn border border-wali-warn/20 font-bold uppercase tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5" /> Israf Detected
                  </span>
                )}
                {entry.nafs_flag && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold uppercase tracking-wider">
                    <BrainCircuit className="w-3.5 h-3.5" /> Nafs-Driven
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Section 3: The Opportunity Cost (Hidden if Approved or Pending) */}
        {!isApproved && !isPending && (
          <div className="p-6 md:p-8 bg-zinc-950/50 flex flex-col md:flex-row md:items-center justify-between gap-6 border-y border-zinc-800/60 shadow-inner">
            <div>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest mb-1.5">Opportunity Cost</p>
              <p className="text-sm text-zinc-400 font-medium">If redirected into <span className="text-zinc-200">{entry.investment_vehicle || 'Halal Savings'}</span></p>
            </div>
            <div className="md:text-right">
              <p className="font-display text-3xl md:text-4xl tracking-tight text-wali-green">
                {formatMoney(fv, currency)}
              </p>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest mt-1">Value in 5 Years (8% Halal)</p>
            </div>
          </div>
        )}

        {/* Section 4: Action & Lock Area */}
        <div className="p-6 md:p-8 bg-zinc-900/30">
          {isPending ? (
            <div className="text-center py-2 animate-fade-in">
              <p className="text-sm text-zinc-300 font-medium">Added to your To-Buy list.</p>
              <p className="text-xs text-zinc-500 mt-1">Wali will analyze this in the background once systems are available.</p>
            </div>
          ) : isLocked ? (
            <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800 text-center shadow-inner">
              <p className="text-xs text-zinc-400 font-medium mb-3">Wali has mandated a {entry.cooling_hours}-hour reflection period.</p>
              <div className="font-display text-4xl tracking-widest text-wali-gold flex justify-center gap-1.5 mb-2">
                <span>{String(Math.floor(remaining / 3600000)).padStart(2, '0')}</span><span className="text-zinc-700 opacity-50">:</span>
                <span>{String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0')}</span><span className="text-zinc-700 opacity-50">:</span>
                <span>{String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}</span>
              </div>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-4">Purchase links disabled</p>
            </div>
          ) : isBought ? (
            <div className="w-full py-4 rounded-xl bg-zinc-950 border border-zinc-800 text-wali-green text-sm font-medium text-center flex items-center justify-center gap-2">
              ✓ Deducted from budget
            </div>
          ) : entry.verdict === 'discourage' ? (
            <div className="text-center py-2 animate-fade-in">
              <p className="text-sm text-wali-warn font-medium">Wali advises against this purchase.</p>
              <p className="text-xs text-zinc-500 mt-1">This item has been saved to your History. Revisit it if your circumstances change.</p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">
                {isApproved ? 'Permitted. Proceed with intention.' : 'Reflection complete. The choice is yours.'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-4 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors">
                  Google <ExternalLink className="w-4 h-4"/>
                </a>
                <a href={darazUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-4 rounded-lg border border-wali-gold/30 text-wali-gold text-sm font-medium hover:bg-wali-gold/10 transition-colors">
                  Daraz <ExternalLink className="w-4 h-4"/>
                </a>
              </div>
              
              <button 
                onClick={() => { 
                  updateEvaluation(entry.id, { purchased: true }); 
                  updateSettings({ spentSoFar: settings.spentSoFar + entry.price }); 
                  setIsBought(true); 
                }} 
                className="btn-primary mt-2 shadow-lg shadow-wali-green/10"
              >
                Mark as Bought
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}