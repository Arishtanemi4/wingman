import { createContext, useContext, useState, useRef } from 'react'
import { analyzeProfile } from './api'

const API_URL = import.meta.env.VITE_API_URL

const RESULT_KEY = 'wingman_result'
const EVAL_KEY   = 'wingman_eval'

const WingmanContext = createContext(null)

export const useWingman = () => useContext(WingmanContext)

export function WingmanProvider({ children }) {
  // ── Analyze state ──
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [analyzeResult, setAnalyzeResult] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RESULT_KEY)) || null } catch { return null }
  })
  const [analyzeError, setAnalyzeError] = useState(null)

  const runAnalyze = async (payload) => {
    setAnalyzeLoading(true)
    setAnalyzeError(null)
    setAnalyzeResult(null)
    localStorage.removeItem(RESULT_KEY)
    try {
      const res = await analyzeProfile(payload)
      setAnalyzeResult(res.data)
      localStorage.setItem(RESULT_KEY, JSON.stringify(res.data))
    } catch (err) {
      setAnalyzeError(err.response?.data?.detail || 'Analysis failed — is the backend running?')
    } finally {
      setAnalyzeLoading(false)
    }
  }

  // ── Evaluate (streaming) state ──
  const [evalStatus, setEvalStatus] = useState(() => {
    try { return JSON.parse(localStorage.getItem(EVAL_KEY))?.done ? 'done' : 'idle' } catch { return 'idle' }
  })
  const [evalResults, setEvalResults] = useState(() => {
    try { return JSON.parse(localStorage.getItem(EVAL_KEY))?.results || [] } catch { return [] }
  })
  const [evalProgress, setEvalProgress] = useState({ done: 0, total: 12 })
  const [evalError, setEvalError] = useState(null)
  const abortRef = useRef(null)

  const persistEval = (results, done = false) => {
    localStorage.setItem(EVAL_KEY, JSON.stringify({ results, done }))
  }

  const runEvaluate = async (profile) => {
    if (!profile) return
    setEvalResults([])
    setEvalStatus('running')
    setEvalError(null)
    setEvalProgress({ done: 0, total: 12 })
    persistEval([], false)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`${API_URL}/api/evaluate/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'start') {
              setEvalProgress({ done: 0, total: event.total })
            } else if (event.type === 'result') {
              accumulated = [...accumulated, event.data]
              setEvalResults([...accumulated])
              setEvalProgress(prev => ({ ...prev, done: event.index }))
              persistEval(accumulated, false)
            } else if (event.type === 'done') {
              setEvalStatus('done')
              persistEval(accumulated, true)
            }
          } catch {}
        }
      }
      setEvalStatus('done')
    } catch (err) {
      if (err.name !== 'AbortError') {
        setEvalError(err.message || 'Stream failed')
        setEvalStatus('error')
      } else {
        setEvalStatus('idle')
      }
    }
  }

  const stopEvaluate = () => {
    abortRef.current?.abort()
  }

  return (
    <WingmanContext.Provider value={{
      // analyze
      analyzeLoading, analyzeResult, analyzeError, runAnalyze,
      // evaluate
      evalStatus, evalResults, evalProgress, evalError, runEvaluate, stopEvaluate,
    }}>
      {children}
    </WingmanContext.Provider>
  )
}
