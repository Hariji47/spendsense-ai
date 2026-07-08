import { useState, useEffect } from 'react';
import { X, CreditCard, Lock, CheckCircle2, Loader2 } from 'lucide-react';

export default function PaymentModal({ tier, onClose, onSuccess }) {
  const [step, setStep] = useState('input'); // input, processing, success
  const price = tier === 'pro' ? '₹499' : '₹999';

  const handlePay = (e) => {
    e.preventDefault();
    setStep('processing');
    
    // Simulate API network request
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 relative border border-white/20 dark:border-slate-700/50">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="relative z-10 text-white">
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <span className="capitalize text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">SpendSense {tier}</span>
            </h2>
            <p className="text-sm text-slate-300 font-medium">Subscribe for {price}/mo</p>
          </div>
          {step === 'input' && (
            <button onClick={onClose} className="relative z-10 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-8 bg-white dark:bg-slate-900">
          
          {step === 'input' && (
            <form onSubmit={handlePay} className="space-y-5">
              <div className="flex justify-center mb-6">
                <div className="flex space-x-2 opacity-60">
                  {/* Fake card icons */}
                  <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">VISA</div>
                  <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">MC</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="text" placeholder="4242 4242 4242 4242" className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all font-mono" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiry</label>
                  <input required type="text" placeholder="MM/YY" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CVC</label>
                  <input required type="text" placeholder="123" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name on Card</label>
                <input required type="text" placeholder="Cardholder Name" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all" />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg">
                  <Lock size={16} />
                  <span>Pay {price}</span>
                </button>
              </div>
              <p className="text-xs text-center text-slate-500 mt-4 flex items-center justify-center space-x-1">
                <Lock size={12} />
                <span>Secured by Stripe Simulation</span>
              </p>
            </form>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 size={48} className="text-primary animate-spin" />
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Processing Payment</h3>
                <p className="text-slate-500 dark:text-slate-400">Please don't close this window.</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} className="text-emerald-500" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Payment Successful!</h3>
                <p className="text-slate-500 dark:text-slate-400">Welcome to SpendSense {tier.charAt(0).toUpperCase() + tier.slice(1)}.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
