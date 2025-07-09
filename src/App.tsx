import React, { lazy, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Home = lazy(() => import('@/pages/Home'));
const DownloadPage = lazy(() => import('@/pages/Download'));
const ChangelogPage = lazy(() => import('@/pages/ChangelogPage'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const Login = lazy(() => import('@/pages/Login'));
const NotFound = lazy(() => import('@/pages/404'));
const HelpPage = lazy(() => import('@/pages/dashboard/help'));
const MyPage = lazy(() => import('@/pages/dashboard/myPage'));

import { AuthCallback } from '@/components/features/authCallback';
import { ProtectedRoute } from '@/components/features/protectedRoute';
import { ThemeProvider } from '@/components/features/themeProvider';

const PageLoader = () => (
  <Loader2 className="h-6 w-6 animate-spin text-primary" />
);

function App() {
  return (
    <Router>
      <ThemeProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* 공개 라우트 */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/changelog" element={<ChangelogPage />} />

            {/* 보호된 라우트 */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/myPage"
              element={
                <ProtectedRoute>
                  <MyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/help"
              element={
                <ProtectedRoute>
                  <HelpPage />
                </ProtectedRoute>
              }
            />

            {/* 404 및 리디렉션 */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </Router>
  );
}

export default App;
