import { useState, useEffect } from 'react';
import { getSettings, updateSettings, changePassword } from '../services/api';
import { AlertTriangle, CheckCircle2, Bell, Shield, Lock } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [yearlyBudgetInput, setYearlyBudgetInput] = useState('');
  
  // Notification States
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      setSettings(res.data);
      setBudgetInput(res.data.monthly_budget.toString());
      setYearlyBudgetInput(res.data.yearly_budget.toString());
      setEmailAlerts(res.data.email_alerts ?? true);
      setPushNotifications(res.data.push_notifications ?? true);
      setWeeklyReports(res.data.weekly_reports ?? true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    try {
      setSaving(true);
      const val = parseFloat(budgetInput);
      const yearlyVal = parseFloat(yearlyBudgetInput);
      if (isNaN(val) || isNaN(yearlyVal)) return;
      
      const res = await updateSettings({ monthly_budget: val, yearly_budget: yearlyVal });
      setSettings(res.data);
      setMessage('Budgets updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update budget.');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = async (type, currentVal) => {
    const newVal = !currentVal;
    try {
      if (type === 'email') setEmailAlerts(newVal);
      if (type === 'push') setPushNotifications(newVal);
      if (type === 'weekly') setWeeklyReports(newVal);
      
      await updateSettings({
        email_alerts: type === 'email' ? newVal : emailAlerts,
        push_notifications: type === 'push' ? newVal : pushNotifications,
        weekly_reports: type === 'weekly' ? newVal : weeklyReports
      });
    } catch (err) {
      console.error('Failed to update preferences', err);
      // Revert on failure
      if (type === 'email') setEmailAlerts(currentVal);
      if (type === 'push') setPushNotifications(currentVal);
      if (type === 'weekly') setWeeklyReports(currentVal);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword(currentPassword, newPassword);
      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>

      {message && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-lg flex items-center space-x-2">
          <CheckCircle2 size={20} />
          <span>{message}</span>
        </div>
      )}

      {/* Budget Limit Section */}
      <div className="glass-panel p-8 rounded-2xl max-w-3xl">
        <h2 className="text-xl font-bold mb-2 flex items-center space-x-2 dark:text-white">
          <AlertTriangle size={24} className="text-orange-500" />
          <span>Smart Budget Limits</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Set your monthly budget limit. We'll warn you if you get too close to overspending.</p>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-48 text-sm font-semibold text-gray-700 dark:text-gray-300">Monthly Budget:</div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
            <input 
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="pl-8 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="w-48 text-sm font-semibold text-gray-700 dark:text-gray-300">Yearly Budget:</div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
            <input 
              type="number"
              value={yearlyBudgetInput}
              onChange={(e) => setYearlyBudgetInput(e.target.value)}
              className="pl-8 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
        </div>

        <div className="flex">
          <button 
            onClick={handleSaveBudget}
            disabled={saving}
            className="bg-primary hover:bg-primaryHover text-white px-6 py-3 rounded-xl font-medium transition-colors w-full sm:w-auto shadow-md"
          >
            {saving ? 'Saving...' : 'Save Limit'}
          </button>
        </div>
      </div>

      {/* Notification Preferences Section */}
      <div className="glass-panel p-8 rounded-2xl max-w-3xl">
        <h2 className="text-xl font-bold mb-2 flex items-center space-x-2 dark:text-white">
          <Bell size={24} className="text-indigo-500" />
          <span>Notification Preferences</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Manage how and when you want to receive alerts.</p>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <div>
              <div className="font-semibold text-gray-800 dark:text-white">Email Alerts</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Receive alerts about suspicious transactions directly to your inbox.</div>
            </div>
            <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${emailAlerts ? 'bg-primary' : 'bg-gray-300 dark:bg-slate-600'}`}>
              <input type="checkbox" className="sr-only" checked={emailAlerts} onChange={() => toggleNotification('email', emailAlerts)} />
              <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${emailAlerts ? 'translate-x-6' : 'translate-x-0'}`}></span>
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <div>
              <div className="font-semibold text-gray-800 dark:text-white">Push Notifications</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Instant push notifications for approaching budget limits.</div>
            </div>
            <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${pushNotifications ? 'bg-primary' : 'bg-gray-300 dark:bg-slate-600'}`}>
              <input type="checkbox" className="sr-only" checked={pushNotifications} onChange={() => toggleNotification('push', pushNotifications)} />
              <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${pushNotifications ? 'translate-x-6' : 'translate-x-0'}`}></span>
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <div>
              <div className="font-semibold text-gray-800 dark:text-white">Weekly Reports</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Receive a weekly summary of your spending and AI insights.</div>
            </div>
            <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${weeklyReports ? 'bg-primary' : 'bg-gray-300 dark:bg-slate-600'}`}>
              <input type="checkbox" className="sr-only" checked={weeklyReports} onChange={() => toggleNotification('weekly', weeklyReports)} />
              <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${weeklyReports ? 'translate-x-6' : 'translate-x-0'}`}></span>
            </div>
          </label>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="glass-panel p-8 rounded-2xl max-w-3xl">
        <h2 className="text-xl font-bold mb-2 flex items-center space-x-2 dark:text-white">
          <Shield size={24} className="text-emerald-500" />
          <span>Security & Password</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Update your password to keep your account secure.</p>
        
        {passwordError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={16} /></span>
              <input 
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={16} /></span>
              <input 
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={16} /></span>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>
          
          <div className="pt-2">
            <button 
              type="submit"
              disabled={changingPassword}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-colors w-full sm:w-auto shadow-md disabled:opacity-70"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
