// src/pages/ToBuyPage.jsx
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { useEvaluations, useSettings } from '../hooks/useStorage'
import HistoryItemCard from '../components/HistoryItemCard'
import { Filter, ChevronDown, GripVertical, TrendingUp } from 'lucide-react'

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

// --- Custom Draggable Component ---
function DraggableItem({ entry, currency }) {
  const controls = useDragControls()

  return (
    <Reorder.Item 
      value={entry} 
      dragListener={false} // Disables whole-card dragging so mobile scrolling works
      dragControls={controls}
      // Added w-full, p-0, m-0 to override any hidden list constraints
      className="flex items-stretch gap-2 md:gap-4 relative z-10 w-full p-0 m-0"
    >
      {/* Professional Drag Handle Zone */}
      <div 
        onPointerDown={(e) => controls.start(e)}
        className="flex-none flex items-center justify-center w-10 md:w-14 cursor-grab active:cursor-grabbing touch-none text-zinc-600 hover:text-zinc-300 transition-colors bg-zinc-900/40 hover:bg-zinc-800/80 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 shadow-sm"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      
      {/* The Actual Card */}
      <div className="flex-1 min-w-0">
        <HistoryItemCard entry={entry} currency={currency} />
      </div>
    </Reorder.Item>
  )
}

export default function ToBuyPage() {
  const { settings } = useSettings()
  const { evaluations, updateEvaluation } = useEvaluations()
  const [activeCategory, setActiveCategory] = useState('all')
  const [orderedItems, setOrderedItems] = useState([])

  const activeItems = useMemo(() => {
    let result = evaluations.filter(e => !e.purchased && !e.diverted)

    if (activeCategory !== 'all') {
      result = result.filter(e => e.category === activeCategory)
    }

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

  useEffect(() => {
    setOrderedItems(activeItems)
  }, [activeItems])

  function handleReorder(newOrder) {
    setOrderedItems(newOrder)
    newOrder.forEach((item, index) => {
      if (item.custom_order !== index) {
        updateEvaluation(item.id, { custom_order: index })
      }
    })
  }

  return (
    <motion.div {...pageTransition} className="max-w-5xl mx-auto px-4 md:px-8 pt-6 pb-28 md:pb-12 scroll-area">
      
      {/* --- Professional Header & Filter Layout --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
        <div>
          <h1 className="font-display text-3xl text-zinc-100">To-Buy List</h1>
          <p className="text-zinc-400 text-sm mt-1">Drag the grip handle to prioritize items.</p>
        </div>

        {/* Sleek Custom Select UI */}
        <div className="relative w-full md:w-auto shrink-0 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Filter className="w-4 h-4 text-zinc-500 group-hover:text-wali-green transition-colors" />
          </div>
          
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="appearance-none w-full md:w-48 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-sm font-medium rounded-xl pl-11 pr-10 py-3.5 focus:outline-none focus:border-wali-green/50 focus:ring-1 focus:ring-wali-green/50 transition-all cursor-pointer shadow-sm"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </div>
        </div>
      </div>

      {/* --- REORDERABLE LIST --- */}
      <div className="w-full">
        <AnimatePresence mode="popLayout">
          {orderedItems.length > 0 ? (
            // CRITICAL FIX: Added `p-0 m-0 list-none w-full` to strip invisible HTML list formatting
            <Reorder.Group axis="y" values={orderedItems} onReorder={handleReorder} className="flex flex-col gap-4 w-full p-0 m-0 list-none">
              {orderedItems.map(entry => (
                <DraggableItem key={entry.id} entry={entry} currency={settings.currency} />
              ))}
            </Reorder.Group>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-center py-20 border border-dashed border-zinc-800 bg-zinc-900/20 rounded-2xl w-full"
            >
              <TrendingUp className="w-8 h-8 mx-auto mb-3 text-zinc-600 opacity-50" />
              <p className="text-zinc-400 font-medium text-sm">No items pending in this category.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  )
}