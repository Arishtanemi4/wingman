import { useState } from 'react'
import { describeImage } from '../services/api'

const SCORE_LABELS = {
  golden_ratio: 'Golden ratio',
  lighting: 'Lighting',
  contrast: 'Contrast',
  facial_symmetry: 'Symmetry',
  physical_build: 'Build',
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
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
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const [image_base64, preview_url] = await Promise.all([
        fileToBase64(file),
        fileToDataUrl(file),
      ])
      const res = await describeImage({ image_base64 })
      // merge preview_url into the analysis so the profile circle can use it
      onChange([...(analyses || []), { ...res.data, preview_url }])
    } catch (err) {
      setError(err.response?.data?.detail || 'Photo analysis failed — is minicpm-v pulled?')
    } finally {
      setUploading(false)
    }
  }

  const remove = (hash) => onChange((analyses || []).filter((a) => a.image_hash !== hash))

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-lg px-4 py-3 text-sm text-slate-400 hover:border-purple-500 hover:text-slate-200 cursor-pointer transition-colors">
        {uploading ? (
          <>
            <span className="w-4 h-4 border-2 border-slate-600 border-t-purple-500 rounded-full animate-spin" />
            Analysing photo…
          </>
        ) : '+ Upload a photo to score'}
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
      </label>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {(analyses || []).map((a) => (
        <div key={a.image_hash} className="bg-slate-900/60 border border-border rounded-lg overflow-hidden">
          {/* Image preview */}
          {a.preview_url && (
            <div className="relative">
              <img
                src={a.preview_url}
                alt="profile"
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <span className="bg-black/70 text-purple-300 text-xs font-bold px-2 py-1 rounded-full">
                  {a.overall}/10
                </span>
                <button
                  onClick={() => remove(a.image_hash)}
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
              <button onClick={() => remove(a.image_hash)} className="text-xs text-slate-600 hover:text-red-400">
                remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
