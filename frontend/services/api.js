import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Separate instance for slow local-LLM calls (5 min timeout)
const slowApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 300000,
})

export const getPersonas = (archetype = null) =>
  api.get('/api/personas', { params: archetype ? { archetype } : {} })

export const getPersona = (name) =>
  api.get(`/api/personas/${encodeURIComponent(name)}`)

export const chatWithPersona = (name, message, history = []) =>
  slowApi.post(`/api/personas/${encodeURIComponent(name)}/chat`, { message, history })

export const analyzeProfile = (profile) =>
  slowApi.post('/api/analyze', profile)

export const describeImage = (payload) =>
  slowApi.post('/api/image/describe', payload)

export const getArchetypeInsights = (profile) =>
  slowApi.post('/api/archetypes/insights', profile)

/**
 * Always returns a STRING from an axios error. FastAPI validation errors return
 * `detail` as an array of objects — rendering that as a React child crashes the
 * app, so we flatten it here.
 */
export function extractErrorMessage(err, fallback = 'Something went wrong.') {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d) => d?.msg || JSON.stringify(d)).join('; ') || fallback
  }
  if (detail && typeof detail === 'object') return JSON.stringify(detail)
  return err?.message || fallback
}

export default api
