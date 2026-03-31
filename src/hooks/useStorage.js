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

  return { evaluations, addEvaluation, removeEvaluation }
}

export function useStats() {
  return getStats()
}
