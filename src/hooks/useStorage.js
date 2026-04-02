import { useState, useCallback } from 'react'
import {
  getSettings, saveSettings,
  getEvaluations, saveEvaluation, deleteEvaluation,
  getStats,
} from '../lib/storage'

export function useSettings() {
  const [settings, setSettingsState] = useState(() => getSettings())

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

  // NEW: Update an existing evaluation (e.g. marking it as bought)
  const updateEvaluation = useCallback((id, updates) => {
    const all = getEvaluations()
    const index = all.findIndex(e => e.id === id)
    if (index !== -1) {
      all[index] = { ...all[index], ...updates }
      localStorage.setItem('wali_evaluations', JSON.stringify(all))
      setEvaluations(all)
    }
  }, [])

  return { evaluations, addEvaluation, removeEvaluation, updateEvaluation }
}

export function useStats() {
  return getStats()
}

export function useTimers() {
  const [timers, setTimersState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wali_timers') || '{}') } 
    catch { return {} }
  })

  const setAppTimer = useCallback((id, expiresAt) => {
    setTimersState(prev => {
      const next = { ...prev, [id]: expiresAt }
      localStorage.setItem('wali_timers', JSON.stringify(next))
      return next
    })
  }, [])

  return { timers, setAppTimer }
}