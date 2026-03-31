import { useEvaluations } from '../hooks/useStorage'
import { VerdictBadge, CategoryPill, EmptyState } from '../components/UI'
import { clsx } from 'clsx'

function HistoryItem({ entry, onDelete }) {
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
          <p className="text-zinc-300 text-sm font-medium">৳{(entry.price || 0).toLocaleString()}</p>
          <VerdictBadge verdict={entry.verdict} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
        <CategoryPill category={entry.category_class || 'Hajiyyat'} />
        <button
          onClick={() => onDelete(entry.id)}
          className="text-zinc-600 text-xs hover:text-red-400 transition-colors"
        >
          Remove
        </button>
      </div>

      {entry.investment_vehicle && (
        <div className="mt-3 bg-zinc-800/50 rounded-lg px-3 py-2 flex justify-between items-center">
          <span className="text-zinc-500 text-xs">{entry.investment_vehicle} in 5yr</span>
          <span className="text-wali-green text-xs font-medium">
            ৳{(entry.projected_5yr || 0).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const { evaluations, removeEvaluation } = useEvaluations()

  const counts = {
    approve:    evaluations.filter(e => e.verdict === 'approve').length,
    caution:    evaluations.filter(e => e.verdict === 'caution').length,
    discourage: evaluations.filter(e => e.verdict === 'discourage').length,
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28 scroll-area">
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
