import React, { useState, useEffect } from 'react';
import { StudentProfile, Course, Batch } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, MapPin, Shield, Edit2, Loader } from 'lucide-react';
import { api } from '../../services/api';

const StudentProfileView: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [students, courses, batches] = await Promise.all([
          api.getStudents(),
          api.getCourses(),
          api.getBatches()
        ]);
        
        const myProfile = (students as StudentProfile[]).find(s => s.email === user?.email);
        if (myProfile) {
          setProfile(myProfile);
          setCourse((courses as Course[]).find(c => c.id === myProfile.courseId) || null);
          setBatch((batches as Batch[]).find(b => b.id === myProfile.batchId) || null);
        }
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.email) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return <div className="text-center p-8 text-gray-500">Student profile not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         {/* Cover */}
         <div className="h-32 bg-primary"></div>
         
         <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="flex items-end gap-6">
                 <img src={profile.avatarUrl} alt={profile.name} className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-100" />
                 <div className="mb-1">
                   <h1 className="text-2xl font-bold text-gray-800">{profile.name}</h1>
                   <p className="text-gray-500">{profile.email}</p>
                 </div>
              </div>
              <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {/* Left: Personal Details */}
               <div className="space-y-6">
                  <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">Personal Information</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Phone Number</p>
                        <p className="text-gray-800">{profile.phone || 'Not Provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Address</p>
                        <p className="text-gray-800">{profile.address || 'Not Provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Email</p>
                        <p className="text-gray-800">{profile.email}</p>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Right: Academic Details (Locked) */}
               <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-6 relative">
                  <div className="absolute top-4 right-4 text-gray-300" title="Managed by Admin">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-800 border-b border-gray-200 pb-2">Academic Record</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <p className="text-xs text-gray-500 font-bold uppercase">Roll Number</p>
                       <p className="font-mono text-primary font-bold">{profile.rollNumber}</p>
                    </div>
                    <div>
                       <p className="text-xs text-gray-500 font-bold uppercase">Status</p>
                       <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mt-1 ${profile.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                         {profile.status}
                       </span>
                    </div>
                    <div>
                       <p className="text-xs text-gray-500 font-bold uppercase">Course</p>
                       <p className="text-gray-800 text-sm">{course?.title}</p>
                    </div>
                    <div>
                       <p className="text-xs text-gray-500 font-bold uppercase">Batch</p>
                       <p className="text-gray-800 text-sm">{batch?.name || 'Unassigned'}</p>
                    </div>
                    <div>
                       <p className="text-xs text-gray-500 font-bold uppercase">Admission Date</p>
                       <p className="text-gray-800 text-sm">{profile.admissionDate}</p>
                    </div>
                    <div>
                       <p className="text-xs text-gray-500 font-bold uppercase">Franchise</p>
                       <p className="text-gray-800 text-sm">Delhi South</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 italic mt-4 text-center">
                    To update academic details, please contact franchise administration.
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StudentProfileView;