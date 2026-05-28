import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, CheckCircle, XCircle, Clock, Loader } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const StudentAttendanceView: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [myAttendance, setMyAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const sData: any = await api.getStudents();
        const sList = Array.isArray(sData) ? sData : sData.data || [];
        const studentProfile = sList.find((s: any) => s.email === user?.email || s.user?.email === user?.email);
        setProfile(studentProfile);

        if (studentProfile) {
          const sid = studentProfile.id || studentProfile._id;
          const attData: any = await api.getAttendance(sid);
          const attList = Array.isArray(attData) ? attData : attData.data || [];
          setMyAttendance(attList.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (user?.email) fetchData();
  }, [user]);

  if (loading || !profile) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;

  const stats = {
    present: myAttendance.filter(a => a.status === 'Present').length,
    absent: myAttendance.filter(a => a.status === 'Absent').length,
    late: myAttendance.filter(a => a.status === 'Late').length,
    total: myAttendance.length
  };

  const attendancePercentage = stats.total === 0 ? 0 : Math.round((stats.present / stats.total) * 100);

  const chartData = [
    { name: 'Present', value: stats.present, color: '#16a34a' },
    { name: 'Late', value: stats.late, color: '#ea580c' },
    { name: 'Absent', value: stats.absent, color: '#dc2626' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-heading font-bold text-primary">My Attendance</h2>
        <p className="text-gray-500 text-sm">Track your daily class presence and consistency.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="w-32 h-32 relative flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#f3f4f6" strokeWidth="12" fill="none" />
              <circle 
                cx="64" cy="64" r="56" 
                stroke={attendancePercentage >= 75 ? '#16a34a' : '#dc2626'} 
                strokeWidth="12" 
                fill="none" 
                strokeDasharray="351.86" 
                strokeDashoffset={351.86 - (351.86 * attendancePercentage) / 100} 
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-2xl font-bold text-gray-800">{attendancePercentage}%</span>
          </div>
          <p className="text-sm font-bold text-gray-500 uppercase">Overall Attendance</p>
          {attendancePercentage < 75 && (
            <p className="text-xs text-red-500 mt-2 font-bold">Warning: Below 75% required for certification.</p>
          )}
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
           <h3 className="font-bold text-gray-800 mb-4">Attendance Breakdown</h3>
           <div className="h-40">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} layout="vertical">
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 12}} />
                 <Tooltip cursor={{fill: 'transparent'}} />
                 <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
           <div className="flex justify-around text-center mt-2">
             <div>
               <p className="text-2xl font-bold text-green-600">{stats.present}</p>
               <p className="text-xs text-gray-500 uppercase">Present</p>
             </div>
             <div>
               <p className="text-2xl font-bold text-orange-600">{stats.late}</p>
               <p className="text-xs text-gray-500 uppercase">Late</p>
             </div>
             <div>
               <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
               <p className="text-xs text-gray-500 uppercase">Absent</p>
             </div>
           </div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">Attendance Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase bg-white">
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Marked By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {myAttendance.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500">No records found.</td>
                </tr>
              ) : (
                myAttendance.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="p-4 font-mono text-gray-600">{record.date}</td>
                    <td className="p-4">
                      <span className={`flex items-center gap-1 font-bold text-xs px-2 py-1 rounded w-fit
                        ${record.status === 'Present' ? 'bg-green-100 text-green-700' : 
                          record.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {record.status === 'Present' && <CheckCircle className="w-3 h-3" />}
                        {record.status === 'Absent' && <XCircle className="w-3 h-3" />}
                        {record.status === 'Late' && <Clock className="w-3 h-3" />}
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">Faculty ID: {record.markedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceView;