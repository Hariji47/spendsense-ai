import { useState } from 'react';
import { uploadCsv, confirmUpload } from '../services/api';
import { UploadCloud, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ImportData() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationResult(null);
      setError(null);
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await uploadCsv(formData);
      setValidationResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred during validation");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!validationResult || validationResult.validRecords.length === 0) return;
    
    setLoading(true);
    try {
      await confirmUpload(validationResult.validRecords);
      navigate('/transactions');
    } catch (err) {
      setError("Failed to import transactions");
      setLoading(false);
    }
  };

  const downloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8,date,description,amount,category,transaction_type\n2024-01-15,Uber Ride,350.50,Transportation,Expense\n2024-01-16,Salary,50000.00,Salary,Income\n2024-01-17,Dominos Pizza,800.00,Food,Expense";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_transactions.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Import Data</h1>
        <button 
          onClick={downloadSample}
          className="text-primary hover:text-primaryHover flex items-center space-x-2 transition-colors font-medium text-sm bg-blue-50 px-4 py-2 rounded-lg"
        >
          <Download size={16} />
          <span>Download Sample CSV</span>
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-12 bg-gray-50 dark:bg-slate-800/50 text-center">
          <UploadCloud size={48} className="text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Upload CSV File</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Your file must include columns for date, description, amount, and category.
          </p>
          
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            className="hidden" 
            id="csv-upload"
          />
          <label 
            htmlFor="csv-upload"
            className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors font-medium"
          >
            {file ? file.name : "Select a file"}
          </label>
        </div>

        {file && !validationResult && !error && (
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleValidate}
              disabled={loading}
              className="bg-primary hover:bg-primaryHover text-white px-6 py-2.5 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Validating...' : 'Validate File'}
            </button>
          </div>
        )}
        
        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start space-x-3">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium">Validation Failed</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {validationResult && (
          <div className="mt-8 space-y-6 border-t border-gray-100 dark:border-slate-700 pt-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Validation Summary</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <p className="text-sm text-emerald-600 font-medium mb-1">Valid Records</p>
                <p className="text-2xl font-bold text-emerald-700">{validationResult.summary.validCount}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <p className="text-sm text-red-600 font-medium mb-1">Errors Found</p>
                <p className="text-2xl font-bold text-red-700">{validationResult.summary.invalidCount}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <p className="text-sm text-orange-600 font-medium mb-1">Duplicates Ignored</p>
                <p className="text-2xl font-bold text-orange-700">{validationResult.summary.duplicateCount}</p>
              </div>
            </div>

            {validationResult.summary.invalidCount > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700">Rows with Errors (will be skipped)</h4>
                </div>
                <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                  {validationResult.invalidRecords.map((record, i) => (
                    <li key={i} className="p-4 text-sm flex items-start space-x-3">
                      <span className="font-mono text-gray-500 w-16">Row {record.row}</span>
                      <span className="text-red-600 flex-1">{record.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleConfirm}
                disabled={loading || validationResult.summary.validCount === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Importing...</span>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    <span>Import {validationResult.summary.validCount} Valid Records</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
