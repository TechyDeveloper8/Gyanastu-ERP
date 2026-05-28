import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ArchiveStats } from '../../types';
import { Users, Search, Award, TrendingUp, Archive, Loader } from 'lucide-react';

const ArchiveDashboard: React.FC = () => {
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getArchiveStats() as ArchiveStats;
        setStats(data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-16 flex justify-center"><Loader className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900 via-purple-800 to-indigo-900 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
            <Archive className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold">Archive Dashboard</h2>
            <p className="opacity-80 text-sm">Overview of archived student records and verification activity.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold">Archived Students</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats?.totalArchived || 0}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg text-green-600"><Search className="w-6 h-6" /></div>
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold">Total Verifications</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats?.totalVerifications || 0}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg text-orange-600"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold">Searches This Week</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats?.recentSearches || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Course Distribution */}
      {stats?.courseCounts && stats.courseCounts.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-heading font-bold text-gray-800 mb-4">Top Courses in Archive</h3>
          <div className="space-y-3">
            {stats.courseCounts.map((course, i) => {
              const maxCount = stats.courseCounts[0]?.count || 1;
              const percentage = Math.round((course.count / maxCount) * 100);
              const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-teal-500', 'bg-emerald-500'];
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{course._id || 'Unknown'}</span>
                    <span className="text-sm font-bold text-gray-800">{course.count} students</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all duration-500 ${colors[i % colors.length]}`}
                      style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveDashboard;
