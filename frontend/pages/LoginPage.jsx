import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, signup } from '../services/auth'

const DEMO_USERS = ['amrit', 'claude', 'gemini', 'chiru', 'kausty']

const inputCls = 'w-full bg-slate-900 border border-border rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'signup'

  const [username, setUsername] = useState('amrit')
  const [password, setPassword] = useState('amrit')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
  }

  const fillDemo = (u) => {
    setUsername(u)
    setPassword(u)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const result = mode === 'login'
      ? await login(username.trim(), password)
      : await signup(username.trim(), password)
    setLoading(false)

    if (result.success) {
      navigate('/analyze', { replace: true })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Wingman.ai
          </h1>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-slate-100 mb-1">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>

          {/* Quick access — only shown on login */}
          {mode === 'login' && (
            <>
              <p className="text-xs text-slate-500 mb-4">Quick access — click any name below</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {DEMO_USERS.map((u) => (
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
            </>
          )}

          {mode === 'signup' && (
            <p className="text-xs text-slate-500 mb-5">Username must be at least 3 characters, no spaces.</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder={mode === 'signup' ? 'Choose a username' : ''}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'signup' ? 'At least 3 characters' : ''}
                className={inputCls}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className={inputCls}
                />
              </div>
            )}

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
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                mode === 'login' ? 'Sign in' : 'Create account'
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-slate-500">
                New here?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
