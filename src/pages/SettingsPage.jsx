import { useState } from 'react'
import { useSettings } from '../hooks/useStorage'

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    geminiApiKey: settings.geminiApiKey || '',
    monthlyLimit: settings.monthlyLimit,
    spentSoFar:   settings.spentSoFar,
    currency:     settings.currency,
  })

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  function handleSave(e) {
    e.preventDefault()
    updateSettings({
      ...form,
      monthlyLimit: parseFloat(form.monthlyLimit) || 0,
      spentSoFar:   parseFloat(form.spentSoFar) || 0,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28 scroll-area">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-zinc-100">Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">Configure Wali</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">

        {/* API Key */}
        <div className="card p-5">
          <p className="section-label">Gemini API key</p>
          <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
            Required for Wali's AI analysis. Get a free key at{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-wali-green underline underline-offset-2"
            >
              aistudio.google.com
            </a>
            {' '}— free tier includes 1M tokens/month.
          </p>
          <input
            type="password"
            className="input-base font-mono text-xs"
            placeholder="AIza..."
            value={form.geminiApiKey}
            onChange={set('geminiApiKey')}
            autoComplete="off"
          />
          <p className="text-[10px] text-zinc-600 mt-2">
            Stored locally on your device only. Never sent anywhere except Google's API.
          </p>
        </div>

        {/* Budget */}
        <div className="card p-5">
          <p className="section-label">Monthly budget</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Monthly limit ({form.currency})</label>
              <input
                type="number"
                className="input-base"
                min="0"
                value={form.monthlyLimit}
                onChange={set('monthlyLimit')}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Spent so far ({form.currency})</label>
              <input
                type="number"
                className="input-base"
                min="0"
                value={form.spentSoFar}
                onChange={set('spentSoFar')}
              />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            Update "Spent so far" manually each time you make a purchase. Reset it at the start of each month.
          </p>
        </div>

        {/* Currency */}
        <div className="card p-5">
          <p className="section-label">Currency symbol</p>
          <div className="grid grid-cols-4 gap-2">
            {['৳', '₹', '$', '€', '£', '¥', 'RM', 'Rp'].map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, currency: c }))}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  form.currency === c
                    ? 'bg-wali-green/10 border-wali-green text-wali-green'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="card p-5">
          <p className="section-label">About Wali</p>
          <div className="space-y-2 text-xs text-zinc-400 leading-relaxed">
            <p>Wali is an Islamic financial guardian that creates productive friction before non-essential purchases.</p>
            <p>All data is stored on your device. No account required. No ads. No tracking.</p>
            <p className="text-zinc-600">v0.1.0 — Built with React + Gemini Flash</p>
          </div>
        </div>

        {/* Save button */}
        <button type="submit" className="btn-primary">
          {saved ? '✓ Saved' : 'Save settings'}
        </button>
      </form>
    </div>
  )
}
