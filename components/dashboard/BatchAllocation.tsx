import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Batch, StudentProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Search, UserPlus, Users, Check, AlertCircle } from 'lucide-react';

const BatchAllocation: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, batchesRes] = await Promise.all([
        api.getStudents(user?.franchiseId),
        api.getBatches(user?.franchiseId)
      ]);
      setStudents(studentsRes);
      setBatches(batchesRes);
    } catch (err) {
      console.error('Fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!selectedStudent || !selectedBatchId) {
      setMessage({ type: 'error', text: 'Please select both a student and a batch.' });
      return;
    }
    
    try {
      setAssigning(true);
      setMessage(null);
      await api.updateStudent(selectedStudent, { batchId: selectedBatchId });
      setMessage({ type: 'success', text: 'Student successfully allocated to batch!' });
      
      // Update local state
      setStudents(students.map(s => s.id === selectedStudent ? { ...s, batchId: selectedBatchId, batchName: batches.find(b => b.id === selectedBatchId)?.batchName } : s));
      setSelectedStudent(null);
      setSelectedBatchId('');
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to assign batch' });
    } finally {
      setAssigning(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.rollNumber && s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const unassignedCount = students.filter(s => !s.batchId).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary">Student Batch Allocation</h2>
          <p className="text-gray-500 text-sm mt-1">Assign or transfer students between your active batches.</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
          <Users className="w-5 h-5" />
          <span>{unassignedCount} Unassigned Students</span>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Search students by name or roll no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="text-sm text-gray-500 font-medium">
              Showing {filteredStudents.length} students
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center py-10 text-gray-500">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No students found.</div>
            ) : (
              filteredStudents.map(student => (
                <div 
                  key={student.id} 
                  onClick={() => setSelectedStudent(student.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedStudent === student.id 
                      ? 'border-accent bg-blue-50 ring-1 ring-accent' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img src={student.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`} alt={student.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <h4 className="font-bold text-gray-900">{student.name}</h4>
                      <p className="text-xs text-gray-500">{student.rollNumber || 'No Roll No'} • {student.courseName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {student.batchId ? (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-[10px] font-bold uppercase rounded-full">
                        {(student as any).batchName || 'Assigned'}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold uppercase rounded-full">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Allocation Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-primary mb-6 border-b pb-2">Allocate Batch</h3>
          
          {selectedStudent ? (
            <div className="space-y-6 flex-1">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Selected Student</p>
                <div className="flex items-center gap-3">
                  <img src={students.find(s => s.id === selectedStudent)?.avatarUrl || `https://ui-avatars.com/api/?name=User`} className="w-8 h-8 rounded-full" />
                  <p className="font-bold text-gray-900">{students.find(s => s.id === selectedStudent)?.name}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                  <p className="text-gray-600">Current Batch: <span className="font-semibold text-gray-900">{(students.find(s => s.id === selectedStudent) as any)?.batchName || 'None'}</span></p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Target Batch</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                >
                  <option value="">-- Choose a Batch --</option>
                  {batches.filter(b => b.status !== 'Completed').map(batch => (
                    <option key={batch.id} value={batch.id} disabled={batch.currentStudents >= batch.capacity}>
                      {batch.batchName} ({batch.currentStudents}/{batch.capacity}) {batch.currentStudents >= batch.capacity ? '- FULL' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">Only Active and Upcoming batches are available.</p>
              </div>
              
              <div className="pt-6 mt-auto">
                <button 
                  onClick={handleAssign}
                  disabled={!selectedBatchId || assigning}
                  className="w-full bg-accent text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {assigning ? 'Allocating...' : <><UserPlus className="w-5 h-5" /> Allocate Student</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12">
              <Users className="w-16 h-16 mb-4 text-gray-200" />
              <p className="text-center font-medium">Select a student from the list to assign or transfer them to a batch.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchAllocation;
