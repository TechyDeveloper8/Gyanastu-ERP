import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, Users, Calendar, AlertTriangle, Book, LayoutDashboard, Search } from 'lucide-react';

const AttendanceReports: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'student' | 'batch'>('student');
  
  const [studentReport, setStudentReport] = useState<any[]>([]);
  const [batchReport, setBatchReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const [studentRes, batchRes] = await Promise.all([
          api.getStudentAttendanceReport(user?.role === 'SUPER_ADMIN' ? undefined : user?.franchiseId),
          api.getBatchAttendanceReport(user?.role === 'SUPER_ADMIN' ? undefined : user?.franchiseId)
        ]);
        setStudentReport(studentRes);
        setBatchReport(batchRes);
      } catch (err) {
        console.error("Failed to load reports", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
  }, [user]);

  const filteredStudentReport = studentReport.filter(s => 
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.batchName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getHealthColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-600 bg-green-50';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const exportToCSV = (type: 'student' | 'batch') => {
    // Simple CSV export
    let csvContent = "data:text/csv;charset=utf-8,";
    if (type === 'student') {
      csvContent += "Student Name,Batch Name,Total Days,Present,Absent,Late,Leave,Attendance %\n";
      studentReport.forEach(r => {
        csvContent += `"${r.studentName}","${r.batchName}",${r.totalDays},${r.presentDays},${r.absentDays},${r.lateDays},${r.leaveDays},${r.attendancePercentage}%\n`;
      });
    } else {
      csvContent += "Batch Name,Total Students,Present Today,Average Attendance %\n";
      batchReport.forEach(r => {
        csvContent += `"${r.batchName}",${r.totalStudents},${r.presentToday},${r.averageAttendance}%\n`;
      });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary">Attendance Analytics</h2>
          <p className="text-gray-500 text-sm mt-1">Detailed attendance reports for students and batches.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => exportToCSV(activeTab)}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[700px]">
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('student')}
            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'student' ? 'text-accent border-b-2 border-accent bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Users className="w-4 h-4" /> Student Attendance Report
          </button>
          <button 
            onClick={() => setActiveTab('batch')}
            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'batch' ? 'text-accent border-b-2 border-accent bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Book className="w-4 h-4" /> Batch Attendance Report
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">Loading reports...</div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden p-6">
            {activeTab === 'student' && (
              <>
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text"
                    placeholder="Search by student name or batch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex-1 overflow-auto border rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Student Name</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Batch</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Total Classes</th>
                        <th className="p-4 text-xs font-bold text-green-600 uppercase text-center">Present</th>
                        <th className="p-4 text-xs font-bold text-red-600 uppercase text-center">Absent</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Late/Leave</th>
                        <th className="p-4 text-xs font-bold text-gray-800 uppercase text-center">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStudentReport.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-4 font-medium text-gray-900">{row.studentName}</td>
                          <td className="p-4 text-sm text-gray-600">{row.batchName}</td>
                          <td className="p-4 text-center font-mono">{row.totalDays}</td>
                          <td className="p-4 text-center font-mono text-green-600 font-medium">{row.presentDays}</td>
                          <td className="p-4 text-center font-mono text-red-600 font-medium">{row.absentDays}</td>
                          <td className="p-4 text-center font-mono text-gray-500">{row.lateDays + row.leaveDays}</td>
                          <td className="p-4">
                            <div className="flex justify-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getHealthColor(row.attendancePercentage)}`}>
                                {row.attendancePercentage}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredStudentReport.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-500">No records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'batch' && (
              <div className="flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                    <p className="text-blue-600 text-sm font-bold uppercase tracking-wide mb-1">Total Active Batches</p>
                    <h3 className="text-3xl font-black text-blue-900">{batchReport.length}</h3>
                  </div>
                  <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                    <p className="text-green-600 text-sm font-bold uppercase tracking-wide mb-1">Present Today (Total)</p>
                    <h3 className="text-3xl font-black text-green-900">
                      {batchReport.reduce((acc, curr) => acc + curr.presentToday, 0)}
                    </h3>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                    <p className="text-purple-600 text-sm font-bold uppercase tracking-wide mb-1">Average Attendance</p>
                    <h3 className="text-3xl font-black text-purple-900">
                      {batchReport.length > 0 
                        ? (batchReport.reduce((acc, curr) => acc + curr.averageAttendance, 0) / batchReport.length).toFixed(1) 
                        : '0'}%
                    </h3>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                  <div className="border border-gray-100 rounded-xl overflow-hidden flex flex-col">
                    <div className="p-4 bg-gray-50 border-b font-bold text-gray-700">Batch Performance Data</div>
                    <div className="flex-1 overflow-auto">
                      <table className="w-full text-left">
                        <thead className="bg-white sticky top-0 shadow-sm">
                          <tr>
                            <th className="p-3 text-xs font-bold text-gray-500 uppercase">Batch Name</th>
                            <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">Students</th>
                            <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">Avg %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {batchReport.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="p-3 font-medium text-sm">{row.batchName}</td>
                              <td className="p-3 text-center text-sm">{row.totalStudents}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${getHealthColor(row.averageAttendance)}`}>
                                  {row.averageAttendance}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-xl p-4 flex flex-col">
                    <h3 className="font-bold text-gray-700 mb-4">Average Attendance Comparison</h3>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={batchReport} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="batchName" tick={{fontSize: 10}} angle={-45} textAnchor="end" height={60} />
                          <YAxis tick={{fontSize: 12}} />
                          <RechartsTooltip 
                            formatter={(value: number) => [`${value}%`, 'Average Attendance']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="averageAttendance" radius={[4, 4, 0, 0]}>
                            {batchReport.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.averageAttendance >= 85 ? '#10B981' : entry.averageAttendance >= 75 ? '#F59E0B' : '#EF4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReports;
