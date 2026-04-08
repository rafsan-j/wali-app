// src/pages/HistoryPage.jsx
import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEvaluations, useSettings } from '../hooks/useStorage'
import HistoryItemCard from '../components/HistoryItemCard'

const pageTransition = { 
  initial: { opacity: 0, y: 15 }, 
  animate: { opacity: 1, y: 0 }, 
  exit: { opacity: 0, y: -15 }, 
  transition: { duration: 0.3, ease: 'easeOut' } 
}

export default function HistoryPage() {
  const { settings } = useSettings()
  const { evaluations } = useEvaluations()

  // ONLY show purchased items, sorted chronologically (newest first)
  const boughtItems = useMemo(() => {
    return evaluations
      .filter(e => e.purchased)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [evaluations])

  return (
    <motion.div {...pageTransition} className="max-w-4xl mx-auto px-4 md:px-8 pt-6 pb-28 md:pb-12 scroll-area">
      
      <div className="mb-8">
        <h1 className="font-display text-3xl text-zinc-100">Purchase History</h1>
        <p className="text-zinc-400 text-sm mt-1">A permanent record of the items you've acquired.</p>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {boughtItems.length > 0 ? (
            boughtItems.map(entry => (
              <motion.div 
                key={entry.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <HistoryItemCard entry={entry} currency={settings.currency} />
              </motion.div>
            ))
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-center py-20 border border-dashed border-zinc-800 rounded-xl"
            >
              <p className="text-zinc-500 font-medium">You haven't marked any items as purchased yet.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  )
}