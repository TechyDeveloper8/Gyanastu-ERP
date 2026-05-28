import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Users, BookOpen, Clock, Calendar, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const FacultyOverview: React.FC = () => {
  const { user } = useAuth();
  
  const [myBatches, setMyBatches] = useState<any[]>([]);
  const [myStudents, setMyStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceAlert, setAttendanceAlert] = useState<string | null>(null);
  const [latestMaterial, setLatestMaterial] = useState<any>(null);

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

        const materialsData: any = await api.getMaterials();
        const mList = Array.isArray(materialsData) ? materialsData : materialsData.data || [];
        const myBatchIds = b.map((batch: any) => batch.id || batch._id);
        const relevantMaterials = mList.filter((mat: any) => {
          const mBatchId = mat.batch?.id || mat.batch?._id || mat.batch;
          return myBatchIds.includes(mBatchId);
        });
        if (relevantMaterials.length > 0) setLatestMaterial(relevantMaterials[0]);

        const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        const todaysCls = b.filter((batch: any) => batch.schedule?.includes(todayStr));
        if (todaysCls.length > 0) {
          const batchId = todaysCls[0].id || todaysCls[0]._id;
          const todayIso = new Date().toISOString().split('T')[0];
          const att: any = await api.getAttendance({ batchId, date: todayIso });
          const atts = Array.isArray(att) ? att : att.data || [];
          if (atts.length === 0) setAttendanceAlert(`You haven't marked attendance for ${todaysCls[0].name} yet.`);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    
    if (user?.id) fetchFacultyData();
  }, [user]);

  if (loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const todaysClasses = myBatches.filter(b => b.schedule?.includes(today));

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
         <h2 className="text-2xl font-heading font-bold text-primary">Academic Dashboard</h2>
         <p className="text-gray-500">Overview of your assigned batches and today's schedule.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><Users /></div>
           <div>
             <p className="text-gray-500 text-xs uppercase font-bold">Total Students</p>
             <h3 className="text-2xl font-bold">{myStudents.length}</h3>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="bg-purple-100 p-3 rounded-lg text-purple-600"><BookOpen /></div>
           <div>
             <p className="text-gray-500 text-xs uppercase font-bold">Active Batches</p>
             <h3 className="text-2xl font-bold">{myBatches.length}</h3>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="bg-orange-100 p-3 rounded-lg text-orange-600"><Calendar /></div>
           <div>
             <p className="text-gray-500 text-xs uppercase font-bold">Today's Classes</p>
             <h3 className="text-2xl font-bold">{todaysClasses.length}</h3>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Schedule Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Today's Schedule
          </h3>
          {todaysClasses.length > 0 ? (
            <div className="space-y-3">
              {todaysClasses.map(batch => (
                <div key={batch.id} className="p-3 border-l-4 border-accent bg-gray-50 rounded-r-lg flex justify-between items-center">
                   <div>
                     <p className="font-bold text-gray-800">{batch.name}</p>
                     <p className="text-xs text-gray-500">{batch.schedule}</p>
                   </div>
                   <span className="bg-white px-3 py-1 rounded text-xs font-bold shadow-sm text-gray-600">Upcoming</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg">
               No classes scheduled for today.
            </div>
          )}
        </div>

        {/* Alerts / Notices */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" /> Academic Alerts
          </h3>
          <div className="space-y-3">
            {attendanceAlert && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-sm text-red-800">
                 <span className="font-bold block">Attendance Pending</span>
                 {attendanceAlert}
              </div>
            )}
            {!attendanceAlert && todaysClasses.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-100 text-sm text-green-800">
                 <span className="font-bold block">Attendance Completed</span>
                 You have marked attendance for today's batches.
              </div>
            )}
            {latestMaterial && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
                 <span className="font-bold block">Recent Upload</span>
                 You recently added "{latestMaterial.title}" to {latestMaterial.batch?.name || 'a batch'}.
              </div>
            )}
            {!latestMaterial && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600">
                 No recent study material uploads.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyOverview;