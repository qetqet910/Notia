import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '@/context/AuthProvider';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { DownloadPage } from '@/pages/Download';
import { Dashboard } from '@/pages/Dashboard';
import { AuthCallback } from '@/pages/AuthCallback';
import { ProtectedRoute } from '@/components/features/ProtectedRoute';
import { NotFound } from '@/pages/404'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />}/>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;