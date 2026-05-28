import React, { useState, useRef } from 'react';
import { api } from '../../services/api';
import { BulkImportReport } from '../../types';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Loader, Download, X, Info } from 'lucide-react';

const ArchiveBulkImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<BulkImportReport | null>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setError('Only CSV and Excel (.xlsx, .xls) files are supported.');
      return;
    }
    setFile(f);
    setError('');
    setReport(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError('');
    setReport(null);
    try {
      const result = await api.bulkImportArchive(file) as BulkImportReport;
      setReport(result);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setReport(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-900 text-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-heading font-bold mb-2">Bulk Import</h2>
        <p className="opacity-80 text-sm">Import historical student records from CSV or Excel files.</p>
      </div>

      {/* Instructions Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-blue-900 text-sm mb-2">File Format Requirements</h4>
            <p className="text-blue-800 text-xs mb-2">Your file should contain columns with any of these header names:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {['Student Name *', 'Certificate ID *', 'Father Name', 'Mother Name', 'Mobile', 'Enrollment No', 'Course', 'Batch', 'Session', 'Admission Date', 'Completion Date', 'Grade', 'Result Status', 'Remarks'].map(col => (
                <span key={col} className={`bg-white px-2 py-1 rounded border ${col.includes('*') ? 'border-blue-400 font-bold text-blue-800' : 'border-blue-200 text-blue-700'}`}>
                  {col}
                </span>
              ))}
            </div>
            <p className="text-blue-600 text-[11px] mt-2">* Required fields. Duplicate Certificate IDs will be skipped.</p>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-gray-300 hover:border-primary/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-4">
              <FileSpreadsheet className="w-16 h-16 text-green-600 mx-auto" />
              <div>
                <p className="font-bold text-gray-800 text-lg">{file.name}</p>
                <p className="text-gray-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <div className="flex justify-center gap-3">
                <button onClick={handleImport} disabled={importing}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                  {importing ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {importing ? 'Importing...' : 'Start Import'}
                </button>
                <button onClick={handleReset}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-16 h-16 text-gray-300 mx-auto" />
              <div>
                <p className="font-bold text-gray-700 text-lg">Drop your file here</p>
                <p className="text-gray-500 text-sm">or click to browse — supports CSV, XLSX, XLS</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors">
                Choose File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}
      </div>

      {/* Import Report */}
      {report && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-heading font-bold text-gray-800">Import Report</h3>
            <button onClick={handleReset} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-3 divide-x divide-gray-100 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800">{report.total}</p>
              <p className="text-xs text-gray-500 uppercase font-bold mt-1">Total Rows</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{report.imported}</p>
              <p className="text-xs text-green-600 uppercase font-bold mt-1">Imported</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{report.skipped}</p>
              <p className="text-xs text-orange-600 uppercase font-bold mt-1">Skipped</p>
            </div>
          </div>

          {report.imported > 0 && (
            <div className="px-6 pb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-800 text-sm font-medium">
                  Successfully imported {report.imported} record{report.imported > 1 ? 's' : ''} into the archive.
                </p>
              </div>
            </div>
          )}

          {report.errors.length > 0 && (
            <div className="px-6 pb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-2">Issues ({report.errors.length})</h4>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {report.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs bg-orange-50 border border-orange-100 rounded px-3 py-2">
                    <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-orange-800"><strong>Row {err.row}:</strong> {err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArchiveBulkImport;
