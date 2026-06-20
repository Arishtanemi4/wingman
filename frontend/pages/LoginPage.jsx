import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/auth'

export default function LoginPage() {
  const [username, setUsername] = useState('amrit')
  const [password, setPassword] = useState('amrit')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(username.trim(), password)
    setLoading(false)
    if (result.success) {
      navigate('/analyze', { replace: true })
    } else {
      setError(result.error)
    }
  }

  const fillDemo = (u) => {
    setUsername(u)
    setPassword(u)
    setError('')
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Wingman
          </h1>
          <p className="text-slate-500 text-sm mt-2">Your AI dating coach</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-slate-100 mb-1">Sign in</h2>
          <p className="text-xs text-slate-500 mb-5">Quick access — click any name below</p>

          {/* Demo accounts */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['amrit', 'claude', 'gemini', 'chiru', 'kausty'].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => fillDemo(u)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  username === u
                    ? 'bg-purple-700 border-purple-600 text-white'
                    : 'border-border text-slate-400 hover:border-purple-500 hover:text-slate-200'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full bg-slate-900 border border-border rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-slate-900 border border-border rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

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
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
