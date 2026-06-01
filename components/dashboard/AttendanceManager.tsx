import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Check, X, Clock, Lock, Loader, AlertCircle, LogOut } from 'lucide-react';
import { Batch } from '../../types';

const AttendanceManager: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [markedStudents, setMarkedStudents] = useState<Record<string, {status: 'Present' | 'Absent' | 'Late' | 'Leave', remarks?: string}>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBatches = async () => {
    try {
      const data: any = await api.getBatches(
        user?.role === 'FRANCHISE_ADMIN' ? user?.franchiseId : undefined,
        user?.role === 'FACULTY' ? user?.id : undefined
      );
      setBatches(data);
    } catch (err) { console.error("Failed to load batches", err); }
  };

  useEffect(() => {
    if (user?.id) fetchBatches();
    socket.on('batch_added', fetchBatches);
    return () => { socket.off('batch_added', fetchBatches); };
  }, [user]);

  const loadAttendanceData = async () => {
    if (!selectedBatchId || !selectedDate) return;
    try {
      setLoading(true);
      // 1. Fetch all students in the batch
      const batchStudents = (await api.getBatchStudents(selectedBatchId)) as any[];
      setStudents(batchStudents);
      
      // 2. Fetch existing attendance for this batch on this date
      const existingRecords: any = await api.getAttendance({ batchId: selectedBatchId, date: selectedDate });
      
      const newMarked: Record<string, any> = {};
      let hasSubmitted = false;
      
      if (existingRecords && existingRecords.length > 0) {
        hasSubmitted = true;
        existingRecords.forEach((r: any) => {
           newMarked[r.studentId] = { status: r.status, remarks: r.remarks || '' };
        });
      } else {
        // Default all to Present
        batchStudents.forEach((s: any) => {
          newMarked[s.studentId] = { status: 'Present', remarks: '' };
        });
      }
      
      setMarkedStudents(newMarked);
      setIsSubmitted(hasSubmitted);
    } catch (err) {
      console.error("Failed to load attendance data", err);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedBatchId, selectedDate]);

  const handleMark = (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Leave') => {
    if (isSubmitted) return;
    setMarkedStudents(prev => ({ 
      ...prev, 
      [studentId]: { ...prev[studentId], status } 
    }));
  };
  
  const handleRemarks = (studentId: string, remarks: string) => {
    if (isSubmitted) return;
    setMarkedStudents(prev => ({ 
      ...prev, 
      [studentId]: { ...prev[studentId], remarks } 
    }));
  };

  const markAll = (status: 'Present' | 'Absent' | 'Late' | 'Leave') => {
    if (isSubmitted) return;
    const newMarked = { ...markedStudents };
    students.forEach(s => {
      newMarked[s.studentId] = { ...newMarked[s.studentId], status };
    });
    setMarkedStudents(newMarked);
  };

  const handleSubmit = async () => {
    if (Object.keys(markedStudents).length !== students.length) {
      return alert("Please ensure all students have an attendance status.");
    }
    
    if (confirm(`Are you sure you want to save attendance for ${selectedDate}?`)) {
      try {
        setSaving(true);
        const records = Object.entries(markedStudents).map(([studentId, data]: [string, any]) => ({ 
          studentId, 
          status: data.status,
          remarks: data.remarks
        }));
        
        await api.markAttendance({ 
          batchId: selectedBatchId, 
          date: selectedDate, 
          records
        });
        
        setIsSubmitted(true);
        alert("Attendance saved successfully!");
      } catch (err: any) {
        alert(err.message || "Failed to save attendance.");
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary">Mark Attendance</h2>
          <p className="text-gray-500 text-sm mt-1">Select a batch and date to record student attendance.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Batch</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
              value={selectedBatchId} 
              onChange={(e) => setSelectedBatchId(e.target.value)}
            >
              <option value="">-- Choose Batch --</option>
              {batches.filter(b => b.status === 'Active').map(b => (
                <option key={b.id} value={b.id}>{b.batchName} ({b.timing})</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Date</label>
            <input 
              type="date"
              max={new Date().toISOString().split('T')[0]} // Cannot mark future attendance
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {selectedBatchId && selectedDate ? (
          <div className="overflow-x-auto">
             {loading ? (
               <div className="p-12 text-center flex flex-col items-center justify-center">
                 <Loader className="w-8 h-8 animate-spin text-primary mb-4" />
                 <p className="text-gray-500">Loading student records...</p>
               </div>
             ) : students.length === 0 ? (
               <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                 <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
                 No students found allocated to this batch.
               </div>
             ) : (
               <>
                 <div className="p-4 bg-gray-50 flex justify-between items-center border-b border-gray-200">
                   <div className="text-sm font-bold text-gray-600">Total Students: {students.length}</div>
                   {!isSubmitted && (
                     <div className="flex gap-2">
                       <button onClick={() => markAll('Present')} className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors">Mark All Present</button>
                       <button onClick={() => markAll('Absent')} className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">Mark All Absent</button>
                     </div>
                   )}
                 </div>
                 
                 <table className="w-full text-left">
                   <thead className="bg-white border-b border-gray-200">
                     <tr>
                       <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                       <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                       <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks (Optional)</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {students.map(student => {
                       const sid = student.studentId;
                       const status = markedStudents[sid]?.status || 'Present';
                       const remarks = markedStudents[sid]?.remarks || '';
                       
                       return (
                       <tr key={sid} className="hover:bg-gray-50 transition-colors">
                         <td className="p-4">
                           <div className="font-bold text-gray-900">{student.name}</div>
                           <div className="text-xs text-gray-500">{student.phone}</div>
                         </td>
                         <td className="p-4">
                           <div className="flex justify-center gap-1.5">
                              <button onClick={() => handleMark(sid, 'Present')} disabled={isSubmitted} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${status === 'Present' ? 'bg-green-500 text-white shadow-md shadow-green-500/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><Check className="w-3 h-3" /> Present</button>
                              <button onClick={() => handleMark(sid, 'Absent')} disabled={isSubmitted} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${status === 'Absent' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><X className="w-3 h-3" /> Absent</button>
                              <button onClick={() => handleMark(sid, 'Late')} disabled={isSubmitted} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${status === 'Late' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><Clock className="w-3 h-3" /> Late</button>
                              <button onClick={() => handleMark(sid, 'Leave')} disabled={isSubmitted} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${status === 'Leave' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><LogOut className="w-3 h-3" /> Leave</button>
                           </div>
                         </td>
                         <td className="p-4">
                           <input 
                             type="text" 
                             placeholder="Add note..."
                             value={remarks}
                             onChange={(e) => handleRemarks(sid, e.target.value)}
                             disabled={isSubmitted}
                             className="w-full text-sm border-gray-200 rounded p-1.5 border focus:border-primary outline-none disabled:bg-gray-50 disabled:text-gray-500"
                           />
                         </td>
                       </tr>
                     )})}
                   </tbody>
                 </table>
                 
                 <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    {isSubmitted ? (
                      <>
                        <div className="flex items-center gap-2 text-green-600 font-bold bg-green-100 px-4 py-2 rounded-lg border border-green-200">
                          <Check className="w-5 h-5" /> 
                          Attendance Saved for {selectedDate}
                        </div>
                        <button onClick={() => setIsSubmitted(false)} className="text-sm font-bold text-accent hover:underline">
                          Edit Attendance
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-gray-500">
                          Ensure all student statuses are correct before saving.
                        </div>
                        <button 
                          onClick={handleSubmit} 
                          disabled={saving}
                          className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-lg flex items-center gap-2 disabled:opacity-70"
                        >
                          {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                          {saving ? 'Saving...' : 'Save Attendance'}
                        </button>
                      </>
                    )}
                 </div>
               </>
             )}
          </div>
        ) : (
          <div className="p-16 text-center text-gray-400 flex flex-col items-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <h3 className="text-lg font-bold text-gray-700 mb-1">No Batch Selected</h3>
            <p>Please select a batch and date above to load the attendance sheet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceManager;
