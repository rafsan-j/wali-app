import { useState, useEffect } from 'react'
import { CategoryPill, VerdictBadge } from './UI'
import { setTimer } from '../lib/storage'
import { useSettings, useEvaluations } from '../hooks/useStorage'
import { clsx } from 'clsx'
import { formatMoney } from '../lib/utils'

// NEW: Maqasid Definitions Dictionary
const MAQASID_DESCRIPTIONS = {
  Dharuriyyat: "Absolute Necessities. Essential for sustaining life, basic work, or Deen (e.g., groceries, medicine).",
  Hajiyyat: "Complements. Improves quality of life and removes hardship, but life continues without it.",
  Tahsiniyyat: "Embellishments. Luxury, status signaling, or pure comfort beyond genuine need."
}

function CountdownTimer({ expiresAt }) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, expiresAt - Date.now())
      setRemaining(diff)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const h = Math.floor(remaining / 3_600_000)
  const m = Math.floor((remaining % 3_600_000) / 60_000)
  const s = Math.floor((remaining % 60_000) / 1_000)

  if (remaining === 0) return (
    <p className="text-wali-green text-sm font-medium">Cooling period complete. Proceed with intention.</p>
  )

  return (
    <div className="flex items-center gap-2">
      {[h, m, s].map((val, i) => (
        <span key={i} className="flex flex-col items-center">
          <span className="font-display text-2xl text-zinc-100 tabular-nums">{String(val).padStart(2, '0')}</span>
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{['hr','min','sec'][i]}</span>
        </span>
      )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, <span key={`sep-${i}`} className="text-zinc-600 font-display text-xl mb-3">:</span>, el], [])}
    </div>
  )
}

export default function ResultCard({ result, item, entryId, currency = '৳' }) {
  const { settings, updateSettings } = useSettings()
  const { updateEvaluation } = useEvaluations()

  const [showBuyLink, setShowBuyLink] = useState(false)
  const [expiresAt, setExpiresAt]     = useState(null)
  const [isBought, setIsBought]       = useState(false)
  const [showTooltip, setShowTooltip] = useState(false) // NEW: Tooltip state

  useEffect(() => {
    if (!result || !entryId) return
    
    const evaluations = JSON.parse(localStorage.getItem('wali_evaluations') || '[]')
    const currentEval = evaluations.find(e => e.id === entryId)
    if (currentEval?.purchased) {
      setIsBought(true)
    }

    if (result.cooling_hours > 0) {
      const timers = JSON.parse(localStorage.getItem('wali_timers') || '{}')
      if (timers[entryId]) {
        setExpiresAt(timers[entryId])
        setShowBuyLink(Date.now() >= timers[entryId])
      } else {
        const exp = Date.now() + result.cooling_hours * 3_600_000
        setTimer(entryId, exp)
        setExpiresAt(exp)
        setShowBuyLink(false)
      }
    } else {
      setShowBuyLink(true)
    }
  }, [result, entryId])

  const handleMarkBought = () => {
    if (isBought) return
    updateEvaluation(entryId, { purchased: true })
    updateSettings({ spentSoFar: settings.spentSoFar + item.price })
    setIsBought(true)
  }

  if (!result) return null

  const fv = result.projected_5yr || Math.round(item.price * Math.pow(1.08, 5))

  const verdictColor = {
    approve:    'border-wali-green/30 bg-wali-green/5',
    caution:    'border-wali-gold/30 bg-wali-gold/5',
    discourage: 'border-wali-warn/30 bg-wali-warn/5',
  }[result.verdict]

  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(item.name + ' best price Bangladesh')}`
  const darazUrl = `https://www.daraz.com.bd/catalog/?q=${encodeURIComponent(item.name)}`

  return (
    <div className={clsx('card border animate-fade-up overflow-hidden', verdictColor)}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
        <div>
          {/* NEW: Interactive Category Tooltip */}
          <div className="relative inline-flex items-center gap-2">
            <CategoryPill category={result.category} />
            <button 
              onMouseEnter={() => setShowTooltip(true)} 
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {showTooltip && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-zinc-800 text-zinc-300 text-[11px] p-3 rounded-lg shadow-xl border border-zinc-700 z-10 leading-relaxed">
                 <span className="font-medium text-wali-green block mb-1">{result.category}</span>
                 {MAQASID_DESCRIPTIONS[result.category] || "Analyzed by Wali's Maqasid engine."}
              </div>
            )}
          </div>

          <div className="mt-2.5">
            <VerdictBadge verdict={result.verdict} />
          </div>
        </div>
        <div className="flex gap-1.5">
          {result.israf_flag && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-wali-warn/10 text-wali-warn border border-wali-warn/20">Israf</span>
          )}
          {result.nafs_flag && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300 border border-zinc-600">Nafs</span>
          )}
        </div>
      </div>

      {/* Wali's argument */}
      <div className="px-5 pb-4 border-t border-zinc-800">
        <p className="text-zinc-300 text-sm leading-relaxed italic mt-4">
          "{result.argument}"
        </p>
        <p className="text-zinc-600 text-xs mt-2">— Wali</p>
      </div>

      {/* Investment alternative */}
      <div className="mx-5 mb-4 bg-zinc-800/60 rounded-xl p-4 border border-zinc-700/50">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
          Instead — {result.investment_vehicle}
        </p>
        <p className="font-display text-2xl text-wali-green">
          {formatMoney(fv, currency)}
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Value in 5 years at 8% annual Halal return.{' '}
          <span className="text-zinc-500">Your {formatMoney(item.price, currency)} working, not spent.</span>
        </p>
      </div>

      {/* Cooling timer or buy links */}
      <div className="px-5 pb-5 border-t border-zinc-800 pt-4">
        {result.cooling_hours > 0 && expiresAt && !showBuyLink ? (
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
              Reflection period — {result.cooling_hours}h
            </p>
            <CountdownTimer expiresAt={expiresAt} />
            <p className="text-zinc-500 text-xs mt-3">
              The purchase link unlocks after this period. Use this time for Istikharah.
            </p>
          </div>
        ) : showBuyLink ? (
          <div className="space-y-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
              {result.cooling_hours > 0 ? 'Reflection complete — proceed with intention' : 'If you choose to proceed'}
            </p>
            
            <div className="flex gap-2">
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors"
              >
                Google Search
              </a>
              <a
                href={darazUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-wali-gold/30 text-wali-gold text-sm hover:bg-wali-gold/10 transition-colors"
              >
                Daraz
              </a>
            </div>

            {!isBought ? (
              <button 
                onClick={handleMarkBought}
                className="w-full py-3 rounded-xl bg-wali-green text-white text-sm font-medium hover:bg-wali-green/90 transition-colors mt-2"
              >
                Mark as Bought
              </button>
            ) : (
              <div className="w-full py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-wali-green text-sm font-medium text-center mt-2 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Deducted from budget
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}