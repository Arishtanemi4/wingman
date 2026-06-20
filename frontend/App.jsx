import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { WingmanProvider } from './services/WingmanContext'
import { currentUsername } from './services/auth'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import AnalyzePage from './pages/AnalyzePage'
import EvaluatePage from './pages/EvaluatePage'
import PersonasPage from './pages/PersonasPage'
import ChatPage from './pages/ChatPage'

// key={username} forces WingmanProvider to remount (fresh state + storage keys)
// whenever the logged-in user changes — so one user never sees another's results.
// State still persists across tab-switches for the SAME user (key unchanged).
function ProtectedApp() {
  return (
    <ProtectedRoute>
      <WingmanProvider key={currentUsername() || 'anon'}>
        <Layout>
          <Outlet />
        </Layout>
      </WingmanProvider>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedApp />}>
          <Route path="/analyze"   element={<AnalyzePage />} />
          <Route path="/simulate"  element={<EvaluatePage />} />
          <Route path="/personas"  element={<PersonasPage />} />
          <Route path="/chat/:name" element={<ChatPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/analyze" replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
