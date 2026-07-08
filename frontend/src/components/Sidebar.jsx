import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, PieChart, Sparkles, UploadCloud, Repeat, Moon, Sun, Settings } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const { user } = useContext(AuthContext);

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
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ReceiptText },
    { name: 'Import Data', path: '/import', icon: UploadCloud },
    { name: 'Analytics', path: '/analytics', icon: PieChart },
    { name: 'AI Insights', path: '/ai-insights', icon: Sparkles },
    { name: 'Subscriptions', path: '/subscriptions', icon: Repeat },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 glass-panel m-4 rounded-2xl flex flex-col justify-between shadow-lg relative z-20 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-10 bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 shrink-0">
            <span className="text-xl">💸</span>
          </div>
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight font-serif truncate">
            SpendSense
          </h1>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary/90 text-white shadow-md shadow-primary/20 backdrop-blur-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-white'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="p-4 border-t border-gray-100 dark:border-slate-800">
          <Link to="/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800 transition-colors group cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg transition-all overflow-hidden">
              {user.profile_picture ? (
                <img src={`http://localhost:8000${user.profile_picture}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.full_name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
