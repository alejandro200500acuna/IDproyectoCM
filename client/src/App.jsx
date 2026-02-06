import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { CreditCard, Settings as SettingsIcon } from 'lucide-react'
import Login from './pages/Login'
import Students from './pages/Students'
import Parents from './pages/Parents'
import Admins from './pages/Admins'
import Grades from './pages/Grades'
import IDDesigner from './pages/IDDesigner'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import StudentPortal from './pages/StudentPortal'
import ParentPortal from './pages/ParentPortal'
import { AuthProvider, useAuth } from './context/AuthContext'
import Settings from './pages/Settings'
import SiteEditor from './pages/SiteEditor'
import Profile from './pages/Profile'
import Attendance from './pages/Attendance'


function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading, role } = useAuth()

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#f8fafc]"><div className="w-8 h-8 rounded-full border-4 border-[var(--primary-color)] border-t-transparent animate-spin"></div></div>

  if (!user) return <Navigate to="/login" />

  // Strict Role Check for protected routes
  if (requiredRole && role !== requiredRole) {
    // Redirect logic based on role
    if (role === 'student') return <Navigate to="/portal" />
    if (role === 'parent') return <Navigate to="/parent-portal" />
    return <Navigate to="/" />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#f8fafc]">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/portal" element={<StudentPortal />} />
            <Route path="/parent-portal" element={<ParentPortal />} />

            {/* Protected Admin Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardHome />} />
              <Route path="students" element={<Students />} />
              <Route path="parents" element={<Parents />} />
              <Route path="courses" element={<Grades />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="designer" element={<IDDesigner />} />
              <Route path="teachers" element={<Admins />} />
              <Route path="settings" element={<Settings />} />
              <Route path="site-editor" element={<SiteEditor />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
