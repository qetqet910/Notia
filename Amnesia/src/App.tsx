import React from 'react';
import { Home } from './pages/Home';
import { MarkdownPage } from './pages/MarkdownPage/MarkdownPage';
import { ThemeProvider } from "next-themes"

const App: React.FC = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Home />
    </ThemeProvider>
  );
};

export default App;


