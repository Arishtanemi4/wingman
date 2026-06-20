import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../services/auth'

const linkClass = ({ isActive }) =>
  `text-sm transition-colors ${isActive ? 'text-purple-400 font-medium' : 'text-slate-400 hover:text-slate-100'}`

export default function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Wingman
          </span>
          <div className="flex gap-6">
            <NavLink to="/analyze" className={linkClass}>Analyze</NavLink>
            <NavLink to="/evaluate" className={linkClass}>Evaluate</NavLink>
            <NavLink to="/personas" className={linkClass}>Personas</NavLink>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors"
        >
          Log out
        </button>
      </div>
    </nav>
  )
}
