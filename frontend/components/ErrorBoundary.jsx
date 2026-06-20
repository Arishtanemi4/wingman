import { Component } from 'react'

// Catches render-time exceptions so a single bad component never blanks the app.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Render error caught by ErrorBoundary:', error, info)
  }

  reset = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-4">
          <div className="bg-card border border-red-900/40 rounded-2xl p-8 max-w-md text-center">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Something broke on screen</h2>
            <p className="text-slate-400 text-sm mb-4">
              The page hit an unexpected error and stopped rendering.
            </p>
            <p className="text-slate-600 text-xs font-mono bg-slate-900 rounded p-3 mb-5 break-words">
              {String(this.state.error?.message || this.state.error)}
            </p>
            <button
              onClick={this.reset}
              className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
