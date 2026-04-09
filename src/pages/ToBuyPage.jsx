// src/pages/ToBuyPage.jsx
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { useEvaluations, useSettings } from '../hooks/useStorage'
import HistoryItemCard from '../components/HistoryItemCard'

const pageTransition = { 
  initial: { opacity: 0, y: 15 }, 
  animate: { opacity: 1, y: 0 }, 
  exit: { opacity: 0, y: -15 }, 
  transition: { duration: 0.3, ease: 'easeOut' } 
}

const CATEGORIES = [
  { value: 'all',           label: 'All Items' },
  { value: 'fashion',       label: 'Fashion' },
  { value: 'electronics',   label: 'Electronics' },
  { value: 'food',          label: 'Food' },
  { value: 'transport',     label: 'Transport' },
  { value: 'health',        label: 'Health' },
  { value: 'education',     label: 'Education' },
  { value: 'home',          label: 'Home' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other',         label: 'Other' },
]

export default function ToBuyPage() {
  const { settings } = useSettings()
  const { evaluations, updateEvaluation } = useEvaluations()
  const [activeCategory, setActiveCategory] = useState('all')
  const [orderedItems, setOrderedItems] = useState([])

  // Filter and initially sort the items
  const activeItems = useMemo(() => {
    // ONLY show unbought AND undiverted items
    let result = evaluations.filter(e => !e.purchased && !e.diverted)

    if (activeCategory !== 'all') {
      result = result.filter(e => e.category === activeCategory)
    }

    // Sort by custom order first, fallback to necessity score
    result.sort((a, b) => {
      if (a.custom_order !== undefined && b.custom_order !== undefined) {
        return a.custom_order - b.custom_order
      }
      if (b.necessity !== a.necessity) {
        return b.necessity - a.necessity
      }
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    return result
  }, [evaluations, activeCategory])

  // Sync state with memoized items for the drag-and-drop feature
  useEffect(() => {
    setOrderedItems(activeItems)
  }, [activeItems])

  // Handle Drag & Drop Reordering
  function handleReorder(newOrder) {
    setOrderedItems(newOrder)
    // Save the new exact order to the database
    newOrder.forEach((item, index) => {
      if (item.custom_order !== index) {
        updateEvaluation(item.id, { custom_order: index })
      }
    })
  }

  return (
    <motion.div {...pageTransition} className="max-w-4xl mx-auto px-4 md:px-8 pt-6 pb-28 md:pb-12 scroll-area">
      
      <div className="mb-8">
        <h1 className="font-display text-3xl text-zinc-100">To-Buy List</h1>
        <p className="text-zinc-400 text-sm mt-1">Drag and drop to set your custom buying priority.</p>
      </div>

      <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeCategory === cat.value
                  ? 'bg-wali-green text-zinc-950 shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {orderedItems.length > 0 ? (
            <Reorder.Group axis="y" values={orderedItems} onReorder={handleReorder} className="space-y-4">
              {orderedItems.map(entry => (
                <Reorder.Item 
                  key={entry.id} 
                  value={entry}
                  className="cursor-grab active:cursor-grabbing relative z-10"
                >
                  <HistoryItemCard entry={entry} currency={settings.currency} />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-center py-20 border border-dashed border-zinc-800 rounded-xl"
            >
              <p className="text-zinc-500 font-medium">No items pending in this category.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  )
}