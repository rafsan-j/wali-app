// src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSettings } from '../hooks/useStorage'
import { supabase, getLocalPayload, applyCloudPayload } from '../lib/supabase'
import { LoadingDots } from '../components/UI'
import { Save, Key, Wallet, ShieldAlert, Trash2, CheckCircle2, PiggyBank, CloudCog, LogOut, BrainCircuit, MessageSquare, Sparkles, Heart, Coffee, Smartphone } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import FeedbackModal from '../components/FeedbackModal'

const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -15 },
  transition: { duration: 0.3, ease: 'easeOut' }
}

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const { addToast } = useToast()
  const [saved, setSaved] = useState(false)
  const [user, setUser] = useState(null)
  
  // Modal State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  // Auth & Sync States
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  const [form, setForm] = useState({
    geminiApiKey: settings.geminiApiKey || '',
    monthlyLimit: settings.monthlyLimit || '',
    spentSoFar:   settings.spentSoFar || '',
    currency:     settings.currency || '৳',
    resetDay:     settings.resetDay || 1,
    aiModel:      settings.aiModel || 'gemini-2.5-flash-lite',
    enableSinkingFunds: settings.enableSinkingFunds || false,
    autoSync:     settings.autoSync || false,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  function handleSave(e) {
    e.preventDefault()
    updateSettings({
      ...form,
      monthlyLimit: parseFloat(form.monthlyLimit) || 0,
      spentSoFar:   parseFloat(form.spentSoFar) || 0,
      resetDay:     parseInt(form.resetDay) || 1,
    })
    setSaved(true)
    addToast('Settings updated successfully!', 'success')
    setTimeout(() => setSaved(false), 2000)
  }

  // --- Supabase Auth Functions ---
  async function handleSignUp() {
    setSyncLoading(true)
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword })
    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
        setSyncMessage('Account exists. Please use Login instead.')
      } else {
        setSyncMessage(error.message)
      }
    } else {
      setSyncMessage('Account created! You are logged in.')
      addToast('Account created successfully!', 'success')
    }
    setSyncLoading(false)
  }

  async function handleSignIn() {
    setSyncLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
    if (error) setSyncMessage(error.message)
    else {
      setSyncMessage('Logged in successfully.')
      addToast('Logged in successfully!', 'success')
    }
    setSyncLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    localStorage.removeItem('wali_settings')
    localStorage.removeItem('wali_evaluations')
    localStorage.removeItem('wali_timers')
    window.location.reload()
  }

  // --- Cloud Sync Functions ---
  async function pushToCloud() {
    setSyncLoading(true)
    setSyncMessage('')
    const payload = getLocalPayload()
    const { error } = await supabase
      .from('wali_sync')
      .upsert({ user_id: user.id, payload, updated_at: new Date().toISOString() })

    if (error) {
      setSyncMessage('Error syncing to cloud.')
      addToast('Error syncing to cloud.', 'error')
    } else {
      setSyncMessage('✓ Data backed up to cloud.')
      addToast('Data backed up to cloud!', 'success')
    }
    setSyncLoading(false)
  }

  async function pullFromCloud() {
    if (!window.confirm('This will overwrite your current device data. Proceed?')) return
    setSyncLoading(true)
    setSyncMessage('')
    const { data, error } = await supabase.from('wali_sync').select('payload').eq('user_id', user.id).single()

    if (error || !data) {
      setSyncMessage('No cloud data found.')
      addToast('No cloud data found.', 'error')
      setSyncLoading(false)
    } else {
      applyCloudPayload(data.payload)
    }
  }

  async function handleAutoSyncToggle(e) {
    const checked = e.target.checked
    setForm(prev => ({ ...prev, autoSync: checked }))
    
    if (checked) {
      if (!window.confirm('This will fetch your latest cloud backup and enable automatic syncing. Continue?')) {
        setForm(prev => ({ ...prev, autoSync: false }))
        return
      }
      setSyncLoading(true)
      setSyncMessage('Fetching cloud data...')
      const { data } = await supabase.from('wali_sync').select('payload').eq('user_id', user.id).single()
      
      if (data && data.payload) {
        const payload = data.payload
        if (!payload.settings) payload.settings = {}
        payload.settings.autoSync = true
        applyCloudPayload(payload)
      } else {
        updateSettings({ ...form, autoSync: true })
        await pushToCloud()
        setSyncMessage('Auto-sync enabled and first backup complete.')
        addToast('Auto-sync enabled!', 'success')
      }
      setSyncLoading(false)
    } else {
      updateSettings({ ...form, autoSync: false })
      addToast('Auto-sync disabled.', 'success')
    }
  }

  function handleClearData() {
    if (window.confirm("WARNING: This will permanently delete all local data. Are you sure?")) {
        localStorage.removeItem('wali_evaluations')
        localStorage.removeItem('wali_settings')
        localStorage.removeItem('wali_timers')
        window.location.reload()
    }
  }

  return (
    <motion.div {...pageTransition} className="max-w-3xl mx-auto px-4 md:px-8 pt-6 pb-28 md:pb-12 scroll-area">
      
      <div className="mb-8">
        <h1 className="font-display text-3xl text-zinc-100">Preferences</h1>
        <p className="text-zinc-400 text-sm mt-1">Configure Wali's engine, sync, and financial rules.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* --- CLOUD SYNC SECTION --- */}
        <div className="card p-0 border-zinc-800 bg-zinc-900/20 overflow-hidden">
          <div className="p-5 border-b border-zinc-800/60 flex items-center gap-3 bg-zinc-900/40">
            <CloudCog className="w-5 h-5 text-wali-green" />
            <h2 className="font-medium text-zinc-200">Cloud Sync & Backup</h2>
          </div>
          <div className="p-6">
            {!user ? (
              <div className="space-y-4 animate-fade-in">
                <p className="text-sm text-zinc-400">Create an account to backup and sync your data securely.</p>
                <input type="email" placeholder="Email" className="input-base w-full bg-zinc-950/50" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
                <input type="password" placeholder="Password (min 6 chars)" className="input-base w-full bg-zinc-950/50" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
                <div className="flex gap-3">
                  <button type="button" onClick={handleSignIn} className="btn-primary flex-1 bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700">Login</button>
                  <button type="button" onClick={handleSignUp} className="btn-primary flex-1 shadow-lg shadow-wali-green/10">Sign Up</button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in">
                <div className="flex justify-between items-center bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Logged in as</p>
                    <p className="text-sm font-medium text-zinc-200 truncate">{user.email}</p>
                  </div>
                  <button type="button" onClick={handleSignOut} className="text-xs text-wali-warn hover:bg-wali-warn/10 px-3 py-2 rounded-lg transition-colors flex items-center gap-2">
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
                
                {form.autoSync ? (
                  <div className="text-center p-4 bg-wali-green/10 border border-wali-green/20 rounded-xl shadow-inner flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-wali-green" />
                    <div>
                      <p className="text-sm text-wali-green font-bold">Auto-Sync Active</p>
                      <p className="text-xs text-zinc-400">Changes are saved to the cloud instantly.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-500 font-medium">Data is strictly local. Back up manually below.</p>
                    <div className="flex gap-3">
                      <button type="button" onClick={pushToCloud} disabled={syncLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">Backup to Cloud</button>
                      <button type="button" onClick={pullFromCloud} disabled={syncLoading} className="btn-primary flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300">Restore Data</button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium text-zinc-300">Enable Auto-Sync</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={form.autoSync} onChange={handleAutoSyncToggle} disabled={syncLoading} />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wali-green"></div>
                  </label>
                </div>
              </div>
            )}
            {syncMessage && <p className="text-xs text-wali-gold mt-4 text-center font-medium">{syncMessage}</p>}
            {syncLoading && !syncMessage && <div className="mt-4 text-center"><LoadingDots /></div>}
          </div>
        </div>

        {/* --- AI ENGINE SECTION --- */}
        <div className="card p-0 border-zinc-800 bg-zinc-900/20 overflow-hidden">
          <div className="p-5 border-b border-zinc-800/60 flex items-center gap-3 bg-zinc-900/40">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            <h2 className="font-medium text-zinc-200">AI Intelligence</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs text-zinc-400 mb-2 font-medium">Gemini API Key</label>
              <input type="password" value={form.geminiApiKey} onChange={set('geminiApiKey')} placeholder="AIzaSy..." className="input-base w-full bg-zinc-950/50 font-mono text-sm" />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-2 font-medium">Model Selection</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setForm(prev => ({ ...prev, aiModel: 'gemini-2.5-flash-lite' }))} className={`flex-1 py-3 px-2 rounded-xl text-xs font-medium border transition-all text-center ${form.aiModel === 'gemini-2.5-flash-lite' ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
                  <span className="block text-sm mb-0.5">Flash</span>
                  <span className="font-normal opacity-70">Fast, everyday use</span>
                </button>
                <button type="button" onClick={() => setForm(prev => ({ ...prev, aiModel: 'gemini-2.5-pro' }))} className={`flex-1 py-3 px-2 rounded-xl text-xs font-medium border transition-all text-center ${form.aiModel === 'gemini-2.5-pro' ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
                  <span className="block text-sm mb-0.5">Pro</span>
                  <span className="font-normal opacity-70">Deep reasoning</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- FINANCIAL RULES --- */}
        <div className="card p-0 border-zinc-800 bg-zinc-900/20 overflow-hidden">
          <div className="p-5 border-b border-zinc-800/60 flex items-center gap-3 bg-zinc-900/40">
            <Wallet className="w-5 h-5 text-wali-gold" />
            <h2 className="font-medium text-zinc-200">Financial Rules</h2>
          </div>
          <div className="p-6 space-y-6">
            
            <div>
              <label className="block text-xs text-zinc-400 mb-2 font-medium">Currency Symbol</label>
              <div className="flex flex-wrap gap-2">
                {['৳', '₹', '$', '€', '£', '¥', 'RM', 'Rp'].map(c => (
                  <button key={c} type="button" onClick={() => setForm(prev => ({ ...prev, currency: c }))} className={`w-12 h-10 rounded-lg text-sm font-medium border transition-all flex items-center justify-center ${form.currency === c ? 'bg-wali-gold/10 border-wali-gold/50 text-wali-gold' : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Monthly Limit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">{form.currency}</span>
                  <input type="number" min="0" value={form.monthlyLimit} onChange={set('monthlyLimit')} className="input-base w-full bg-zinc-950/50 pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Spent So Far</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">{form.currency}</span>
                  <input type="number" min="0" value={form.spentSoFar} onChange={set('spentSoFar')} className="input-base w-full bg-zinc-950/50 pl-10" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Budget Reset Day (1-28)</label>
              <input type="number" min="1" max="28" value={form.resetDay} onChange={set('resetDay')} className="input-base w-full bg-zinc-950/50" />
            </div>

            <div className="pt-2 border-t border-zinc-800/60 mt-6">
              <label className="flex items-center gap-3 cursor-pointer group mt-4">
                <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${form.enableSinkingFunds ? 'bg-wali-green' : 'bg-zinc-800'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute shadow-sm transition-transform ${form.enableSinkingFunds ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <input type="checkbox" className="hidden" checked={form.enableSinkingFunds} onChange={(e) => setForm(prev => ({ ...prev, enableSinkingFunds: e.target.checked }))} />
                <div>
                  <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors flex items-center gap-1.5">
                    <PiggyBank className="w-4 h-4 text-zinc-400" /> Enable Sinking Funds
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Track partial savings for individual To-Buy items.</p>
                </div>
              </label>
            </div>

          </div>
        </div>

        {/* --- SAVE BUTTON --- */}
        <div className="flex justify-end pt-2">
          <button type="submit" className={`btn-primary px-8 py-3.5 flex items-center gap-2 transition-all min-w-[160px] justify-center ${saved ? 'bg-wali-green border-wali-green text-zinc-950 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : ''}`}>
            {saved ? <><CheckCircle2 className="w-5 h-5" /> Saved</> : <><Save className="w-5 h-5" /> Save Changes</>}
          </button>
        </div>
      </form>

      {/* --- PREMIUM FEEDBACK BANNER --- */}
      <div className="mt-16 relative overflow-hidden rounded-2xl border border-wali-green/30 bg-zinc-900/60 shadow-[0_0_30px_-10px_rgba(34,197,94,0.15)] group transition-all hover:border-wali-green/50">
        <div className="absolute inset-0 bg-gradient-to-br from-wali-green/10 to-transparent opacity-50 pointer-events-none" />
        
        <div className="relative p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-wali-green/20 border border-wali-green/30 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 text-wali-green" />
            </div>
            <div>
              <h3 className="text-zinc-100 font-bold tracking-wide">Shape the future of Wali</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-sm">
                Have an idea? Found a bug? Your feedback directly influences the next update.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsFeedbackOpen(true)}
            className="shrink-0 w-full sm:w-auto px-6 py-3 rounded-xl bg-wali-green text-zinc-950 font-bold tracking-wide transition-all shadow-lg shadow-wali-green/20 hover:bg-[#198f69] flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" /> Send Feedback
          </button>
        </div>
      </div>

      {/* --- SUPPORT THE DEVELOPER --- */}
      <div className="mt-8 card p-6 border-zinc-800 bg-zinc-900/30 text-center">
        <div className="w-12 h-12 rounded-full bg-wali-gold/10 border border-wali-gold/20 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-5 h-5 text-wali-gold" />
        </div>
        <h3 className="text-zinc-100 font-bold tracking-wide mb-2">Support Wali's Journey</h3>
        <p className="text-xs text-zinc-400 mb-6 max-w-sm mx-auto leading-relaxed">
          Wali is completely ad-free. If this app has helped you conquer your Nafs and save money, consider supporting its development.
        </p>

        <div className="space-y-3">
          <a href="https://buymeacoffee.com/YOUR_USERNAME" target="_blank" rel="noopener noreferrer" className="w-full py-3.5 rounded-xl bg-[#FFDD00]/10 border border-[#FFDD00]/30 hover:bg-[#FFDD00]/20 text-[#FFDD00] text-sm font-bold tracking-wide transition-colors flex justify-center items-center gap-3">
            <Coffee className="w-4 h-4" /> Buy me a Coffee
          </a>
          
          <a href="https://ko-fi.com/YOUR_USERNAME" target="_blank" rel="noopener noreferrer" className="w-full py-3.5 rounded-xl bg-[#FF5E5B]/10 border border-[#FF5E5B]/30 hover:bg-[#FF5E5B]/20 text-[#FF5E5B] text-sm font-bold tracking-wide transition-colors flex justify-center items-center gap-3">
            <Heart className="w-4 h-4" /> Support on Ko-fi
          </a>
          
          <a href="#" target="_blank" rel="noopener noreferrer" className="w-full py-3.5 rounded-xl bg-wali-green/10 border border-wali-green/30 hover:bg-wali-green/20 text-wali-green text-sm font-bold tracking-wide transition-colors flex justify-center items-center gap-3">
            <Smartphone className="w-4 h-4" /> Local Support (bKash/Nagad)
          </a>
        </div>
      </div>

      {/* --- DANGER ZONE --- */}
      <div className="mt-12 card p-6 border-red-900/30 bg-red-950/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-red-400 font-medium flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5" /> Danger Zone
          </h3>
          <p className="text-xs text-red-400/70">Erase all local data. Does not delete cloud backups.</p>
        </div>
        <button onClick={handleClearData} className="shrink-0 px-5 py-3 rounded-xl border border-red-900/50 text-red-400 hover:bg-red-900/20 text-sm font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto">
          <Trash2 className="w-4 h-4" /> Wipe Local Data
        </button>
      </div>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </motion.div>
  )
}