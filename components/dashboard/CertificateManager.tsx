import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { Certificate, StudentProfile } from '../../types';
import { Award, Lock, CheckCircle, Printer, XCircle, AlertTriangle, FileText, Loader } from 'lucide-react';

const CertificateManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'issued' | 'pending'>('pending');
  const [issuedCerts, setIssuedCerts] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [certs, stds] = await Promise.all([api.getCertificates(), api.getStudents()]);
      setIssuedCerts(certs as any[]);
      setStudents(stds as any[]);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    socket.on('certificate_generated', fetchData);
    socket.on('student_updated', fetchData);
    socket.on('fee_paid', fetchData);
    socket.on('attendance_updated', fetchData);
    return () => {
      socket.off('certificate_generated', fetchData);
      socket.off('student_updated', fetchData);
      socket.off('fee_paid', fetchData);
      socket.off('attendance_updated', fetchData);
    };
  }, []);

  const pendingStudents = students.filter(s => !issuedCerts.some(c => c.studentId === s.id));

  const generateCertificate = async (student: any) => {
    try {
      const res = await api.generateCertificate({
        studentId: student.id,
        courseId: student.courseId,
        generatedBy: 'SuperAdmin'
      });
      alert(`Certificate generated for ${student.name}`);
      if (res && res.certificateId) {
        handleDownload(res.certificateId);
      }
    } catch (err: any) { alert(err.message || 'Failed to generate certificate'); }
  };

  const handleDownload = (certId: string) => {
    window.open(`/api/certificates/download/${certId}`, '_blank');
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white p-8 rounded-xl shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold mb-2">Certificate Authority</h2>
          <p className="opacity-80">Centralized control for issuing tamper-proof credentials.</p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm text-center"><p className="text-3xl font-bold">{issuedCerts.length}</p><p className="text-xs opacity-80 uppercase tracking-wide">Total Issued</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
        <div className="flex border-b border-gray-100 flex-wrap">
          <button className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'pending' ? 'border-accent text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('pending')}>
            Pending Certification <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{pendingStudents.length}</span>
          </button>
          <button className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'issued' ? 'border-accent text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('issued')}>
            Issued History
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'pending' && (
            <div>
              {pendingStudents.length === 0 ? (
                <div className="text-center py-10 text-gray-500"><CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No students currently pending certification.</p></div>
              ) : (
                <div className="space-y-4">
                  {pendingStudents.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4"><img src={student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} className="w-10 h-10 rounded-full" alt="" /><div><p className="font-bold text-gray-800">{student.name}</p><p className="text-xs text-gray-500">{student.rollNumber} • Attendance: {student.attendancePercentage || 0}%</p></div></div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => generateCertificate(student)} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                          <Award className="w-4 h-4" /> Generate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'issued' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <th className="p-3">Certificate ID</th><th className="p-3">Student</th><th className="p-3">Course</th><th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {issuedCerts.map(cert => (
                    <tr key={cert.id}>
                      <td className="p-3 font-mono text-xs">{cert.id}</td><td className="p-3 font-bold">{cert.studentName}</td><td className="p-3">{cert.courseName}</td><td className="p-3 text-gray-500">{cert.issueDate}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${cert.status === 'Valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{cert.status}</span></td>
                      <td className="p-3 text-right flex justify-end gap-2"><button className="text-gray-400 hover:text-primary" title="View Digital Copy"><FileText className="w-4 h-4" /></button><button onClick={() => handleDownload(cert.id)} className="text-gray-400 hover:text-primary" title="Print/Download"><Printer className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateManager;
