import { Routes, Route, Navigate } from 'react-router-dom'

// Student Pages
import StudentLogin from './pages/student/StudentLogin'
import StudentHome from './pages/student/StudentHome'

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLogs from './pages/admin/AdminLogs'
import AdminStudents from './pages/admin/AdminStudents'
import AdminStudentDetail from './pages/admin/AdminStudentDetail'

// Guards
import StudentGuard from './components/guards/StudentGuard'
import AdminGuard from './components/guards/AdminGuard'

function App() {
  return (
    <Routes>
      {/* 기본 경로 */}
      <Route path="/" element={<Navigate to="/student/login" replace />} />

      {/* 학생용 라우트 */}
      <Route path="/student/login" element={<StudentLogin />} />
      <Route
        path="/student/home"
        element={
          <StudentGuard>
            <StudentHome />
          </StudentGuard>
        }
      />

      {/* 관리자용 라우트 */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard/status"
        element={
          <AdminGuard>
            <AdminDashboard />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/dashboard/logs"
        element={
          <AdminGuard>
            <AdminLogs />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/students"
        element={
          <AdminGuard>
            <AdminStudents />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/students/:hakbun"
        element={
          <AdminGuard>
            <AdminStudentDetail />
          </AdminGuard>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
