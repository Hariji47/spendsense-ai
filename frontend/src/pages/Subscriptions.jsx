import { useState, useEffect } from 'react';
import { getSubscriptions, getSettings } from '../services/api';
import { Repeat, AlertCircle, Calendar } from 'lucide-react';
import Paywall from '../components/Paywall';

export default function Subscriptions() {
  const [subsData, setSubsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const settingsRes = await getSettings();
      if (settingsRes.data.tier === 'free') {
        setHasAccess(false);
        setLoading(false);
        return;
      }
      
      const res = await getSubscriptions();
      setSubsData(res.data);
    } catch (err) {
      setError("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
        <div className="bg-white p-6 rounded-xl shadow-sm h-32"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  if (!hasAccess) {
    return (
      <Paywall 
        title="Smart Subscriptions"
        description="Automatically scan your transaction history to detect recurring payments and calculate your fixed monthly burn rate."
        requiredTier="pro"
      />
    );
  }

  const { subscriptions, total_fixed_cost_monthly } = subsData;

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Smart Subscription Manager</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between col-span-1 md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-100 dark:border-blue-800/30">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
              <Repeat size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Fixed Monthly Burn Rate</h3>
          </div>
          <div>
            <p className="text-4xl font-black text-blue-600">{formatCurrency(total_fixed_cost_monthly)}</p>
            <p className="text-sm text-gray-500 mt-2">This is the amount of money automatically locked into subscriptions or fixed costs every month.</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border-orange-100 bg-orange-50/50 dark:bg-orange-900/10">
           <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 mb-2">
             <AlertCircle size={20} />
             <span className="font-bold">Detected Subs</span>
           </div>
           <p className="text-4xl font-black text-gray-800 dark:text-white">{subscriptions.length}</p>
           <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Active recurring charges found by AI.</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="bg-white/50 dark:bg-slate-800/50 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 dark:text-gray-200">All Detected Subscriptions</h3>
        </div>
        
        {subscriptions.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
            <Repeat size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <p className="font-medium text-lg text-gray-700 dark:text-gray-300">No subscriptions detected</p>
            <p className="max-w-sm mt-2">We couldn't find any recurring charges. Keep adding transactions and the AI will scan for them!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Service Name</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Frequency</th>
                  <th className="px-6 py-4 font-medium text-right">Avg Amount</th>
                  <th className="px-6 py-4 font-medium text-center">Estimated Next Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700 bg-white/30 dark:bg-slate-800/30">
                {subscriptions.map((sub, i) => (
                  <tr key={i} className="hover:bg-white/60 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-white flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                        {sub.name.substring(0, 2)}
                      </div>
                      <span className="capitalize">{sub.name}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md text-xs">{sub.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${sub.frequency === 'Monthly' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                        {sub.frequency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-800 dark:text-white">
                      {formatCurrency(sub.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2 text-orange-600 font-medium">
                        <Calendar size={16} />
                        <span>{sub.next_due}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
