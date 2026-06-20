import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPersonas } from '../services/api'

const ARCHETYPES = [
  'intellectual', 'creative', 'adventurer', 'careerist', 'nurturer',
  'rebel', 'social_butterfly', 'homebody', 'athlete', 'spiritualist',
  'free_spirit', 'traditionalist',
]

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

export default function PersonasPage() {
  const [personas, setPersonas] = useState([])
  const [activeArchetype, setActiveArchetype] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    getPersonas(activeArchetype)
      .then((res) => setPersonas(res.data))
      .catch(() => setError('Could not load personas — is the backend running?'))
      .finally(() => setLoading(false))
  }, [activeArchetype])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Personas</h1>
        <p className="text-slate-500 text-sm">
          108 women across 12 archetypes. Click any card to start a conversation.
        </p>
      </div>

      {/* Archetype filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveArchetype(null)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            !activeArchetype
              ? 'bg-purple-700 border-purple-600 text-white'
              : 'border-border text-slate-400 hover:border-slate-500'
          }`}
        >
          All ({activeArchetype ? '' : personas.length || 108})
        </button>
        {ARCHETYPES.map((a) => (
          <button
            key={a}
            onClick={() => setActiveArchetype(activeArchetype === a ? null : a)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeArchetype === a
                ? `${ARCHETYPE_COLORS[a]} font-medium`
                : 'border-border text-slate-400 hover:border-slate-500'
            }`}
          >
            {a.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/40 rounded-lg px-4 py-3 mb-6">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <span className="w-8 h-8 border-2 border-slate-700 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map((p) => (
            <div
              key={p.name}
              onClick={() => navigate(`/chat/${encodeURIComponent(p.name)}`)}
              className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-purple-600/60 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-slate-100 font-medium">{p.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{p.age} · {p.occupation}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${ARCHETYPE_COLORS[p.archetype]}`}
                >
                  {p.archetype.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-slate-600 text-xs">{p.nationality}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
