import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { uploadProfilePicture, getSettings, updateSettings, deleteAccount } from '../services/api';
import { Shield, Sparkles, Zap, CheckCircle2, Crown, HeadphonesIcon, FileText, Download, Camera } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';

function Profile() {
  const { user, logout, fetchUser } = useContext(AuthContext);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [checkoutTier, setCheckoutTier] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      setSettings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      await uploadProfilePicture(formData);
      await fetchUser(); // refresh user context
    } catch (err) {
      console.error('Failed to upload picture', err);
      alert('Failed to upload picture');
    } finally {
      setUploading(false);
    }
  };

  const handleUpgrade = async (tier) => {
    if (tier === 'free') {
      try {
        const res = await updateSettings({ tier });
        setSettings(res.data);
      } catch (err) {
        console.error(err);
      }
    } else {
      setCheckoutTier(tier);
    }
  };

  const onPaymentSuccess = async () => {
    try {
      const res = await updateSettings({ tier: checkoutTier });
      setSettings(res.data);
      setCheckoutTier(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      logout();
    } catch (err) {
      console.error('Failed to delete account', err);
      alert('Failed to delete account. Please try again.');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-12">
      {checkoutTier && (
        <PaymentModal 
          tier={checkoutTier} 
          onClose={() => setCheckoutTier(null)} 
          onSuccess={onPaymentSuccess} 
        />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-transparent dark:border-slate-700 animate-fade-in-up">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Account?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete your account? This action is permanent and will destroy all your data (transactions, settings, profile).
              </p>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Yes, Delete My Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile & Billing</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-6 mb-8">
            <div 
              className="relative h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg cursor-pointer overflow-hidden group"
              onClick={handleAvatarClick}
            >
              {user.profile_picture ? (
                <img src={`http://localhost:8000${user.profile_picture}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.full_name?.charAt(0).toUpperCase()
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <Camera size={24} className="text-white" />
                )}
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.full_name}</h2>
              <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Account Created</h3>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Account ID</h3>
              <p className="text-lg font-semibold text-slate-900 dark:text-white font-mono">
                #{user.id.toString().padStart(6, '0')}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
            >
              Delete Account
            </button>
            <button
              onClick={logout}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300 rounded-lg font-medium transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {loadingSettings ? (
        <div className="animate-pulse h-64 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
      ) : settings ? (
        <>
          {/* Pro Subscription Tier */}
          <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
            <h2 className="text-xl font-bold mb-2 flex items-center space-x-2 dark:text-white">
              <Shield size={24} className="text-primary" />
              <span>Subscription Plan</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
              Upgrade your plan to unlock the full power of SpendSense. Your current plan is: 
              <span className="font-bold ml-1 text-gray-900 dark:text-white uppercase px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-md">{settings.tier}</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Free Tier */}
              <div className={`p-8 rounded-2xl border-2 transition-all flex flex-col ${settings.tier === 'free' ? 'border-primary bg-blue-50/50 dark:bg-slate-800 shadow-md' : 'border-transparent bg-gray-50 dark:bg-slate-800/50 opacity-70'}`}>
                <h3 className="text-2xl font-bold mb-4 dark:text-white">Free</h3>
                <p className="text-4xl font-black mb-6 dark:text-white">₹0<span className="text-lg text-gray-500 font-medium">/mo</span></p>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center space-x-3 text-gray-700 dark:text-gray-300"><CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0"/> <span>Basic Dashboard</span></li>
                  <li className="flex items-center space-x-3 text-gray-700 dark:text-gray-300"><CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0"/> <span>Manual CSV Imports</span></li>
                  <li className="flex items-center space-x-3 text-gray-400"><span className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"></span> <span>AI Chatbot</span></li>
                  <li className="flex items-center space-x-3 text-gray-400"><span className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"></span> <span>Subscriptions Manager</span></li>
                  <li className="flex items-center space-x-3 text-gray-400"><span className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"></span> <span>AI Anomaly Detection</span></li>
                </ul>
                {settings.tier === 'free' ? (
                  <div className="text-center py-3 font-bold text-gray-500 bg-gray-100 dark:bg-slate-700 rounded-xl">Current Plan</div>
                ) : (
                  <button onClick={() => handleUpgrade('free')} className="w-full py-3 rounded-xl border-2 border-gray-200 dark:border-slate-600 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors dark:text-white">Downgrade</button>
                )}
              </div>

              {/* Pro Tier */}
              <div className={`p-8 rounded-2xl border-2 relative transition-all flex flex-col ${settings.tier === 'pro' ? 'border-primary bg-primary/5 dark:bg-slate-800 shadow-xl scale-105 z-10' : 'border-transparent bg-gray-50 dark:bg-slate-800/80 hover:border-primary/50'}`}>
                <h3 className="text-2xl font-bold mb-4 flex items-center space-x-2 text-primary">
                  <Sparkles size={24} />
                  <span>Pro</span>
                </h3>
                <p className="text-4xl font-black mb-6 dark:text-white">₹499<span className="text-lg text-gray-500 font-medium">/mo</span></p>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center space-x-3 text-gray-700 dark:text-gray-300"><CheckCircle2 size={18} className="text-primary flex-shrink-0"/> <span>Everything in Free</span></li>
                  <li className="flex items-center space-x-3 text-gray-700 dark:text-gray-300"><CheckCircle2 size={18} className="text-primary flex-shrink-0"/> <span className="font-bold">AI Chatbot</span></li>
                  <li className="flex items-center space-x-3 text-gray-700 dark:text-gray-300"><CheckCircle2 size={18} className="text-primary flex-shrink-0"/> <span className="font-bold">Subscriptions Manager</span></li>
                  <li className="flex items-center space-x-3 text-gray-700 dark:text-gray-300"><CheckCircle2 size={18} className="text-primary flex-shrink-0"/> <span className="font-bold">Health Score on Dashboard</span></li>
                  <li className="flex items-center space-x-3 text-gray-700 dark:text-gray-300"><CheckCircle2 size={18} className="text-primary flex-shrink-0"/> <span className="font-bold">AI Anomaly Detection</span></li>
                </ul>
                {settings.tier === 'pro' ? (
                  <div className="text-center py-3 font-bold text-white bg-primary rounded-xl flex justify-center items-center space-x-2">
                    <CheckCircle2 size={18} /><span>Current Plan</span>
                  </div>
                ) : (
                  <button onClick={() => handleUpgrade('pro')} className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-bold shadow-md transition-colors">
                    Select Pro
                  </button>
                )}
              </div>

              {/* Max Tier */}
              <div className={`p-8 rounded-2xl border-2 relative transition-all flex flex-col ${settings.tier === 'max' ? 'border-purple-500 bg-purple-500/5 dark:bg-slate-800 shadow-xl' : 'border-transparent bg-gradient-to-br from-primary/5 to-purple-600/5 dark:bg-slate-800/50 hover:border-purple-500/50'}`}>
                {settings.tier === 'max' && (
                  <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 rounded-bl-xl text-xs font-bold flex items-center space-x-1">
                    <Crown size={12} /><span>ACTIVE</span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-4 flex items-center space-x-2 text-purple-600">
                  <Crown size={24} />
                  <span>Max</span>
                </h3>
                <p className="text-4xl font-black mb-6 dark:text-white">₹999<span className="text-lg text-gray-500 font-medium">/mo</span></p>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center space-x-3 text-gray-700 dark:text-gray-300"><CheckCircle2 size={18} className="text-purple-600 flex-shrink-0"/> <span>Everything in Pro</span></li>
                  <li className="flex items-center space-x-3 text-gray-700 dark:text-gray-300"><CheckCircle2 size={18} className="text-purple-600 flex-shrink-0"/> <span className="font-bold">Machine Learning Insights</span></li>
                  <li className="flex items-center space-x-3 text-gray-700 dark:text-gray-300"><CheckCircle2 size={18} className="text-purple-600 flex-shrink-0"/> <span className="font-bold">Spending Forecasts</span></li>
                  <li className="flex items-center space-x-3 text-gray-700 dark:text-gray-300"><CheckCircle2 size={18} className="text-purple-600 flex-shrink-0"/> <span className="font-bold flex items-center space-x-1"><span>Tax Reports (PDF)</span><Zap size={14} className="text-yellow-500"/></span></li>
                  <li className="flex items-center space-x-3 text-gray-700 dark:text-gray-300"><CheckCircle2 size={18} className="text-purple-600 flex-shrink-0"/> <span className="font-bold flex items-center space-x-1"><span>Priority Support</span><HeadphonesIcon size={14} className="text-blue-500"/></span></li>
                </ul>
                {settings.tier === 'max' ? (
                  <div className="text-center py-3 font-bold text-white bg-purple-600 rounded-xl flex justify-center items-center space-x-2">
                    <CheckCircle2 size={18} /><span>Current Plan</span>
                  </div>
                ) : (
                  <button onClick={() => handleUpgrade('max')} className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primaryHover hover:to-purple-700 text-white py-3 rounded-xl font-bold shadow-md transition-all">
                    Select Max
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Billing History Section */}
          <div className="glass-panel p-8 rounded-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center space-x-2 dark:text-white">
              <FileText size={24} className="text-gray-500" />
              <span>Billing History</span>
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-4 font-medium rounded-tl-lg">Date</th>
                    <th className="p-4 font-medium">Description</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Amount</th>
                    <th className="p-4 font-medium text-center rounded-tr-lg">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {settings.tier === 'max' ? (
                    <>
                      <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">Jul 01, 2026</td>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">SpendSense Max Subscription</td>
                        <td className="p-4 text-sm"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md text-xs font-bold">Paid</span></td>
                        <td className="p-4 text-sm font-bold text-gray-900 dark:text-white text-right">₹999.00</td>
                        <td className="p-4 text-sm text-center">
                          <button className="text-primary hover:text-primaryHover inline-flex items-center space-x-1 transition-colors">
                            <Download size={16} /> <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">Jun 01, 2026</td>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">SpendSense Max Subscription</td>
                        <td className="p-4 text-sm"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md text-xs font-bold">Paid</span></td>
                        <td className="p-4 text-sm font-bold text-gray-900 dark:text-white text-right">₹999.00</td>
                        <td className="p-4 text-sm text-center">
                          <button className="text-primary hover:text-primaryHover inline-flex items-center space-x-1 transition-colors">
                            <Download size={16} /> <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    </>
                  ) : settings.tier === 'pro' ? (
                    <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-300">Jul 01, 2026</td>
                      <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">SpendSense Pro Subscription</td>
                      <td className="p-4 text-sm"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md text-xs font-bold">Paid</span></td>
                      <td className="p-4 text-sm font-bold text-gray-900 dark:text-white text-right">₹499.00</td>
                      <td className="p-4 text-sm text-center">
                        <button className="text-primary hover:text-primaryHover inline-flex items-center space-x-1 transition-colors">
                          <Download size={16} /> <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No billing history available on the Free tier.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

    </div>
  );
}

export default Profile;
