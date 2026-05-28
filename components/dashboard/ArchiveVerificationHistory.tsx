import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { VerificationLogEntry } from '../../types';
import { Loader, Search, CheckCircle, XCircle, Archive, Clock, RefreshCw } from 'lucide-react';

const ArchiveVerificationHistory: React.FC = () => {
  const [logs, setLogs] = useState<VerificationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'archive' | 'not_found'>('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getVerificationHistory() as VerificationLogEntry[];
      setLogs(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = filter === 'all' ? logs : logs.filter(l => l.source === filter);

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'active': return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold"><CheckCircle className="w-3 h-3" />Active</span>;
      case 'archive': return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold"><Archive className="w-3 h-3" />Archive</span>;
      case 'not_found': return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold"><XCircle className="w-3 h-3" />Not Found</span>;
      default: return <span className="text-xs text-gray-500">{source}</span>;
    }
  };

  const stats = {
    total: logs.length,
    found: logs.filter(l => l.found).length,
    notFound: logs.filter(l => !l.found).length,
    fromArchive: logs.filter(l => l.source === 'archive').length
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-900 via-blue-800 to-sky-900 text-white p-8 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-heading font-bold mb-2">Verification History</h2>
            <p className="opacity-80 text-sm">Track all certificate verification searches across active and archived records.</p>
          </div>
          <button onClick={fetchLogs} className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2.5 rounded-lg text-gray-600"><Search className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Total Searches</p>
              <p className="text-xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2.5 rounded-lg text-green-600"><CheckCircle className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Found</p>
              <p className="text-xl font-bold text-green-600">{stats.found}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2.5 rounded-lg text-red-600"><XCircle className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Not Found</p>
              <p className="text-xl font-bold text-red-600">{stats.notFound}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600"><Archive className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">From Archive</p>
              <p className="text-xl font-bold text-blue-600">{stats.fromArchive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs + Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 flex-wrap">
          {(['all', 'active', 'archive', 'not_found'] as const).map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-5 py-3.5 font-bold text-sm border-b-2 transition-colors capitalize ${
                filter === tab ? 'border-accent text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab === 'not_found' ? 'Not Found' : tab === 'all' ? 'All' : tab}
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {tab === 'all' ? logs.length : logs.filter(l => l.source === tab).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-16 flex justify-center"><Loader className="animate-spin text-primary w-8 h-8" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-bold">No verification searches yet</p>
            <p className="text-sm mt-1">Searches will appear here when users verify certificates.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-3 pl-5">Certificate ID</th>
                  <th className="p-3">Searched At</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Source</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 pl-5 font-mono text-xs text-indigo-600 font-bold">{log.certificateId}</td>
                    <td className="p-3 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {new Date(log.searchedAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-3">
                      {log.found ? (
                        <span className="inline-flex items-center gap-1 text-green-700 font-bold text-xs"><CheckCircle className="w-3.5 h-3.5" /> Found</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs"><XCircle className="w-3.5 h-3.5" /> Not Found</span>
                      )}
                    </td>
                    <td className="p-3">{getSourceBadge(log.source)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveVerificationHistory;
