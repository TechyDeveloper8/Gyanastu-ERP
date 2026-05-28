import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Check, X, Clock, Lock, Loader } from 'lucide-react';
import { StudentProfile, Batch } from '../../types';

const AttendanceManager: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [markedStudents, setMarkedStudents] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchBatches = async () => {
    try {
      const data: any = await api.getBatches(user?.id);
      setBatches(data);
    } catch (err) { console.error("Failed to load batches", err); }
  };

  useEffect(() => {
    if (user?.id) fetchBatches();
    socket.on('batch_added', fetchBatches);
    return () => { socket.off('batch_added', fetchBatches); };
  }, [user]);

  const fetchStudents = async () => {
    if (!selectedBatchId) return;
    try {
      setLoading(true);
      const allStudents: any = await api.getStudents();
      const batchStudents = allStudents.filter((s: any) => s.batchId === selectedBatchId && s.status === 'Active');
      setStudents(batchStudents);
    } catch (err) { console.error("Failed to load students", err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStudents();
    socket.on('student_added', fetchStudents);
    socket.on('student_updated', fetchStudents);
    return () => {
      socket.off('student_added', fetchStudents);
      socket.off('student_updated', fetchStudents);
    };
  }, [selectedBatchId]);

  const today = new Date().toISOString().split('T')[0];

  const handleMark = (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    if (isSubmitted) return;
    setMarkedStudents(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (Object.keys(markedStudents).length !== students.length) return alert("Please mark attendance for all students before submitting.");
    if (confirm("Confirm submission? This cannot be edited later.")) {
      try {
        setIsSubmitted(true);
        const records = Object.entries(markedStudents).map(([studentId, status]) => ({ studentId, status }));
        await api.markAttendance({ batchId: selectedBatchId, date: today, records, markedBy: user?.id || '' });
        alert("Attendance submitted successfully!");
      } catch (err) {
        setIsSubmitted(false);
        alert("Failed to submit attendance. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-2xl font-heading font-bold text-primary">Daily Attendance</h2><p className="text-gray-500 text-sm">Mark attendance for your assigned batches. Records are locked after submission.</p></div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm"><Calendar className="w-4 h-4 text-accent" /><span className="font-bold text-gray-700">{today}</span><span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Date Locked</span></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Batch</label>
          <select className="w-full md:w-1/3 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" value={selectedBatchId} onChange={(e) => { setSelectedBatchId(e.target.value); setMarkedStudents({}); setIsSubmitted(false); }}>
            <option value="">-- Choose Batch --</option>
            {batches.map(b => (
              <option key={b.id || (b as any)._id} value={b.id || (b as any)._id}>{b.name} ({b.schedule})</option>
            ))}
          </select>
        </div>

        {selectedBatchId ? (
          <div className="overflow-x-auto">
             {loading ? (<div className="p-8 text-center flex justify-center"><Loader className="animate-spin text-primary" /></div>) : students.length === 0 ? (<div className="p-8 text-center text-gray-500">No active students found in this batch.</div>) : (
               <table className="w-full text-left">
                 <thead className="bg-gray-50 border-b border-gray-100">
                   <tr><th className="p-4 text-xs font-bold text-gray-500 uppercase">Student Name</th><th className="p-4 text-xs font-bold text-gray-500 uppercase">Roll No</th><th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Status</th></tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {students.map(student => {
                     const sid = student.id || (student as any)._id;
                     return (
                     <tr key={sid} className="hover:bg-gray-50">
                       <td className="p-4 flex items-center gap-3"><img src={student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} className="w-8 h-8 rounded-full" alt="" /><span className="font-bold text-gray-700">{student.name}</span></td>
                       <td className="p-4 font-mono text-xs text-gray-500">{student.rollNumber}</td>
                       <td className="p-4">
                         <div className="flex justify-center gap-2">
                            <button onClick={() => handleMark(sid, 'Present')} disabled={isSubmitted} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${markedStudents[sid] === 'Present' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><Check className="w-3 h-3" /> Present</button>
                            <button onClick={() => handleMark(sid, 'Absent')} disabled={isSubmitted} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${markedStudents[sid] === 'Absent' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><X className="w-3 h-3" /> Absent</button>
                            <button onClick={() => handleMark(sid, 'Late')} disabled={isSubmitted} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${markedStudents[sid] === 'Late' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><Clock className="w-3 h-3" /> Late</button>
                         </div>
                       </td>
                     </tr>
                   )})}
                 </tbody>
               </table>
             )}
             {students.length > 0 && (
               <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                  {isSubmitted ? (<span className="flex items-center gap-2 text-green-600 font-bold bg-green-100 px-4 py-2 rounded-lg"><Check className="w-4 h-4" /> Attendance Submitted</span>) : (<button onClick={handleSubmit} className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-lg">Submit Attendance Record</button>)}
               </div>
             )}
          </div>
        ) : (<div className="p-12 text-center text-gray-400"><Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />Please select a batch to mark attendance.</div>)}
      </div>
    </div>
  );
};
export default AttendanceManager;
