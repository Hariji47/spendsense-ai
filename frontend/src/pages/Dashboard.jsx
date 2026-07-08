import { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getDashboardStats, getAnalyticsCharts, getTransactions, getAnalyticsInsights, getSettings } from '../services/api';
import { IndianRupee, TrendingDown, TrendingUp, Activity, Calendar, HeartPulse, Sparkles, Target, PiggyBank, ArrowRight, Plane, Car, Home, Sun, Moon, CloudSun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('monthly');
  const [tier, setTier] = useState('free');
  const { user } = useContext(AuthContext);

  const greetingData = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      const greetings = ['Morning', 'Good morning', 'Rise and shine', 'Happy morning'];
      return {
        text: greetings[Math.floor(Math.random() * greetings.length)],
        Icon: CloudSun,
        color: 'text-amber-400 dark:text-amber-300'
      };
    } else if (hour < 18) {
      const greetings = ['Afternoon', 'Good afternoon', 'Hello there', 'Welcome back'];
      return {
        text: greetings[Math.floor(Math.random() * greetings.length)],
        Icon: Sun,
        color: 'text-orange-400 dark:text-orange-300'
      };
    } else {
      const greetings = ['Evening', 'Good evening', 'Good to see you', 'Hello'];
      return {
        text: greetings[Math.floor(Math.random() * greetings.length)],
        Icon: Moon,
        color: 'text-indigo-400 dark:text-indigo-300'
      };
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [timeframe]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [statsRes, chartsRes, txnsRes, insightsRes, settingsRes] = await Promise.all([
        getDashboardStats(timeframe),
        getAnalyticsCharts(timeframe),
        getTransactions(timeframe, 0, 5),
        getAnalyticsInsights(),
        getSettings()
      ]);
      setStats(statsRes.data);
      setCharts(chartsRes.data);
      setRecentTxns(txnsRes.data);
      setInsights(insightsRes.data.insights || []);
      setTier(settingsRes.data.tier || 'free');
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const cards = [
    {
      title: 'Total Expenses',
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Total Income',
      value: formatCurrency(stats.totalIncome),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: 'Period Spending',
      value: formatCurrency(stats.currentMonthSpending),
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions,
      icon: IndianRupee,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const timeframes = [
    { id: 'weekly', label: '7 Days' },
    { id: 'monthly', label: '30 Days' },
    { id: 'yearly', label: 'This Year' },
    { id: 'all', label: 'All Time' }
  ];

  return (
    <div className="space-y-6 relative min-h-screen pb-12">
      {/* Subtle Money Pattern Background */}
      <div 
        className="absolute inset-0 z-[-1] opacity-[0.03] dark:opacity-[0.02] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      ></div>

      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <div className="flex items-center gap-4">
            <greetingData.Icon className={greetingData.color} size={32} strokeWidth={2.5} />
            <h1 className="text-4xl md:text-5xl font-medium font-serif text-slate-800 dark:text-slate-100 tracking-tight">
              {greetingData.text}{user ? `, ${user.full_name.split(' ')[0]}` : ''}
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm md:text-base ml-[3.5rem]">Here's your financial overview for this period.</p>
        </div>
        
        {/* Timeframe Toggle */}
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-1">
          {timeframes.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                timeframe === tf.id 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Savings Goal Tracker - The Better Feature (Max Only) */}
      {tier === 'max' && (
      <div className="glass-panel p-8 rounded-3xl bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-900 border-t border-white/60 dark:border-slate-700/50 shadow-xl mb-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="flex justify-between items-end mb-8 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center space-x-3 mb-2">
              <Target size={28} className="text-primary" />
              <span>Savings Goals</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Track your progress toward financial freedom.</p>
          </div>
          <button className="text-primary font-bold hover:text-primaryHover flex items-center space-x-1 group transition-colors">
            <span>View All</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          
          {/* Goal 1 */}
          <div className="bg-white/80 dark:bg-slate-800/80 p-6 rounded-2xl border border-white dark:border-slate-700 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <Plane size={24} />
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-md text-gray-600 dark:text-gray-300">Target: Oct 2026</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1">Vacation to Hawaii</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">₹1,20,000 / ₹2,00,000</p>
              
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      60%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-blue-100 dark:bg-slate-700">
                  <div style={{ width: "60%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Goal 2 */}
          <div className="bg-white/80 dark:bg-slate-800/80 p-6 rounded-2xl border border-white dark:border-slate-700 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <PiggyBank size={24} />
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-md text-gray-600 dark:text-gray-300">Target: Dec 2026</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1">Emergency Fund</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">₹4,50,000 / ₹5,00,000</p>
              
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-200">
                      90%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-emerald-100 dark:bg-slate-700">
                  <div style={{ width: "90%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Goal 3 */}
          <div className="bg-white/80 dark:bg-slate-800/80 p-6 rounded-2xl border border-white dark:border-slate-700 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                <Car size={24} />
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-md text-gray-600 dark:text-gray-300">Target: Jan 2027</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1">New Car Downpayment</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">₹80,000 / ₹3,00,000</p>
              
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                      26%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-purple-100 dark:bg-slate-700">
                  <div style={{ width: "26%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      )}

      {/* Health Score Hero (Pro & Max) */}
      {tier !== 'free' && stats.healthScore !== null && stats.healthScore !== undefined && (
        <div className="glass-panel p-8 rounded-2xl flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-emerald-100 dark:border-emerald-800/30">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 mb-2">
              <HeartPulse size={24} />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Financial Health Score</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 max-w-lg mt-2">
              This score is calculated by our AI based on your savings ratio, category diversity, and spending anomalies.
            </p>
          </div>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-emerald-100" />
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray={`${251.2 * (stats.healthScore / 100)} 251.2`}
                className={`${stats.healthScore > 70 ? 'text-emerald-500' : stats.healthScore > 40 ? 'text-orange-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-black ${stats.healthScore > 70 ? 'text-emerald-600' : stats.healthScore > 40 ? 'text-orange-600' : 'text-red-600'}`}>
                {stats.healthScore}
              </span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">/ 100</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-panel p-6 rounded-2xl flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity"></div>
              <div className="flex justify-between items-start relative z-10">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                <div className={`p-2 rounded-lg ${card.bgColor} dark:bg-opacity-20`}>
                  <Icon size={20} className={card.color} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-4 relative z-10">{card.value}</h3>
            </div>
          );
        })}
      </div>

      {/* AI Insights Summary (Pro & Max) */}
      {tier !== 'free' && insights.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden mt-6">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles size={64} className="text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center space-x-2 mb-4">
            <Sparkles size={20} className="text-purple-500" />
            <span>AI Quick Insights</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.slice(0, 2).map((insight, idx) => (
              <div key={idx} className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 p-4 rounded-xl flex items-start space-x-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></div>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Utilization Progress Bar */}
      {stats.budgetLimit && (
        <div className="glass-panel p-6 rounded-2xl flex flex-col space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center z-10">
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
              <Activity size={18} className="text-blue-500" />
              <span>{timeframe === 'yearly' ? 'Yearly Budget Utilization' : 'Monthly Budget Utilization'}</span>
            </h3>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {formatCurrency(stats.currentMonthSpending)} / {formatCurrency(stats.budgetLimit)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4 z-10 overflow-hidden relative">
            <div 
              className={`h-4 rounded-full transition-all duration-1000 ease-out ${
                (stats.currentMonthSpending / stats.budgetLimit) * 100 > 90 ? 'bg-red-500' :
                (stats.currentMonthSpending / stats.budgetLimit) * 100 > 75 ? 'bg-orange-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min((stats.currentMonthSpending / stats.budgetLimit) * 100, 100)}%` }}
            ></div>
          </div>
          
          {(stats.currentMonthSpending / stats.budgetLimit) * 100 > 90 && (
            <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 animate-pulse z-0"></div>
          )}
          {(stats.currentMonthSpending / stats.budgetLimit) * 100 > 90 && (
            <p className="text-xs text-red-600 dark:text-red-400 font-bold z-10 animate-bounce">
              ⚠️ Warning: You are extremely close to exceeding your budget!
            </p>
          )}
        </div>
      )}
      
      {stats.totalTransactions === 0 ? (
        <div className="mt-8 bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Activity size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No data available</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            You don't have any transactions yet. Add your first transaction to see your financial overview.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tier !== 'free' && charts?.category_data?.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-base font-bold text-gray-700 dark:text-white mb-6">Spending by Category</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.category_data}
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                    >
                      {charts.category_data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {/* Recent Transactions List */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-gray-700 dark:text-white">Recent Transactions ({timeframes.find(t=>t.id===timeframe)?.label})</h3>
            </div>
            
            {recentTxns.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <Calendar size={32} className="mb-2 text-gray-300" />
                <p>No transactions in this period</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTxns.map((txn) => (
                  <div key={txn.id} className="flex justify-between items-center p-3 hover:bg-white/50 rounded-lg transition-colors border border-transparent hover:border-white/60">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.transaction_type === 'Expense' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {txn.transaction_type === 'Expense' ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white text-sm">{txn.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(txn.date), 'MMM dd, yyyy')} • {txn.category}</p>
                      </div>
                    </div>
                    <div className={`font-bold ${txn.transaction_type === 'Expense' ? 'text-gray-800 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {txn.transaction_type === 'Expense' ? '-' : '+'}{formatCurrency(txn.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
