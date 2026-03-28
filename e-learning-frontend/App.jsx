import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./components/PublicLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CertificatesPage from "./pages/CertificatesPage";
import CourseDetailsPage from "./pages/CourseDetailsPage";
import CourseFormPage from "./pages/CourseFormPage";
import CoursesPage from "./pages/CoursesPage";
import EnrollmentRequestsPage from "./pages/EnrollmentRequestsPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ManageCoursesPage from "./pages/ManageCoursesPage";
import ManageLessonsPage from "./pages/ManageLessonsPage";
import ManageQuizzesPage from "./pages/ManageQuizzesPage";
import MyCoursesPage from "./pages/MyCoursesPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";
import StudentDashboardPage from "./pages/StudentDashboardPage";
import UsersPage from "./pages/UsersPage";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailsPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["student"]} />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<StudentDashboardPage />} />
          <Route path="/my-courses" element={<MyCoursesPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route element={<AppShell />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/courses" element={<ManageCoursesPage />} />
          <Route path="/admin/courses/new" element={<CourseFormPage />} />
          <Route path="/admin/courses/:id/edit" element={<CourseFormPage />} />
          <Route path="/admin/courses/:courseId/lessons" element={<ManageLessonsPage />} />
          <Route path="/admin/courses/:courseId/quizzes" element={<ManageQuizzesPage />} />
          <Route path="/admin/enrollments" element={<EnrollmentRequestsPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
        </Route>
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
