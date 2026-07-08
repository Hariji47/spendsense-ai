import { Lock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Paywall({ title, description, requiredTier }) {
  return (
    <div className="space-y-6 max-w-5xl flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="glass-panel p-12 rounded-3xl max-w-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <Lock className="text-gray-300 dark:text-slate-600" size={48} />
        </div>
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Lock size={32} className="text-primary" />
        </div>
        
        <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-4">Unlock {title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {description} This feature is available exclusively on the <span className="font-bold capitalize">{requiredTier}</span> tier.
        </p>
        
        <Link to="/profile">
          <button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primaryHover hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-2 mx-auto">
            <Zap size={20} />
            <span>View Subscription Plans</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
