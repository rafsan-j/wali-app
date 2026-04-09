// src/pages/EvaluatePage.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { evaluateWithWali } from '../lib/gemini'
import { useSettings, useEvaluations } from '../hooks/useStorage'
import { BudgetBar, LoadingDots } from '../components/UI'
import ResultCard from '../components/ResultCard'
import { formatMoney } from '../lib/utils'
import { ShoppingBag, Tag, FolderOpen, Target, MessageSquare, AlertCircle, Copy, Key, BrainCircuit } from 'lucide-react'
import { Link } from 'react-router-dom'

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
  
  // Check if API key is missing
  const missingKey = !settings.geminiApiKey
  
  const currentEntry = entryId ? evaluations.find(e => e.id === entryId) : null

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    
    // REMOVED the missingKey block here!
    if (!form.name || !form.price || blocked) return

    if (price <= 0) return setError('Price must be greater than 0.')
    if (!form.reason || form.reason.trim().length < 10) return setError('Be honest. Please provide a real reason for Wali to analyze.')

    setLoading(true)
    setError(null)

    // NEW: If no API key, bypass the AI entirely and save as pending
    if (missingKey) {
      const entry = addEvaluation({
        name: form.name, price, category: form.category, necessity: parseInt(form.necessity), reason: form.reason,
        verdict: 'pending', category_class: form.category, investment_vehicle: 'Pending AI Analysis',
        projected_5yr: 0, cooling_hours: 0, argument: 'API Key missing. Item added to your list.'
      })
      setEntryId(entry.id)
      setLoading(false)
      return
    }

    const duplicateImpulse = evaluations.find(prevEval => 
      prevEval.name.toLowerCase().trim() === form.name.toLowerCase().trim() &&
      prevEval.verdict === 'discourage' &&
      (Date.now() - new Date(prevEval.createdAt).getTime()) < (48 * 60 * 60 * 1000)
    )

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
        argument: res.argument,
        israf_flag: res.israf_flag,
        nafs_flag: res.nafs_flag
      })

      setEntryId(entry.id)
    } catch (err) {
      if (err.message === 'QUOTA_EXCEEDED' || err.message.toLowerCase().includes('fetch')) {
        const entry = addEvaluation({
          name: form.name, price, category: form.category, necessity: parseInt(form.necessity), reason: form.reason,
          verdict: 'pending', category_class: form.category, investment_vehicle: 'Pending AI Analysis',
          projected_5yr: 0, cooling_hours: 0, argument: 'Pending offline sync.'
        })
        setEntryId(entry.id)
      } else {
        setError(err.message || 'Something went wrong. Try again.')
      }
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
    <motion.div {...pageTransition} className="max-w-5xl mx-auto px-4 md:px-10 lg:px-12 pt-6 md:pt-12 pb-28 md:pb-12 scroll-area flex justify-center w-full overflow-x-hidden">
      <AnimatePresence mode="wait">
        {!currentEntry ? (
          <motion.div key="form" className="w-full max-w-xl" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
            
            <div className="mb-8">
              <h1 className="font-display text-3xl text-zinc-100">Consult Wali</h1>
              <p className="text-zinc-400 text-sm mt-1">Submit your purchase for Islamic financial analysis.</p>
            </div>

            {/* MODIFIED: The warning banner now explains the offline functionality */}
            {missingKey && (
              <div className="mb-6 card p-5 border-zinc-700/50 bg-zinc-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-300">No API Key Configured</p>
                    <p className="text-xs text-zinc-500 mt-1">You can still save items to your list, but Wali will not analyze them.</p>
                  </div>
                </div>
                <Link to="/settings" className="shrink-0 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-colors">
                  Add Key
                </Link>
              </div>
            )}

            <div className="card p-5 md:p-6 mb-6 border-zinc-800 bg-zinc-900/30">
              <div className="flex justify-between items-end mb-3">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Monthly Limit</p>
                <p className="text-sm font-medium text-zinc-300">
                  <span className={remaining < 0 ? 'text-red-400' : 'text-zinc-100'}>{formatMoney(remaining, settings.currency)}</span> remaining
                </p>
              </div>
              <BudgetBar spent={settings.spentSoFar} limit={settings.monthlyLimit} currency={settings.currency} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="card p-0 border-zinc-800 bg-zinc-900/20 overflow-hidden relative">
                
                {/* Loading Overlay */}
                <AnimatePresence>
                  {loading && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl border border-wali-green/30"
                    >
                      <BrainCircuit className="w-10 h-10 text-wali-green animate-pulse mb-4" />
                      <div className="flex items-center gap-3 text-wali-green font-medium tracking-wide">
                        <LoadingDots /> Wali is deliberating...
                      </div>
                      <p className="text-xs text-zinc-500 mt-3 font-medium">Checking Maqasid al-Shariah principles</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-5 border-b border-zinc-800/60 bg-zinc-900/40">
                  <h2 className="font-medium text-zinc-200 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-zinc-400" /> Purchase Details
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-2 font-medium flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" /> Item Name
                      </label>
                      <input className="input-base w-full bg-zinc-950/50" placeholder="e.g. Mechanical Keyboard" value={form.name} onChange={set('name')} required disabled={loading} />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-2 font-medium flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5" /> Category
                      </label>
                      <select className="input-base w-full bg-zinc-950/50" value={form.category} onChange={set('category')} disabled={loading}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-2 font-medium">Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">{settings.currency}</span>
                      <input type="number" className="input-base w-full bg-zinc-950/50 pl-10" placeholder="8500" min="0" value={form.price} onChange={set('price')} required disabled={loading} />
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> How necessary is this?
                      </label>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded ${form.necessity >= 8 ? 'bg-wali-green/10 text-wali-green' : form.necessity >= 5 ? 'bg-wali-gold/10 text-wali-gold' : 'bg-zinc-800 text-zinc-400'}`}>
                        {form.necessity}<span className="opacity-50 text-xs">/10</span>
                      </span>
                    </div>
                    <input type="range" min="1" max="10" step="1" value={form.necessity} onChange={set('necessity')} className="w-full accent-wali-green cursor-pointer" disabled={loading} />
                    <div className="flex justify-between text-[10px] text-zinc-500 font-medium mt-2 uppercase tracking-wider">
                      <span>Pure Want</span>
                      <span>Absolute Need</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/60">
                    <label className="block text-xs text-zinc-400 mb-2 font-medium flex items-center gap-1.5 mt-4">
                      <MessageSquare className="w-3.5 h-3.5" /> Justification
                    </label>
                    <textarea 
                      className="input-base w-full bg-zinc-950/50 resize-y min-h-[100px]" 
                      placeholder="Be honest. Why do you believe you need this right now? Wali will analyze your reasoning." 
                      value={form.reason} 
                      onChange={set('reason')} 
                      disabled={loading}
                    />
                  </div>

                  <div className="pt-2">
                    <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${form.hasDuplicate ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700'}`}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${form.hasDuplicate ? 'bg-wali-green border-wali-green' : 'border-zinc-600'}`}>
                        {form.hasDuplicate && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Copy className="w-3 h-3 text-zinc-950" /></motion.div>}
                      </div>
                      <input type="checkbox" checked={form.hasDuplicate} onChange={set('hasDuplicate')} className="hidden" disabled={loading} />
                      <div>
                        <span className="text-sm font-medium text-zinc-200 block">I already own something similar</span>
                        <span className="text-[10px] text-zinc-500">Checking this triggers a stricter necessity evaluation.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {blocked && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="rounded-xl p-4 bg-red-950/30 border border-red-900/50 text-red-400 flex items-start gap-3 mt-4">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">Purchase Blocked</p>
                        <p className="text-xs mt-1 text-red-400/80">This exceeds your remaining budget of {formatMoney(Math.max(0, remaining), settings.currency)}. You cannot submit this to Wali.</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {error && !blocked && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="rounded-xl p-4 bg-wali-warn/10 border border-wali-warn/30 text-wali-warn flex items-start gap-3 mt-4">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium mt-0.5">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MODIFIED: The button style and text changes dynamically based on the missingKey state */}
              <button 
                type="submit" 
                className={`w-full py-4 rounded-xl font-bold tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                  loading || blocked ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none' : 
                  missingKey ? 'bg-zinc-200 text-zinc-950 hover:bg-white' : 
                  'bg-wali-green text-zinc-950 hover:bg-[#198f69] shadow-wali-green/20'
                }`}
                disabled={loading || blocked}
              >
                {loading ? 'Processing...' : missingKey ? 'Save to List (Pending)' : 'Submit to Wali'}
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