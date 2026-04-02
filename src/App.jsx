import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import BottomNav from './components/BottomNav'
import Sidebar from './components/Sidebar' // NEW IMPORT
import DashboardPage from './pages/DashboardPage'
import EvaluatePage from './pages/EvaluatePage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-wali-green/30 flex">
      {/* Desktop Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 relative">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/evaluate" element={<EvaluatePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Mobile Navigation */}
      <BottomNav />
    </div>
  )
}