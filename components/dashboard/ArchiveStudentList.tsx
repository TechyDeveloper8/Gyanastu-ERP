import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { ArchiveStudent } from '../../types';
import { Search, Plus, Edit3, Trash2, Loader, ChevronLeft, ChevronRight, Users, Award, FileText, Eye, X } from 'lucide-react';
import ArchiveStudentForm from './ArchiveStudentForm';

const ArchiveStudentList: React.FC = () => {
  const [records, setRecords] = useState<ArchiveStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<ArchiveStudent | null>(null);
  const [viewRecord, setViewRecord] = useState<ArchiveStudent | null>(null);
  const [stats, setStats] = useState({ totalArchived: 0, totalVerifications: 0, recentSearches: 0, courseCounts: [] as any[] });
  const limit = 15;

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getArchiveStudents({ search, page, limit }) as any;
      setRecords(data.records || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [search, page]);

  const fetchStats = async () => {
    try {
      const data = await api.getArchiveStats() as any;
      setStats(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchRecords();
    fetchStats();
    socket.on('archive_updated', () => { fetchRecords(); fetchStats(); });
    return () => { socket.off('archive_updated'); };
  }, [fetchRecords]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const handleAdd = async (data: Partial<ArchiveStudent>) => {
    await api.addArchiveStudent(data);
    fetchRecords();
    fetchStats();
  };

  const handleEdit = async (data: Partial<ArchiveStudent>) => {
    if (!editRecord) return;
    await api.updateArchiveStudent(editRecord.id, data);
    fetchRecords();
  };

  const handleDelete = async (record: ArchiveStudent) => {
    if (!confirm(`Delete record for "${record.studentName}" (${record.certificateId})?`)) return;
    try {
      await api.deleteArchiveStudent(record.id);
      fetchRecords();
      fetchStats();
    } catch (err: any) { alert(err.message || 'Delete failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-800 text-white p-8 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-heading font-bold mb-2">Student Archive</h2>
            <p className="opacity-80 text-sm">Historical student records management & verification</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm text-center min-w-[100px]">
              <p className="text-2xl font-bold">{stats.totalArchived}</p>
              <p className="text-[10px] opacity-80 uppercase tracking-wide">Total Records</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm text-center min-w-[100px]">
              <p className="text-2xl font-bold">{stats.totalVerifications}</p>
              <p className="text-[10px] opacity-80 uppercase tracking-wide">Verifications</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm text-center min-w-[100px]">
              <p className="text-2xl font-bold">{stats.recentSearches}</p>
              <p className="text-[10px] opacity-80 uppercase tracking-wide">This Week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <form onSubmit={handleSearch} className="flex-grow flex gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, certificate ID, course, session, or batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <button type="submit" className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors whitespace-nowrap">
              Search
            </button>
          </form>
          <button onClick={() => { setEditRecord(null); setShowForm(true); }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </div>
        {total > 0 && (
          <p className="text-xs text-gray-500 mt-3">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} records</p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center"><Loader className="animate-spin text-primary w-8 h-8" /></div>
        ) : records.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-bold">No records found</p>
            <p className="text-sm mt-1">Try adjusting your search or add a new archive record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-3 pl-5">Student Name</th>
                  <th className="p-3">Certificate ID</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Session</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3">Grade</th>
                  <th className="p-3">Result</th>
                  <th className="p-3 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {records.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 pl-5 font-bold text-gray-800">{record.studentName}</td>
                    <td className="p-3 font-mono text-xs text-indigo-600">{record.certificateId}</td>
                    <td className="p-3 text-gray-600">{record.courseName || '—'}</td>
                    <td className="p-3 text-gray-600">{record.session || '—'}</td>
                    <td className="p-3 text-gray-600">{record.batch || '—'}</td>
                    <td className="p-3">
                      {record.grade ? (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{record.grade}</span>
                      ) : '—'}
                    </td>
                    <td className="p-3">
                      {record.resultStatus ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          record.resultStatus === 'Distinction' ? 'bg-yellow-100 text-yellow-700' :
                          record.resultStatus === 'Pass' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>{record.resultStatus}</span>
                      ) : '—'}
                    </td>
                    <td className="p-3 pr-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setViewRecord(record)} className="text-gray-400 hover:text-primary transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditRecord(record); setShowForm(true); }} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(record)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded text-sm font-bold transition-colors ${page === pageNum ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <ArchiveStudentForm
          student={editRecord}
          onClose={() => { setShowForm(false); setEditRecord(null); }}
          onSave={editRecord ? handleEdit : handleAdd}
        />
      )}

      {/* View Details Modal */}
      {viewRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-heading font-bold text-primary">Student Details</h2>
              <button onClick={() => setViewRecord(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Student Name', value: viewRecord.studentName },
                { label: 'Certificate ID', value: viewRecord.certificateId, mono: true },
                { label: "Father's Name", value: viewRecord.fatherName },
                { label: "Mother's Name", value: viewRecord.motherName },
                { label: 'Mobile Number', value: viewRecord.mobileNumber },
                { label: 'Enrollment No', value: viewRecord.enrollmentNumber },
                { label: 'Course', value: viewRecord.courseName },
                { label: 'Batch', value: viewRecord.batch },
                { label: 'Session', value: viewRecord.session },
                { label: 'Admission Date', value: viewRecord.admissionDate ? new Date(viewRecord.admissionDate).toLocaleDateString() : null },
                { label: 'Completion Date', value: viewRecord.completionDate ? new Date(viewRecord.completionDate).toLocaleDateString() : null },
                { label: 'Grade', value: viewRecord.grade },
                { label: 'Result', value: viewRecord.resultStatus },
                { label: 'Remarks', value: viewRecord.remarks },
              ].filter(f => f.value).map(field => (
                <div key={field.label} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{field.label}</span>
                  <span className={`text-sm font-medium text-gray-800 text-right max-w-[60%] ${field.mono ? 'font-mono' : ''}`}>{field.value}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => { setViewRecord(null); setEditRecord(viewRecord); setShowForm(true); }}
                className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2">
                <Edit3 className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => setViewRecord(null)}
                className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveStudentList;
