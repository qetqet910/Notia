import React, { lazy, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { LandingPageLoader } from '@/components/loader/LandingPageLoader';
import { LoginPageLoader } from '@/components/loader/LoginPageLoader';
import { MyPageLoader } from '@/components/loader/MyPageLoader';
import { NotFoundPageLoader } from '@/components/loader/NotFoundPageLoader';
import { DashboardLoader } from '@/components/loader/DashboardLoader';

const Home = lazy(() => import('@/pages/_landing/Home'));
const DownloadPage = lazy(() => import('@/pages/_landing/Download'));
const ChangelogPage = lazy(() => import('@/pages/_landing/ChangelogPage'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const Login = lazy(() => import('@/pages/_auth/Login'));
const NotFound = lazy(() => import('@/pages/NotFoundPage'));
const HelpPage = lazy(() => import('@/pages/dashboard/help'));
const MyPage = lazy(() => import('@/pages/dashboard/myPage'));

import { AuthCallback } from '@/pages/_auth/authCallback';
import { ProtectedRoute } from '@/components/features/protectedRoute';
import { ThemeProvider } from '@/components/features/themeProvider';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <Routes>
          {/* 공개 라우트 */}
          <Route
            path="/"
            element={
              <Suspense fallback={<LandingPageLoader />}>
                <Home />
              </Suspense>
            }
          />
          <Route
            path="/login"
            element={
              <Suspense fallback={<LoginPageLoader />}>
                <Login />
              </Suspense>
            }
          />
          <Route
            path="/download"
            element={
              <Suspense fallback={<LandingPageLoader />}>
                <DownloadPage />
              </Suspense>
            }
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/changelog"
            element={
              <Suspense fallback={<LandingPageLoader />}>
                <ChangelogPage />
              </Suspense>
            }
          />

          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Suspense fallback={<DashboardLoader />}>
                  <Dashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/myPage"
            element={
              <ProtectedRoute>
                <Suspense fallback={<MyPageLoader />}>
                  <MyPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/help"
            element={
              <ProtectedRoute>
                <Suspense fallback={<MyPageLoader />}>
                  <HelpPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* 404 및 리디렉션 */}
          <Route
            path="/404"
            element={
              <Suspense fallback={<NotFoundPageLoader />}>
                <NotFound />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;
