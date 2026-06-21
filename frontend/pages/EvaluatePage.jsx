import { useNavigate } from 'react-router-dom'
import { useWingman } from '../services/WingmanContext'
import { NVIDIA_MODELS } from '../services/api'
import { userKey } from '../services/auth'

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

const archetypeLabel = (arch) =>
  arch ? `Female ${arch.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}` : '—'

const resolveArchetype = (r) =>
  r._archetype || Object.keys(ARCHETYPE_COLORS).find(k =>
    (r.agent_metadata?.agent_name || '').toLowerCase().includes(k.replace('_', ' '))
  ) || null

function OverallSummary({ results }) {
  if (!results.length) return null
  const scores = results.map(r => r.agent_metadata?.compatibility_score ?? 0)
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  const top = results.reduce((a, b) =>
    (a.agent_metadata?.compatibility_score ?? 0) >= (b.agent_metadata?.compatibility_score ?? 0) ? a : b)
  const bottom = results.reduce((a, b) =>
    (a.agent_metadata?.compatibility_score ?? 100) <= (b.agent_metadata?.compatibility_score ?? 100) ? a : b)
  const scoreColor = avg >= 70 ? 'text-green-400' : avg >= 45 ? 'text-yellow-400' : 'text-red-400'
  const scoreLabel = avg >= 70 ? 'Strong profile' : avg >= 45 ? 'Room to grow' : 'Needs work'

  return (
    <div className="bg-card border border-purple-900/40 rounded-2xl p-6 mb-6">
      <h3 className="text-xs text-purple-400 uppercase tracking-widest mb-5">Simulation Summary</h3>
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="text-center">
          <p className={`text-4xl font-bold ${scoreColor}`}>{avg}</p>
          <p className="text-xs text-slate-500 mt-1">avg swipe score</p>
          <p className={`text-xs font-medium mt-0.5 ${scoreColor}`}>{scoreLabel}</p>
        </div>
        <div className="text-center border-x border-border">
          <p className="text-slate-100 font-medium text-sm">{archetypeLabel(resolveArchetype(top))}</p>
          <p className="text-xs text-slate-500 mt-1">most compatible</p>
          <p className="text-green-400 font-bold text-lg">{top.agent_metadata?.compatibility_score}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-100 font-medium text-sm">{archetypeLabel(resolveArchetype(bottom))}</p>
          <p className="text-xs text-slate-500 mt-1">least compatible</p>
          <p className="text-red-400 font-bold text-lg">{bottom.agent_metadata?.compatibility_score}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {results
          .slice()
          .sort((a, b) => (b.agent_metadata?.compatibility_score ?? 0) - (a.agent_metadata?.compatibility_score ?? 0))
          .map((r, i) => {
            const score = r.agent_metadata?.compatibility_score ?? 0
            const arch = resolveArchetype(r)
            const barColor = score >= 70 ? 'bg-green-500' : score >= 45 ? 'bg-yellow-500' : 'bg-red-500'
            return (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="text-slate-400 w-36 truncate">{archetypeLabel(arch)}</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
                </div>
                <span className="text-slate-300 w-6 text-right">{score}</span>
              </div>
            )
          })}
      </div>
    </div>
  )
}

function SimCard({ evaluation }) {
  const meta = evaluation.agent_metadata || {}
  const critique = evaluation.psychological_critique || {}
  const feedback = evaluation.actionable_feedback || {}
  const arch = resolveArchetype(evaluation)
  const score = meta.compatibility_score ?? 0
  const scoreColor = score >= 70 ? 'text-green-400' : score >= 45 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-slate-100 font-medium">{archetypeLabel(arch)}</p>
          {arch && (
            <span className={`text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ${ARCHETYPE_COLORS[arch]}`}>
              {arch.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${scoreColor}`}>{score}</p>
          <p className="text-xs text-slate-600 mt-0.5">/ 100</p>
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

function ModelSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-slate-900 border border-border rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500 disabled:opacity-50"
    >
      {NVIDIA_MODELS.map(m => (
        <option key={m.id} value={m.id}>{m.label}</option>
      ))}
    </select>
  )
}

export default function SimulatePage() {
  const navigate = useNavigate()
  const {
    evalStatus: status,
    evalResults: results,
    evalProgress: progress,
    evalError: error,
    runEvaluate,
    stopEvaluate: stop,
    selectedModel,
    updateModel,
  } = useWingman()

  const profile = (() => {
    try { return JSON.parse(localStorage.getItem(userKey('wingman_profile'))) } catch { return null }
  })()

  const startSimulation = () => runEvaluate(profile)

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
          <h1 className="text-2xl font-bold mb-1">Simulate</h1>
          <p className="text-slate-500 text-sm">
            12 female archetypes rate <span className="text-slate-300">{profile.name}</span>'s profile.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ModelSelect value={selectedModel} onChange={updateModel} disabled={status === 'running'} />
          {status === 'running' ? (
            <button onClick={stop} className="px-4 py-2 rounded-lg border border-red-700/50 text-red-400 text-sm hover:bg-red-950/30 transition-colors">
              Stop
            </button>
          ) : (
            <button onClick={startSimulation} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors">
              {status === 'done' ? 'Re-run' : 'Start Simulation'}
            </button>
          )}
        </div>
      </div>

      {status === 'running' && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Simulating archetypes…</span>
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

      {error && (
        <div className="mb-6 bg-red-950/40 border border-red-900/40 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {status === 'idle' && results.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-slate-600">
          <p className="text-lg">Hit Start Simulation to begin</p>
          <p className="text-sm mt-1">Each archetype streams in as it completes (~3 min total)</p>
        </div>
      )}

      {results.length > 0 && <OverallSummary results={results} />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {results.map((r, i) => <SimCard key={i} evaluation={r} />)}
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
