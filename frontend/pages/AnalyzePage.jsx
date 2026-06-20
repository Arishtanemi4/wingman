import { useState, useRef } from 'react'
import TagInput from '../components/TagInput'
import PhotoUpload from '../components/PhotoUpload'
import { useWingman } from '../services/WingmanContext'
import { describeImage } from '../services/api'
import { currentUsername, userKey } from '../services/auth'

// Scoped to the logged-in user — computed once at module parse time is wrong here
// so we compute it inside the component via a getter
const getProfileKey = () => userKey('wingman_profile')

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

const DEFAULT_BADGE = 'bg-slate-800 text-slate-300 border-slate-600'

function ArchetypeBadge({ name }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${ARCHETYPE_COLORS[name] || DEFAULT_BADGE}`}>
      {name.replace(/_/g, ' ')}
    </span>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-slate-900 border border-border rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors'

const EMPTY_PROFILE = { name: '', age: '', bio: '', occupation: '', hobbies: [], image_descriptions: [], image_analyses: [] }

export default function AnalyzePage() {
  const { analyzeLoading: loading, analyzeResult: result, analyzeError, runAnalyze } = useWingman()

  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem(getProfileKey())) || EMPTY_PROFILE } catch { return EMPTY_PROFILE }
  })
  const [formError, setFormError] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef(null)
  const error = formError || analyzeError

  const primaryPhoto = profile.image_analyses?.[0]

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvatarUploading(true)
    try {
      const reader = new FileReader()
      const [image_base64, preview_url] = await Promise.all([
        new Promise((res, rej) => { reader.onload = () => res(reader.result.split(',')[1]); reader.onerror = rej; reader.readAsDataURL(file) }),
        new Promise((res, rej) => { const r2 = new FileReader(); r2.onload = () => res(r2.result); r2.onerror = rej; r2.readAsDataURL(file) }),
      ])
      const apiRes = await describeImage({ image_base64 })
      const newAnalysis = { ...apiRes.data, preview_url }
      // Replace first photo (avatar slot) or prepend
      const rest = profile.image_analyses?.slice(1) || []
      set('image_analyses')([newAnalysis, ...rest])
    } catch {}
    setAvatarUploading(false)
  }

  const set = (key) => (val) => setProfile((p) => {
    const next = { ...p, [key]: val }
    localStorage.setItem(getProfileKey(), JSON.stringify(next))
    return next
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!profile.hobbies.length) {
      setFormError('Add at least one hobby to analyse.')
      return
    }
    setFormError(null)
    const payload = { ...profile, age: parseInt(profile.age) || 0 }
    localStorage.setItem(getProfileKey(), JSON.stringify(payload))
    runAnalyze(payload)  // fire-and-forget: state lives in context, survives tab switches
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* ── Profile Form ── */}
      <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
        {/* Profile circle */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-600 hover:border-purple-400 transition-colors relative group"
            >
              {primaryPhoto?.preview_url ? (
                <img src={primaryPhoto.preview_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-xl font-bold">
                  {profile.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {avatarUploading
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <span className="text-white text-xs">Change</span>
                }
              </div>
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{profile.name || 'Your Profile'}</h2>
            <p className="text-slate-500 text-xs">
              {currentUsername() && <span className="text-purple-400">@{currentUsername()} · </span>}
              Fill in your details to get personalised feedback.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name *">
              <input
                required
                value={profile.name}
                onChange={(e) => set('name')(e.target.value)}
                placeholder="Alex"
                className={inputCls}
              />
            </Field>
            <Field label="Age *">
              <input
                required
                type="number"
                min={18}
                max={80}
                value={profile.age}
                onChange={(e) => set('age')(e.target.value)}
                placeholder="27"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Occupation">
            <input
              value={profile.occupation}
              onChange={(e) => set('occupation')(e.target.value)}
              placeholder="Software Engineer"
              className={inputCls}
            />
          </Field>

          <Field label="Bio *">
            <textarea
              required
              rows={3}
              value={profile.bio}
              onChange={(e) => set('bio')(e.target.value)}
              placeholder="A few sentences about yourself..."
              className={`${inputCls} resize-none`}
            />
          </Field>

          <Field label="Hobbies * (press Enter to add)">
            <TagInput
              value={profile.hobbies}
              onChange={set('hobbies')}
              placeholder="e.g. hiking, photography..."
            />
          </Field>

          <Field label="Photos (scored on golden ratio, lighting, symmetry…)">
            <PhotoUpload analyses={profile.image_analyses} onChange={set('image_analyses')} />
          </Field>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/40 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analysing...
              </>
            ) : (
              'Analyse my profile'
            )}
          </button>
        </form>
      </div>

      {/* ── Results ── */}
      <div className="space-y-6">
        {!result && !loading && (
          <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-slate-600">
            <p className="text-lg">Results appear here</p>
            <p className="text-sm mt-1">Fill your profile and hit Analyse</p>
          </div>
        )}

        {loading && (
          <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center gap-4 text-slate-500">
            <span className="w-8 h-8 border-2 border-slate-700 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-sm">Reading the room...</p>
          </div>
        )}

        {result && (
          <>
            {/* Summary */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-3">Overview</h3>
              <p className="text-slate-200 leading-relaxed">{result.summary}</p>
            </div>

            {/* Top Recommendations */}
            <div className="bg-card border border-purple-900/40 rounded-2xl p-6">
              <h3 className="text-xs text-purple-400 uppercase tracking-widest mb-4">Top Recommendations</h3>
              <ol className="space-y-3">
                {result.top_recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-purple-500 font-bold text-sm w-5 shrink-0">{i + 1}.</span>
                    <p className="text-slate-300 text-sm leading-relaxed">{rec}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Hobby Feedback */}
            <div>
              <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-3">Hobby Breakdown</h3>
              <div className="space-y-4">
                {result.hobby_feedback.map((hf) => (
                  <div key={hf.hobby} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <span className="text-slate-100 font-medium capitalize">{hf.hobby}</span>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {hf.appeals_to.map((a) => (
                          <ArchetypeBadge key={a} name={a} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Direction</p>
                        <p className="text-slate-300 text-sm">{hf.improvement_direction}</p>
                      </div>
                      <div className="bg-yellow-950/30 border border-yellow-800/30 rounded-lg p-3">
                        <p className="text-xs text-yellow-600 uppercase tracking-wide mb-1">★ Standout tip</p>
                        <p className="text-yellow-200 text-sm">{hf.standout_tip}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Archetype Gaps */}
            {result.archetype_gaps?.length > 0 && (
              <div>
                <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-3">Gaps to Bridge</h3>
                <div className="space-y-4">
                  {result.archetype_gaps.map((gap) => (
                    <div key={gap.archetype} className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <ArchetypeBadge name={gap.archetype} />
                        <span className="text-xs text-slate-600">low overlap</span>
                      </div>
                      <p className="text-slate-400 text-sm mb-3">{gap.reason}</p>
                      <div className="bg-green-950/30 border border-green-800/30 rounded-lg p-3">
                        <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Quick win</p>
                        <p className="text-green-300 text-sm">{gap.quick_win}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
