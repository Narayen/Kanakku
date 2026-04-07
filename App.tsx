import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './contexts/DataContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Books from './pages/Books';
import Settings from './pages/Settings';
import ErrorBoundary from './components/ErrorBoundary';

const ThemeController = () => {
  const { currentProfile } = useData();
  
  useEffect(() => {
    if (!currentProfile) return;

    const root = window.document.documentElement;
    const theme = currentProfile.themePreference;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [currentProfile?.themePreference]);

  return null;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <DataProvider>
          <ThemeController />
          <HashRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="books" element={<Books />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </HashRouter>
        </DataProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;