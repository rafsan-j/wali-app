import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
// Import professional icons from Lucide
import { LayoutDashboard, Scale, History, Settings } from 'lucide-react'

export default function BottomNav() {
  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/evaluate', icon: Scale, label: 'Wali' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none md:hidden">
      <nav className="w-full max-w-xl bg-zinc-950/40 backdrop-blur-2xl border-t border-zinc-800/50 pb-safe pointer-events-auto">
        <div className="flex justify-around items-center px-2 py-2 md:py-3">
          {links.map(l => {
            const Icon = l.icon; // Assign the component to a capitalized variable
            return (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => clsx(
                  'flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all relative w-16',
                  'md:hover:bg-zinc-800/40 active:scale-95 active:bg-zinc-800/60',
                  isActive ? 'text-wali-green' : 'text-zinc-500 hover:text-zinc-400'
                )}
              >
                {({ isActive }) => (
                  <>
                    <Icon strokeWidth={isActive ? 2.5 : 2} className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-medium tracking-wide">{l.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -top-2 w-8 h-1 bg-wali-green rounded-b-full shadow-[0_0_8px_rgba(29,158,117,0.6)]"
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}