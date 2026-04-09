// src/components/FeedbackModal.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bug, Lightbulb, Heart, MessageSquare, CheckCircle2 } from 'lucide-react'

const TYPES = [
  { id: 'bug', label: 'Report a Bug', icon: Bug, color: 'text-wali-warn', bg: 'bg-wali-warn/10', border: 'border-wali-warn/30' },
  { id: 'idea', label: 'Feature Idea', icon: Lightbulb, color: 'text-wali-gold', bg: 'bg-wali-gold/10', border: 'border-wali-gold/30' },
  { id: 'praise', label: 'Appreciation', icon: Heart, color: 'text-wali-green', bg: 'bg-wali-green/10', border: 'border-wali-green/30' },
  { id: 'other', label: 'Other', icon: MessageSquare, color: 'text-zinc-400', bg: 'bg-zinc-800', border: 'border-zinc-700' }
]

export default function FeedbackModal({ isOpen, onClose }) {
  const [type, setType] = useState('idea')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)

    // SIMULATED BACKEND DELAY
    setTimeout(() => {
      console.log('--- FEEDBACK SUBMITTED ---')
      console.log('Type:', type)
      console.log('Message:', message)
      console.log('--------------------------')
      
      setIsSubmitting(false)
      setIsSuccess(true)

      // Auto-close after showing success state
      setTimeout(() => {
        handleClose()
      }, 2000)
    }, 800)
  }

  function handleClose() {
    setIsSuccess(false)
    setMessage('')
    setType('idea')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-end sm:items-center justify-center z-[101] pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-5 md:p-6 border-b border-zinc-800/60 bg-zinc-950/30">
                <div>
                  <h2 className="text-xl font-display text-zinc-100">Send Feedback</h2>
                  <p className="text-xs text-zinc-400 mt-1">Help shape the future of Wali.</p>
                </div>
                <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar">
                {isSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-wali-green/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-wali-green" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-100 mb-1">Feedback Received</h3>
                    <p className="text-sm text-zinc-400">Jazakallah Khair! Your thoughts have been securely logged.</p>
                  </motion.div>
                ) : (
                  <form id="feedback-form" onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Type Selector */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">What is this regarding?</label>
                      <div className="grid grid-cols-2 gap-3">
                        {TYPES.map(t => {
                          const Icon = t.icon
                          const isSelected = type === t.id
                          return (
                            <button
                              key={t.id} type="button" onClick={() => setType(t.id)}
                              className={`p-3 rounded-xl border flex flex-col items-start gap-2 transition-all ${isSelected ? `${t.bg} ${t.border}` : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'}`}
                            >
                              <Icon className={`w-5 h-5 ${isSelected ? t.color : 'text-zinc-500'}`} />
                              <span className={`text-sm font-medium ${isSelected ? 'text-zinc-100' : 'text-zinc-400'}`}>{t.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Message Area */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Your Message</label>
                      <textarea
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell me what's on your mind..."
                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-wali-green/50 focus:ring-1 focus:ring-wali-green/50 min-h-[120px] resize-y placeholder:text-zinc-600"
                      />
                    </div>
                  </form>
                )}
              </div>

              {/* Footer */}
              {!isSuccess && (
                <div className="p-5 md:p-6 border-t border-zinc-800/60 bg-zinc-950/30">
                  <button 
                    type="submit" 
                    form="feedback-form"
                    disabled={isSubmitting || !message.trim()}
                    className={`w-full py-4 rounded-xl text-sm font-bold tracking-wide transition-all flex justify-center items-center gap-2 ${isSubmitting || !message.trim() ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-zinc-200 text-zinc-950 hover:bg-white'}`}
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-zinc-500 border-t-zinc-950 rounded-full animate-spin" />
                    ) : (
                      <><Send className="w-4 h-4" /> Send securely</>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}