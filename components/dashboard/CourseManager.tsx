import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api'; 
import { socket } from '../../services/socket';
import { Course } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Book, Edit2, Trash2, Plus, Clock, Archive, CheckCircle, Loader, XCircle, FileText, Download, UploadCloud, ImageIcon, Users, IndianRupee, Eye } from 'lucide-react';
import DeleteConfirmationModal from '../DeleteConfirmationModal';

const CourseManager: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  const initialCourseState = { title: '', category: 'Development', duration: '', price: 0, description: '', status: 'Active' };
  const [newCourse, setNewCourse] = useState(initialCourseState);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data: any = await api.getCourses();
      setCourses(data);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchCourses();
    socket.on('course_added', fetchCourses);
    socket.on('course_updated', fetchCourses);
    socket.on('course_deleted', fetchCourses);
    return () => {
      socket.off('course_added', fetchCourses);
      socket.off('course_updated', fetchCourses);
      socket.off('course_deleted', fetchCourses);
    };
  }, []);

  const handleDeleteClick = (id: string) => {
    setCourseToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if(!courseToDelete) return;
    try { 
      await api.deleteCourse(courseToDelete); 
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
    } catch(err) { alert('Failed to delete course'); }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    if(user?.role !== UserRole.SUPER_ADMIN) return;
    try {
      await api.updateCourse(id, { status: currentStatus === 'Active' ? 'Inactive' : 'Active' });
    } catch(err) { alert('Failed to update status'); }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') return alert('Only PDF files are allowed for the syllabus.');
      if (file.size > 10 * 1024 * 1024) return alert('PDF file size must be less than 10 MB.');
      setPdfFile(file);
    }
  };

  const resetForm = () => {
    setNewCourse(initialCourseState);
    setImageFile(null);
    setImagePreview('');
    setPdfFile(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if(user?.role !== UserRole.SUPER_ADMIN) return;

    try {
      const formData = new FormData();
      Object.entries(newCourse).forEach(([key, val]) => formData.append(key, String(val)));
      
      if (imageFile) formData.append('courseImage', imageFile);
      if (pdfFile) formData.append('syllabusPdf', pdfFile);

      // Using generic request for multipart to reuse existing auth logic in api.ts
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) throw new Error('Failed to create course');
      
      setIsAddModalOpen(false);
      resetForm();
      fetchCourses();
    } catch(err) { alert('Failed to create course'); }
  };

  const openViewModal = (course: Course) => {
    setSelectedCourse(course);
    setIsViewModalOpen(true);
  };

  if(loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div><h2 className="text-lg font-heading font-bold text-primary">Course Repository</h2><p className="text-sm text-gray-500">Master curriculum control and syllabus management.</p></div>
          {user?.role === UserRole.SUPER_ADMIN && (
            <button onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"><Plus className="w-4 h-4" /> Add New Course</button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-bold">Course Info</th>
                <th className="p-4 font-bold">Category</th>
                <th className="p-4 font-bold">Duration</th>
                <th className="p-4 font-bold">Fee</th>
                <th className="p-4 font-bold">Students</th>
                <th className="p-4 font-bold">Syllabus</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {courses.map(course => {
                const cid = course.id || (course as any)._id;
                return (
                <tr key={cid} className={`transition-colors hover:bg-gray-50 ${course.status === 'Inactive' || course.status === 'Archived' ? 'bg-gray-50/50 opacity-80' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {course.thumbnail ? (
                        <img src={`http://localhost:5000${course.thumbnail}`} alt="" className={`w-12 h-12 rounded-lg object-cover shadow-sm ${course.status !== 'Active' ? 'grayscale' : ''}`} onError={(e) => (e.currentTarget.src = 'https://placehold.co/150x150')} />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary/50"><Book className="w-6 h-6" /></div>
                      )}
                      <div><p className="font-bold text-gray-800">{course.title}</p></div>
                    </div>
                  </td>
                  <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">{course.category}</span></td>
                  <td className="p-4"><div className="flex items-center gap-1 text-gray-600 font-medium"><Clock className="w-3.5 h-3.5" /> {course.duration}</div></td>
                  <td className="p-4 font-bold text-gray-800"><div className="flex items-center gap-0.5"><IndianRupee className="w-3.5 h-3.5 text-gray-400" />{Number(course.price).toLocaleString()}</div></td>
                  <td className="p-4"><div className="flex items-center gap-1 text-gray-600 font-medium"><Users className="w-3.5 h-3.5 text-gray-400" /> {course.totalStudents || 0}</div></td>
                  <td className="p-4">
                    {course.syllabusUrl ? <span className="text-green-600 flex items-center gap-1 font-bold text-xs bg-green-50 px-2 py-1 rounded w-max"><FileText className="w-3 h-3" /> Available</span> : <span className="text-gray-400 text-xs italic">Not Uploaded</span>}
                  </td>
                  <td className="p-4">
                    {user?.role === UserRole.SUPER_ADMIN ? (
                      <button onClick={() => toggleStatus(cid, course.status as string)} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${course.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                        {course.status === 'Active' ? <CheckCircle className="w-3 h-3" /> : <Archive className="w-3 h-3" />}{course.status}
                      </button>
                    ) : (
                      <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold w-max ${course.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                        {course.status}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openViewModal(course)} className="text-gray-400 hover:text-primary p-1 border border-transparent hover:border-gray-200 rounded transition-colors" title="View Profile"><Eye className="w-4 h-4" /></button>
                      {user?.role === UserRole.SUPER_ADMIN && (
                        <>
                          <button className="text-gray-400 hover:text-primary p-1 border border-transparent hover:border-gray-200 rounded transition-colors" title="Edit Course"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteClick(cid)} className="text-gray-400 hover:text-red-600 p-1 border border-transparent hover:border-gray-200 rounded transition-colors" title="Delete Course"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          {courses.length === 0 && <div className="p-8 text-center text-gray-500 italic">No courses found in the system.</div>}
        </div>
      </div>

      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Delete Course" />

      {/* ADD COURSE MODAL */}
      {isAddModalOpen && user?.role === UserRole.SUPER_ADMIN && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="font-heading font-bold text-xl text-primary flex items-center gap-2"><Book className="w-5 h-5" /> Course Registration Form</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow-sm transition-colors"><XCircle className="w-6 h-6" /></button>
            </div>
            
            <div className="overflow-y-auto p-6 bg-gray-50 flex-grow">
              <form id="courseForm" onSubmit={handleCreate} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                
                {/* Course Image */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Course Image (Upload)</label>
                  <div className="relative group cursor-pointer" onClick={() => imageInputRef.current?.click()}>
                    <div className="w-full h-40 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400 group-hover:text-primary/70">
                          <ImageIcon className="w-8 h-8 mb-2" />
                          <span className="text-sm font-bold">Click to upload course image</span>
                          <span className="text-xs mt-1 font-normal">Recommended: 1200x800px</span>
                        </div>
                      )}
                    </div>
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course Name *</label><input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} placeholder="e.g. Advanced Web Development" /></div>
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course Category *</label><input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" value={newCourse.category} onChange={e => setNewCourse({...newCourse, category: e.target.value})} placeholder="e.g. Programming" /></div>
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course Duration *</label><input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" value={newCourse.duration} onChange={e => setNewCourse({...newCourse, duration: e.target.value})} placeholder="e.g. 6 Months" /></div>
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course Fee (₹) *</label><input required type="number" min="0" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none" value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: parseInt(e.target.value) || 0})} /></div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course Status</label>
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold" value={newCourse.status} onChange={e => setNewCourse({...newCourse, status: e.target.value})}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course Description</label><textarea rows={3} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none resize-none" value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} placeholder="Brief overview of the course content..." /></div>
                </div>

                {/* Syllabus PDF */}
                <div className="pt-2 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Syllabus</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 text-red-500 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{pdfFile ? pdfFile.name : 'Upload Course Syllabus'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">PDF Only • Maximum Size: 10 MB</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => pdfInputRef.current?.click()} className="bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 text-sm"><UploadCloud className="w-4 h-4" /> Browse File</button>
                    <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfChange} />
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-4 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" form="courseForm" className="bg-primary text-white font-bold py-2.5 px-8 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">Save Course</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW COURSE PROFILE MODAL */}
      {isViewModalOpen && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            
            <div className="relative bg-white pt-6 pb-6 px-8 border-b border-gray-100 flex justify-between items-start shrink-0">
              <div className="flex gap-6 items-center">
                {selectedCourse.thumbnail ? (
                  <img src={`http://localhost:5000${selectedCourse.thumbnail}`} alt="" className="w-24 h-24 rounded-xl object-cover shadow-sm border border-gray-100" onError={(e) => (e.currentTarget.src = 'https://placehold.co/150x150')} />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center text-primary/50 border border-primary/20"><Book className="w-10 h-10" /></div>
                )}
                <div>
                  <h2 className="text-2xl font-heading font-bold text-primary mb-1">{selectedCourse.title}</h2>
                  <div className="flex gap-2 items-center text-sm font-bold">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">{selectedCourse.category}</span>
                    <span className={`px-2.5 py-1 rounded-md ${selectedCourse.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{selectedCourse.status}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>

            <div className="overflow-y-auto p-8 space-y-8 flex-grow">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                  <Clock className="w-6 h-6 text-primary mb-2 opacity-80" />
                  <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Duration</p>
                  <p className="font-bold text-gray-800 text-lg">{selectedCourse.duration || '—'}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                  <IndianRupee className="w-6 h-6 text-green-600 mb-2 opacity-80" />
                  <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Course Fee</p>
                  <p className="font-bold text-gray-800 text-lg">₹{Number(selectedCourse.price).toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                  <Users className="w-6 h-6 text-blue-500 mb-2 opacity-80" />
                  <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Total Students</p>
                  <p className="font-bold text-gray-800 text-lg">{selectedCourse.totalStudents || 0}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h4 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">Course Description</h4>
                <p className="text-gray-600 leading-relaxed text-sm">{selectedCourse.description || <span className="italic text-gray-400">No description provided.</span>}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h4 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Course Syllabus</h4>
                
                {selectedCourse.syllabusUrl ? (
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 text-red-500 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5" /></div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">Official Syllabus Document</p>
                        <p className="text-xs text-gray-500">PDF Format</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`http://localhost:5000${selectedCourse.syllabusUrl}`} target="_blank" rel="noopener noreferrer" className="bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4" /> View PDF
                      </a>
                      <a href={`http://localhost:5000${selectedCourse.syllabusUrl}`} download className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm flex items-center gap-2">
                        <Download className="w-4 h-4" /> Download PDF
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500 italic">
                    No syllabus available for this course.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseManager;
