import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { CurriculumBuilder } from './pages/CurriculumBuilder';
import { TrackViewer } from './pages/TrackViewer';
import { ReadinessScorecard } from './pages/ReadinessScorecard';
import { StudyMode } from './pages/StudyMode';
import { AssessmentMode } from './pages/AssessmentMode';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-indigo-400 font-mono">Initializing Session...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // If logged in but profile is not completed, force onboarding
  if (user && !user.profileCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-indigo-400 font-mono">Verifying Privileges...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user && !user.profileCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return <>{children}</>;
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={
              <useAuth.Context.Consumer>
                {(auth) => {
                  if (auth?.isLoading) return null;
                  if (!auth?.isAuthenticated) return <Navigate to="/login" replace />;
                  if (auth?.user?.profileCompleted) return <Navigate to="/" replace />;
                  return <Onboarding />;
                }}
              </useAuth.Context.Consumer>
            } />

            <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/curriculum" element={<ProtectedRoute><AppLayout><CurriculumBuilder /></AppLayout></ProtectedRoute>} />
            <Route path="/track/enroll/:trackId" element={<ProtectedRoute><AppLayout><TrackViewer /></AppLayout></ProtectedRoute>} />
            <Route path="/track/:trackId/lesson/:lessonId" element={<ProtectedRoute><StudyMode /></ProtectedRoute>} />
            <Route path="/track/:trackId/module/:moduleId/assessment" element={<ProtectedRoute><AssessmentMode /></ProtectedRoute>} />
            <Route path="/readiness" element={<ProtectedRoute><AppLayout><ReadinessScorecard /></AppLayout></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
