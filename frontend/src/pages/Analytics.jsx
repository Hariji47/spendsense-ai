import { useState, useEffect } from 'react';
import { getAnalyticsCharts, getAnalyticsInsights, getSettings, generateTaxReport } from '../services/api';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import { Lightbulb, Activity, Download, FileText, CheckCircle2, Lock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4', '#84cc16'];

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [tier, setTier] = useState('free');
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chartsRes, insightsRes, settingsRes] = await Promise.all([
        getAnalyticsCharts(),
        getAnalyticsInsights(),
        getSettings()
      ]);
      setAnalyticsData({
        categoryData: chartsRes.data.category_data,
        monthlyData: chartsRes.data.monthly_trend,
        insights: insightsRes.data.insights
      });
      setTier(settingsRes.data.tier);
    } catch (error) {
      console.error("Failed to load analytics", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const response = await generateTaxReport();
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Tax_Report_2026.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to generate report", error);
      alert("Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading || !analyticsData) {
    return <div className="animate-pulse space-y-8">
      <div className="h-24 glass-panel rounded-xl"></div>
      <div className="h-64 glass-panel rounded-xl"></div>
    </div>;
  }

  const { categoryData, monthlyData, insights } = analyticsData;

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Analytics Dashboard</h1>
      
      {/* Max Tier Exclusive: Tax Report Generator */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between border-2 border-purple-500/30">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent"></div>
        <div className="relative z-10 flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl text-purple-600 dark:text-purple-400">
            <FileText size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center space-x-2">
              <span>Automated Tax Reports</span>
              <span className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Max Tier</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">Let our AI instantly compile a comprehensive PDF report of your deductible expenses.</p>
          </div>
        </div>

        <div className="relative z-10">
          {tier !== 'max' ? (
              <Link to="/profile" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                <Lock size={16} />
                <span>Unlock on Max</span>
              </Link>
          ) : reportSuccess ? (
            <button disabled className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-colors">
              <CheckCircle2 size={18} />
              <span>Report Downloaded</span>
            </button>
          ) : (
            <button 
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 shadow-lg transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:transform-none"
            >
              {generatingReport ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              <span>{generatingReport ? 'Generating...' : 'Generate 2026 PDF'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Spending By Category */}
        <div className="glass-panel p-6 rounded-xl">
          <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Spending by Category</h2>
          <div className="h-80">
            {categoryData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">No data available</div>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="glass-panel p-6 rounded-xl">
          <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Monthly Spending Trend</h2>
          <div className="h-80">
            {monthlyData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <RechartsTooltip 
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">No data available</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
