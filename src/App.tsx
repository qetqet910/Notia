import React, { lazy, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { LandingPageLoader } from '@/components/loader/LandingPageLoader';
import { DonwloadPage } from '@/components/loader/LandingLoader';
import {
  TermsLoader,
  LoginPageLoader,
} from '@/components/loader/LoginPageLoader';
import { NotFoundPageLoader } from '@/components/loader/NotFoundPageLoader';
import { DashboardLoader } from '@/components/loader/DashboardLoader';
import HelpPage from '@/pages/dashboard/help';
import MyPage from '@/pages/dashboard/myPage';

const Home = lazy(() => import('@/pages/_landing/Home'));
const DownloadPage = lazy(() => import('@/pages/_landing/Download'));
const ChangelogPage = lazy(() => import('@/pages/_landing/ChangelogPage'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const Login = lazy(() => import('@/pages/_auth/Login'));
const TermsAgreement = lazy(() => import('@/pages/_auth/TermsAgreement'));
const NotFound = lazy(() => import('@/pages/NotFoundPage'));

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
            path="/terms-agreement"
            element={
              <ProtectedRoute checkTerms={false}>
                <Suspense fallback={<TermsLoader />}>
                  <TermsAgreement />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/download"
            element={
              <Suspense fallback={<DonwloadPage />}>
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
