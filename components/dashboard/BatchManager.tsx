import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Batch, Course, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Users, Search, Calendar, Clock, MapPin } from 'lucide-react';
import { socket } from '../../services/socket';

const BatchManager: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<Partial<Batch>>({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [batchesRes, coursesRes, facultyRes] = await Promise.all([
        api.getBatches(user?.franchiseId),
        api.getCourses(),
        api.getFaculty(user?.franchiseId)
      ]);
      setBatches(batchesRes);
      setCourses(coursesRes);
      setFaculty(facultyRes);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    socket.on('batch_added', fetchData);
    socket.on('batch_updated', fetchData);
    socket.on('batch_deleted', fetchData);
    return () => {
      socket.off('batch_added', fetchData);
      socket.off('batch_updated', fetchData);
      socket.off('batch_deleted', fetchData);
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentBatch.id) {
        await api.updateBatch(currentBatch.id, currentBatch);
      } else {
        await api.createBatch(currentBatch);
      }
      setIsModalOpen(false);
      setCurrentBatch({});
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save batch');
    }
  };

  const handleDelete = async () => {
    if (!currentBatch.id) return;
    try {
      await api.deleteBatch(currentBatch.id);
      setIsDeleteModalOpen(false);
      setCurrentBatch({});
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete batch');
    }
  };

  const filteredBatches = batches.filter(b => 
    b.batchName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary">Batch Management</h2>
          <p className="text-gray-500 text-sm mt-1">Manage active batches and assignments for your franchise.</p>
        </div>
        <button 
          onClick={() => { setCurrentBatch({ status: 'Active', capacity: 30 }); setIsModalOpen(true); }}
          className="bg-accent text-white px-5 py-2.5 rounded-lg font-medium hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Create Batch
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading batches...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map(batch => (
              <div key={batch.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-primary">{batch.batchName}</h3>
                    <span className={`inline-block px-2 py-1 text-xs font-bold rounded-full mt-1 ${batch.status === 'Active' ? 'bg-green-100 text-green-700' : batch.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                      {batch.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setCurrentBatch(batch); setIsModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setCurrentBatch(batch); setIsDeleteModalOpen(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{batch.courseName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>Faculty: <span className="font-medium text-gray-900">{batch.facultyName || 'Unassigned'}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Timing: <span className="font-medium text-gray-900">{batch.timing}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>Room: <span className="font-medium text-gray-900">{batch.classroom || 'TBD'}</span></span>
                  </div>
                  
                  <div className="pt-3 mt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Capacity</span>
                      <span className="text-xs font-bold text-primary">{batch.currentStudents} / {batch.capacity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-accent h-1.5 rounded-full" style={{ width: `${Math.min(100, (batch.currentStudents / batch.capacity) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredBatches.length === 0 && (
              <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 mb-2">No batches found matching your search.</p>
                <button onClick={() => { setCurrentBatch({ status: 'Active', capacity: 30 }); setIsModalOpen(true); }} className="text-accent font-medium hover:underline">
                  Create your first batch
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Batch Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
              <h3 className="text-xl font-heading font-bold text-primary">
                {currentBatch.id ? 'Edit Batch' : 'Create New Batch'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-6 h-6 hidden" />
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Batch Name *</label>
                  <input 
                    type="text" required
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="e.g. WD-Morning-2024"
                    value={currentBatch.batchName || ''}
                    onChange={e => setCurrentBatch({...currentBatch, batchName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Course *</label>
                  <select 
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={currentBatch.courseId || ''}
                    onChange={e => setCurrentBatch({...currentBatch, courseId: e.target.value})}
                  >
                    <option value="">Select Course...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Assigned Faculty</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={currentBatch.facultyId || ''}
                    onChange={e => setCurrentBatch({...currentBatch, facultyId: e.target.value})}
                  >
                    <option value="">Select Faculty...</option>
                    {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Batch Timing</label>
                  <input 
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="e.g. MWF 10:00 AM"
                    value={currentBatch.timing || ''}
                    onChange={e => setCurrentBatch({...currentBatch, timing: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={currentBatch.startDate ? new Date(currentBatch.startDate).toISOString().split('T')[0] : ''}
                    onChange={e => setCurrentBatch({...currentBatch, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
                  <input 
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={currentBatch.endDate ? new Date(currentBatch.endDate).toISOString().split('T')[0] : ''}
                    onChange={e => setCurrentBatch({...currentBatch, endDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Maximum Capacity</label>
                  <input 
                    type="number" min="1"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={currentBatch.capacity || 30}
                    onChange={e => setCurrentBatch({...currentBatch, capacity: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Classroom</label>
                  <input 
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="e.g. Room 101"
                    value={currentBatch.classroom || ''}
                    onChange={e => setCurrentBatch({...currentBatch, classroom: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={currentBatch.status || 'Active'}
                    onChange={e => setCurrentBatch({...currentBatch, status: e.target.value as any})}
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 transition-all shadow-sm">
                  {currentBatch.id ? 'Update Batch' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-2xl animate-scale-in">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Batch?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete <span className="font-bold text-gray-800">{currentBatch.batchName}</span>? 
              This will remove the batch and unassign all students in it.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManager;
