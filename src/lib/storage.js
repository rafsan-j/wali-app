// ─── Keys ────────────────────────────────────────────────────────────────────
const KEYS = {
  SETTINGS:    'wali_settings',
  EVALUATIONS: 'wali_evaluations',
  TIMERS:      'wali_timers',
}

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  monthlyLimit:  15000,
  spentSoFar:    0,
  geminiApiKey:  '',
  currency:      '৳',
  resetDay:      1, // day of month budget resets
}

// ─── Settings ────────────────────────────────────────────────────────────────
export function getSettings() {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch { return DEFAULT_SETTINGS }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
}

// ─── Evaluations ─────────────────────────────────────────────────────────────
export function getEvaluations() {
  try {
    const raw = localStorage.getItem(KEYS.EVALUATIONS)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveEvaluation(evaluation) {
  const all = getEvaluations()
  const entry = {
    id:        Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...evaluation,
  }
  all.unshift(entry) // newest first
  // Keep last 100 only
  localStorage.setItem(KEYS.EVALUATIONS, JSON.stringify(all.slice(0, 100)))
  return entry
}

export function deleteEvaluation(id) {
  const all = getEvaluations().filter(e => e.id !== id)
  localStorage.setItem(KEYS.EVALUATIONS, JSON.stringify(all))
}

// ─── Timers ──────────────────────────────────────────────────────────────────
export function getTimers() {
  try {
    const raw = localStorage.getItem(KEYS.TIMERS)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function setTimer(itemId, expiresAt) {
  const timers = getTimers()
  timers[itemId] = expiresAt
  localStorage.setItem(KEYS.TIMERS, JSON.stringify(timers))
}

export function isTimerExpired(itemId) {
  const timers = getTimers()
  if (!timers[itemId]) return true
  return Date.now() >= timers[itemId]
}

// ─── Stats helpers ────────────────────────────────────────────────────────────
export function getStats() {
  const evals = getEvaluations()
  const approved   = evals.filter(e => e.verdict === 'approve')
  const cautioned  = evals.filter(e => e.verdict === 'caution')
  const discouraged = evals.filter(e => e.verdict === 'discourage')

  const totalSpentOnWants = discouraged
    .filter(e => isTimerExpired(e.id)) // they bought it after timer
    .reduce((sum, e) => sum + (e.price || 0), 0)

  const totalRedirected = discouraged
    .reduce((sum, e) => sum + (e.price || 0), 0)

  const projectedValue = totalRedirected * Math.pow(1.08, 5)

  return {
    total:          evals.length,
    approved:       approved.length,
    cautioned:      cautioned.length,
    discouraged:    discouraged.length,
    totalRedirected,
    projectedValue: Math.round(projectedValue),
    resistanceRate: evals.length > 0
      ? Math.round((discouraged.length / evals.length) * 100)
      : 0,
  }
}
