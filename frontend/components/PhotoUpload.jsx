import { useState } from 'react'
import { describeImage, extractErrorMessage } from '../services/api'
import { photoStrength } from '../services/photoScore'
import { fileToBase64, downscaleImage } from '../services/imageUtils'

const SCORE_LABELS = {
  golden_ratio: 'Golden ratio',
  lighting: 'Lighting',
  contrast: 'Contrast',
  facial_symmetry: 'Symmetry',
  physical_build: 'Build',
}

function ScoreBar({ label, value }) {
  const pct = (value / 10) * 100
  const color = value >= 7 ? 'bg-green-500' : value >= 4 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-300 w-6 text-right">{value}</span>
    </div>
  )
}

export default function PhotoUpload({ analyses, onChange }) {
  const [pending, setPending] = useState([])  // [{preview_url, image_base64}]
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return

    const added = await Promise.all(files.map(async (file) => ({
      image_base64: await fileToBase64(file),
      preview_url: await downscaleImage(file),
    })))
    setPending(prev => [...prev, ...added])
  }

  const generateInsights = async () => {
    if (!pending.length || processing) return
    setProcessing(true)
    setError(null)
    try {
      const results = await Promise.all(
        pending.map(async ({ image_base64, preview_url }) => {
          const res = await describeImage({ image_base64 })
          return { ...res.data, preview_url }
        })
      )
      onChange([...(analyses || []), ...results])
      setPending([])
    } catch (err) {
      setError(extractErrorMessage(err, 'Photo analysis failed.'))
    } finally {
      setProcessing(false)
    }
  }

  const removePending = (idx) => setPending(prev => prev.filter((_, i) => i !== idx))
  const removeAnalyzed = (hash) => onChange((analyses || []).filter(a => a.image_hash !== hash))

  const strength = photoStrength(analyses)
  const strengthColor = (s) => (s >= 7 ? 'text-green-400' : s >= 4 ? 'text-yellow-400' : 'text-red-400')
  const strengthBar = (s) => (s >= 7 ? 'bg-green-500' : s >= 4 ? 'bg-yellow-500' : 'bg-red-500')

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-lg px-4 py-3 text-sm text-slate-400 hover:border-purple-500 hover:text-slate-200 cursor-pointer transition-colors">
        + Add photos (you can select multiple)
        <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
      </label>

      {/* Pending queue */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {pending.map((p, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden border border-dashed border-slate-700">
                <img src={p.preview_url} alt="pending" className="w-full h-24 object-cover opacity-50" />
                <button
                  type="button"
                  onClick={() => removePending(i)}
                  className="absolute top-1 right-1 bg-black/60 text-slate-400 hover:text-red-400 text-xs px-1.5 py-0.5 rounded-full"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={generateInsights}
            disabled={processing}
            className="w-full bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating insights…
              </>
            ) : `Generate image insights (${pending.length} photo${pending.length > 1 ? 's' : ''})`}
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Photo strength summary */}
      {strength && strength.count > 1 && (
        <div className="bg-card border border-purple-900/40 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-purple-400 uppercase tracking-widest">Photo strength</span>
            <span className={`text-lg font-bold ${strengthColor(strength.strength)}`}>{strength.strength}/10</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
            <div className={`h-full ${strengthBar(strength.strength)} rounded-full`} style={{ width: `${strength.strength * 10}%` }} />
          </div>
          <p className="text-xs text-slate-500">
            Best pic {strength.best}/10 leads · weakest {strength.weakestScore}/10 is a mild drag · {strength.count} photos
          </p>
        </div>
      )}

      {/* Analysed photos */}
      {(analyses || []).map((a, i) => (
        <div key={a.image_hash} className="bg-slate-900/60 border border-border rounded-lg overflow-hidden">
          {a.preview_url && (
            <div className="relative">
              <img src={a.preview_url} alt="profile" className="w-full h-48 object-cover" />
              <span className="absolute top-2 left-2 bg-black/70 text-xs px-2 py-1 rounded-full text-slate-200">
                {i === 0 ? '★ Main' : `Photo ${i + 1}`}
              </span>
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <span className="bg-black/70 text-purple-300 text-xs font-bold px-2 py-1 rounded-full">
                  {a.overall}/10
                </span>
                <button
                  type="button"
                  onClick={() => removeAnalyzed(a.image_hash)}
                  className="bg-black/70 text-slate-400 hover:text-red-400 text-xs px-2 py-1 rounded-full"
                >
                  ✕
                </button>
              </div>
              {a.cached && (
                <span className="absolute bottom-2 left-2 bg-black/60 text-slate-500 text-xs px-2 py-0.5 rounded-full">
                  cached
                </span>
              )}
            </div>
          )}
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">{a.description}</p>
            <div className="space-y-1.5">
              {Object.entries(a.scores || {}).map(([k, v]) => (
                <ScoreBar key={k} label={SCORE_LABELS[k] || k} value={v} />
              ))}
            </div>
            {a.improvement && (
              <p className="text-xs text-green-300 bg-green-950/30 border border-green-800/30 rounded px-2.5 py-1.5">
                💡 {a.improvement}
              </p>
            )}
            {!a.preview_url && (
              <button type="button" onClick={() => removeAnalyzed(a.image_hash)} className="text-xs text-slate-600 hover:text-red-400">
                remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
