import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { BookOpen, Calendar, DollarSign, Award, Clock, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StudentOverview: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [myCourse, setMyCourse] = useState<any>(null);
  const [myBatch, setMyBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentsData, coursesData, batchesData]: any = await Promise.all([
          api.getStudents(),
          api.getCourses(),
          api.getBatches()
        ]);
        
        const sList = Array.isArray(studentsData) ? studentsData : studentsData.data || [];
        const studentProfile = sList.find((s: any) => s.email === user?.email || s.user?.email === user?.email);
        setProfile(studentProfile);
        
        if (studentProfile) {
          const cList = Array.isArray(coursesData) ? coursesData : coursesData.data || [];
          setMyCourse(cList.find((c: any) => c.id === studentProfile.courseId || c._id === studentProfile.courseId));
          const bList = Array.isArray(batchesData) ? batchesData : batchesData.data || [];
          const batchInfo = bList.find((b: any) => b.id === studentProfile.batchId || b._id === studentProfile.batchId);
          setMyBatch(batchInfo);
          
          if (batchInfo) {
            const mats: any = await api.getMaterials(batchInfo.id || batchInfo._id);
            setMaterials(Array.isArray(mats) ? mats : mats.data || []);
          }
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (user?.email) {
      fetchData();
      socket.on('course_updated', fetchData);
      socket.on('course_deleted', fetchData);
    }
    return () => {
      socket.off('course_updated', fetchData);
      socket.off('course_deleted', fetchData);
    };
  }, [user]);

  if (loading || !profile) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;

  const feesPending = profile.totalFees - (profile.feesPaid || 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
          <BookOpen className="w-64 h-64" />
        </div>
        <div className="relative z-10">
           <h2 className="text-3xl font-heading font-bold mb-2">Welcome back, {profile.name.split(' ')[0]}!</h2>
           <p className="text-blue-100 max-w-xl">You are making great progress in <span className="font-bold text-white">{myCourse?.title}</span>. Keep up the momentum!</p>
           
           <div className="flex flex-wrap gap-4 mt-6">
             <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
               <span className="text-xs text-blue-200 block uppercase font-bold">Roll Number</span>
               <span className="font-mono font-bold">{profile.rollNumber}</span>
             </div>
             <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
               <span className="text-xs text-blue-200 block uppercase font-bold">Current Batch</span>
               <span className="font-bold">{myBatch?.name || 'Unassigned'}</span>
             </div>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Calendar className="w-6 h-6" /></div>
             <span className={`text-xs font-bold px-2 py-1 rounded ${profile.attendancePercentage >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
               {profile.attendancePercentage >= 75 ? 'Good' : 'Low'}
             </span>
           </div>
           <div>
             <h3 className="text-2xl font-bold text-gray-800">{profile.attendancePercentage}%</h3>
             <p className="text-xs text-gray-500 font-bold uppercase">Attendance</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><BookOpen className="w-6 h-6" /></div>
             <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700">Available</span>
           </div>
           <div>
             <h3 className="text-2xl font-bold text-gray-800">{materials.length}</h3>
             <p className="text-xs text-gray-500 font-bold uppercase">Study Materials</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-green-100 text-green-600 rounded-lg"><DollarSign className="w-6 h-6" /></div>
             {feesPending > 0 ? (
               <span className="text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700">Payment Due</span>
             ) : (
               <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">Paid</span>
             )}
           </div>
           <div>
             <h3 className="text-2xl font-bold text-gray-800">₹{feesPending.toLocaleString()}</h3>
             <p className="text-xs text-gray-500 font-bold uppercase">Outstanding Fees</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Award className="w-6 h-6" /></div>
             <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600">
               {profile.status}
             </span>
           </div>
           <div>
             <h3 className="text-lg font-bold text-gray-800 truncate">{profile.status === 'Graduated' ? 'Certified' : 'In Progress'}</h3>
             <p className="text-xs text-gray-500 font-bold uppercase">Certificate Status</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts / Notices */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" /> Latest Updates
          </h3>
          <div className="space-y-4">
             {profile.status === 'Pending' && (
               <div className="flex gap-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                 <div className="mt-1"><Clock className="w-5 h-5 text-orange-600" /></div>
                 <div>
                   <h4 className="font-bold text-orange-800 text-sm">Admission Verification Pending</h4>
                   <p className="text-sm text-gray-600 mt-1">Your admission request is currently under review by the Head Office. Course access will be enabled shortly.</p>
                 </div>
               </div>
             )}
             
             {feesPending > 0 && (
               <div className="flex gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
                 <div className="mt-1"><DollarSign className="w-5 h-5 text-red-600" /></div>
                 <div>
                   <h4 className="font-bold text-red-800 text-sm">Fee Payment Reminder</h4>
                   <p className="text-sm text-gray-600 mt-1">You have pending dues of ₹{feesPending}. Please clear them to avoid restricted access to exam modules.</p>
                 </div>
               </div>
             )}

             <div className="flex gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="mt-1"><CheckCircle className="w-5 h-5 text-blue-600" /></div>
                <div>
                   <h4 className="font-bold text-blue-800 text-sm">Study Materials</h4>
                   <p className="text-sm text-gray-600 mt-1">
                     {materials.length > 0 
                      ? `Latest: "${materials[0].title}" added recently to your course.`
                      : 'No study materials uploaded for your batch yet.'}
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
           <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Class Schedule
          </h3>
          {myBatch ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                 <span className="text-xs text-gray-500 uppercase font-bold block mb-2">Batch Timing</span>
                 <p className="font-bold text-lg text-primary">{myBatch.schedule}</p>
                 <p className="text-sm text-gray-600 mt-1">{myBatch.name}</p>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Classes are held {myBatch.schedule.includes('Mon') ? 'Online/Offline' : 'Online'} as per franchise guidelines.
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
               No batch assigned yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;