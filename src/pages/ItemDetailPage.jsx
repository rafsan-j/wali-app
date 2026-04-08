// src/pages/ItemDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEvaluations, useSettings } from '../hooks/useStorage'
import { formatMoney } from '../lib/utils'
import { VerdictBadge } from '../components/UI'
import { ArrowLeft, BrainCircuit, Link as LinkIcon, PiggyBank, Save, Trash2, FileText, CheckCircle2 } from 'lucide-react'

export default function ItemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings() // Added updateSettings
  const { evaluations, updateEvaluation, removeEvaluation } = useEvaluations()
  
  const [entry, setEntry] = useState(null)
  const [url, setUrl] = useState('')
  const [savedAmount, setSavedAmount] = useState(0)
  const [note, setNote] = useState('')

  useEffect(() => {
    const found = evaluations.find(e => e.id === id)
    if (found) {
      setEntry(found)
      setUrl(found.url || '')
      setSavedAmount(found.saved_amount || 0)
      setNote(found.note || '')
    }
  }, [id, evaluations])

  if (!entry) return (
    <div className="flex flex-col items-center justify-center h-full pt-20">
      <p className="text-zinc-500 mb-4">Item not found.</p>
      <button onClick={() => navigate('/to-buy')} className="btn-primary">Go Back</button>
    </div>
  )

  const isBought = entry.purchased
  const returnPath = isBought ? '/history' : '/to-buy'

  function handleSave() {
    updateEvaluation(entry.id, { url, saved_amount: parseFloat(savedAmount) || 0, note })
    navigate(returnPath)
  }

  function handleDelete() {
    if (window.confirm('Delete this evaluation permanently?')) {
      removeEvaluation(entry.id)
      navigate(returnPath)
    }
  }

  // NEW: Mark as Bought logic for the detail page
  function handleMarkBought() {
    if (window.confirm(`Mark "${entry.name}" as bought? This will deduct ${formatMoney(entry.price, settings.currency)} from your budget.`)) {
      updateEvaluation(entry.id, { purchased: true })
      updateSettings({ spentSoFar: settings.spentSoFar + entry.price })
      navigate('/history') // Instantly send them to history
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto px-4 md:px-8 pt-6 pb-28 scroll-area">
      
      <button onClick={() => navigate(returnPath)} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-sm font-medium mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
      </button>

      <div className="mb-8">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h1 className={`text-3xl font-display ${isBought ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>{entry.name}</h1>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-zinc-200">{formatMoney(entry.price, settings.currency)}</p>
            <VerdictBadge verdict={entry.verdict} />
          </div>
        </div>
        <p className="text-zinc-400 italic">"{entry.reason || 'No user reason provided'}"</p>
      </div>

      <div className="space-y-6">
        
        <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 shadow-inner">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-wali-green" /> Wali's Counsel
          </p>
          <p className="text-zinc-300 font-medium leading-relaxed">
            "{entry.argument || 'Analysis pending or not recorded for this item.'}"
          </p>
        </div>

        {!isBought && (
          <div className="card p-5 space-y-5 border-zinc-800">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" /> Exact Product Link
              </label>
              <input type="url" placeholder="Paste URL here..." value={url} onChange={(e) => setUrl(e.target.value)} className="input-base w-full bg-zinc-950/50" />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Personal Note
              </label>
              <textarea 
                placeholder="Why are you saving this? (e.g. Wait for Eid sale...)" 
                value={note} onChange={(e) => setNote(e.target.value)} 
                className="input-base w-full bg-zinc-950/50 min-h-[80px] resize-y" 
              />
            </div>

            {settings.enableSinkingFunds && (
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium flex items-center gap-1.5">
                  <PiggyBank className="w-3.5 h-3.5" /> Money Saved ({settings.currency})
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input type="number" min="0" max={entry.price} value={savedAmount} onChange={(e) => setSavedAmount(e.target.value)} className="input-base w-full sm:w-32 bg-zinc-950/50" />
                  <div className="flex-1 h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div className="h-full bg-wali-gold transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, ((savedAmount || 0) / entry.price) * 100))}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Buttons Row */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button onClick={handleDelete} className="px-5 py-3 rounded-xl border border-red-900/50 text-red-400 hover:bg-red-900/20 text-sm font-medium flex justify-center items-center gap-2 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          
          {!isBought && (
            <>
              <button onClick={handleSave} className="flex-1 py-3 text-sm flex justify-center items-center gap-2 btn-primary bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200">
                <Save className="w-4 h-4" /> Save Details
              </button>
              <button onClick={handleMarkBought} className="flex-1 py-3 text-sm flex justify-center items-center gap-2 btn-primary shadow-lg shadow-wali-green/10">
                <CheckCircle2 className="w-4 h-4" /> Mark as Bought
              </button>
            </>
          )}
        </div>

      </div>
    </motion.div>
  )
}