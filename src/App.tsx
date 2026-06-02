import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from '@/pages/Home'
import AdminLogin from '@/pages/admin/AdminLogin'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminGameSettings from '@/pages/admin/AdminGameSettings'
import AdminGameResults from '@/pages/admin/AdminGameResults'
import ParticipantJoin from '@/pages/participant/ParticipantJoin'
import ParticipantRegister from '@/pages/participant/ParticipantRegister'
import ParticipantOrientation from '@/pages/participant/ParticipantOrientation'
import ParticipantGame from '@/pages/participant/ParticipantGame'
import ParticipantResult from '@/pages/participant/ParticipantResult'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* 관리자 라우트 */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute isAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/games/:gameId/settings"
          element={
            <ProtectedRoute isAdmin>
              <AdminGameSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/games/:gameId/results"
          element={
            <ProtectedRoute isAdmin>
              <AdminGameResults />
            </ProtectedRoute>
          }
        />

        {/* 참가자 라우트 */}
        <Route path="/join" element={<ParticipantJoin />} />
        <Route path="/register/:gameId" element={<ParticipantRegister />} />
        <Route path="/orientation/:gameId/:teamId" element={<ParticipantOrientation />} />
        <Route path="/game/:gameId/:teamId" element={<ParticipantGame />} />
        <Route path="/result/:gameId/:teamId" element={<ParticipantResult />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
