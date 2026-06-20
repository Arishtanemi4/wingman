import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPersonas, getArchetypeInsights } from '../services/api'
import { userKey } from '../services/auth'

const ARCHETYPES = [
  'intellectual','creative','adventurer','careerist','nurturer','rebel',
  'social_butterfly','homebody','athlete','spiritualist','free_spirit','traditionalist',
]

const ARCHETYPE_COLORS = {
  intellectual:     { card: 'border-blue-700/40',   badge: 'bg-blue-900/40 text-blue-300 border-blue-700/40',   text: 'text-blue-300' },
  creative:         { card: 'border-purple-700/40', badge: 'bg-purple-900/40 text-purple-300 border-purple-700/40', text: 'text-purple-300' },
  adventurer:       { card: 'border-green-700/40',  badge: 'bg-green-900/40 text-green-300 border-green-700/40',  text: 'text-green-300' },
  careerist:        { card: 'border-yellow-700/40', badge: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40', text: 'text-yellow-300' },
  nurturer:         { card: 'border-pink-700/40',   badge: 'bg-pink-900/40 text-pink-300 border-pink-700/40',   text: 'text-pink-300' },
  rebel:            { card: 'border-red-700/40',    badge: 'bg-red-900/40 text-red-300 border-red-700/40',    text: 'text-red-300' },
  social_butterfly: { card: 'border-orange-700/40', badge: 'bg-orange-900/40 text-orange-300 border-orange-700/40', text: 'text-orange-300' },
  homebody:         { card: 'border-teal-700/40',   badge: 'bg-teal-900/40 text-teal-300 border-teal-700/40',   text: 'text-teal-300' },
  athlete:          { card: 'border-lime-700/40',   badge: 'bg-lime-900/40 text-lime-300 border-lime-700/40',   text: 'text-lime-300' },
  spiritualist:     { card: 'border-indigo-700/40', badge: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/40', text: 'text-indigo-300' },
  free_spirit:      { card: 'border-cyan-700/40',   badge: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/40',   text: 'text-cyan-300' },
  traditionalist:   { card: 'border-amber-700/40',  badge: 'bg-amber-900/40 text-amber-300 border-amber-700/40',  text: 'text-amber-300' },
}

const archetypeLabel = (arch) =>
  arch.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export default function PersonasPage() {
  const navigate = useNavigate()
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chatPersonas, setChatPersonas] = useState({}) // archetype → persona name

  // Profile from localStorage (user-scoped)
  const profile = (() => {
    try { return JSON.parse(localStorage.getItem(userKey('wingman_profile'))) } catch { return null }
  })()

  // Most compatible archetype from simulation results
  const simResults = (() => {
    try { return JSON.parse(localStorage.getItem(userKey('wingman_sim')))?.results || [] } catch { return [] }
  })()

  const mostCompatible = simResults.length
    ? simResults.reduce((a, b) =>
        (a.agent_metadata?.compatibility_score ?? 0) >= (b.agent_metadata?.compatibility_score ?? 0) ? a : b
      )
    : null

  const mostCompatibleArch = mostCompatible?._archetype || null
  const mostCompatibleScore = mostCompatible?.agent_metadata?.compatibility_score

  // Load one persona per archetype for chat navigation
  useEffect(() => {
    const load = async () => {
      const results = {}
      await Promise.all(
        ARCHETYPES.map(async (arch) => {
          try {
            const res = await getPersonas(arch)
            if (res.data?.length) results[arch] = res.data[0].name
          } catch {}
        })
      )
      setChatPersonas(results)
    }
    load()
  }, [])

  // Load archetype insights
  useEffect(() => {
    if (!profile?.hobbies?.length) return
    setLoading(true)
    setError(null)
    getArchetypeInsights(profile)
      .then((res) => setInsights(res.data.insights || []))
      .catch(() => setError('Could not load insights — is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  if (!profile?.hobbies?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
        <p>Complete your profile and run Analyze first.</p>
        <button onClick={() => navigate('/analyze')} className="text-purple-400 text-sm hover:underline">
          → Go to Analyze
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Personas</h1>
        <p className="text-slate-500 text-sm">
          How well <span className="text-slate-300">{profile.name}</span> plays with each archetype — pros, cons, and who to chat with.
        </p>
      </div>

      {/* Most compatible banner */}
      {mostCompatibleArch && (
        <div className={`mb-6 bg-card border ${ARCHETYPE_COLORS[mostCompatibleArch]?.card || 'border-purple-700/40'} rounded-2xl p-5 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-purple-400 uppercase tracking-widest mb-1">Most Compatible from Simulation</p>
            <p className={`text-xl font-bold ${ARCHETYPE_COLORS[mostCompatibleArch]?.text || 'text-purple-300'}`}>
              A Female {archetypeLabel(mostCompatibleArch)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">{mostCompatibleScore}</p>
            <p className="text-xs text-slate-500">swipe score</p>
          </div>
          {chatPersonas[mostCompatibleArch] && (
            <button
              onClick={() => navigate(`/chat/${encodeURIComponent(chatPersonas[mostCompatibleArch])}`)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
            >
              Chat now →
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/40 rounded-lg px-4 py-3 mb-6">{error}</p>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
          <span className="w-8 h-8 border-2 border-slate-700 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-sm">Generating archetype insights…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(insights.length ? insights : ARCHETYPES.map(a => ({ archetype: a, pros: [], cons: [] }))).map((item) => {
            const arch = item.archetype
            const colors = ARCHETYPE_COLORS[arch] || {}
            const isBest = arch === mostCompatibleArch
            return (
              <div
                key={arch}
                className={`bg-card border rounded-xl p-5 flex flex-col gap-4 ${isBest ? colors.card + ' ring-1 ring-purple-600/40' : 'border-border'}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold ${colors.text || 'text-slate-100'}`}>
                      A Female {archetypeLabel(arch)}
                    </p>
                    {isBest && <span className="text-xs text-purple-400">★ Most compatible</span>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${colors.badge || 'bg-slate-800 text-slate-400 border-slate-600'}`}>
                    {archetypeLabel(arch)}
                  </span>
                </div>

                {/* Pros */}
                {item.pros?.length > 0 && (
                  <div>
                    <p className="text-xs text-green-500 uppercase tracking-wide mb-1.5">Works for you</p>
                    <ul className="space-y-1">
                      {item.pros.map((p, i) => (
                        <li key={i} className="text-xs text-green-200 flex gap-1.5">
                          <span className="text-green-500 shrink-0">+</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cons */}
                {item.cons?.length > 0 && (
                  <div>
                    <p className="text-xs text-red-500 uppercase tracking-wide mb-1.5">Needs work</p>
                    <ul className="space-y-1">
                      {item.cons.map((c, i) => (
                        <li key={i} className="text-xs text-red-200 flex gap-1.5">
                          <span className="text-red-500 shrink-0">−</span>{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Chat CTA */}
                {chatPersonas[arch] && (
                  <button
                    onClick={() => navigate(`/chat/${encodeURIComponent(chatPersonas[arch])}`)}
                    className="mt-auto text-xs text-slate-400 hover:text-slate-200 border border-border hover:border-slate-500 rounded-lg py-2 transition-colors"
                  >
                    Chat with her →
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
