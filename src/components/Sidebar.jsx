import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { LayoutDashboard, Scale, History, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Sidebar() {
  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/evaluate', icon: Scale, label: 'Wali' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    // hidden on mobile, flex on md (tablets/laptops)
    <aside className="hidden md:flex flex-col w-64 h-screen border-r border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 shrink-0">
      <div className="p-8">
        <h2 className="font-display text-2xl text-zinc-100 tracking-wide">Wali.</h2>
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Financial Guardian</p>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        {links.map(l => {
          const Icon = l.icon
          return (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3.5 px-4 py-3 rounded-lg transition-all relative',
                'hover:bg-zinc-800/40',
                isActive ? 'text-wali-green bg-zinc-800/30' : 'text-zinc-400 hover:text-zinc-300'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon strokeWidth={isActive ? 2.5 : 2} className="w-4 h-4" />
                  <span className="text-sm font-medium tracking-wide">{l.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-wali-green rounded-r-full shadow-[0_0_8px_rgba(29,158,117,0.6)]"
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
      
      {/* Optional: Add a user/status footer here later */}
      <div className="p-6 border-t border-zinc-800/50">
         <p className="text-[10px] text-zinc-600">Local Data Mode</p>
      </div>
    </aside>
  )
}