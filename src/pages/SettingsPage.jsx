import { useState, useEffect } from 'react'
import { useSettings } from '../hooks/useStorage'
import { supabase, getLocalPayload, applyCloudPayload } from '../lib/supabase'
import { LoadingDots } from '../components/UI'
import { motion } from 'framer-motion'

const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -15 },
  transition: { duration: 0.3, ease: 'easeOut' }
}

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const [saved, setSaved] = useState(false)
  const [user, setUser] = useState(null)
  
  // Auth & Sync States
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  const [form, setForm] = useState({
    geminiApiKey: settings.geminiApiKey || '',
    monthlyLimit: settings.monthlyLimit,
    spentSoFar:   settings.spentSoFar,
    currency:     settings.currency,
    resetDay:     settings.resetDay || 1,
    aiModel:      settings.aiModel || 'gemini-2.5-flash-lite', // NEW
  })

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  function handleSave(e) {
    e.preventDefault()
    updateSettings({
      ...form,
      monthlyLimit: parseFloat(form.monthlyLimit) || 0,
      spentSoFar:   parseFloat(form.spentSoFar) || 0,
      resetDay:     parseInt(form.resetDay) || 1,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // --- Supabase Auth Functions ---
  async function handleSignUp() {
    setSyncLoading(true)
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword })
    
    if (error) {
      // Check if it's the specific collision error
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
        setSyncMessage('Account exists. Please use Login instead, or use a format like your.email+wali@gmail.com to create a separate app account.')
      } else {
        setSyncMessage(error.message)
      }
    } else {
      setSyncMessage('Account created! You are logged in.')
    }
    
    setSyncLoading(false)
  }

  async function handleSignIn() {
    setSyncLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
    if (error) setSyncMessage(error.message)
    else setSyncMessage('Logged in successfully.')
    setSyncLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setSyncMessage('')
  }

  // --- Cloud Sync Functions ---
  async function pushToCloud() {
    setSyncLoading(true)
    setSyncMessage('')
    const payload = getLocalPayload()
    
    const { error } = await supabase
      .from('wali_sync')
      .upsert({ user_id: user.id, payload, updated_at: new Date().toISOString() })

    if (error) setSyncMessage('Error syncing to cloud.')
    else setSyncMessage('✓ Data backed up to cloud.')
    setSyncLoading(false)
  }

  async function pullFromCloud() {
    if (!window.confirm('This will overwrite your current device data. Proceed?')) return
    
    setSyncLoading(true)
    setSyncMessage('')
    const { data, error } = await supabase
      .from('wali_sync')
      .select('payload')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      setSyncMessage('No cloud data found.')
      setSyncLoading(false)
    } else {
      applyCloudPayload(data.payload)
    }
  }

  return (
    <motion.div {...pageTransition} className="max-w-xl mx-auto px-4 md:px-6 pt-6 pb-28 scroll-area">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-zinc-100">Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">Configure Wali</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* --- CLOUD SYNC SECTION --- */}
        <div className="card p-5 border-wali-green/20">
          <p className="section-label text-wali-green">Cloud Sync & Backup</p>
          
          {!user ? (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">Create an account to backup and sync your data across devices.</p>
              <input
                type="email" placeholder="Email" className="input-base"
                value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
              />
              <input
                type="password" placeholder="Password (min 6 chars)" className="input-base"
                value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="button" onClick={handleSignIn} className="btn-primary flex-1 bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700">Login</button>
                <button type="button" onClick={handleSignUp} className="btn-primary flex-1">Sign Up</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                <div>
                  <p className="text-xs text-zinc-500">Logged in as</p>
                  <p className="text-sm font-medium text-zinc-200 truncate max-w-[200px]">{user.email}</p>
                </div>
                <button type="button" onClick={handleSignOut} className="text-xs text-zinc-400 underline">Sign out</button>
              </div>
              
              <div className="flex gap-2">
                <button type="button" onClick={pushToCloud} disabled={syncLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Backup
                </button>
                <button type="button" onClick={pullFromCloud} disabled={syncLoading} className="btn-primary flex-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Restore
                </button>
              </div>
            </div>
          )}
          
          {syncMessage && <p className="text-xs text-wali-gold mt-3 text-center">{syncMessage}</p>}
          {syncLoading && !syncMessage && <div className="mt-3 text-center"><LoadingDots /></div>}
        </div>

        {/* Existing API Key */}
        <div className="card p-5">
          <p className="section-label">Gemini API key</p>
          <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
            Required for Wali's AI analysis. Get a free key at{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-wali-green underline underline-offset-2">
              aistudio.google.com
            </a>
          </p>
          <input type="password" className="input-base font-mono text-xs" placeholder="AIza..." value={form.geminiApiKey} onChange={set('geminiApiKey')} autoComplete="off" />
        </div>

        {/* AI Model Selection */}
        <div className="card p-5">
          <p className="section-label">AI Intelligence Level</p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, aiModel: 'gemini-2.5-flash-lite' }))}
              className={`flex-1 py-3 px-2 rounded-xl text-xs font-medium border transition-all text-center ${
                form.aiModel === 'gemini-2.5-flash-lite'
                  ? 'bg-wali-green/10 border-wali-green text-wali-green'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <span className="block text-sm mb-0.5">Flash</span>
              <span className="font-normal opacity-70">Fast, everyday use</span>
            </button>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, aiModel: 'gemini-2.5-pro' }))}
              className={`flex-1 py-3 px-2 rounded-xl text-xs font-medium border transition-all text-center ${
                form.aiModel === 'gemini-2.5-pro'
                  ? 'bg-wali-gold/10 border-wali-gold text-wali-gold'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <span className="block text-sm mb-0.5">Pro</span>
              <span className="font-normal opacity-70">Deep reasoning</span>
            </button>
          </div>
        </div>

        {/* Existing Budget */}
        <div className="card p-5">
          <p className="section-label mb-3">Monthly budget</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Monthly limit ({form.currency})</label>
              <input type="number" className="input-base" min="0" value={form.monthlyLimit} onChange={set('monthlyLimit')} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Spent so far ({form.currency})</label>
              <input type="number" className="input-base" min="0" value={form.spentSoFar} onChange={set('spentSoFar')} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Budget Reset Date (1-28)</label>
            <input type="number" className="input-base w-full" min="1" max="28" value={form.resetDay} onChange={set('resetDay')} />
          </div>
        </div>

        {/* Existing Currency */}
        <div className="card p-5">
          <p className="section-label">Currency symbol</p>
          <div className="grid grid-cols-4 gap-2">
            {['৳', '₹', '$', '€', '£', '¥', 'RM', 'Rp'].map(c => (
              <button key={c} type="button" onClick={() => setForm(prev => ({ ...prev, currency: c }))} className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${form.currency === c ? 'bg-wali-green/10 border-wali-green text-wali-green' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary">
          {saved ? '✓ Saved' : 'Save local settings'}
        </button>
      </form>
    </motion.div>
  )
}