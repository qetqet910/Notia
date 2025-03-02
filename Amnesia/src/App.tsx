import React from 'react';
import { ThemeProvider } from "next-themes"
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Home } from '@/pages/Home';
import { Dashboard } from '@/pages/Dashboard/Dashboard';
import { Login } from '@/pages/Settings/Login';
import { DownloadPage } from '@/pages/Download';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;