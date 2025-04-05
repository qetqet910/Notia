import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { DownloadPage } from '@/pages/Download';
import { Dashboard } from '@/pages/Dashboard';
import { AuthCallback } from '@/components/features/AuthCallback';
import { ProtectedRoute } from '@/components/features/ProtectedRoute';
import { NotFound } from '@/pages/404';

function App() {
  return (
    <Router>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/login" element={<Login />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* 보호된 라우트 */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* 기타 보호될 라우트들
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        /> */}

        {/* 기본 리다이렉트 */}
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="*" element={<Navigate to="/NotFound" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
