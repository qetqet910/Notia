import React from 'react';
import { Home } from './pages/Home';
import { Login } from './pages/Settings/Login';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login as Lo } from './pages/Settings/Settings';
import { DownloadPage } from './pages/Donwload';
import { ThemeProvider } from "next-themes"

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Lo />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/download" element={<DownloadPage />} />
          {/* 존재하지 않는 경로로 접근시 홈으로 리다이렉트 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;