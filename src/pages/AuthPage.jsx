// src/pages/AuthPage.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react'

export default function AuthPage({ onOfflineSelect }) {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!form.email || !form.password) {
      return setError('Email and password are required.')
    }

    if (!isLogin && form.password !== form.confirmPassword) {
      return setError('Passwords do not match.')
    }

    if (!isLogin && form.password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }

    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (error) throw error
        // App.jsx will automatically detect the session change and route them in
      } else {
        const { error } = await supabase.auth.signUp({ email: form.email, password: form.password })
        if (error) throw error
        setMessage('Account created! You are securely logged in.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSkip() {
    localStorage.setItem('wali_offline_mode', 'true')
    onOfflineSelect() // Tells App.jsx to let them in immediately
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-wali-green/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-wali-green/10 text-wali-green mb-6 border border-wali-green/20 shadow-[0_0_30px_-5px_rgba(34,197,94,0.15)]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-display text-zinc-100 mb-2">Wali <span className="text-2xl text-zinc-500 font-sans tracking-widest">(ولي)</span></h1>
          <p className="text-sm text-zinc-400 font-medium tracking-wide">Your Islamic Financial Guardian</p>
        </div>

        {/* Auth Card */}
        <div className="card p-6 md:p-8 shadow-2xl border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${isLogin ? 'border-wali-green text-wali-green' : 'border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${!isLogin ? 'border-wali-green text-wali-green' : 'border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Email Address</label>
              <input type="email" className="input-base w-full bg-zinc-950/50" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="input-base w-full bg-zinc-950/50 pr-10" 
                  placeholder="••••••••" 
                  value={form.password} 
                  onChange={set('password')} 
                  required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {!isLogin && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="pt-1">
                    <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Confirm Password</label>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="input-base w-full bg-zinc-950/50" 
                      placeholder="••••••••" 
                      value={form.confirmPassword} 
                      onChange={set('confirmPassword')} 
                      required={!isLogin} 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && <p className="text-xs text-wali-warn bg-wali-warn/10 p-3 rounded-lg border border-wali-warn/20">{error}</p>}
            {message && <p className="text-xs text-wali-green bg-wali-green/10 p-3 rounded-lg border border-wali-green/20">{message}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Offline Fallback */}
        <div className="mt-8 text-center">
          <button onClick={handleSkip} className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors group">
            Continue offline without account 
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </motion.div>
    </div>
  )
}