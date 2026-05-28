import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { Franchise } from '../../types';
import { MoreVertical, Shield, CheckCircle, MapPin, DollarSign, Users, XCircle, Clock, Loader, Settings, Plus, Trash2 } from 'lucide-react';

const FranchiseManager: React.FC = () => {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Active' | 'Pending'>('Active');
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{username: string, password: string} | null>(null);
  const [newFranchise, setNewFranchise] = useState({ name: '', location: '', adminName: '', adminEmail: '' });

  const fetchFranchises = async () => {
    try {
      setLoading(true);
      const response: any = await api.getFranchises();
      setFranchises(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error("Failed to fetch franchises", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFranchises();
    socket.on('franchise_added', fetchFranchises);
    socket.on('franchise_updated', fetchFranchises);
    socket.on('franchise_deleted', fetchFranchises);
    return () => {
      socket.off('franchise_added', fetchFranchises);
      socket.off('franchise_updated', fetchFranchises);
      socket.off('franchise_deleted', fetchFranchises);
    };
  }, []);

  const filteredFranchises = franchises.filter(f => {
    if (activeTab === 'Active') return f.status === 'Active' || f.status === 'Suspended';
    return f.status === 'Pending';
  });

  const toggleStatus = async (id: string, newStatus?: 'Active' | 'Suspended') => {
    try {
      const f = franchises.find(i => i.id === id || (i as any)._id === id);
      if (!f) return;
      const targetId = f.id || (f as any)._id;
      const nextStatus = newStatus ? newStatus : (f.status === 'Active' ? 'Suspended' : 'Active');
      await api.updateFranchiseStatus(targetId, nextStatus);
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("WARNING: Deleting a franchise will suspend all linked students and remove faculties. Proceed?")) {
      try {
        await api.deleteFranchise(id);
      } catch (err) { alert("Failed to delete franchise"); }
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...newFranchise, status: 'Active', studentCount: 0, revenue: 0 };
      const response: any = await api.createFranchise(payload);
      if (response && response.generatedUsername) {
        setNewCredentials({ username: response.generatedUsername, password: response.generatedPassword });
      } else {
        setIsAddModalOpen(false);
      }
      setNewFranchise({ name: '', location: '', adminName: '', adminEmail: '' });
    } catch (err: any) { alert(err.message || "Failed to add franchise"); }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary">Franchise Governance</h2>
          <p className="text-gray-500 text-sm">Monitor performance, approve applications, and enforce brand standards.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-lg p-1 border border-gray-200 flex">
            <button onClick={() => setActiveTab('Active')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'Active' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-primary'}`}>
              Network ({franchises.filter(f => f.status !== 'Pending').length})
            </button>
            <button onClick={() => setActiveTab('Pending')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'Pending' ? 'bg-accent text-white shadow-md' : 'text-gray-500 hover:text-accent'}`}>
              Requests {franchises.filter(f => f.status === 'Pending').length > 0 && <span className="bg-white text-accent px-1.5 py-0.5 rounded-full text-xs font-bold shadow-sm">{franchises.filter(f => f.status === 'Pending').length}</span>}
            </button>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Add Franchise
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFranchises.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No {activeTab.toLowerCase()} franchises found.</p>
          </div>
        ) : (
          filteredFranchises.map((franchise) => {
            const fid = franchise.id || (franchise as any)._id;
            return (
              <div key={fid} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow relative">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${franchise.status === 'Active' ? 'bg-green-100 text-green-700' : franchise.status === 'Suspended' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {franchise.status === 'Active' && <CheckCircle className="w-3 h-3" />}
                      {franchise.status === 'Suspended' && <XCircle className="w-3 h-3" />}
                      {franchise.status === 'Pending' && <Clock className="w-3 h-3" />}
                      {franchise.status}
                    </div>
                    <div className="flex gap-2">
                       {activeTab === 'Active' && (
                         <button onClick={() => setShowPermissions(fid)} className="text-gray-400 hover:text-primary" title="Manage Permissions"><Settings className="w-5 h-5" /></button>
                       )}
                       <button onClick={() => handleDelete(fid)} className="text-gray-400 hover:text-red-500" title="Delete Franchise"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-primary mb-1">{franchise.name}</h3>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-6"><MapPin className="w-4 h-4" /> {franchise.location}</div>

                  {activeTab === 'Active' && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-3 rounded-lg flex flex-col items-start"><div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Users className="w-3 h-3" /> Students</div><p className="font-bold text-gray-800">{franchise.studentCount || 0}</p></div>
                        <div className="bg-gray-50 p-3 rounded-lg flex flex-col items-start"><div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><DollarSign className="w-3 h-3" /> Revenue</div><p className="font-bold text-gray-800">₹{franchise.revenue || 0}</p></div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${franchise.adminName}`} className="w-8 h-8 rounded-full bg-gray-200" alt="Admin" />
                    <div className="flex-grow"><p className="text-xs text-gray-500">Applicant / Owner</p><p className="text-sm font-bold text-gray-800">{franchise.adminName}</p></div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between gap-3">
                    {activeTab === 'Active' ? (
                      <><button className="text-sm font-bold text-primary hover:underline">View Reports</button><button onClick={() => toggleStatus(fid)} className={`text-sm font-bold ${franchise.status === 'Active' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>{franchise.status === 'Active' ? 'Suspend Access' : 'Reactivate'}</button></>
                    ) : (
                      <><button onClick={() => toggleStatus(fid, 'Active')} className="flex-1 bg-green-600 text-white py-1.5 rounded text-sm font-bold hover:bg-green-700">Approve</button><button onClick={() => toggleStatus(fid, 'Suspended')} className="flex-1 border border-gray-300 text-gray-600 py-1.5 rounded text-sm font-bold hover:bg-gray-100">Reject</button></>
                    )}
                </div>

                {showPermissions === fid && (
                  <div className="absolute inset-0 bg-white/95 z-10 p-6 flex flex-col animate-fade-in text-left">
                    <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-primary flex items-center gap-2"><Settings className="w-4 h-4" /> Access Control</h4><button onClick={() => setShowPermissions(null)}><XCircle className="w-5 h-5 text-gray-400" /></button></div>
                    <div className="flex-grow space-y-3 overflow-y-auto">
                        <p className="text-xs text-gray-500 uppercase font-bold">Allowed Courses</p>
                        <div className="space-y-2"><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked readOnly className="rounded text-primary focus:ring-primary" /> Web Development</label></div>
                    </div>
                    <button onClick={() => setShowPermissions(null)} className="mt-4 bg-primary text-white py-2 rounded text-sm font-bold">Update Permissions</button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-heading font-bold text-lg text-primary">
                {newCredentials ? 'Credentials Generated' : 'Add New Franchise'}
              </h3>
              <button onClick={() => { setIsAddModalOpen(false); setNewCredentials(null); }} className="text-gray-400 hover:text-red-500"><XCircle className="w-5 h-5" /></button>
            </div>
            
            {newCredentials ? (
              <div className="p-6 space-y-4 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-gray-800">Franchise Created!</h4>
                <p className="text-sm text-gray-500">Please share these admin credentials securely. They will only be shown once.</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4 text-left space-y-3">
                  <div><p className="text-xs text-gray-500 font-bold uppercase">Username</p><p className="font-mono text-lg text-primary">{newCredentials.username}</p></div>
                  <div><p className="text-xs text-gray-500 font-bold uppercase">Password</p><p className="font-mono text-lg text-primary">{newCredentials.password}</p></div>
                </div>
                <button onClick={() => { setIsAddModalOpen(false); setNewCredentials(null); }} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 mt-6">Done</button>
              </div>
            ) : (
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Franchise Name</label><input required type="text" className="w-full border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" value={newFranchise.name} onChange={e => setNewFranchise({...newFranchise, name: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label><input required type="text" className="w-full border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" value={newFranchise.location} onChange={e => setNewFranchise({...newFranchise, location: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Name</label><input required type="text" className="w-full border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" value={newFranchise.adminName} onChange={e => setNewFranchise({...newFranchise, adminName: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Email</label><input required type="email" className="w-full border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" value={newFranchise.adminEmail} onChange={e => setNewFranchise({...newFranchise, adminEmail: e.target.value})} /></div>
              <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 mt-2">Create Franchise</button>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FranchiseManager;
