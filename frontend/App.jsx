import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { WingmanProvider } from './services/WingmanContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import AnalyzePage from './pages/AnalyzePage'
import EvaluatePage from './pages/EvaluatePage'
import PersonasPage from './pages/PersonasPage'
import ChatPage from './pages/ChatPage'

// Mounts WingmanProvider fresh on every login — remounts when user leaves protected area
function ProtectedApp() {
  return (
    <ProtectedRoute>
      <WingmanProvider>
        <Layout>
          <Outlet />
        </Layout>
      </WingmanProvider>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedApp />}>
          <Route path="/analyze"   element={<AnalyzePage />} />
          <Route path="/evaluate"  element={<EvaluatePage />} />
          <Route path="/personas"  element={<PersonasPage />} />
          <Route path="/chat/:name" element={<ChatPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/analyze" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
