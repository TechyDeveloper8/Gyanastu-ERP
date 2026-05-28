import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { Award, Lock, CheckCircle, Download, XCircle, Printer, Loader } from 'lucide-react';

const StudentCertificateView: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentsData, coursesData, certData]: any = await Promise.all([
          api.getStudents(),
          api.getCourses(),
          api.getCertificates()
        ]);
        
        const sList = Array.isArray(studentsData) ? studentsData : studentsData.data || [];
        const studentProfile = sList.find((s: any) => s.email === user?.email || s.user?.email === user?.email);
        setProfile(studentProfile);
        
        if (studentProfile) {
          const cList = Array.isArray(coursesData) ? coursesData : coursesData.data || [];
          setCourse(cList.find((c: any) => c.id === studentProfile.courseId || c._id === studentProfile.courseId));
          
          const certList = Array.isArray(certData) ? certData : certData.data || [];
          const sid = studentProfile.id || studentProfile._id;
          setCertificate(certList.find((c: any) => c.student?._id === sid || c.student === sid));
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

  const feesPaid = profile.feesPaid || 0;
  const attendancePercentage = profile.attendancePercentage || 0;

  const requirements = [
    { label: 'Course Completion', met: profile.status === 'Graduated' || profile.status === 'Active' },
    { label: 'Attendance >= 75%', met: attendancePercentage >= 75 },
    { label: 'Fees Cleared', met: profile.totalFees - feesPaid <= 0 },
    { label: 'Final Exam Passed', met: profile.status === 'Graduated' }
  ];

  const isEligible = requirements.every(r => r.met);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-heading font-bold text-primary">Certifications</h2>
        <p className="text-gray-500 text-sm">Track your eligibility and download earned credentials.</p>
      </div>

      {certificate ? (
        // Certificate Issued View
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-4xl mx-auto">
          <div className="bg-green-600 text-white p-6 flex items-center gap-4">
             <Award className="w-12 h-12" />
             <div>
               <h3 className="text-2xl font-heading font-bold">Certificate Issued</h3>
               <p className="opacity-90">Congratulations! You have successfully completed the course.</p>
             </div>
          </div>
          <div className="p-8 md:p-12 relative text-center">
             {/* Decorative Background */}
             <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
             
             <div className="border-8 border-double border-gray-200 p-8 inline-block bg-white shadow-inner max-w-2xl w-full relative z-10">
                <div className="mb-6">
                  <span className="font-heading font-bold text-3xl text-primary tracking-widest uppercase">Certificate</span>
                  <span className="block text-gray-400 text-sm uppercase tracking-widest mt-1">of Completion</span>
                </div>
                
                <p className="text-gray-500 italic mb-4">This is to certify that</p>
                <h2 className="text-3xl font-heading font-bold text-gray-800 mb-4">{profile.name}</h2>
                <p className="text-gray-500 italic mb-6">has successfully completed the training program in</p>
                <h3 className="text-2xl font-bold text-primary mb-8">{course?.title}</h3>

                <div className="flex justify-between items-end text-left mt-12 border-t border-gray-100 pt-6">
                   <div>
                     <p className="text-xs text-gray-400 uppercase font-bold">Date Issued</p>
                     <p className="font-bold text-gray-700">{new Date(certificate.issueDate || certificate.createdAt).toLocaleDateString()}</p>
                   </div>
                   <div className="text-center">
                      <div className="w-20 h-20 bg-gray-100 mx-auto mb-2 flex items-center justify-center">QR</div>
                      <p className="text-[10px] text-gray-400 font-mono">{certificate.certificateNumber || certificate._id}</p>
                   </div>
                   <div className="text-right">
                     <div className="h-10 w-32 border-b border-gray-400 mb-2"></div>
                     <p className="text-xs text-gray-400 uppercase font-bold">Authorized Signatory</p>
                   </div>
                </div>
             </div>

             <div className="mt-8 flex justify-center gap-4">
               <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 flex items-center gap-2">
                 <Download className="w-4 h-4" /> Download PDF
               </button>
               <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-200 flex items-center gap-2">
                 <Printer className="w-4 h-4" /> Print
               </button>
             </div>
          </div>
        </div>
      ) : (
        // Eligibility Tracker
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-400" /> Certificate Locked
              </h3>
              <p className="text-gray-600 mb-8">
                Your certificate for <span className="font-bold text-primary">{course?.title}</span> is not yet available. 
                Please ensure all requirements below are met.
              </p>
              
              <div className="space-y-4">
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                    <span className="text-gray-700 font-medium">{req.label}</span>
                    {req.met ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-blue-50 p-8 rounded-xl border border-blue-100 flex flex-col justify-center items-center text-center">
              <Award className="w-16 h-16 text-blue-300 mb-4" />
              <h3 className="font-bold text-blue-900 text-lg mb-2">Why Certification Matters?</h3>
              <p className="text-blue-800 text-sm mb-6 max-w-xs">
                Gyanastu certificates are industry-recognized and validated. They serve as proof of your skills and dedication to potential employers.
              </p>
              <button className="text-blue-600 font-bold text-sm hover:underline">Read Certification Policy</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentCertificateView;