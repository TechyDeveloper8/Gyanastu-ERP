import React, { useState, useEffect } from 'react';
import { EnquiryAnalytics as AnalyticsType } from '../../types';
import { api } from '../../services/api';
import { Users, Briefcase, CheckCircle, Clock, FileText, TrendingUp, RefreshCw, Loader } from 'lucide-react';

const EnquiryAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getEnquiryAnalytics() as AnalyticsType;
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-16 flex justify-center items-center h-full">
        <Loader className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 text-white p-8 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-heading font-bold mb-2">Enquiry Analytics</h2>
            <p className="opacity-80 text-sm">Real-time overview of student and franchise leads.</p>
          </div>
          <button onClick={fetchAnalytics} className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-heading font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Student Course Enquiries
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><FileText className="w-6 h-6" /></div>
                <div>
                  <p className="text-gray-500 text-xs uppercase font-bold">Total Leads</p>
                  <h3 className="text-3xl font-bold text-gray-800">{data.student.total}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600"><TrendingUp className="w-6 h-6" /></div>
                <div>
                  <p className="text-gray-500 text-xs uppercase font-bold">Today's Leads</p>
                  <h3 className="text-3xl font-bold text-gray-800">{data.student.today}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-lg text-green-600"><CheckCircle className="w-6 h-6" /></div>
                <div>
                  <p className="text-gray-500 text-xs uppercase font-bold">Converted</p>
                  <h3 className="text-3xl font-bold text-gray-800">{data.student.converted}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-xl font-heading font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-600" /> Franchise Applications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600"><FileText className="w-6 h-6" /></div>
                <div>
                  <p className="text-gray-500 text-xs uppercase font-bold">Total Applications</p>
                  <h3 className="text-3xl font-bold text-gray-800">{data.franchise.total}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-lg text-yellow-600"><Clock className="w-6 h-6" /></div>
                <div>
                  <p className="text-gray-500 text-xs uppercase font-bold">Pending Review</p>
                  <h3 className="text-3xl font-bold text-gray-800">{data.franchise.pending}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-lg text-green-600"><CheckCircle className="w-6 h-6" /></div>
                <div>
                  <p className="text-gray-500 text-xs uppercase font-bold">Approved</p>
                  <h3 className="text-3xl font-bold text-gray-800">{data.franchise.approved}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EnquiryAnalytics;
