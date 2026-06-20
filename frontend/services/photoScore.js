// Combine per-photo "overall" scores into one "photo strength".
// Best-dominant (halo / first impression) with a soft penalty for a weak pic.
// KEEP CONSTANTS IN SYNC with backend/routes/image.py aggregate_photo_score().

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

export function photoStrength(analyses) {
  const overalls = (analyses || []).map((a) => Number(a.overall) || 0)
  if (!overalls.length) return null

  const best = Math.max(...overalls)
  const main = overalls[0]
  const worst = Math.min(...overalls)
  const avg = overalls.reduce((s, x) => s + x, 0) / overalls.length

  const base = 0.5 * best + 0.3 * main + 0.2 * avg
  const penalty = Math.max(0, 5 - worst) * 0.5
  const strength = Math.round(clamp(base - penalty, 1, 10) * 10) / 10

  const weakestIndex = overalls.indexOf(worst)
  return { strength, best, weakestIndex, weakestScore: worst, count: overalls.length }
}
