import React from 'react';
import { Home } from './pages/Home';
import { MarkdownPage } from './pages/MarkdownPage/MarkdownPage';
import { ThemeProvider } from "next-themes"

const App: React.FC = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div>
        <nav className="bg-gray-800 text-white p-4">
          <ul className="flex space-x-4">
            <li><a href="/">홈</a></li>
            <li><a href="/markdown">마크다운</a></li>
          </ul>
        </nav>
        <Home />
      </div>
    </ThemeProvider>
  );
};

export default App;


