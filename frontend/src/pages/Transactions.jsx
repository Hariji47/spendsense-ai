import { useState, useEffect } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, deleteAllTransactions, predictCategory, exportTransactions } from '../services/api';
import { Plus, Edit2, Trash2, X, Sparkles, Download, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: 'Food',
    transaction_type: 'Expense'
  });
  const [isPredicting, setIsPredicting] = useState(false);

  const categories = [
    'Food', 'Transportation', 'Shopping', 'Entertainment', 
    'Bills & Utilities', 'Healthcare', 'Education', 
    'Travel', 'Rent', 'Salary', 'Other'
  ];

  useEffect(() => {
    loadTransactions();
  }, [timeframe]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await getTransactions(timeframe);
      setTransactions(res.data);
    } catch (error) {
      console.error("Failed to load transactions", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Debounced AI Prediction
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.description.length > 2 && !editingId && formData.transaction_type === 'Expense') {
        setIsPredicting(true);
        try {
          const res = await predictCategory(formData.description);
          if (res.data.category) {
            setFormData(prev => ({ ...prev, category: res.data.category }));
          }
        } catch (error) {
          console.error("AI Prediction failed");
        } finally {
          setIsPredicting(false);
        }
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.description, editingId, formData.transaction_type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString()
      };

      if (editingId) {
        await updateTransaction(editingId, payload);
      } else {
        await createTransaction(payload);
      }
      
      closeModal();
      loadTransactions();
    } catch (error) {
      console.error("Failed to save transaction", error);
      alert("Error saving transaction");
    }
  };

  const handleEdit = (t) => {
    setFormData({
      date: t.date.split('T')[0],
      description: t.description,
      amount: t.amount,
      category: t.category,
      transaction_type: t.transaction_type
    });
    setEditingId(t.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(id);
        loadTransactions();
      } catch (error) {
        console.error("Failed to delete", error);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("WARNING: Are you sure you want to delete ALL transactions? This action cannot be undone.")) {
      try {
        await deleteAllTransactions();
        loadTransactions();
      } catch (error) {
        console.error("Failed to delete all", error);
      }
    }
  };

  const openNewModal = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      category: 'Food',
      transaction_type: 'Expense'
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleExport = async () => {
    try {
      const response = await exportTransactions();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'spendsense_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export transactions", error);
    }
  };

  const timeframes = [
    { id: 'weekly', label: '7 Days' },
    { id: 'monthly', label: '30 Days' },
    { id: 'yearly', label: 'This Year' },
    { id: 'all', label: 'All Time' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Transactions</h1>
          {/* Timeframe Toggle */}
          <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-1">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
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
        <div className="flex space-x-3">
          <button 
            onClick={handleExport}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={handleDeleteAll}
            className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-50 transition-colors font-medium shadow-sm"
            title="Delete All Transactions"
          >
            <AlertTriangle size={18} />
            <span className="hidden sm:inline">Delete All</span>
          </button>
          <button 
            onClick={openNewModal}
            className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 text-sm">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">Loading transactions...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No transactions found. Add one to get started!</td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                      {format(new Date(t.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">{t.description}</td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-md text-xs">{t.category}</span>
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        t.transaction_type === 'Expense' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {t.transaction_type}
                      </span>
                    </td>
                    <td className={`p-4 text-sm font-semibold ${
                      t.transaction_type === 'Expense' ? 'text-gray-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {t.transaction_type === 'Expense' ? '-' : '+'}
                      ₹{t.amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-right space-x-2 flex justify-end">
                      <button onClick={() => handleEdit(t)} className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-gray-100">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-transparent dark:border-slate-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingId ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select 
                    name="transaction_type" 
                    value={formData.transaction_type} 
                    onChange={handleInputChange}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleInputChange}
                    required
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  name="amount" 
                  value={formData.amount} 
                  onChange={handleInputChange}
                  required
                  placeholder="0.00"
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input 
                  type="text" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Uber Ride"
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                  <span>Category</span>
                  {isPredicting && <span className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center"><Sparkles size={12} className="mr-1"/> AI Predicting...</span>}
                </label>
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange}
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 dark:border-slate-800 mt-6 pt-6">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg transition-colors font-medium"
                >
                  {editingId ? 'Save Changes' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
