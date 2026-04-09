// src/App.jsx
import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { supabase, getLocalPayload } from './lib/supabase'

import BottomNav from './components/BottomNav'
import Sidebar from './components/Sidebar'
import DashboardPage from './pages/DashboardPage'
import EvaluatePage from './pages/EvaluatePage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import AuthPage from './pages/AuthPage'
import ItemDetailPage from './pages/ItemDetailPage'
import ToBuyPage from './pages/ToBuyPage'
import VaultPage from './pages/VaultPage'
import AnalyticsPage from './pages/AnalyticsPage'
import { ToastProvider } from './context/ToastContext'
import ToastContainer from './components/ToastContainer'

export default function App() {
  const location = useLocation()
  
  // Gatekeeper States
  const [session, setSession] = useState(null)
  const [isOffline, setIsOffline] = useState(false)
  const [loading, setLoading] = useState(true)

  // 1. Initial Gatekeeper & Auth Listener
  useEffect(() => {
    // Check if user previously opted for offline mode
    if (localStorage.getItem('wali_offline_mode') === 'true') {
      setIsOffline(true)
    }

    // Check for active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for future auth changes (e.g., logging in/out from Settings)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Background Auto-Sync Listener
  useEffect(() => {
    const handleSync = async () => {
      const settings = JSON.parse(localStorage.getItem('wali_settings') || '{}')
      
      // Only sync if the user turned it on in settings AND they are actually logged in
      if (settings.autoSync && session) {
        const payload = getLocalPayload()
        await supabase
          .from('wali_sync')
          .upsert({ user_id: session.user.id, payload, updated_at: new Date().toISOString() })
      }
    }
    
    window.addEventListener('wali_data_changed', handleSync)
    return () => window.removeEventListener('wali_data_changed', handleSync)
  }, [session])

  // Show a blank dark screen while checking auth to prevent UI flashing
  if (loading) {
    return <div className="min-h-screen bg-zinc-950" />
  }

  // GATEKEEPER: If no session AND they haven't opted for offline, trap them at AuthPage
  if (!session && !isOffline) {
    return <AuthPage onOfflineSelect={() => setIsOffline(true)} />
  }

  // Otherwise, render the main application
  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-wali-green/30 relative flex">
        
        <Sidebar />
        
        {/* FIXED: overflow-y-auto allows the page to scroll properly! */}
        <main className="flex-1 h-[100dvh] relative overflow-y-auto pb-20 md:pb-0 flex flex-col">
          <AnimatePresence mode="wait">
             <Routes location={location} key={location.pathname}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/evaluate" element={<EvaluatePage />} />
                <Route path="/to-buy" element={<ToBuyPage />} />
                <Route path="/vault" element={<VaultPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                
                {/* FIXED: Restored the Item Detail Route so it stops crashing! */}
                <Route path="/item/:id" element={<ItemDetailPage />} />
             </Routes>
          </AnimatePresence>
        </main>

        <BottomNav />
        <ToastContainer />
        
      </div>
    </ToastProvider>
  )
}