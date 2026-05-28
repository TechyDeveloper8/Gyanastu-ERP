import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { DollarSign, Search, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { StudentProfile } from '../../types';

interface FeeManagerProps { franchiseId?: string; }

const FeeManager: React.FC<FeeManagerProps> = ({ franchiseId }) => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data: any = await api.getStudents(franchiseId);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Failed to fetch students", err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStudents();
    socket.on('fee_paid', fetchStudents);
    socket.on('student_updated', fetchStudents);
    socket.on('student_added', fetchStudents);
    return () => {
      socket.off('fee_paid', fetchStudents);
      socket.off('student_updated', fetchStudents);
      socket.off('student_added', fetchStudents);
    };
  }, [franchiseId]);

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.rollNumber && s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())));

  const handleUpdateFee = async (id: string, currentFeesPaid: number, totalFees: number) => {
    const amountStr = prompt("Enter amount collected (₹):");
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) return alert("Invalid amount.");
    if ((currentFeesPaid || 0) + amount > totalFees) return alert("Error: Amount exceeds total outstanding fees.");

    try {
      await api.collectFee({ studentId: id, amount, type: 'Tuition' });
      alert(`Successfully collected ₹${amount}`);
    } catch (err) { alert("Failed to record fee payment."); }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-2xl font-heading font-bold text-primary">Fee Management</h2><p className="text-gray-500 text-sm">Track collections and update payment status.</p></div>
        <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search student..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">Student</th><th className="p-4 text-xs font-bold text-gray-500 uppercase">Total Fee</th><th className="p-4 text-xs font-bold text-gray-500 uppercase">Paid</th><th className="p-4 text-xs font-bold text-gray-500 uppercase">Pending</th><th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th><th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 text-sm">
               {filteredStudents.length === 0 ? (<tr><td colSpan={6} className="p-8 text-center text-gray-500">No students found.</td></tr>) : (
                 filteredStudents.map(student => {
                   const sid = student.id || (student as any)._id;
                   const feesPaid = student.feesPaid || 0;
                   const pending = student.totalFees - feesPaid;
                   return (
                     <tr key={sid} className="hover:bg-gray-50">
                       <td className="p-4"><p className="font-bold text-gray-800">{student.name}</p><p className="text-xs text-gray-500 font-mono">{student.rollNumber || 'N/A'}</p></td>
                       <td className="p-4 text-gray-600">₹{student.totalFees.toLocaleString()}</td>
                       <td className="p-4 font-bold text-green-600">₹{feesPaid.toLocaleString()}</td>
                       <td className="p-4 font-bold text-red-600">₹{pending.toLocaleString()}</td>
                       <td className="p-4">{pending <= 0 ? (<span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Cleared</span>) : (<span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" /> Due</span>)}</td>
                       <td className="p-4 text-right">
                         <button onClick={() => handleUpdateFee(sid, feesPaid, student.totalFees)} disabled={pending <= 0} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${pending <= 0 ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-primary text-primary hover:bg-primary hover:text-white'}`}>
                           {pending <= 0 ? 'Completed' : 'Collect Fee'}
                         </button>
                       </td>
                     </tr>
                   );
                 })
               )}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default FeeManager;
