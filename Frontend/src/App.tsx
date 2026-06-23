import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './pages/Landing/LandingPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { MemoriesPage } from './pages/Dashboard/MemoriesPage';
import { ConnectionsPage } from './pages/Dashboard/ConnectionsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Marketing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Dashboard Application Shell */}
          <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="dashboard/memories" element={<MemoriesPage />} />
            <Route path="dashboard/connections" element={<ConnectionsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback redirect to Landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
