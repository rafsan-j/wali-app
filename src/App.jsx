import { Routes, Route } from 'react-router-dom'
import BottomNav    from './components/BottomNav'
import EvaluatePage from './pages/EvaluatePage'
import HistoryPage  from './pages/HistoryPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="overflow-y-auto h-screen scroll-area">
        <Routes>
          <Route path="/"          element={<EvaluatePage />} />
          <Route path="/history"   element={<HistoryPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings"  element={<SettingsPage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
