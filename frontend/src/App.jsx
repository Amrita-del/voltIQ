import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Health from './pages/Health';
import Carbon from './pages/Carbon';
import Budget from './pages/Budget';
import Chat from './pages/Chat';
import Scanner from './pages/Scanner';
import Profile from './pages/Profile';
import { AnimatePresence } from 'framer-motion';

function ProtectedRoute({ children, requireProfile = true }) {
  const { isAuthenticated, hasProfile, isNewUser } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  // Only force onboarding if actually the very first signup session
  if (requireProfile && !hasProfile && isNewUser) return <Navigate to="/onboarding" replace />;
  return children;
}

function AppContent() {
  const { isAuthenticated, hasProfile, isNewUser } = useAuthStore();
  const location = useLocation();

  const isAuthOrOnboarding = ['/auth', '/onboarding'].includes(location.pathname);
  const showSidebar = isAuthenticated && !isAuthOrOnboarding;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)] text-text-primary font-sans selection:bg-brand-primary/20">
      {showSidebar && <Sidebar />}
      <main className={`flex-1 min-h-0 overflow-y-auto ${showSidebar ? 'px-5 py-6 md:px-8 md:py-8' : ''}`}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={
                <ProtectedRoute requireProfile={false}>
                   {/* Don't force onboarding even if specifically visited, unless new or on purpose */}
                   {hasProfile && !new URLSearchParams(location.search).get('edit') ? <Navigate to="/dashboard" replace /> : <Onboarding />}
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/health" element={<ProtectedRoute><Health /></ProtectedRoute>} />
              <Route path="/carbon" element={<ProtectedRoute><Carbon /></ProtectedRoute>} />
              <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
export default App;
