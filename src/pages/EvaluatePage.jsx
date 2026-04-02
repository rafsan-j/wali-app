import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { evaluateWithWali } from '../lib/gemini'
import { useSettings, useEvaluations } from '../hooks/useStorage'
import { BudgetBar, LoadingDots } from '../components/UI'
import ResultCard from '../components/ResultCard'
import { formatMoney } from '../lib/utils'

const pageTransition = { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -15 }, transition: { duration: 0.3, ease: 'easeOut' } }

const CATEGORIES = [
  { value: 'fashion',       label: 'Fashion / Accessories' },
  { value: 'electronics',   label: 'Electronics / Gadgets' },
  { value: 'food',          label: 'Food / Dining' },
  { value: 'transport',     label: 'Transport' },
  { value: 'health',        label: 'Health / Medicine' },
  { value: 'education',     label: 'Education / Books' },
  { value: 'home',          label: 'Home / Furniture' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other',         label: 'Other' },
]

export default function EvaluatePage() {
  const { settings } = useSettings()
  const { evaluations, addEvaluation } = useEvaluations()

  const [form, setForm] = useState({ name: '', price: '', category: 'fashion', necessity: 5, reason: '', hasDuplicate: false })
  const [loading, setLoading] = useState(false)
  const [entryId, setEntryId] = useState(null)
  const [error, setError]     = useState(null)

  const price     = parseFloat(form.price) || 0
  const remaining = settings.monthlyLimit - settings.spentSoFar
  const blocked   = price > remaining && remaining > 0
  
  // Find the exact active entry in the DB to pass to the ResultCard
  const currentEntry = entryId ? evaluations.find(e => e.id === entryId) : null

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.price || blocked) return

    if (price <= 0) return setError('Price must be greater than 0.')
    if (!form.reason || form.reason.trim().length < 10) return setError('Be honest. Please provide a real reason for Wali to analyze.')
    if (!settings.geminiApiKey) return setError('Add your Gemini API key in Settings first.')

    const duplicateImpulse = evaluations.find(prevEval => 
      prevEval.name.toLowerCase().trim() === form.name.toLowerCase().trim() &&
      prevEval.verdict === 'discourage' &&
      (Date.now() - new Date(prevEval.createdAt).getTime()) < (48 * 60 * 60 * 1000)
    )

    setLoading(true)
    setError(null)

    try {
      const res = await evaluateWithWali({
        apiKey: settings.geminiApiKey,
        model: settings.aiModel || 'gemini-2.5-flash-lite',
        item: { ...form, price, currency: settings.currency, isReEvaluation: !!duplicateImpulse },
      })

      const entry = addEvaluation({
        name: form.name, price, category: form.category, necessity: parseInt(form.necessity), reason: form.reason,
        verdict: res.verdict, category_class: res.category, investment_vehicle: res.investment_vehicle,
        projected_5yr: res.projected_5yr, cooling_hours: res.cooling_hours,
      })

      setEntryId(entry.id)
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setForm({ name: '', price: '', category: 'fashion', necessity: 5, reason: '', hasDuplicate: false })
    setEntryId(null)
    setError(null)
  }

  return (
    <motion.div {...pageTransition} className="max-w-5xl mx-auto px-4 md:px-10 lg:px-12 pt-6 md:pt-12 pb-28 md:pb-12 scroll-area flex justify-center w-full">
      <AnimatePresence mode="wait">
        {!currentEntry ? (
          <motion.div key="form" className="w-full max-w-xl" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
            <div className="mb-6">
              <h1 className="font-display text-3xl text-zinc-100">Wali</h1>
              <p className="text-zinc-400 text-sm mt-1">Your Islamic financial guardian</p>
            </div>

            <div className="card p-5 md:p-6 mb-6 hover:border-zinc-700/50 transition-colors">
              <p className="section-label">Monthly budget</p>
              <BudgetBar spent={settings.spentSoFar} limit={settings.monthlyLimit} currency={settings.currency} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="card p-5 md:p-6 space-y-5 hover:border-zinc-700/50 transition-colors">
                <p className="section-label">Evaluate a purchase</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2 font-medium">Item name</label>
                    <input className="input-base" placeholder="e.g. Mechanical Keyboard" value={form.name} onChange={set('name')} required />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2 font-medium">Price ({settings.currency})</label>
                    <input type="number" className="input-base" placeholder="8500" min="0" value={form.price} onChange={set('price')} required />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-2 font-medium">Category</label>
                  <select className="input-base" value={form.category} onChange={set('category')}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-zinc-400 font-medium">How necessary?</label>
                    <span className="text-sm font-bold text-zinc-200">{form.necessity}<span className="text-zinc-500 font-medium">/10</span></span>
                  </div>
                  <input type="range" min="1" max="10" step="1" value={form.necessity} onChange={set('necessity')} className="w-full accent-wali-green" />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-2 font-medium">Why do you believe you need this right now?</label>
                  <textarea className="input-base resize-none h-24" placeholder="Be honest. Wali is watching." value={form.reason} onChange={set('reason')} />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.hasDuplicate} onChange={set('hasDuplicate')} className="w-4 h-4 accent-wali-green rounded" />
                  <span className="text-xs text-zinc-400 font-medium">I already own something similar</span>
                </label>
              </div>

              {blocked && (
                <div className="rounded-lg px-4 py-3 bg-wali-warn/10 border border-wali-warn/20 text-wali-warn text-sm font-medium">
                  This exceeds your remaining budget of {formatMoney(Math.max(0, remaining), settings.currency)}. Purchase blocked.
                </div>
              )}
              {error && (
                <div className="rounded-lg px-4 py-3 bg-red-950/40 border border-red-800/30 text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary py-4" disabled={loading || blocked}>
                {loading ? <><LoadingDots /><span className="ml-2 text-white/70">Wali is deliberating…</span></> : 'Submit to Wali'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div key="result" className="w-full max-w-4xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <ResultCard entry={currentEntry} onReset={reset} currency={settings.currency} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}