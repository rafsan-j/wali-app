import { useState } from 'react'
import { evaluateWithWali } from '../lib/gemini'
import { useSettings, useEvaluations } from '../hooks/useStorage'
import { BudgetBar, LoadingDots } from '../components/UI'
import ResultCard from '../components/ResultCard'

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
  const { addEvaluation } = useEvaluations()

  const [form, setForm] = useState({
    name:         '',
    price:        '',
    category:     'fashion',
    necessity:    5,
    reason:       '',
    hasDuplicate: false,
  })
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [entryId,  setEntryId]  = useState(null)
  const [error,    setError]    = useState(null)

  const price     = parseFloat(form.price) || 0
  const remaining = settings.monthlyLimit - settings.spentSoFar
  const blocked   = price > remaining && remaining > 0

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.price) return
    if (blocked) return

    if (!settings.geminiApiKey) {
      setError('Add your Gemini API key in Settings first.')
      return
    }

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await evaluateWithWali({
        apiKey: settings.geminiApiKey,
        item:   { ...form, price, currency: settings.currency },
      })

      const entry = addEvaluation({
        name:     form.name,
        price,
        category: form.category,
        necessity: parseInt(form.necessity),
        reason:   form.reason,
        verdict:  res.verdict,
        category_class: res.category,
        investment_vehicle: res.investment_vehicle,
        projected_5yr: res.projected_5yr,
        cooling_hours: res.cooling_hours,
      })

      setResult(res)
      setEntryId(entry.id)
    } catch (err) {
      const msg = err.message || ''
      if (msg === 'QUOTA_EXCEEDED') {
        setError('Quota limit hit. Go to aistudio.google.com/app/apikey → Create API key in a NEW project → paste it in Settings.')
      } else if (msg === 'INVALID_KEY') {
        setError('Invalid API key. Check Settings — it should start with AIza.')
      } else if (msg === 'NO_API_KEY') {
        setError('No API key set. Go to Settings and add your Gemini API key.')
      } else {
        setError(msg || 'Something went wrong. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setForm({ name: '', price: '', category: 'fashion', necessity: 5, reason: '', hasDuplicate: false })
    setResult(null)
    setEntryId(null)
    setError(null)
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28 scroll-area">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl text-zinc-100">Wali</h1>
        <p className="text-zinc-400 text-sm mt-1">Your Islamic financial guardian</p>
      </div>

      {/* Budget snapshot */}
      <div className="card p-4 mb-4">
        <p className="section-label">Monthly budget</p>
        <BudgetBar spent={settings.spentSoFar} limit={settings.monthlyLimit} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-5 space-y-4">
          <p className="section-label">Evaluate a purchase</p>

          {/* Name & price row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Item name</label>
              <input
                className="input-base"
                placeholder="e.g. Fossil watch"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Price ({settings.currency})</label>
              <input
                type="number"
                className="input-base"
                placeholder="8500"
                min="0"
                value={form.price}
                onChange={set('price')}
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Category</label>
            <select className="input-base" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Necessity slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-zinc-400">How necessary?</label>
              <span className="text-sm font-medium text-zinc-200">{form.necessity}<span className="text-zinc-500">/10</span></span>
            </div>
            <input
              type="range" min="1" max="10" step="1"
              value={form.necessity}
              onChange={set('necessity')}
              className="w-full accent-wali-green"
            />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
              <span>Pure luxury</span>
              <span>Essential</span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              Why do you believe you need this right now?
            </label>
            <textarea
              className="input-base resize-none h-20"
              placeholder="Be honest. Wali is watching."
              value={form.reason}
              onChange={set('reason')}
            />
          </div>

          {/* Duplicate checkbox */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasDuplicate}
              onChange={set('hasDuplicate')}
              className="w-4 h-4 accent-wali-green"
            />
            <span className="text-xs text-zinc-400">I already own something similar</span>
          </label>
        </div>

        {/* Budget block warning */}
        {blocked && (
          <div className="rounded-xl px-4 py-3 bg-wali-warn/10 border border-wali-warn/20 text-wali-warn text-sm">
            This exceeds your remaining budget of {settings.currency}{Math.max(0, remaining).toLocaleString()}. Purchase blocked.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl px-4 py-3 bg-red-950/40 border border-red-800/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        {!result ? (
          <button type="submit" className="btn-primary" disabled={loading || blocked}>
            {loading ? <><LoadingDots /><span className="ml-2 text-white/60">Wali is deliberating…</span></> : 'Ask Wali →'}
          </button>
        ) : (
          <button type="button" onClick={reset} className="btn-primary bg-zinc-800 hover:bg-zinc-700">
            Evaluate another →
          </button>
        )}
      </form>

      {/* Result */}
      {result && (
        <div className="mt-4">
          <ResultCard
            result={result}
            item={{ ...form, price }}
            entryId={entryId}
            currency={settings.currency}
          />
        </div>
      )}
    </div>
  )
}
