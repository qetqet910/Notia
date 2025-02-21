import React from 'react';
import { Home } from './pages/Home';
import { Login } from './pages/Settings';
import { ThemeProvider } from "next-themes"

const App: React.FC = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Login />
    </ThemeProvider>
  );
};

export default App;


