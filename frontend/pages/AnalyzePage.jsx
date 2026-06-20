import { useState } from 'react'
import TagInput from '../components/TagInput'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-slate-900 border border-border rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors'

const SCORE_COLORS = {
  'Moderate-High':                    'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  'Moderate':                         'bg-amber-900/40 text-amber-300 border-amber-700/40',
  'Moderate to Moderate-High':        'bg-teal-900/40 text-teal-300 border-teal-700/40',
  'Low Neuroticism (High Stability)': 'bg-blue-900/40 text-blue-300 border-blue-700/40',
}
const DEFAULT_SCORE = 'bg-slate-800 text-slate-300 border-slate-600'

const MOCK_RESULT = [
  {
    trait: 'Openness to Experience',
    score: 'Moderate-High',
    evidence: [
      {
        observation: 'Graphic tee featuring East Asian (likely Japanese) aesthetic iconography worn at a British coastal landmark',
        inference: 'Suggests cultural curiosity and comfort with cross-cultural aesthetic reference points beyond the local mainstream',
      },
      {
        observation: 'Choice of Durdle Door — a geologically significant, historically layered site — over a generic beach resort',
        inference: 'Consistent with preference for environments that carry intellectual or natural-historical significance',
      },
      {
        observation: 'Compositional awareness in photo framing (arch deliberately positioned)',
        inference: 'Indicates some aesthetic sensibility and attention to visual storytelling',
      },
    ],
    note: { label: 'Caveat', text: 'The clothing choice alone could reflect fan culture (anime/manga) rather than broad cultural openness. Score is moderate-high rather than strongly high due to otherwise conventional presentation.' },
  },
  {
    trait: 'Conscientiousness',
    score: 'Moderate',
    evidence: [
      {
        observation: 'Carrying a hat — preparedness for sun exposure on a coastal walk',
        inference: 'Small behavioural signal of forethought and practical planning',
      },
      {
        observation: 'Wristwatch worn — analogue time-awareness accessory in an era of smartphones',
        inference: 'Mild indicator of time-conscious, structured orientation',
      },
      {
        observation: 'Overall appearance is tidy but not rigidly curated',
        inference: 'Suggests baseline organisation without compulsive precision; adequate rather than meticulous',
      },
      {
        observation: 'Jacket tied around waist (functional adaptation to temperature change)',
        inference: 'Practical adaptability — neutral signal, neither strongly structured nor spontaneous',
      },
    ],
    note: { label: 'Assessment', text: 'Nothing in the image strongly signals high conscientiousness (no formal attire, no hyper-curated styling) nor low conscientiousness (no visible dishevelment or apparent carelessness).' },
  },
  {
    trait: 'Extraversion',
    score: 'Moderate to Moderate-High',
    evidence: [
      {
        observation: 'Direct, sustained gaze into camera with confident, unreserved smile',
        inference: 'Comfort with being observed and photographed — reduced self-monitoring anxiety in social/public contexts',
      },
      {
        observation: 'Willingness to be photographed prominently at a popular tourist landmark',
        inference: 'Suggests neither social withdrawal nor performative attention-seeking — a functional social comfort level',
      },
      {
        observation: 'Duchenne smile (genuine engagement) rather than polite, closed-mouth social smile',
        inference: 'Positive affective display in a shared moment suggests interpersonal warmth and expressive range',
      },
      {
        observation: 'No visible stiffness or guardedness in posture',
        inference: 'Body language is open, weight distributed casually',
      },
    ],
    note: { label: 'Caveat', text: 'Tourist photography specifically encourages extraverted display regardless of baseline trait levels. This is the strongest situational confound in the dataset.' },
  },
  {
    trait: 'Agreeableness',
    score: 'Moderate-High',
    evidence: [
      {
        observation: 'Head tilt and genuine smile together form a classic approachability cluster in non-verbal communication research',
        inference: 'Signals prosocial orientation, willingness to be warm toward the observer/photographer',
      },
      {
        observation: 'Relaxed, open body language with no crossed arms, squared-off posture, or dominance display',
        inference: 'Absence of competitive or defensive non-verbal cues',
      },
      {
        observation: 'Minimal, understated accessories (single bracelet, watch)',
        inference: 'Low status-signalling — consistent with non-hierarchical, cooperative interpersonal style',
      },
      {
        observation: 'Soft facial musculature — no tension in jaw or brow',
        inference: 'Absence of vigilance or adversarial affect',
      },
    ],
    note: null,
  },
  {
    trait: 'Neuroticism / Emotional Stability',
    score: 'Low Neuroticism (High Stability)',
    evidence: [
      {
        observation: 'Genuine Duchenne smile in an exposed, high-altitude clifftop environment',
        inference: 'Suggests baseline emotional security — no visible anxiety response to height or public exposure',
      },
      {
        observation: 'Relaxed posture on a cliff edge at a busy tourist site',
        inference: 'Absence of environmental hypervigilance',
      },
      {
        observation: 'Even skin tone, relaxed musculature, no visible stress indicators',
        inference: 'Physiological calm consistent with low trait anxiety',
      },
      {
        observation: 'Comfort being the primary subject of a deliberately composed photograph',
        inference: 'Low self-consciousness in evaluative social contexts',
      },
    ],
    note: null,
  },
]

export default function AnalyzePage() {
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    bio: '',
    occupation: '',
    hobbies: [],
    interests: [],
  })
  const [images, setImages] = useState([]) // [{url, desc}]
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (key) => (val) => setProfile((p) => ({ ...p, [key]: val }))

  const addImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 6 - images.length)
    setImages((prev) => [...prev, ...files.map((f) => ({ url: URL.createObjectURL(f), desc: '' }))].slice(0, 6))
  }

  const removeImage = (i) => setImages((prev) => {
    URL.revokeObjectURL(prev[i].url)
    return prev.filter((_, idx) => idx !== i)
  })

  const setDesc = (i, desc) => setImages((prev) => prev.map((img, idx) => idx === i ? { ...img, desc } : img))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!profile.hobbies.length) {
      setError('Add at least one hobby to analyse.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setResult(MOCK_RESULT)
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* ── Profile Form ── */}
      <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
        <h2 className="text-lg font-semibold mb-1">Your Profile</h2>
        <p className="text-slate-500 text-sm mb-6">Fill in your details to get personalised feedback.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Image Upload ── */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Profile Photos (optional, up to 6)</label>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img.url} alt="" className="w-full h-24 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full text-xs text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >×</button>
                    <input
                      value={img.desc}
                      onChange={(e) => setDesc(i, e.target.value)}
                      placeholder="Describe this photo..."
                      className="mt-1 w-full bg-slate-900 border border-border rounded px-2 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
              </div>
            )}
            {images.length < 6 && (
              <label className="cursor-pointer flex items-center justify-center gap-2 border border-dashed border-border rounded-lg px-4 py-3 text-slate-500 hover:border-purple-500 hover:text-purple-400 transition-colors text-sm">
                + Add photos
                <input type="file" accept="image/*" multiple className="hidden" onChange={addImages} />
              </label>
            )}
          </div>

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

          <Field label="Interests (press Enter to add)">
            <TagInput
              value={profile.interests}
              onChange={set('interests')}
              placeholder="e.g. travel, music..."
            />
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
            <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-2xl px-6 py-4 flex items-center gap-3">
              <span className="text-emerald-400 text-lg">✓</span>
              <h3 className="text-emerald-300 font-semibold">Profile Analyzed</h3>
            </div>

            {result.map((item, i) => (
              <div key={item.trait} className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-sm font-medium">{i + 1}.</span>
                    <h4 className="text-slate-100 font-semibold">{item.trait}</h4>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${SCORE_COLORS[item.score] || DEFAULT_SCORE}`}>
                    {item.score}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <span className="text-xs text-slate-600 uppercase tracking-wide">Observation</span>
                    <span className="text-xs text-slate-600 uppercase tracking-wide">Inference</span>
                  </div>
                  <div className="space-y-3">
                    {item.evidence.map((row, j) => (
                      <div key={j} className="grid grid-cols-2 gap-3 border-t border-border/50 pt-3">
                        <p className="text-slate-400 text-sm leading-relaxed">{row.observation}</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{row.inference}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {item.note && (
                  <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg px-4 py-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">{item.note.label}: </span>
                    <span className="text-slate-400 text-sm">{item.note.text}</span>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
