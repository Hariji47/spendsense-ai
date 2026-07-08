import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatWidget from './ChatWidget';
import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  return (
    <div className="flex h-screen bg-mesh-gradient overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="p-8 relative">
          <button 
            onClick={toggleDarkMode}
            className="absolute top-8 right-8 p-3 rounded-full glass-panel hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all text-slate-700 dark:text-slate-300 z-50 shadow-md flex items-center justify-center"
            title="Toggle Theme"
          >
            {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
          </button>
          
          <div className="max-w-7xl mx-auto mt-12">
            <Outlet />
          </div>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
