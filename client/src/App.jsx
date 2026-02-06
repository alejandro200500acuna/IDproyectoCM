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
import PlaceholderPage from './components/PlaceholderPage'
import { AuthProvider, useAuth } from './context/AuthContext'
import Settings from './pages/Settings'
import SiteEditor from './pages/SiteEditor'


const ProtectedRoute = () => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/student-portal" element={<StudentPortal />} />
          <Route path="/parent-portal" element={<ParentPortal />} />


          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="students" element={<Students />} />
              <Route path="parents" element={<Parents />} />
              <Route path="teachers" element={<Admins />} />
              <Route path="courses" element={<Grades />} />
              <Route path="designer" element={<IDDesigner />} />
              <Route path="attendance" element={<PlaceholderPage title="Attendance Management" icon={CreditCard} />} />
              <Route path="payments" element={<PlaceholderPage title="Payment Management" icon={CreditCard} />} />
              <Route path="settings" element={<Settings />} />
              <Route path="site-editor" element={<SiteEditor />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
