import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { Users, DollarSign, BookOpen, AlertCircle, TrendingUp, Clock, Loader } from 'lucide-react';
import { Franchise, StudentProfile } from '../../types';

interface FranchiseOverviewProps {
  franchiseId: string;
}

const FranchiseOverview: React.FC<FranchiseOverviewProps> = ({ franchiseId }) => {
  const [franchise, setFranchise] = useState<any>(null);
  const [myStudents, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [franData, stuData]: any = await Promise.all([
        api.getFranchises(),
        api.getStudents(franchiseId)
      ]);
      const fList = Array.isArray(franData) ? franData : franData.data || [];
      setFranchise(fList.find((f: any) => f.id === franchiseId || f._id === franchiseId) || { name: 'Franchise', location: 'Unknown', status: 'Active' });
      setStudents(Array.isArray(stuData) ? stuData : stuData.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    socket.on('student_added', fetchData);
    socket.on('fee_paid', fetchData);
    socket.on('franchise_updated', fetchData);
    return () => {
      socket.off('student_added', fetchData);
      socket.off('fee_paid', fetchData);
      socket.off('franchise_updated', fetchData);
    };
  }, [franchiseId]);

  if (loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;

  const activeStudents = myStudents.filter(s => s.status === 'Active').length;
  const pendingStudents = myStudents.filter(s => s.status === 'Pending').length;
  const totalRevenue = myStudents.reduce((acc, curr) => acc + (curr.feesPaid || 0), 0);
  const pendingFees = myStudents.reduce((acc, curr) => acc + (curr.totalFees - (curr.feesPaid || 0)), 0);

  // Active Courses could be calculated by taking unique courseIds from students
  const activeCoursesSet = new Set(myStudents.map(s => s.courseId).filter(Boolean));
  const activeCoursesCount = activeCoursesSet.size;

  const avgAttendance = myStudents.length ? Math.round(myStudents.reduce((acc, curr) => acc + (curr.attendancePercentage || 0), 0) / myStudents.length) : 0;
  const courseCompletionRate = myStudents.length ? Math.round(myStudents.filter(s => s.status === 'Graduated').length / myStudents.length * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary">{franchise.name}</h2>
          <p className="text-gray-500">Operational Dashboard • {franchise.location}</p>
        </div>
        <div className={`px-4 py-2 rounded-lg font-bold text-sm ${franchise.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          Status: {franchise.status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-blue-500 group-hover:w-2 transition-all"></div>
          <div className="flex items-center gap-4">
             <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><Users /></div>
             <div>
               <p className="text-gray-500 text-xs uppercase font-bold">Total Strength</p>
               <h3 className="text-2xl font-bold">{myStudents.length}</h3>
             </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 flex gap-2">
            <span className="text-green-600 font-bold">{activeStudents} Active</span>
            <span className="text-orange-500 font-bold">{pendingStudents} Pending</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-green-500 group-hover:w-2 transition-all"></div>
          <div className="flex items-center gap-4">
             <div className="bg-green-100 p-3 rounded-lg text-green-600"><DollarSign /></div>
             <div>
               <p className="text-gray-500 text-xs uppercase font-bold">Revenue collected</p>
               <h3 className="text-2xl font-bold">₹{(totalRevenue/100000).toFixed(2)}L</h3>
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-red-500 group-hover:w-2 transition-all"></div>
          <div className="flex items-center gap-4">
             <div className="bg-red-100 p-3 rounded-lg text-red-600"><AlertCircle /></div>
             <div>
               <p className="text-gray-500 text-xs uppercase font-bold">Pending Dues</p>
               <h3 className="text-2xl font-bold text-red-600">₹{(pendingFees/1000).toFixed(1)}k</h3>
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-purple-500 group-hover:w-2 transition-all"></div>
          <div className="flex items-center gap-4">
             <div className="bg-purple-100 p-3 rounded-lg text-purple-600"><BookOpen /></div>
             <div>
               <p className="text-gray-500 text-xs uppercase font-bold">Active Courses</p>
               <h3 className="text-2xl font-bold">{activeCoursesCount}</h3>
             </div>
          </div>
        </div>
      </div>

      {/* Operational Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Performance Insights
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
               <span className="text-sm text-gray-600">Avg. Attendance</span>
               <span className={`font-bold ${avgAttendance >= 75 ? 'text-green-600' : 'text-orange-600'}`}>{avgAttendance}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
               <span className="text-sm text-gray-600">Course Completion Rate</span>
               <span className="font-bold text-blue-600">{courseCompletionRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" /> Pending Actions
          </h3>
          <div className="space-y-3">
            {pendingStudents > 0 ? (
               <div className="flex items-center gap-3 p-3 bg-orange-50 text-orange-800 rounded-lg border border-orange-100">
                 <AlertCircle className="w-5 h-5 flex-shrink-0" />
                 <div>
                   <p className="font-bold text-sm">Verification Pending</p>
                   <p className="text-xs">{pendingStudents} student profiles waiting for HQ approval.</p>
                 </div>
               </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">
                No pending actions. Great job!
              </div>
            )}
             {pendingFees > 0 && (
               <div className="flex items-center gap-3 p-3 bg-red-50 text-red-800 rounded-lg border border-red-100">
                 <DollarSign className="w-5 h-5 flex-shrink-0" />
                 <div>
                   <p className="font-bold text-sm">Fee Collection</p>
                   <p className="text-xs">Follow up on ₹{pendingFees} outstanding dues.</p>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FranchiseOverview;