import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, Printer, Filter, Loader } from 'lucide-react';

const ReportsAnalytics: React.FC = () => {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [feesData, studentsData, franchiseData]: any = await Promise.all([
          api.getFees(),
          api.getStudents(),
          api.getFranchises()
        ]);

        const fList = Array.isArray(feesData) ? feesData : feesData.data || [];
        const sList = Array.isArray(studentsData) ? studentsData : studentsData.data || [];
        const frList = Array.isArray(franchiseData) ? franchiseData : franchiseData.data || [];

        // Compute 6 months revenue
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const last6Months = [];
        const now = new Date();
        for(let i = 5; i >= 0; i--) {
           const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
           last6Months.push({ monthIndex: d.getMonth(), year: d.getFullYear(), name: monthNames[d.getMonth()], revenue: 0 });
        }
        
        fList.forEach((fee: any) => {
          if (fee.status !== 'Paid') return;
          const fd = new Date(fee.createdAt || fee.date || new Date());
          const match = last6Months.find(m => m.monthIndex === fd.getMonth() && m.year === fd.getFullYear());
          if (match) match.revenue += fee.amount;
        });
        setRevenueData(last6Months);

        // Compute Student Status Distribution
        const statusMap: Record<string, number> = { Active: 0, Graduated: 0, Dropout: 0, Pending: 0, Suspended: 0 };
        sList.forEach((s: any) => {
           const st = s.status || 'Pending';
           if (statusMap[st] !== undefined) statusMap[st]++;
           else statusMap[st] = 1;
        });
        
        const sd = [
          { name: 'Active', value: statusMap['Active'] || 0, color: '#16a34a' },
          { name: 'Graduated', value: statusMap['Graduated'] || 0, color: '#2563eb' },
          { name: 'Dropout', value: statusMap['Dropout'] || 0, color: '#dc2626' },
          { name: 'Pending', value: statusMap['Pending'] || 0, color: '#ea580c' },
        ];
        if (statusMap['Suspended']) sd.push({ name: 'Suspended', value: statusMap['Suspended'], color: '#7f1d1d' });
        
        setStudentData(sd.filter(d => d.value > 0)); 
        setFranchises(frList);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchReports();
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-heading font-bold text-primary">Reports & Analytics</h2>
           <p className="text-gray-500 text-sm">System-wide performance metrics and financial reports.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 text-sm">
             <Printer className="w-4 h-4" /> Print
          </button>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary/90 text-sm">
             <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-800 mb-6">Revenue Trend (6 Months)</h3>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={revenueData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(value) => `₹${value/1000}k`} />
                 <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                 <Line type="monotone" dataKey="revenue" stroke="#E07A5F" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Student Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-800 mb-6">Student Status Distribution</h3>
           <div className="flex items-center justify-center h-72">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={studentData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={100}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {studentData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
             <div className="space-y-2">
               {studentData.map((entry, index) => (
                 <div key={index} className="flex items-center gap-2 text-sm">
                   <div className="w-3 h-3 rounded-full" style={{backgroundColor: entry.color}}></div>
                   <span className="text-gray-600">{entry.name}: </span>
                   <span className="font-bold text-gray-800">{entry.value}</span>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>

      {/* Table Report */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Franchise Performance</h3>
          <button className="text-accent text-sm font-bold flex items-center gap-1 hover:underline">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Franchise Name</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Students</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Revenue</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Rating</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
             {franchises.map((f: any) => (
               <tr key={f.id || f._id}>
                 <td className="p-4 font-bold text-primary">{f.name}</td>
                 <td className="p-4">{f.studentCount || 0}</td>
                 <td className="p-4">₹{(f.revenue || 0).toLocaleString()}</td>
                 <td className="p-4 text-yellow-500 font-bold">{f.rating || '4.0'} ★</td>
                 <td className="p-4">
                   <span className={`px-2 py-1 rounded text-xs font-bold ${f.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                     {f.status || 'Unknown'}
                   </span>
                 </td>
               </tr>
             ))}
             {franchises.length === 0 && (
               <tr><td colSpan={5} className="text-center py-6 text-gray-500">No franchise performances found.</td></tr>
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsAnalytics;