import React, { lazy, Suspense, useEffect } from 'react';
import {
  createHashRouter,
  createBrowserRouter,
  RouterProvider,
  useLocation,
  Outlet,
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
import DesktopLogin from '@/pages/_auth/DesktopLogin';
const MyPage = lazy(() => import('@/pages/dashboard/myPage'));
const HelpPage = lazy(() => import('@/pages/dashboard/help'));

const Home = lazy(() => import('@/pages/_landing/Home'));
const DownloadPage = lazy(() => import('@/pages/_landing/Download'));
const ChangelogPage = lazy(() => import('@/pages/_landing/ChangelogPage'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const Login = lazy(() => import('@/pages/_auth/Login'));
const TermsAgreement = lazy(() => import('@/pages/_auth/TermsAgreement'));
const NotFound = lazy(() => import('@/pages/NotFoundPage'));
const GlobalError = lazy(() => import('@/pages/GlobalError'));

import { AuthCallback } from '@/pages/_auth/authCallback';
import { ProtectedRoute } from '@/components/features/protectedRoute';
import { ThemeProvider } from '@/components/features/themeProvider';
import { usePwaStore } from './stores/pwaStore';
import { isTauri, isAppMode } from '@/utils/isTauri';
import { checkForUpdates, installUpdate } from '@/utils/updater';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

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

const createRouter = isTauri() ? createHashRouter : createBrowserRouter;

const router = createRouter([
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
        element: isAppMode() ? (
          <DesktopLogin />
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
  const [updateAvailable, setUpdateAvailable] = React.useState<{ version: string; body: string } | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);

  useEffect(() => {
    // Check for updates on startup (Tauri only)
    if (isTauri()) {
      const checkUpdate = async () => {
        try {
          const result = await checkForUpdates();
          if (result.shouldUpdate && result.manifest) {
            setUpdateAvailable({
              version: result.manifest.version,
              body: result.manifest.body,
            });
          }
        } catch (error) {
          console.error('Failed to check for updates:', error);
        }
      };
      
      // Delay slightly to not block initial render
      setTimeout(checkUpdate, 2000);
    }

    // 1. Supabase Auth Callback Handling for HashRouter (Tauri Only)
    // Supabase redirects to /?code=... but HashRouter expects /#/auth/callback?code=...
    // IMPORTANT: This logic MUST only run in Tauri to avoid destroying PKCE state on web.
    const isTauriEnv = isTauri();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasTauriInternals = typeof (window as any).__TAURI_INTERNALS__ !== 'undefined';
    
    if (isTauriEnv && hasTauriInternals) {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        console.log('Tauri Auth Redirect: Converting to Hash...');
        const newUrl = new URL(window.location.href);
        newUrl.search = ''; 
        newUrl.hash = `#/auth/callback?code=${code}`; 
        window.location.replace(newUrl.toString());
        return;
      }
    }

    console.log('Environment Debug:', {
      isTauri: isTauriEnv,
      hasTauriInternals,
      mode: import.meta.env.MODE,
      VITE_IS_TAURI: import.meta.env.VITE_IS_TAURI
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

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await installUpdate();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
      alert('업데이트 설치 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-[1920px] mx-auto min-h-screen bg-background">
      <RouterProvider router={router} />
      
      <AlertDialog open={!!updateAvailable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>새로운 버전이 있습니다! (v{updateAvailable?.version})</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>최신 기능과 버그 수정이 포함된 새 버전으로 업데이트하시겠습니까?</p>
              {updateAvailable?.body && (
                 <div className="bg-muted p-3 rounded-md text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
                   {updateAvailable.body}
                 </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUpdateAvailable(null)}>나중에</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleUpdate(); }} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  설치 및 재시작 중...
                </>
              ) : (
                '지금 업데이트'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
