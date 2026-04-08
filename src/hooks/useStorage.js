// src/hooks/useStorage.js
import { useState, useCallback, useEffect } from 'react'

// NEW: Helper to trigger background sync listener
function triggerSync() {
  window.dispatchEvent(new Event('wali_data_changed'))
}

// ─── 1. RAW DATABASE WRAPPERS (Pure functions, no React state) ───────────────

const KEYS = {
  SETTINGS:    'wali_settings',
  EVALUATIONS: 'wali_evaluations',
  TIMERS:      'wali_timers',
}

const DEFAULT_SETTINGS = {
  monthlyLimit:  15000,
  spentSoFar:    0,
  geminiApiKey:  '',
  currency:      '৳',
  resetDay:      1,
  lastResetDate: new Date().toISOString(),
  aiModel:       'gemini-2.5-flash-lite',
  enableSinkingFunds: false,
  autoSync:      false, // NEW: Defaulted to off
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch { return DEFAULT_SETTINGS }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
  triggerSync() // Trigger sync on change
}

export function getEvaluations() {
  try {
    const raw = localStorage.getItem(KEYS.EVALUATIONS)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveEvaluation(evaluation) {
  const all = getEvaluations()
  const entry = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...evaluation,
  }
  all.unshift(entry)
  localStorage.setItem(KEYS.EVALUATIONS, JSON.stringify(all.slice(0, 100)))
  triggerSync() // Trigger sync on change
  return entry
}

export function deleteEvaluation(id) {
  const all = getEvaluations().filter(e => e.id !== id)
  localStorage.setItem(KEYS.EVALUATIONS, JSON.stringify(all))
  triggerSync() // Trigger sync on change
}

// ─── 2. REACT HOOKS (Use these in your components) ───────────────────────────

export function useSettings() {
  const [settings, setSettingsState] = useState(() => getSettings())

  // Check budget reset safely on mount, preventing hydration errors
  useEffect(() => {
    const current = getSettings()
    const now = new Date()
    const lastReset = new Date(current.lastResetDate || now)
    const resetDay = current.resetDay || 1
    const targetResetDate = new Date(now.getFullYear(), now.getMonth(), resetDay)

    let updated = false
    if (now >= targetResetDate && lastReset < targetResetDate) {
      current.spentSoFar = 0
      current.lastResetDate = now.toISOString()
      updated = true
    } else if (now < targetResetDate) {
      const lastMonthTarget = new Date(now.getFullYear(), now.getMonth() - 1, resetDay)
      if (lastReset < lastMonthTarget) {
        current.spentSoFar = 0
        current.lastResetDate = now.toISOString()
        updated = true
      }
    }

    if (updated) {
      saveSettings(current)
      setSettingsState(current)
    }
  }, [])

  const updateSettings = useCallback((updates) => {
    setSettingsState(prev => {
      const next = { ...prev, ...updates }
      saveSettings(next)
      return next
    })
  }, [])

  return { settings, updateSettings }
}

export function useEvaluations() {
  const [evaluations, setEvaluations] = useState(() => getEvaluations())

  const addEvaluation = useCallback((data) => {
    const entry = saveEvaluation(data)
    setEvaluations(getEvaluations())
    return entry
  }, [])

  const removeEvaluation = useCallback((id) => {
    deleteEvaluation(id)
    setEvaluations(getEvaluations())
  }, [])

  // Fixed abstraction: now uses the DB correctly
  const updateEvaluation = useCallback((id, updates) => {
    const all = getEvaluations()
    const index = all.findIndex(e => e.id === id)
    if (index !== -1) {
      all[index] = { ...all[index], ...updates }
      localStorage.setItem(KEYS.EVALUATIONS, JSON.stringify(all))
      setEvaluations(all)
    }
  }, [])

  return { evaluations, addEvaluation, removeEvaluation, updateEvaluation }
}

export function useTimers() {
  const [timers, setTimersState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEYS.TIMERS) || '{}') } 
    catch { return {} }
  })

  const setAppTimer = useCallback((id, expiresAt) => {
    setTimersState(prev => {
      const next = { ...prev, [id]: expiresAt }
      localStorage.setItem(KEYS.TIMERS, JSON.stringify(next))
      return next
    })
  }, [])

  return { timers, setAppTimer }
}