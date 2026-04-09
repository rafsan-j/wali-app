// src/components/ResultCard.jsx
import { useState, useEffect } from 'react'
import { CategoryPill } from './UI'
import { useEvaluations, useTimers } from '../hooks/useStorage'
import { formatMoney } from '../lib/utils'
import { ArrowLeft, ExternalLink, ShieldAlert, BrainCircuit, Clock, ShieldCheck, TrendingUp, CheckCircle2 } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export default function ResultCard({ entry, onReset, currency = '৳' }) {
  const { updateEvaluation } = useEvaluations()
  const { timers, setAppTimer } = useTimers()
  const { addToast } = useToast()

  const [isDiverted, setIsDiverted] = useState(false)
  const [remaining, setRemaining] = useState(0)

  const isApproved = entry?.verdict === 'approve'
  const isPending = entry?.verdict === 'pending'
  const expiresAt = new Date(entry?.createdAt || Date.now()).getTime() + ((entry?.cooling_hours || 0) * 3_600_000)
  const isLocked = !isApproved && (entry?.cooling_hours > 0) && Date.now() < expiresAt

  useEffect(() => {
    if (!entry) return
    const evaluations = JSON.parse(localStorage.getItem('wali_evaluations') || '[]')
    const current = evaluations.find(e => e.id === entry.id)
    if (current?.diverted) setIsDiverted(true)

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

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(entry.name + ' best price')}`
  const darazUrl = `https://www.daraz.com.bd/catalog/?q=${encodeURIComponent(entry.name)}`

  const handleVaultRedirect = () => {
    updateEvaluation(entry.id, { diverted: true })
    setIsDiverted(true)
    addToast('Capital Secured in Vault!', 'vault')
  }

  return (
    <div className="max-w-2xl mx-auto w-full animate-fade-up">
      
      {/* Top Navigation */}
      <button onClick={onReset} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-xs font-medium uppercase tracking-widest mb-10 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Evaluate another item
      </button>

      {/* Main Content Area */}
      <div className="px-2 md:px-6">
        
        {/* Header: Title & Price */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="mb-4">
              <CategoryPill category={entry.category_class || entry.category} />
            </div>
            <h2 className="text-4xl md:text-5xl font-display text-zinc-100 leading-none tracking-tight">
              {entry.name}
            </h2>
          </div>
          <div className="md:text-right shrink-0">
            <p className="text-3xl md:text-4xl font-bold text-zinc-200 tracking-tight mb-3">
              {formatMoney(entry.price, currency)}
            </p>
            {isPending ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <Clock className="w-3.5 h-3.5" /> Pending Analysis
              </span>
            ) : isApproved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-wali-green/10 border border-wali-green/30 text-[10px] font-bold uppercase tracking-widest text-wali-green">
                 <CheckCircle2 className="w-3.5 h-3.5" /> Permitted
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-wali-warn/10 border border-wali-warn/30 text-[10px] font-bold uppercase tracking-widest text-wali-warn">
                 <ShieldAlert className="w-3.5 h-3.5" /> Discouraged
              </span>
            )}
          </div>
        </div>

        {/* Body: Wali's Counsel */}
        {!isPending && (
          <div className="py-8 border-y border-zinc-800/40 relative">
            <p className="text-2xl md:text-3xl text-zinc-300 font-display italic leading-snug">
              "{entry.argument}"
            </p>

            {/* Warning Flags */}
            {(entry.israf_flag || entry.nafs_flag) && (
              <div className="flex flex-wrap gap-3 mt-6">
                {entry.israf_flag && (
                  <span className="px-3 py-1.5 rounded-lg bg-wali-warn/10 border border-wali-warn/30 text-wali-warn text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> Israf (Excess)
                  </span>
                )}
                {entry.nafs_flag && (
                  <span className="px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4" /> Nafs-Driven
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Counter Offer */}
        {!isApproved && !isPending && (
          <div className="py-8 border-b border-zinc-800/40 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3 text-zinc-400">
              <TrendingUp className="w-5 h-5 text-wali-gold" />
              <p className="text-sm">
                Redirect to <span className="text-zinc-200 font-medium">{entry.investment_vehicle || 'Halal Savings'}</span>
              </p>
            </div>
            <p className="text-lg text-wali-gold font-light tracking-wide">
              <span className="font-bold">{formatMoney(fv, currency)}</span> in 5 years
            </p>
          </div>
        )}

        {/* Action Area */}
        <div className="pt-10">
          {isPending ? (
            <div className="text-center">
              <p className="text-zinc-400 font-medium">Item saved to your list.</p>
              <p className="text-sm text-zinc-600 mt-1">Wali will analyze this when connectivity is restored.</p>
            </div>
          ) : isLocked ? (
            <div className="flex flex-col items-center">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-4">Mandatory Reflection</p>
              <div className="font-display text-5xl tracking-widest text-zinc-300 flex justify-center gap-2 mb-8 opacity-80">
                <span>{String(Math.floor(remaining / 3600000)).padStart(2, '0')}</span><span className="text-zinc-700 opacity-50">:</span>
                <span>{String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0')}</span><span className="text-zinc-700 opacity-50">:</span>
                <span>{String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}</span>
              </div>
              <button 
                onClick={handleVaultRedirect} 
                className="w-full sm:w-auto px-10 py-4 rounded-full border border-wali-gold/30 text-wali-gold hover:bg-wali-gold/10 text-sm font-bold transition-colors flex justify-center items-center gap-2"
              >
                <ShieldCheck className="w-5 h-5"/> Conquer Nafs & Send to Vault
              </button>
            </div>
          ) : isDiverted ? (
            <div className="text-center py-6 text-wali-gold animate-fade-in">
              <ShieldCheck className="w-10 h-10 mx-auto mb-4 opacity-80"/>
              <p className="text-xl font-display">Secured in Wali's Vault</p>
            </div>
          ) : entry.verdict === 'discourage' ? (
            <div className="space-y-6 animate-fade-in text-center flex flex-col items-center">
              <p className="text-zinc-400 font-medium text-sm">Wali advises against this purchase.</p>

              <button 
                onClick={handleVaultRedirect} 
                className="w-full py-4 rounded-xl bg-wali-gold text-zinc-950 hover:bg-yellow-500 text-sm font-bold tracking-wide transition-colors flex justify-center items-center gap-2 shadow-lg shadow-wali-gold/20 mt-2"
              >
                <ShieldCheck className="w-5 h-5"/> Send Capital to Vault
              </button>
            </div>
          ) : (
            <div className="animate-fade-in flex flex-col items-center">
              <p className="text-sm text-zinc-400 font-medium mb-6">Permitted. Proceed with intention.</p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-300 text-sm font-medium hover:bg-zinc-800 hover:text-white transition-all">
                  Search Google <ExternalLink className="w-4 h-4"/>
                </a>
                <a href={darazUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-300 text-sm font-medium hover:bg-zinc-800 hover:text-white transition-all">
                  Search Daraz <ExternalLink className="w-4 h-4"/>
                </a>
              </div>
              
              <button 
                onClick={handleVaultRedirect} 
                className="w-full mt-4 py-3.5 rounded-xl border border-wali-gold/30 bg-wali-gold/5 text-wali-gold hover:bg-wali-gold/15 text-sm font-medium transition-all flex justify-center items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4"/> Actually, I'll send this to the Vault
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}