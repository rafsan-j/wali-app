import { useEvaluations, useSettings } from '../hooks/useStorage'
import { VerdictBadge, CategoryPill, EmptyState } from '../components/UI'
import { clsx } from 'clsx'
import { formatMoney } from '../lib/utils'
import { motion } from 'framer-motion'

const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -15 },
  transition: { duration: 0.3, ease: 'easeOut' }
}

function HistoryItem({ entry, onDelete, onMarkBought, currency }) {
  const date = new Date(entry.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="card p-4 animate-fade-up">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-zinc-100 font-medium text-sm truncate">{entry.name}</p>
          <p className="text-zinc-500 text-xs mt-0.5">{date}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <p className="text-zinc-300 text-sm font-medium">{formatMoney(entry.price, currency)}</p>
          <VerdictBadge verdict={entry.verdict} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
        <CategoryPill category={entry.category_class || 'Hajiyyat'} />
        <div className="flex gap-3 items-center">
          {/* NEW: Mark as bought toggle in history */}
          {!entry.purchased ? (
            <button
              onClick={() => onMarkBought(entry)}
              className="text-wali-green text-xs font-medium hover:text-wali-green/80 transition-colors"
            >
              Mark Bought
            </button>
          ) : (
             <span className="text-zinc-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
               Bought
             </span>
          )}
          <button
            onClick={() => onDelete(entry.id)}
            className="text-zinc-600 text-xs hover:text-red-400 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>

      {entry.investment_vehicle && (
        <div className="mt-3 bg-zinc-800/50 rounded-lg px-3 py-2 flex justify-between items-center">
          <span className="text-zinc-500 text-xs">{entry.investment_vehicle} in 5yr</span>
          <span className="text-wali-green text-xs font-medium">
            {formatMoney(entry.projected_5yr, currency)}
          </span>
        </div>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const { evaluations, removeEvaluation, updateEvaluation } = useEvaluations()
  const { settings, updateSettings } = useSettings()

  const counts = {
    approve:    evaluations.filter(e => e.verdict === 'approve').length,
    caution:    evaluations.filter(e => e.verdict === 'caution').length,
    discourage: evaluations.filter(e => e.verdict === 'discourage').length,
  }

  const handleMarkBought = (entry) => {
    updateEvaluation(entry.id, { purchased: true })
    updateSettings({ spentSoFar: settings.spentSoFar + entry.price })
  }

  return (
    <motion.div {...pageTransition} className="max-w-xl mx-auto px-4 md:px-6 pt-6 pb-28 scroll-area">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-zinc-100">History</h1>
        <p className="text-zinc-400 text-sm mt-1">Your past evaluations</p>
      </div>

      {evaluations.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { key: 'approve',    label: 'Approved',    color: 'text-wali-green' },
            { key: 'caution',    label: 'Caution',     color: 'text-wali-gold' },
            { key: 'discourage', label: 'Discouraged', color: 'text-wali-warn' },
          ].map(({ key, label, color }) => (
            <div key={key} className="card p-3 text-center">
              <p className={clsx('text-xl font-display', color)}>{counts[key]}</p>
              <p className="text-zinc-500 text-[10px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {evaluations.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No evaluations yet"
          subtitle="Ask Wali to evaluate your first purchase"
        />
      ) : (
        <div className="space-y-3">
          {evaluations.map(entry => (
            <HistoryItem
              key={entry.id}
              entry={entry}
              onDelete={removeEvaluation}
              onMarkBought={handleMarkBought}
              currency={settings.currency}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}