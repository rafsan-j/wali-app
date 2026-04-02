import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to bundle local storage for cloud saving
export function getLocalPayload() {
  return {
    settings: JSON.parse(localStorage.getItem('wali_settings') || '{}'),
    evaluations: JSON.parse(localStorage.getItem('wali_evaluations') || '[]'),
    timers: JSON.parse(localStorage.getItem('wali_timers') || '{}')
  }
}

// Helper function to overwrite local storage with cloud data
export function applyCloudPayload(payload) {
  if (payload.settings) localStorage.setItem('wali_settings', JSON.stringify(payload.settings))
  if (payload.evaluations) localStorage.setItem('wali_evaluations', JSON.stringify(payload.evaluations))
  if (payload.timers) localStorage.setItem('wali_timers', JSON.stringify(payload.timers))
  // Force a reload to reflect new state
  window.location.reload()
}