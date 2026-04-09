import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ShieldCheck, AlertCircle, X } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => {
          // Dynamic styling based on what kind of toast it is
          const Icon = toast.type === 'vault' ? ShieldCheck : toast.type === 'error' ? AlertCircle : CheckCircle2;
          const theme = toast.type === 'vault' ? 'bg-wali-gold/90 border-wali-gold text-zinc-950' :
                        toast.type === 'error' ? 'bg-red-950/90 border-red-900 text-red-400' :
                        'bg-wali-green/90 border-wali-green text-zinc-950';

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md ${theme}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <p className="text-sm font-bold tracking-wide flex-1">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="text-current opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}