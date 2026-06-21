import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPersonas } from '../services/api'
import { useWingman } from '../services/WingmanContext'

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

const resolveArchetype = (r) =>
  r._archetype || Object.keys(ARCHETYPE_COLORS).find(k =>
    (r.agent_metadata?.agent_name || '').toLowerCase().includes(k.replace('_', ' '))
  ) || null

export default function PersonasPage() {
  const navigate = useNavigate()
  const { evalResults } = useWingman()
  const [persona, setPersona] = useState(null)

  const mostCompatible = evalResults.length
    ? evalResults.reduce((a, b) =>
        (a.agent_metadata?.compatibility_score ?? 0) >= (b.agent_metadata?.compatibility_score ?? 0) ? a : b
      )
    : null

  const arch = mostCompatible ? resolveArchetype(mostCompatible) : null
  const score = mostCompatible?.agent_metadata?.compatibility_score ?? null

  useEffect(() => {
    if (!arch) return
    getPersonas(arch)
      .then(res => { if (res.data?.length) setPersona(res.data[0]) })
      .catch(() => {})
  }, [arch])

  if (!arch) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
        <p>Run Simulate first to find your best match.</p>
        <button onClick={() => navigate('/simulate')} className="text-purple-400 text-sm hover:underline">
          → Go to Simulate
        </button>
      </div>
    )
  }

  if (!persona) {
    return (
      <div className="flex justify-center py-24">
        <span className="w-8 h-8 border-2 border-slate-700 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  const colors = ARCHETYPE_COLORS[arch] || {}

  return (
    <div className="max-w-md mx-auto pt-12">
      <div className="text-center mb-8">
        <p className="text-xs text-purple-400 uppercase tracking-widest mb-1">Your Best Match</p>
        <h1 className="text-2xl font-bold text-slate-100">
          Female {archetypeLabel(arch)}
        </h1>
      </div>

      <div className={`bg-card border ${colors.card || 'border-border'} rounded-2xl p-8 flex flex-col gap-6`}>
        {score != null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 uppercase tracking-widest">Compatibility</span>
            <span className="text-3xl font-bold text-green-400">
              {score}<span className="text-lg text-slate-500">/100</span>
            </span>
          </div>
        )}

        <div className="border-t border-border" />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${colors.text || 'text-slate-100'}`}>Female {archetypeLabel(arch)}</h2>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${colors.badge || 'bg-slate-800 text-slate-400 border-slate-600'}`}>
              {archetypeLabel(arch)}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            {persona.age} · {persona.occupation} · {persona.nationality}
          </p>
        </div>

        {persona.personality_traits?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {persona.personality_traits.map(t => (
              <span key={t} className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-border">
                {t}
              </span>
            ))}
          </div>
        )}

        <p className="text-sm text-slate-400 leading-relaxed">{persona.background}</p>

        <button
          onClick={() => navigate(`/chat/${encodeURIComponent(persona.name)}`)}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-xl transition-colors text-sm"
        >
          Start chatting →
        </button>
      </div>
    </div>
  )
}
