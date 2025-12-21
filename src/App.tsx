import React, { lazy, Suspense, useEffect } from 'react';
import {
  createHashRouter,
  RouterProvider,
  useLocation,
  Outlet,
  Navigate,
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
const MyPage = lazy(() => import('@/pages/dashboard/myPage'));
const HelpPage = lazy(() => import('@/pages/dashboard/help'));

const Home = lazy(() => import('@/pages/_landing/Home'));
const DownloadPage = lazy(() => import('@/pages/_landing/Download'));
const ChangelogPage = lazy(() => import('@/pages/_landing/ChangelogPage'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const Login = lazy(() => import('@/pages/_auth/Login'));
const DesktopLogin = lazy(() => import('@/pages/_auth/DesktopLogin'));
const TermsAgreement = lazy(() => import('@/pages/_auth/TermsAgreement'));
const NotFound = lazy(() => import('@/pages/NotFoundPage'));
const GlobalError = lazy(() => import('@/pages/GlobalError'));

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

const AppLayout = () => {
  return (
    <ThemeProvider>
      <ScrollToTop />
      <Outlet />
    </ThemeProvider>
  );
};

const router = createHashRouter([
  {
    element: <AppLayout />,
    errorElement: (
      <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
        <GlobalError />
      </Suspense>
    ),
    children: [
      {
        path: '/',
        element:
          import.meta.env.VITE_IS_TAURI === 'true' ? (
            <Navigate to="/desktop-login" replace />
          ) : (
            <Suspense fallback={<LandingPageLoader />}>
              <Home />
            </Suspense>
          ),
      },
      {
        path: '/login',
        element: (
          <Suspense fallback={<LoginPageLoader />}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: '/desktop-login',
        element: (
          <Suspense fallback={<LoginPageLoader />}>
            <DesktopLogin />
          </Suspense>
        ),
      },
      {
        path: '/terms-agreement',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<TermsPageLoader />}>
              <TermsAgreement />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/download',
        element: (
          <Suspense fallback={<DownloadPageLoader />}>
            <DownloadPage />
          </Suspense>
        ),
      },
      {
        path: '/auth/callback',
        element: <AuthCallback />,
      },
      {
        path: '/changelog',
        element: (
          <Suspense fallback={<ChangelogPageLoader />}>
            <ChangelogPage />
          </Suspense>
        ),
      },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<DashboardPageLoader />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/myPage',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<DashboardPageLoader />}>
              <MyPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/help',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<DashboardPageLoader />}>
              <HelpPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<NotFoundPageLoader />}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },
]);
 
function App() {
  const { setDeferredPrompt } = usePwaStore();

  useEffect(() => {
    console.log('Environment Check:', {
      VITE_IS_TAURI: import.meta.env.VITE_IS_TAURI,
      Mode: import.meta.env.MODE
    });
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
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
    <div className="max-w-[1920px] mx-auto min-h-screen bg-slate-500">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
