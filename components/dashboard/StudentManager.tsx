import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { Search, Eye, Edit2, Plus, X, CheckCircle, ShieldAlert, Loader, ArrowLeftRight, UserCheck, Trash2 } from 'lucide-react';
import { UserRole, StudentProfile } from '../../types';
import DeleteConfirmationModal from '../DeleteConfirmationModal';

interface StudentManagerProps {
  userRole: UserRole;
  franchiseId?: string;
}

const StudentManager: React.FC<StudentManagerProps> = ({ userRole, franchiseId }) => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [newCredentials, setNewCredentials] = useState<{ username: string, password: string } | null>(null);

  const [newStudent, setNewStudent] = useState({
    name: '', email: '', courseId: '', batchId: '', feesTotal: '', phone: '', address: '', guardianName: '', aadhaarNumber: '', franchiseName: '', bloodGroup: ''
  });
  const [studentPhoto, setStudentPhoto] = useState<File | null>(null);

  const fetchStudentsAndCourses = async () => {
    try {
      setLoading(true);
      const [resStudents, resCourses, resFranchises, resBatches]: any = await Promise.all([
        api.getStudents(franchiseId),
        api.getCourses(),
        userRole === UserRole.SUPER_ADMIN ? api.getFranchises() : Promise.resolve([]),
        api.getBatches(franchiseId)
      ]);
      setStudents(Array.isArray(resStudents) ? resStudents : resStudents.data || []);

      const courseList = Array.isArray(resCourses) ? resCourses : [];
      setCourses(courseList);

      const franchiseList = Array.isArray(resFranchises) ? resFranchises : resFranchises.data || [];
      setFranchises(franchiseList);

      const batchList = Array.isArray(resBatches) ? resBatches : [];
      setBatches(batchList);

      if (courseList.length > 0 && !newStudent.courseId) {
        setNewStudent(prev => ({ ...prev, courseId: courseList[0]._id || courseList[0].id }));
      }
    } catch (err) {
      setError('Failed to load students. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsAndCourses();
    socket.on('student_added', fetchStudentsAndCourses);
    socket.on('student_updated', fetchStudentsAndCourses);
    socket.on('student_deleted', fetchStudentsAndCourses);
    socket.on('course_added', fetchStudentsAndCourses);
    socket.on('course_updated', fetchStudentsAndCourses);
    socket.on('course_deleted', fetchStudentsAndCourses);
    return () => {
      socket.off('student_added', fetchStudentsAndCourses);
      socket.off('student_updated', fetchStudentsAndCourses);
      socket.off('student_deleted', fetchStudentsAndCourses);
      socket.off('course_added', fetchStudentsAndCourses);
      socket.off('course_updated', fetchStudentsAndCourses);
      socket.off('course_deleted', fetchStudentsAndCourses);
    };
  }, [franchiseId]);

  const filteredStudents = students.filter(s => {
    return s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.courseId) return alert('Please select a course.');
    try {
      const formData = new FormData();
      formData.append('name', newStudent.name);
      formData.append('email', newStudent.email);
      formData.append('courseId', newStudent.courseId);
      if (newStudent.batchId) formData.append('batchId', newStudent.batchId);
      formData.append('totalFees', newStudent.feesTotal.toString());
      formData.append('phone', newStudent.phone);
      formData.append('address', newStudent.address);
      formData.append('guardianName', newStudent.guardianName);
      formData.append('aadhaarNumber', newStudent.aadhaarNumber);
      formData.append('franchiseName', newStudent.franchiseName);
      formData.append('bloodGroup', newStudent.bloodGroup);
      if (franchiseId) formData.append('franchiseId', franchiseId);
      formData.append('role', UserRole.STUDENT);
      formData.append('status', userRole === UserRole.SUPER_ADMIN ? 'Active' : 'Pending');
      if (studentPhoto) formData.append('studentPhoto', studentPhoto);

      const response: any = await api.createStudent(formData);
      if (response && response.generatedUsername) {
        setNewCredentials({ username: response.generatedUsername, password: response.generatedPassword });
      } else {
        setIsAddModalOpen(false);
      }
      setNewStudent({ name: '', email: '', courseId: courses.length > 0 ? (courses[0]._id || courses[0].id) : '', batchId: '', feesTotal: 45000, phone: '', address: '', guardianName: '', aadhaarNumber: '', franchiseName: '', bloodGroup: '' });
      setStudentPhoto(null);
    } catch (err: any) { alert(err.message || 'Failed to create student'); }
  };

  const handleVerifyStudent = async (id: string) => {
    if (window.confirm('GOVERNANCE CHECK: Verify documents and approve admission? This generates a permanent Roll Number.')) {
      try {
        const updatedData = {
          status: 'Active' as const,
          rollNumber: `GYAN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        };
        await api.updateStudent(id, updatedData);
      } catch (err) { alert('Failed to verify student'); }
    }
  };

  const handleDeleteClick = (id: string) => {
    setStudentToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await api.deleteStudent(studentToDelete);
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    } catch (err) { alert('Failed to delete student'); }
  };

  const handleTransfer = (id: string) => {
    if (userRole !== UserRole.SUPER_ADMIN) return;
    const targetFranchise = prompt("Enter Target Franchise ID to transfer student:");
    if (targetFranchise) { alert(`Transfer request initiated for student ${id} to Franchise ${targetFranchise}.`); }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;
  if (error) return <div className="p-10 text-red-500 text-center">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div><h2 className="text-lg font-heading font-bold text-primary">Student Directory</h2><p className="text-sm text-gray-500">Manage admissions, verify docs, and handle transfers.</p></div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search Name or Roll No" className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            {userRole === UserRole.FRANCHISE_ADMIN && (<button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex items-center gap-2"><Plus className="w-4 h-4" /> Add Student</button>)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Student</th><th className="p-4 font-bold">Roll No</th><th className="p-4 font-bold">Course / Franchise</th><th className="p-4 font-bold">Status</th><th className="p-4 font-bold">Attendance</th><th className="p-4 font-bold">Fees Due</th><th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredStudents.length === 0 ? (<tr><td colSpan={6} className="p-8 text-center text-gray-500">No students found.</td></tr>) : (
                filteredStudents.map(student => {
                  const sid = student.id || (student as any).userId;
                  const feeDue = (student.totalFees || 0) - (student.feesPaid || 0);
                  return (
                    <tr key={sid} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4"><div className="flex items-center gap-3"><img src={student.avatarUrl || 'https://placehold.co/40x40'} alt="" className="w-8 h-8 rounded-full bg-gray-100" /><div><p className="font-bold text-gray-800">{student.name}</p><p className="text-xs text-gray-500">{student.email}</p></div></div></td>
                      <td className="p-4 font-mono text-gray-600">{student.rollNumber || 'N/A'}</td>
                      <td className="p-4">
                        <p className="font-bold text-gray-800">{(student as any).courseName || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{(student as any).franchiseName || 'N/A'}</p>
                      </td>
                      <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1 ${student.status === 'Active' ? 'bg-green-100 text-green-700' : student.status === 'Pending' ? 'bg-orange-100 text-orange-700' : student.status === 'Graduated' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{student.status === 'Pending' && <Loader className="w-3 h-3 animate-spin" />}{student.status}</span></td>
                      <td className="p-4"><div className="flex items-center gap-2"><div className="w-16 bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${student.attendancePercentage < 75 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${student.attendancePercentage || 0}%` }}></div></div><span className="text-xs font-bold">{student.attendancePercentage || 0}%</span></div></td>
                      <td className="p-4">{feeDue > 0 ? (<span className="text-red-600 font-bold">₹{feeDue.toLocaleString()}</span>) : (<span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {student.status === 'Pending' && userRole === UserRole.SUPER_ADMIN ? (
                            <button onClick={() => handleVerifyStudent(sid)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 flex items-center gap-1 shadow-sm"><UserCheck className="w-3 h-3" /> Verify</button>
                          ) : (
                            <>
                              <button className="text-gray-400 hover:text-primary p-1 border border-transparent hover:border-gray-200 rounded" title="View Profile"><Eye className="w-4 h-4" /></button>
                              {userRole === UserRole.SUPER_ADMIN && (<><button onClick={() => handleTransfer(sid)} className="text-gray-400 hover:text-blue-600 p-1 border border-transparent hover:border-gray-200 rounded" title="Transfer Franchise"><ArrowLeftRight className="w-4 h-4" /></button><button onClick={() => handleDeleteClick(sid)} className="text-gray-400 hover:text-red-500 p-1 border border-transparent hover:border-gray-200 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button></>)}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }))}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Student Record"
      />

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-heading font-bold text-lg text-primary">
                {newCredentials ? 'Credentials Generated' : 'New Student Admission'}
              </h3>
              <button onClick={() => { setIsAddModalOpen(false); setNewCredentials(null); }} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
            </div>

            {newCredentials ? (
              <div className="p-6 space-y-4 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-gray-800">Student Created!</h4>
                <p className="text-sm text-gray-500">Please share these credentials with the student. They will only be shown once.</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4 text-left space-y-3">
                  <div><p className="text-xs text-gray-500 font-bold uppercase">Username</p><p className="font-mono text-lg text-primary">{newCredentials.username}</p></div>
                  <div><p className="text-xs text-gray-500 font-bold uppercase">Password</p><p className="font-mono text-lg text-primary">{newCredentials.password}</p></div>
                </div>
                <button onClick={() => { setIsAddModalOpen(false); setNewCredentials(null); }} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 mt-6">Done</button>
              </div>
            ) : (
              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                {userRole === UserRole.FRANCHISE_ADMIN && (<div className="bg-orange-50 border border-orange-100 p-3 rounded-lg flex gap-3 text-sm text-orange-800"><ShieldAlert className="w-5 h-5 flex-shrink-0" /><p>Students added by franchises remain <strong>Pending</strong> until verified by HQ.</p></div>)}
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label><input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label><input required type="email" className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} /></div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={newStudent.courseId}
                      onChange={e => setNewStudent({ ...newStudent, courseId: e.target.value })}
                    >
                      {courses.length === 0 ? <option value="">No Courses Available</option> : courses.map((c: any) => (
                        <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  {userRole === UserRole.SUPER_ADMIN ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Franchise Name</label>
                      <div className="flex flex-col gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white">
                        {franchises.length === 0 ? <p className="text-xs text-gray-400">No franchises found</p> : franchises.map((f: any) => (
                          <label key={f._id || f.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                            <input
                              type="radio"
                              name="franchiseName"
                              value={f.name}
                              checked={newStudent.franchiseName === f.name}
                              onChange={e => setNewStudent({ ...newStudent, franchiseName: e.target.value })}
                              className="text-primary focus:ring-primary h-4 w-4"
                            />
                            {f.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Fee (₹)</label><input type="number" className="w-full border border-gray-200 rounded-lg px-4 py-2" value={newStudent.feesTotal} onChange={e => setNewStudent({ ...newStudent, feesTotal: parseInt(e.target.value) })} /></div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assigned Batch (Optional)</label>
                        <select
                          className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={newStudent.batchId}
                          onChange={e => setNewStudent({ ...newStudent, batchId: e.target.value })}
                        >
                          <option value="">Select Batch later</option>
                          {batches.filter(b => b.courseId === newStudent.courseId && b.status !== 'Completed').map((b: any) => (
                            <option key={b.id} value={b.id}>{b.batchName} ({b.timing})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {userRole === UserRole.SUPER_ADMIN && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Fee (₹)</label><input type="number" className="w-full border border-gray-200 rounded-lg px-4 py-2" value={newStudent.feesTotal} onChange={e => setNewStudent({ ...newStudent, feesTotal: parseInt(e.target.value) })} />
                  </div>
                )}

                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label><input required type="tel" className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" value={newStudent.phone} onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label><input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" value={newStudent.address} onChange={e => setNewStudent({ ...newStudent, address: e.target.value })} /></div>

                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Guardian Name</label><input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" value={newStudent.guardianName} onChange={e => setNewStudent({ ...newStudent, guardianName: e.target.value })} /></div>
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Aadhaar Number</label><input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" value={newStudent.aadhaarNumber} onChange={e => setNewStudent({ ...newStudent, aadhaarNumber: e.target.value })} /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Blood Group</label>
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" value={newStudent.bloodGroup} onChange={e => setNewStudent({ ...newStudent, bloodGroup: e.target.value })}>
                      <option value="">Select</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student Photo</label>
                    <input type="file" accept="image/*" className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" onChange={e => setStudentPhoto(e.target.files ? e.target.files[0] : null)} />
                  </div>
                </div>

                <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors mt-2">Create Enrollment</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentManager;
