import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Users, Book, Award, ArrowRight, Loader } from 'lucide-react';

const MyBatches: React.FC = () => {
  const { user } = useAuth();
  const [myBatches, setMyBatches] = useState<any[]>([]);
  const [myStudents, setMyStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        const [batchesData, studentsData]: any = await Promise.all([
          api.getBatches(user?.id),
          api.getStudents() 
        ]);
        
        const b = Array.isArray(batchesData) ? batchesData : batchesData.data || [];
        setMyBatches(b);
        
        const s = Array.isArray(studentsData) ? studentsData : studentsData.data || [];
        setMyStudents(s.filter((stu: any) => b.some((batch: any) => batch.id === stu.batchId)));
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    
    if (user?.id) fetchFacultyData();
  }, [user]);

  if (loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
       <div>
         <h2 className="text-2xl font-heading font-bold text-primary">My Batches</h2>
         <p className="text-gray-500 text-sm">Overview of assigned student groups and academic progress.</p>
       </div>

        <div className="grid grid-cols-1 gap-6">
         {myBatches.length === 0 ? (
           <div className="p-10 text-center text-gray-500 bg-white rounded-xl shadow-sm">No batches assigned yet.</div>
         ) : myBatches.map(batch => {
           const batchStudents = myStudents.filter(s => s.batchId === batch.id);
           const avgAttendance = batchStudents.length > 0 
              ? Math.round(batchStudents.reduce((acc, s) => acc + s.attendancePercentage, 0) / batchStudents.length) 
              : 0;

           return (
             <div key={batch.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                 <div>
                   <h3 className="text-lg font-bold text-primary">{batch.name}</h3>
                   <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                     <span className="flex items-center gap-1"><Book className="w-4 h-4" /> Full Stack Web Dev</span>
                     <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {batchStudents.length} Students</span>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-xs text-gray-500 font-bold uppercase">Avg. Attendance</p>
                   <p className={`text-xl font-bold ${avgAttendance >= 75 ? 'text-green-600' : 'text-orange-500'}`}>{avgAttendance}%</p>
                 </div>
               </div>
               
               <div className="p-6">
                 <h4 className="text-sm font-bold text-gray-700 mb-4">Student Roster</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {batchStudents.map(student => (
                     <div key={student.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer group">
                       <div className="flex items-center gap-3">
                         <img src={student.avatarUrl} className="w-8 h-8 rounded-full" alt="" />
                         <div>
                           <p className="font-bold text-gray-800 text-sm group-hover:text-primary">{student.name}</p>
                           <p className="text-xs text-gray-500">Roll: {student.rollNumber}</p>
                         </div>
                       </div>
                       
                       <div className="text-right">
                         {student.attendancePercentage < 75 && (
                           <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">Low Att.</span>
                         )}
                       </div>
                     </div>
                   ))}
                   {batchStudents.length === 0 && (
                     <p className="text-gray-400 text-sm col-span-full">No students assigned to this batch yet.</p>
                   )}
                 </div>
               </div>
             </div>
           );
         })}
       </div>
    </div>
  );
};

export default MyBatches;