import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './pages/Landing/LandingPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { MemoriesPage } from './pages/Dashboard/MemoriesPage';
import { ConnectionsPage } from './pages/Dashboard/ConnectionsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ChatPage } from './pages/Chat/ChatPage';
import { NotesPage } from './pages/Dashboard/NotesPage';
import { ProjectsPage } from './pages/Dashboard/ProjectsPage';
import { ProjectDetailsPage } from './pages/Dashboard/ProjectDetailsPage';


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Marketing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Authentication pages*/}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Dashboard Application Shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="dashboard/chat" element={<ChatPage />} />
                <Route path="dashboard/notes" element={<NotesPage />} />
                <Route path="dashboard/memories" element={<MemoriesPage />} />
                <Route path="dashboard/connections" element={<ConnectionsPage />} />
                <Route path="dashboard/projects" element={<ProjectsPage />} />
                <Route path="dashboard/projects/:id" element={<ProjectDetailsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Fallback redirect to Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
