import React, { lazy, Suspense, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { LandingPageLoader } from '@/components/loader/landing/LandingPageLoader';
import { ChangelogPageLoader } from '@/components/loader/landing/ChangelogPageLoader';
import { DownloadPageLoader } from '@/components/loader/landing/DownloadPageLoader';
import {
  TermsPageLoader,
  LoginPageLoader,
} from '@/components/loader/landing/AuthPageLoader';
import { NotFoundPageLoader } from '@/components/loader/landing/NotFoundPageLoader';
import { DashboardPageLoader } from '@/components/loader/dashboard/DashboardPageLoader';
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
import { usePwaStore } from './stores/pwaStore';

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100); // 100ms 지연을 주어 렌더링 시간을 확보합니다.
    }
  }, [location]);

  return null;
};

function App() {
  const { setDeferredPrompt } = usePwaStore();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
    };
  }, [setDeferredPrompt]);

  return (
    <Router>
      <ScrollToTop />
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
              <ProtectedRoute>
                <Suspense fallback={<TermsPageLoader />}>
                  <TermsAgreement />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/download"
            element={
              <Suspense fallback={<DownloadPageLoader />}>
                <DownloadPage />
              </Suspense>
            }
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/changelog"
            element={
              <Suspense fallback={<ChangelogPageLoader />}>
                <ChangelogPage />
              </Suspense>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Suspense fallback={<DashboardPageLoader />}>
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
