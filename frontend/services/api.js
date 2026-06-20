import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export const getPersonas = (archetype = null) =>
  api.get('/api/personas', { params: archetype ? { archetype } : {} })

export const getPersona = (name) =>
  api.get(`/api/personas/${encodeURIComponent(name)}`)

export const chatWithPersona = (name, message, history = []) =>
  api.post(`/api/personas/${encodeURIComponent(name)}/chat`, { message, history })

export const analyzeProfile = (profile) =>
  api.post('/api/analyze', profile)

export default api
