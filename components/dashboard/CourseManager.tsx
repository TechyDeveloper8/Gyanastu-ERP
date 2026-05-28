import React, { useState, useEffect } from 'react';
import { api } from '../../services/api'; 
import { socket } from '../../services/socket';
import { Course } from '../../types';
import { Book, Edit2, Trash2, Plus, Clock, Archive, CheckCircle, Loader, XCircle } from 'lucide-react';

const CourseManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', category: 'Development', duration: '', price: 0, description: '' });

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

  const handleDelete = async (id: string) => {
    if(window.confirm('Are you sure? This will hide the course from all franchises.')) {
      try { await api.deleteCourse(id); } catch(err) { alert('Failed to delete course'); }
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      await api.updateCourse(id, { status: currentStatus === 'Active' ? 'Archived' : 'Active' });
    } catch(err) { alert('Failed to update status'); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCourse({ ...newCourse, slug: newCourse.title.toLowerCase().replace(/ /g, '-'), status: 'Active', thumbnail: `https://picsum.photos/400/250?random=${Math.random()}` });
      setIsAddModalOpen(false);
      setNewCourse({ title: '', category: 'Development', duration: '', price: 0, description: '' });
    } catch(err) { alert('Failed to create course'); }
  };

  if(loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div><h2 className="text-lg font-heading font-bold text-primary">Course Repository</h2><p className="text-sm text-gray-500">Master curriculum control. Changes propagate instantly to all franchises.</p></div>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Add New Course</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Course Details</th><th className="p-4 font-bold">Category</th><th className="p-4 font-bold">Status</th><th className="p-4 font-bold">Duration</th><th className="p-4 font-bold">Price</th><th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {courses.map(course => {
                const cid = course.id || (course as any)._id;
                return (
                <tr key={cid} className={`transition-colors ${course.status === 'Archived' ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3"><img src={course.thumbnail} alt="" className={`w-12 h-12 rounded-lg object-cover ${course.status === 'Archived' ? 'grayscale' : ''}`} /><div><p className="font-bold text-gray-800">{course.title}</p><p className="text-xs text-gray-500 line-clamp-1">{course.description}</p></div></div>
                  </td>
                  <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">{course.category}</span></td>
                  <td className="p-4">
                    <button onClick={() => toggleStatus(cid, course.status as string)} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${course.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                      {course.status === 'Active' ? <CheckCircle className="w-3 h-3" /> : <Archive className="w-3 h-3" />}{course.status}
                    </button>
                  </td>
                  <td className="p-4"><div className="flex items-center gap-1 text-gray-600"><Clock className="w-3 h-3" /> {course.duration}</div></td>
                  <td className="p-4 font-bold text-gray-800">₹{Number(course.price).toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2"><button className="text-gray-400 hover:text-primary p-1" title="Edit Content"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDelete(cid)} className="text-gray-400 hover:text-red-600 p-1" title="Delete Permanently"><Trash2 className="w-4 h-4" /></button></div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-heading font-bold text-lg text-primary">New Course</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-red-500"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label><input required type="text" className="w-full border rounded-lg px-4 py-2" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label><input required type="text" className="w-full border rounded-lg px-4 py-2" value={newCourse.category} onChange={e => setNewCourse({...newCourse, category: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration</label><input required type="text" placeholder="6 Months" className="w-full border rounded-lg px-4 py-2" value={newCourse.duration} onChange={e => setNewCourse({...newCourse, duration: e.target.value})} /></div>
                 <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (₹)</label><input required type="number" className="w-full border rounded-lg px-4 py-2" value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: parseInt(e.target.value)})} /></div>
              </div>
              <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 mt-2">Publish Course</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManager;
