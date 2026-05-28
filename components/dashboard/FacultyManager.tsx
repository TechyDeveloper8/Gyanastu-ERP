import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { UserRole } from '../../types';
import { Users, BookOpen, MoreHorizontal, ShieldCheck, Loader, XCircle, Trash2, CheckCircle, Camera, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const FacultyManager: React.FC = () => {
  const { user } = useAuth();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ username: string, password: string, employeeCode: string } | null>(null);

  const [newFac, setNewFac] = useState({
    name: '', email: '', phone: '', address: '', franchiseId: '',
    designation: '', qualification: '', bloodGroup: '', emergencyContact: '', joinDate: '',
    expertise: [''] as string[], assignedCourses: [] as string[], assignedBatches: [] as string[]
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facData, franData, courseData, batchData]: any = await Promise.all([
        api.getFaculty(user?.role === UserRole.SUPER_ADMIN ? undefined : user?.franchiseId),
        user?.role === UserRole.SUPER_ADMIN ? api.getFranchises() : Promise.resolve([]),
        api.getCourses(),
        api.getBatches()
      ]);
      setFaculty(Array.isArray(facData) ? facData : facData.data || []);

      const franList = Array.isArray(franData) ? franData : franData.data || [];
      setFranchises(franList);
      setCourses(Array.isArray(courseData) ? courseData : courseData.data || []);
      setBatches(Array.isArray(batchData) ? batchData : batchData.data || []);

      if (user?.role === UserRole.SUPER_ADMIN && franList.length > 0 && !newFac.franchiseId) {
        setNewFac(prev => ({ ...prev, franchiseId: franList[0].id || franList[0]._id }));
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    socket.on('faculty_added', fetchData);
    socket.on('faculty_deleted', fetchData);
    socket.on('franchise_added', fetchData);
    socket.on('course_added', fetchData);
    socket.on('course_updated', fetchData);
    socket.on('course_deleted', fetchData);
    return () => {
      socket.off('faculty_added', fetchData);
      socket.off('faculty_deleted', fetchData);
      socket.off('franchise_added', fetchData);
      socket.off('course_added', fetchData);
      socket.off('course_updated', fetchData);
      socket.off('course_deleted', fetchData);
    };
  }, [user]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this faculty member completely?')) {
      try { await api.deleteFaculty(id); } catch (err) { alert('Failed to delete faculty'); }
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setNewFac({
      name: '', email: '', phone: '', address: '', franchiseId: franchises.length > 0 ? (franchises[0].id || franchises[0]._id) : '',
      designation: '', qualification: '', bloodGroup: '', emergencyContact: '', joinDate: '',
      expertise: [''], assignedCourses: [], assignedBatches: []
    });
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalFranchiseId = user?.role === UserRole.SUPER_ADMIN ? newFac.franchiseId : user?.franchiseId;
      if (!finalFranchiseId) return alert('Please select a franchise.');

      const formData = new FormData();
      formData.append('name', newFac.name);
      formData.append('email', newFac.email);
      formData.append('phone', newFac.phone);
      formData.append('address', newFac.address);
      formData.append('franchiseId', finalFranchiseId);
      formData.append('designation', newFac.designation);
      formData.append('qualification', newFac.qualification);
      formData.append('bloodGroup', newFac.bloodGroup);
      formData.append('emergencyContact', newFac.emergencyContact);
      if (newFac.joinDate) formData.append('joinDate', newFac.joinDate);
      formData.append('expertise', JSON.stringify(newFac.expertise.filter(e => e.trim())));
      formData.append('assignedCourses', JSON.stringify(newFac.assignedCourses));
      formData.append('assignedBatches', JSON.stringify(newFac.assignedBatches));
      if (photoFile) formData.append('facultyPhoto', photoFile);

      const response = await api.createFaculty(formData) as any;
      setNewCredentials({ username: response.generatedUsername, password: response.generatedPassword, employeeCode: response.employeeCode });
      resetForm();
    } catch (err: any) { alert(err.message || 'Failed to add faculty'); }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary">Faculty Administration</h2>
          <p className="text-gray-500 text-sm">{user?.role === UserRole.SUPER_ADMIN ? "Assign teachers to franchises." : "View assigned faculty members for your institute."}</p>
        </div>
        {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.FRANCHISE_ADMIN) && (
          <button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors">+ Add Faculty</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculty.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300"><Users className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No faculty assigned to this franchise yet.</p></div>
        ) : (
          faculty.map(f => {
            const fid = f.id || f._id;
            return (
              <div key={fid} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center relative group">
                <button className="absolute top-4 right-4 text-gray-300 hover:text-primary"><MoreHorizontal className="w-5 h-5" /></button>
                {user?.role === UserRole.SUPER_ADMIN && (<button onClick={() => handleDelete(fid)} className="absolute top-4 left-4 text-gray-300 hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>)}

                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gray-100 mb-4 overflow-hidden border-2 border-white shadow-lg"><img src={f.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.name}`} alt={f.name} className="w-full h-full object-cover" /></div>
                  {user?.role === UserRole.FRANCHISE_ADMIN && (<div className="absolute -bottom-1 -right-1 bg-green-100 text-green-700 p-1 rounded-full border-2 border-white" title="Verified by HQ"><ShieldCheck className="w-4 h-4" /></div>)}
                </div>
                <h3 className="font-bold text-lg text-primary">{f.name}</h3>
                {f.designation && <p className="text-xs text-gray-400 font-medium">{f.designation}</p>}
                <p className="text-sm text-gray-500 mb-1">{f.email}</p>
                {f.employeeCode && <p className="text-xs font-mono font-bold text-teal-600 mb-4">{f.employeeCode}</p>}

                <div className="w-full space-y-2 mb-6">
                  <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"><span className="flex items-center gap-2 text-gray-500"><BookOpen className="w-3 h-3" /> Expertise</span><span className="font-bold text-gray-700">{f.expertise?.join(', ') || '—'}</span></div>
                  {f.qualification && <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"><span className="text-gray-500">Qualification</span><span className="font-bold text-gray-700">{f.qualification}</span></div>}
                  {f.phone && <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"><span className="text-gray-500">Phone</span><span className="font-bold text-gray-700">{f.phone}</span></div>}
                </div>
                <button className="w-full border border-gray-200 text-gray-600 font-bold py-2 rounded hover:bg-gray-50 transition-colors text-sm">View Performance Log</button>
              </div>
            )
          }))}

        {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.FRANCHISE_ADMIN) && (
          <div onClick={() => setIsAddModalOpen(true)} className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-accent hover:text-accent transition-colors cursor-pointer">
            <Users className="w-12 h-12 mb-2" /><p className="font-bold">Assign New Faculty</p>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="font-heading font-bold text-lg text-primary">
                {newCredentials ? 'Faculty Onboarded!' : 'Add Faculty Member'}
              </h3>
              <button onClick={() => { setIsAddModalOpen(false); setNewCredentials(null); resetForm(); }} className="text-gray-400 hover:text-red-500"><XCircle className="w-5 h-5" /></button>
            </div>

            {newCredentials ? (
              <div className="p-6 space-y-4 text-center overflow-y-auto">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-gray-800">Faculty Onboarded!</h4>
                <p className="text-sm text-gray-500">Please share these credentials with the faculty member. They will only be shown once.</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4 text-left space-y-3">
                  <div><p className="text-xs text-gray-500 font-bold uppercase">Employee Code</p><p className="font-mono text-lg text-teal-600">{newCredentials.employeeCode}</p></div>
                  <div><p className="text-xs text-gray-500 font-bold uppercase">Username</p><p className="font-mono text-lg text-primary">{newCredentials.username}</p></div>
                  <div><p className="text-xs text-gray-500 font-bold uppercase">Password</p><p className="font-mono text-lg text-primary">{newCredentials.password}</p></div>
                </div>
                <button onClick={() => { setIsAddModalOpen(false); setNewCredentials(null); }} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 mt-6">Done</button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto">
                {/* Photo Upload */}
                <div className="flex justify-center">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group-hover:border-primary/50 transition-all">
                      {photoPreview ? (
                        <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-300 group-hover:text-primary/50" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-md"><Camera className="w-3 h-3" /></div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </div>
                </div>

                {/* Row 1: Name + Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Full Name *</label><input required type="text" className={inputClass} placeholder="Enter full name" value={newFac.name} onChange={e => setNewFac({ ...newFac, name: e.target.value })} /></div>
                  <div><label className={labelClass}>Email *</label><input required type="email" className={inputClass} placeholder="email@example.com" value={newFac.email} onChange={e => setNewFac({ ...newFac, email: e.target.value })} /></div>
                </div>

                {/* Row 2: Mobile + Emergency Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Mobile Number</label><input type="tel" className={inputClass} placeholder="+91 9876543210" value={newFac.phone} onChange={e => setNewFac({ ...newFac, phone: e.target.value })} /></div>
                  <div><label className={labelClass}>Emergency Contact</label><input type="tel" className={inputClass} placeholder="Emergency number" value={newFac.emergencyContact} onChange={e => setNewFac({ ...newFac, emergencyContact: e.target.value })} /></div>
                </div>

                {/* Row 3: Designation + Qualification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Designation</label><input type="text" className={inputClass} placeholder="e.g. Senior Instructor" value={newFac.designation} onChange={e => setNewFac({ ...newFac, designation: e.target.value })} /></div>
                  <div><label className={labelClass}>Qualification</label><input type="text" className={inputClass} placeholder="e.g. M.Tech, B.Ed" value={newFac.qualification} onChange={e => setNewFac({ ...newFac, qualification: e.target.value })} /></div>
                </div>

                {/* Row 4: Blood Group + Join Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Blood Group</label>
                    <select className={inputClass} value={newFac.bloodGroup} onChange={e => setNewFac({ ...newFac, bloodGroup: e.target.value })}>
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div><label className={labelClass}>Join Date</label><input type="date" className={inputClass} value={newFac.joinDate} onChange={e => setNewFac({ ...newFac, joinDate: e.target.value })} /></div>
                </div>

                {/* Address */}
                <div><label className={labelClass}>Address</label><textarea className={inputClass + ' resize-none'} rows={2} placeholder="Full address" value={newFac.address} onChange={e => setNewFac({ ...newFac, address: e.target.value })} /></div>

                {/* Franchise (Super Admin only) */}
                {user?.role === UserRole.SUPER_ADMIN && (
                  <div>
                    <label className={labelClass}>Assign Franchise *</label>
                    <select
                      className={inputClass}
                      value={newFac.franchiseId}
                      onChange={e => setNewFac({ ...newFac, franchiseId: e.target.value })}
                    >
                      {franchises.length === 0 ? <option value="">No Franchises Available</option> : franchises.map((f: any) => (
                        <option key={f.id || f._id} value={f.id || f._id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Assign Courses */}
                <div>
                  <label className={labelClass}>Assign Courses</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 p-3 rounded-lg">
                    {courses.map(c => (
                      <label key={c.id || c._id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={newFac.assignedCourses.includes(c.id || c._id)}
                          onChange={(e) => {
                            const val = c.id || c._id;
                            if (e.target.checked) setNewFac({ ...newFac, assignedCourses: [...newFac.assignedCourses, val] });
                            else setNewFac({ ...newFac, assignedCourses: newFac.assignedCourses.filter(id => id !== val) });
                          }}
                        /> {c.title}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Assign Batches */}
                <div>
                  <label className={labelClass}>Assign Batches</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 p-3 rounded-lg">
                    {batches.map(b => (
                      <label key={b.id || b._id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={newFac.assignedBatches.includes(b.id || b._id)}
                          onChange={(e) => {
                            const val = b.id || b._id;
                            if (e.target.checked) setNewFac({ ...newFac, assignedBatches: [...newFac.assignedBatches, val] });
                            else setNewFac({ ...newFac, assignedBatches: newFac.assignedBatches.filter(id => id !== val) });
                          }}
                        /> {b.name}
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 mt-2 transition-colors">Onboard Faculty</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default FacultyManager;