import { useState, useEffect } from 'react'
import { CategoryPill, VerdictBadge } from './UI'
import { setTimer, isTimerExpired } from '../lib/storage'
import { clsx } from 'clsx'

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
  const [showBuyLink, setShowBuyLink] = useState(false)
  const [expiresAt, setExpiresAt]     = useState(null)

  useEffect(() => {
    if (!result || !entryId) return
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

  if (!result) return null

  const fv = result.projected_5yr || Math.round(item.price * Math.pow(1.08, 5))

  const verdictColor = {
    approve:    'border-wali-green/30 bg-wali-green/5',
    caution:    'border-wali-gold/30 bg-wali-gold/5',
    discourage: 'border-wali-warn/30 bg-wali-warn/5',
  }[result.verdict]

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(item.name + ' best price Bangladesh')}`

  return (
    <div className={clsx('card border animate-fade-up overflow-hidden', verdictColor)}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
        <div>
          <CategoryPill category={result.category} />
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
          {currency}{fv.toLocaleString()}
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Value in 5 years at 8% annual Halal return.{' '}
          <span className="text-zinc-500">Your {currency}{item.price.toLocaleString()} working, not spent.</span>
        </p>
      </div>

      {/* Cooling timer or buy link */}
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
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
              {result.cooling_hours > 0 ? 'Reflection complete — proceed with intention' : 'If you choose to proceed'}
            </p>
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find best price for "{item.name}"
            </a>
          </div>
        ) : null}
      </div>
    </div>
  )
}
