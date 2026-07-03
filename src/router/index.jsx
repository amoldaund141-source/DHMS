import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// ── Layouts / Shells ──────────────────────────────────────────
import AdminShell  from '@/components/layout/AdminShell'
import StaffShell  from '@/components/layout/StaffShell'
import PatientShell from '@/components/layout/PatientShell'

// ── Public Pages ──────────────────────────────────────────────
import LandingPage     from '@/pages/public/LandingPage'
import LoginPage       from '@/pages/public/LoginPage'
import RegisterPage    from '@/pages/public/RegisterPage'
import NotFoundPage    from '@/pages/public/NotFoundPage'
import ErrorPage       from '@/pages/public/ErrorPage'

// ── Admin Pages ───────────────────────────────────────────────
import AdminOverview   from '@/pages/admin/AdminOverview'
import HospitalDetail  from '@/pages/admin/HospitalDetail'
import CompareCharts   from '@/pages/admin/CompareCharts'
import AdminNotifications from '@/pages/admin/AdminNotifications'
import AdminProfile    from '@/pages/admin/AdminProfile'

// ── Staff Pages ───────────────────────────────────────────────
import StaffDashboard  from '@/pages/staff/StaffDashboard'
import AttendancePage  from '@/pages/staff/AttendancePage'
import AppointmentsPage from '@/pages/staff/AppointmentsPage'
import StockPage       from '@/pages/staff/StockPage'
import StaffNotifications from '@/pages/staff/StaffNotifications'
import StaffProfile    from '@/pages/staff/StaffProfile'

// ── Patient Pages ─────────────────────────────────────────────
import NearbyHospitals from '@/pages/patient/NearbyHospitals'
import HospitalDetailPatient from '@/pages/patient/HospitalDetailPatient'
import BookAppointment from '@/pages/patient/BookAppointment'
import MyAppointments  from '@/pages/patient/MyAppointments'
import PatientNotifications from '@/pages/patient/PatientNotifications'
import PatientProfile  from '@/pages/patient/PatientProfile'

// ── Role-based redirect after login ───────────────────────────
const ROLE_HOME = {
  admin:   '/admin',
  staff:   '/staff',
  patient: '/patient',
}

// ── Protected Route guard ──────────────────────────────────────
function ProtectedRoute({ allowedRole, children }) {
  const { isAuthenticated, role, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null // Wait for localStorage restore

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRole && role !== allowedRole) {
    // Wrong role — redirect to their correct dashboard
    return <Navigate to={ROLE_HOME[role] ?? '/login'} replace />
  }

  return children
}

// ── Root redirect after login ──────────────────────────────────
function RootRedirect() {
  const { isAuthenticated, role, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/landing" replace />
  return <Navigate to={ROLE_HOME[role] ?? '/login'} replace />
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public routes */}
      <Route path="/landing"  element={<LandingPage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/error"    element={<ErrorPage />} />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRole="admin">
          <AdminShell />
        </ProtectedRoute>
      }>
        <Route index             element={<AdminOverview />} />
        <Route path="hospital/:id" element={<HospitalDetail />} />
        <Route path="compare"    element={<CompareCharts />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="profile"    element={<AdminProfile />} />
      </Route>

      {/* Staff routes */}
      <Route path="/staff" element={
        <ProtectedRoute allowedRole="staff">
          <StaffShell />
        </ProtectedRoute>
      }>
        <Route index             element={<StaffDashboard />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="stock"      element={<StockPage />} />
        <Route path="notifications" element={<StaffNotifications />} />
        <Route path="profile"    element={<StaffProfile />} />
      </Route>

      {/* Patient routes */}
      <Route path="/patient" element={
        <ProtectedRoute allowedRole="patient">
          <PatientShell />
        </ProtectedRoute>
      }>
        <Route index             element={<NearbyHospitals />} />
        <Route path="hospital/:id" element={<HospitalDetailPatient />} />
        <Route path="book"       element={<BookAppointment />} />
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="notifications" element={<PatientNotifications />} />
        <Route path="profile"    element={<PatientProfile />} />
      </Route>

      {/* 404 fallback */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*"    element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
