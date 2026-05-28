import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudyMaterial } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { FileText, Upload, Trash2, Video, Link as LinkIcon, Download, Loader } from 'lucide-react';

const StudyMaterialManager: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [myBatches, setMyBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'view' | 'upload'>('view');
  
  // Upload Form State
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: 'PDF' as 'PDF' | 'Video' | 'Assignment' | 'Link',
    batchId: '',
    url: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matData, batchData]: any = await Promise.all([
        api.getMaterials(),
        api.getBatches(user?.id)
      ]);
      setMaterials(Array.isArray(matData) ? matData : matData.data || []);
      setMyBatches(Array.isArray(batchData) ? batchData : batchData.data || []);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const courseId = myBatches.find(b => b.id === newMaterial.batchId || b._id === newMaterial.batchId)?.courseId || '';
      await api.createMaterial({
        title: newMaterial.title,
        type: newMaterial.type,
        url: newMaterial.url,
        batchId: newMaterial.batchId,
        courseId,
        uploadedBy: user?.name || 'Faculty'
      });
      await fetchData();
      setActiveTab('view');
      setNewMaterial({ title: '', type: 'PDF', batchId: '', url: '' });
      alert("Material uploaded successfully.");
    } catch(err) { alert("Failed to upload material"); }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm("Delete this material?")) {
      try {
        await api.deleteMaterial(id);
        await fetchData();
      } catch(err) { alert("Failed to delete material"); }
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Video': return <Video className="w-5 h-5 text-red-500" />;
      case 'Link': return <LinkIcon className="w-5 h-5 text-blue-500" />;
      default: return <FileText className="w-5 h-5 text-orange-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-heading font-bold text-primary">Study Materials</h2>
           <p className="text-gray-500 text-sm">Share resources, notes, and assignments with your students.</p>
        </div>
        <button 
          onClick={() => setActiveTab(activeTab === 'view' ? 'upload' : 'view')}
          className="bg-accent text-white px-4 py-2 rounded-lg font-bold hover:bg-accent-hover transition-colors flex items-center gap-2"
        >
          {activeTab === 'view' ? <><Upload className="w-4 h-4" /> Upload Material</> : 'Cancel Upload'}
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-slide-up">
           <h3 className="font-bold text-gray-800 mb-4">Upload New Resource</h3>
           <form onSubmit={handleUpload} className="space-y-4 max-w-lg">
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
               <input 
                 required
                 type="text" 
                 className="w-full border border-gray-200 rounded-lg px-4 py-2"
                 value={newMaterial.title}
                 onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
               />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Resource Type</label>
                   <select 
                     className="w-full border border-gray-200 rounded-lg px-4 py-2"
                     value={newMaterial.type}
                     onChange={e => setNewMaterial({...newMaterial, type: e.target.value as any})}
                   >
                     <option value="PDF">PDF Document</option>
                     <option value="Video">Video Link</option>
                     <option value="Assignment">Assignment</option>
                     <option value="Link">External URL</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Batch</label>
                   <select 
                     required
                     className="w-full border border-gray-200 rounded-lg px-4 py-2"
                     value={newMaterial.batchId}
                     onChange={e => setNewMaterial({...newMaterial, batchId: e.target.value})}
                   >
                     <option value="">Select Batch</option>
                     {myBatches.map(b => (
                       <option key={b.id} value={b.id}>{b.name}</option>
                     ))}
                   </select>
                </div>
             </div>

             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">File URL / Link</label>
               <input 
                 required
                 type="text" 
                 placeholder="https://..."
                 className="w-full border border-gray-200 rounded-lg px-4 py-2"
                 value={newMaterial.url}
                 onChange={e => setNewMaterial({...newMaterial, url: e.target.value})}
               />
             </div>

             <button type="submit" className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary/90">
               Publish to Students
             </button>
           </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">Resource Name</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">Batch</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 text-sm">
               {loading ? <tr><td colSpan={5} className="p-8 text-center"><Loader className="animate-spin text-primary mx-auto" /></td></tr> : materials.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-400">No resources found</td></tr> : materials.map(mat => (
                 <tr key={mat.id || mat._id} className="hover:bg-gray-50">
                   <td className="p-4 flex items-center gap-3">
                     <div className="p-2 bg-gray-100 rounded-lg">{getIcon(mat.type)}</div>
                     <span className="font-bold text-gray-700">{mat.title}</span>
                   </td>
                   <td className="p-4 text-gray-500">{mat.type}</td>
                   <td className="p-4">
                     <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                       {mat.batch?.name || 'All Batches'}
                     </span>
                   </td>
                   <td className="p-4 text-gray-500">{new Date(mat.createdAt).toLocaleDateString()}</td>
                   <td className="p-4 text-right flex justify-end gap-2">
                     <a href={mat.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary pt-1"><Download className="w-4 h-4" /></a>
                     <button onClick={() => handleDelete(mat.id || mat._id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};

export default StudyMaterialManager;