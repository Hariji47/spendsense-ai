import { useState, useEffect } from 'react';
import { getForecast, getAnomalies, trainModels, getSettings } from '../services/api';
import { BrainCircuit, AlertTriangle, TrendingUp, TrendingDown, CheckCircle, RefreshCw, Sparkles, Lock, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import Paywall from '../components/Paywall';

export default function AiInsights() {
  const [forecast, setForecast] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(true);
  const [tier, setTier] = useState('max');
  const [training, setTraining] = useState(false);
  const [trainMessage, setTrainMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const settingsRes = await getSettings();
      setTier(settingsRes.data.tier);
      if (settingsRes.data.tier === 'free') {
        setIsPro(false);
        setLoading(false);
        return;
      }

      const [forecastRes, anomaliesRes] = await Promise.all([
        getForecast(),
        getAnomalies()
      ]);
      setForecast(forecastRes.data);
      setAnomalies(anomaliesRes.data.anomalies);
    } catch (err) {
      console.error(err);
      setError('Failed to load AI insights. Make sure you have enough transaction data.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModels = async () => {
    try {
      setTraining(true);
      setTrainMessage(null);
      const res = await trainModels();
      setTrainMessage({ type: 'success', text: res.data.message });
      loadData(); // reload in case new anomalies found
    } catch (err) {
      setTrainMessage({ type: 'error', text: 'Failed to train models' });
    } finally {
      setTraining(false);
      setTimeout(() => setTrainMessage(null), 5000);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
      <div className="h-32 bg-gray-200 rounded-xl"></div>
      <div className="h-64 bg-gray-200 rounded-xl"></div>
    </div>;
  }

  if (!isPro) {
    return (
      <Paywall 
        title="SpendSense Pro" 
        description="AI-powered anomaly detection and deep machine learning insights require incredible computational power."
        requiredTier="pro"
      />
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">AI Insights & Predictions</h1>
        <button 
          onClick={handleTrainModels}
          disabled={training}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 font-medium"
        >
          <RefreshCw size={18} className={training ? 'animate-spin' : ''} />
          <span>{training ? 'Training Models...' : 'Retrain AI Models'}</span>
        </button>
      </div>

      {trainMessage && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          trainMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <CheckCircle size={20} />
          <span className="font-medium">{trainMessage.text}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-center space-x-2">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Spending Forecast Section */}
      {tier === 'max' ? (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-8 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <BrainCircuit size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-indigo-950">Spending Forecast</h2>
              <p className="text-indigo-700 text-sm">Powered by Linear Regression</p>
            </div>
          </div>

          {forecast?.status === 'insufficient_data' ? (
            <div className="bg-white/60 p-6 rounded-xl border border-indigo-100/50">
              <p className="text-indigo-800 font-medium">{forecast.message}</p>
            </div>
          ) : forecast?.status === 'success' ? (
            <div className="bg-white/80 p-6 rounded-xl border border-white flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Predicted Expenses for {forecast.forecast_month}</p>
                <h3 className="text-4xl font-bold text-gray-900">{formatCurrency(forecast.predicted_amount)}</h3>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500 mb-1">Historical Monthly Average</p>
                <div className="flex items-center justify-end space-x-2">
                  <span className="text-xl font-bold text-gray-700">{formatCurrency(forecast.historical_avg)}</span>
                  {forecast.trend === 'up' ? (
                    <TrendingUp className="text-red-500" size={24} />
                  ) : (
                    <TrendingDown className="text-emerald-500" size={24} />
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden p-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Spending Forecasts</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">Predict your future expenses based on machine learning trends. Upgrade to Max to unlock.</p>
          </div>
          <Link to="/profile" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-colors flex items-center space-x-2">
            <Lock size={18} /><span>Unlock with Max</span>
          </Link>
        </div>
      )}

      {/* Anomalies Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center space-x-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Detected Anomalies</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Unusual spending patterns found using Isolation Forest</p>
          </div>
        </div>
        
        {anomalies && anomalies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium">AI Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {anomalies.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-600">{format(new Date(a.date), 'MMM dd, yyyy')}</td>
                    <td className="p-4 text-sm font-medium text-gray-900">{a.description}</td>
                    <td className="p-4 text-sm">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">{a.category}</span>
                    </td>
                    <td className="p-4 text-sm font-bold text-red-600 text-right">{formatCurrency(a.amount)}</td>
                    <td className="p-4 text-sm text-orange-700 font-medium">{a.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No anomalies detected</h3>
            <p className="text-gray-500">Your spending patterns look normal based on your history.</p>
          </div>
        )}
      </div>
    </div>
  );
}
