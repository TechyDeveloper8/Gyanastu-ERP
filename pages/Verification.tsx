import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Award } from 'lucide-react';
import { api } from '../services/api';
import { Certificate } from '../types';

const Verification: React.FC = () => {
  const [certId, setCertId] = useState('');
  const [result, setResult] = useState<Certificate | null | 'not_found'>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const data = await api.verifyCertificate(certId);
      setResult(data as Certificate);
    } catch (err: any) {
      setResult('not_found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary py-20 animate-fade-in">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center mb-10">
          <Award className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-4">Certificate Verification</h1>
          <p className="text-gray-600">Enter the unique Certificate ID printed on the document to verify its authenticity.</p>
        </div>

        <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-md">
          <form onSubmit={handleVerify} className="mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter Certificate ID (e.g., CERT-2023-001)"
                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 bg-primary text-white px-4 rounded-md font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? '...' : <Search className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Try entering: <span className="font-mono bg-gray-100 px-1">CERT-2023-001</span></p>
          </form>

          {result === 'not_found' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center animate-fade-in">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-red-700 mb-1">Invalid Certificate</h3>
              <p className="text-red-600 text-sm">The ID provided does not exist in our records.</p>
            </div>
          )}

          {result && result !== 'not_found' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 animate-fade-in text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500 rotate-45 transform translate-x-12 -translate-y-12"></div>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4 relative z-10" />
              <h2 className="text-2xl font-heading font-bold text-green-800 mb-2">Verified Successfully</h2>
              {(result as any).source === 'archive' && (
                <p className="text-sm text-green-600 mb-4 inline-flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                  📁 Record from Student Archive
                </p>
              )}

              <div className="space-y-4 text-left border-t border-green-200 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Student Name</p>
                    <p className="font-bold text-gray-800 text-lg">{result.studentName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Certificate Status</p>
                    <span className="inline-block bg-green-200 text-green-800 text-xs px-2 py-1 rounded font-bold">{result.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Course Completed</p>
                    <p className="font-bold text-gray-800">{result.courseName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Aadhar Number</p>
                    <p className="font-bold text-gray-800 ">XXXX XXXX {result.aadharNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-green-600 uppercase font-bold tracking-wider">
                      {(result as any).source === 'archive' ? 'Completion Date' : 'Issue Date'}
                    </p>
                    <p className="font-bold text-gray-800">
                      {(result as any).source === 'archive'
                        ? ((result as any).completionDate || 'N/A')
                        : result.issueDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Certificate ID</p>
                    <p className="font-bold text-gray-800 font-mono">{result.id}</p>
                  </div>
                </div>

                {(result as any).source === 'archive' && (
                  <div className="grid grid-cols-2 gap-4">
                    {(result as any).grade && (
                      <div>
                        <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Grade</p>
                        <p className="font-bold text-gray-800">{(result as any).grade}</p>
                      </div>
                    )}
                    {(result as any).session && (
                      <div>
                        <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Session</p>
                        <p className="font-bold text-gray-800">{(result as any).session}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default Verification;