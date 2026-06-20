import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL

const ARCHETYPE_COLORS = {
  intellectual:     'bg-blue-900/40 text-blue-300 border-blue-700/40',
  creative:         'bg-purple-900/40 text-purple-300 border-purple-700/40',
  adventurer:       'bg-green-900/40 text-green-300 border-green-700/40',
  careerist:        'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
  nurturer:         'bg-pink-900/40 text-pink-300 border-pink-700/40',
  rebel:            'bg-red-900/40 text-red-300 border-red-700/40',
  social_butterfly: 'bg-orange-900/40 text-orange-300 border-orange-700/40',
  homebody:         'bg-teal-900/40 text-teal-300 border-teal-700/40',
  athlete:          'bg-lime-900/40 text-lime-300 border-lime-700/40',
  spiritualist:     'bg-indigo-900/40 text-indigo-300 border-indigo-700/40',
  free_spirit:      'bg-cyan-900/40 text-cyan-300 border-cyan-700/40',
  traditionalist:   'bg-amber-900/40 text-amber-300 border-amber-700/40',
}

function ScoreRing({ score }) {
  const color = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'
  return (
    <div className={`text-2xl font-bold ${color}`}>{score}</div>
  )
}

function EvalCard({ evaluation }) {
  const meta = evaluation.agent_metadata || {}
  const critique = evaluation.psychological_critique || {}
  const feedback = evaluation.actionable_feedback || {}
  const archetype = meta.agent_name
    ? Object.keys(ARCHETYPE_COLORS).find(k =>
        meta.agent_name.toLowerCase().includes(k.replace('_', ' '))
      )
    : null

  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-slate-100 font-medium">{meta.agent_name || '—'}</p>
          {archetype && (
            <span className={`text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ${ARCHETYPE_COLORS[archetype]}`}>
              {archetype.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        <div className="text-center">
          <ScoreRing score={meta.compatibility_score ?? '?'} />
          <p className="text-xs text-slate-600 mt-0.5">swipe score</p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        {critique.first_impression && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">First impression</p>
            <p className="text-slate-300">{critique.first_impression}</p>
          </div>
        )}
        {critique.dealbreakers_detected && (
          <div className="bg-red-950/30 border border-red-800/30 rounded-lg p-3">
            <p className="text-xs text-red-500 uppercase tracking-wide mb-1">Dealbreakers</p>
            <p className="text-red-200">{critique.dealbreakers_detected}</p>
          </div>
        )}
        {feedback.direct_quote && (
          <div className="bg-slate-800/60 rounded-lg p-3 border-l-2 border-purple-500">
            <p className="text-slate-300 italic">"{feedback.direct_quote}"</p>
          </div>
        )}
        {feedback.prompt_changes && (
          <div className="bg-green-950/30 border border-green-800/30 rounded-lg p-3">
            <p className="text-xs text-green-500 uppercase tracking-wide mb-1">What to fix</p>
            <p className="text-green-200">{feedback.prompt_changes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function EvaluatePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | running | done | error
  const [progress, setProgress] = useState({ done: 0, total: 12 })
  const [filePath, setFilePath] = useState(null)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('wingman_profile')
    if (stored) setProfile(JSON.parse(stored))
  }, [])

  const startEvaluation = async () => {
    if (!profile) return
    setResults([])
    setStatus('running')
    setError(null)
    setProgress({ done: 0, total: 12 })

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
              setProgress({ done: 0, total: event.total })
              setFilePath(event.file_path)
            } else if (event.type === 'result') {
              setResults(prev => [...prev, event.data])
              setProgress(prev => ({ ...prev, done: event.index }))
            } else if (event.type === 'done') {
              setStatus('done')
              setFilePath(event.file_path)
            }
          } catch {}
        }
      }

      setStatus('done')
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Stream failed')
        setStatus('error')
      }
    }
  }

  const stop = () => {
    abortRef.current?.abort()
    setStatus('idle')
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
        <p>No profile found. Analyse your profile first.</p>
        <button onClick={() => navigate('/analyze')} className="text-purple-400 text-sm hover:underline">
          → Go to Analyze
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Persona Evaluations</h1>
          <p className="text-slate-500 text-sm">
            12 archetypes critique <span className="text-slate-300">{profile.name}</span>'s profile in real time.
          </p>
        </div>

        <div className="flex gap-3">
          {status === 'running' ? (
            <button
              onClick={stop}
              className="px-4 py-2 rounded-lg border border-red-700/50 text-red-400 text-sm hover:bg-red-950/30 transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={startEvaluation}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              {status === 'done' ? 'Re-run' : 'Start Evaluation'}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {status === 'running' && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Evaluating archetypes…</span>
            <span>{progress.done}/{progress.total}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {status === 'done' && filePath && (
        <div className="mb-6 bg-green-950/30 border border-green-800/30 rounded-lg px-4 py-2.5 text-xs text-green-400">
          Saved → <span className="font-mono text-green-300">{filePath}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-950/40 border border-red-900/40 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {status === 'idle' && results.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-slate-600">
          <p className="text-lg">Hit Start Evaluation to begin</p>
          <p className="text-sm mt-1">Each archetype streams in as it completes (~3 min total)</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {results.map((r, i) => (
          <EvalCard key={i} evaluation={r} />
        ))}

        {/* Skeleton for in-progress slot */}
        {status === 'running' && (
          <div className="bg-card border border-border/50 rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-2/3 mb-3" />
            <div className="h-3 bg-slate-800 rounded w-1/3 mb-4" />
            <div className="h-3 bg-slate-800 rounded w-full mb-2" />
            <div className="h-3 bg-slate-800 rounded w-5/6" />
          </div>
        )}
      </div>
    </div>
  )
}
