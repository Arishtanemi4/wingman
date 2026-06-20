import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import AnalyzePage from './pages/AnalyzePage'
import PersonasPage from './pages/PersonasPage'
import ChatPage from './pages/ChatPage'

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/analyze" element={<Protected><AnalyzePage /></Protected>} />
        <Route path="/personas" element={<Protected><PersonasPage /></Protected>} />
        <Route path="/chat/:name" element={<Protected><ChatPage /></Protected>} />
        <Route path="*" element={<Navigate to="/analyze" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
