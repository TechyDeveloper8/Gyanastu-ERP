import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { Franchise } from '../../types';
import { MoreVertical, Shield, CheckCircle, MapPin, DollarSign, Users, XCircle, Clock, Loader, Settings, Plus, Trash2, Camera, User, Phone, Map, Building2, Key } from 'lucide-react';
import DeleteConfirmationModal from '../DeleteConfirmationModal';

const FranchiseManager: React.FC = () => {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Active' | 'Pending'>('Active');
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [franchiseToDelete, setFranchiseToDelete] = useState<string | null>(null);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  
  const [newCredentials, setNewCredentials] = useState<{username: string, password: string, franchiseCode: string} | null>(null);
  
  const initialFranchiseState = {
    name: '', ownerName: '', dateOfBirth: '', gender: '',
    mobileNumber: '', alternateMobileNumber: '', emailAddress: '',
    aadhaarNumber: '', gstNumber: '', panNumber: '', establishmentYear: '',
    addressLine1: '', addressLine2: '', city: '', district: '', state: '', pinCode: ''
  };
  const [newFranchise, setNewFranchise] = useState(initialFranchiseState);
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDeleteClick = (id: string) => {
    setFranchiseToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!franchiseToDelete) return;
    try { 
      await api.deleteFranchise(franchiseToDelete); 
      setIsDeleteModalOpen(false);
      setFranchiseToDelete(null);
    } catch (err) { alert('Failed to delete franchise'); }
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
    setNewFranchise(initialFranchiseState);
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) return alert("Franchise Profile Photo is required.");
    
    try {
      const formData = new FormData();
      Object.keys(newFranchise).forEach(key => {
        formData.append(key, (newFranchise as any)[key]);
      });
      formData.append('franchisePhoto', photoFile);

      const response: any = await api.createFranchise(formData);
      if (response && response.generatedUsername) {
        setNewCredentials({ 
          username: response.generatedUsername, 
          password: response.generatedPassword,
          franchiseCode: response.franchiseCode || 'Generated'
        });
      } else {
        setIsAddModalOpen(false);
      }
      resetForm();
    } catch (err: any) { alert(err.message || "Failed to add franchise"); }
  };

  const viewingFranchise = franchises.find(f => (f.id || (f as any)._id) === viewProfileId);

  if (loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-1.5";

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
          <button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
            <Plus className="w-4 h-4" /> Register Franchise
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
              <div key={fid} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all relative">
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
                       <button onClick={() => handleDeleteClick(fid)} className="text-gray-400 hover:text-red-500" title="Delete Franchise"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <img src={franchise.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${franchise.name}`} alt={franchise.name} className="w-16 h-16 rounded-lg object-cover border border-gray-100 shadow-sm" />
                    <div>
                      <h3 className="text-lg font-bold text-primary mb-1">{franchise.name}</h3>
                      <p className="text-xs text-gray-500 font-mono font-bold bg-gray-100 px-2 py-0.5 rounded inline-block">{franchise.franchiseCode || 'PENDING'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-6"><MapPin className="w-4 h-4" /> {franchise.city || franchise.location}</div>

                  {activeTab === 'Active' && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-3 rounded-lg flex flex-col items-start"><div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Users className="w-3 h-3" /> Students</div><p className="font-bold text-gray-800">{franchise.studentCount || 0}</p></div>
                        <div className="bg-gray-50 p-3 rounded-lg flex flex-col items-start"><div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><DollarSign className="w-3 h-3" /> Revenue</div><p className="font-bold text-gray-800">₹{franchise.revenue || 0}</p></div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 border-t border-gray-100 pt-4 mb-4">
                    <div className="flex-grow"><p className="text-xs text-gray-500 uppercase font-bold mb-0.5">Applicant / Owner</p><p className="text-sm font-bold text-gray-800">{franchise.ownerName || franchise.adminName}</p></div>
                  </div>
                  
                  <button onClick={() => setViewProfileId(fid)} className="w-full py-2.5 border border-primary/20 text-primary font-bold rounded-lg hover:bg-primary/5 transition-colors text-sm">
                    View Complete Profile
                  </button>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between gap-3">
                    {activeTab === 'Active' ? (
                      <><button className="text-sm font-bold text-primary hover:underline">View Reports</button><button onClick={() => toggleStatus(fid)} className={`text-sm font-bold ${franchise.status === 'Active' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>{franchise.status === 'Active' ? 'Suspend Access' : 'Reactivate'}</button></>
                    ) : (
                      <><button onClick={() => toggleStatus(fid, 'Active')} className="flex-1 bg-green-600 text-white py-1.5 rounded text-sm font-bold hover:bg-green-700 shadow-sm transition-colors">Approve</button><button onClick={() => toggleStatus(fid, 'Suspended')} className="flex-1 border border-gray-300 text-gray-600 py-1.5 rounded text-sm font-bold hover:bg-gray-100 transition-colors">Reject</button></>
                    )}
                </div>

                {showPermissions === fid && (
                  <div className="absolute inset-0 bg-white/95 z-10 p-6 flex flex-col animate-fade-in text-left">
                    <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-primary flex items-center gap-2"><Settings className="w-4 h-4" /> Access Control</h4><button onClick={() => setShowPermissions(null)}><XCircle className="w-5 h-5 text-gray-400" /></button></div>
                    <div className="flex-grow space-y-3 overflow-y-auto">
                        <p className="text-xs text-gray-500 uppercase font-bold">Allowed Courses</p>
                        <div className="space-y-2"><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked readOnly className="rounded text-primary focus:ring-primary" /> Web Development</label></div>
                    </div>
                    <button onClick={() => setShowPermissions(null)} className="mt-4 bg-primary text-white py-2 rounded text-sm font-bold shadow-md">Update Permissions</button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Franchise & All Linked Data"
      />

      {/* REGISTRATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="font-heading font-bold text-xl text-primary flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                {newCredentials ? 'Franchise Registered Successfully' : 'Franchise Registration Form'}
              </h3>
              <button onClick={() => { setIsAddModalOpen(false); setNewCredentials(null); resetForm(); }} className="text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 shadow-sm"><XCircle className="w-6 h-6" /></button>
            </div>
            
            {newCredentials ? (
              <div className="p-8 space-y-6 text-center overflow-y-auto bg-white">
                <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <h4 className="text-3xl font-heading font-bold text-gray-800">Registration Complete!</h4>
                <p className="text-gray-500 max-w-md mx-auto">The franchise has been created and admin account generated. Please share these credentials securely. They will not be shown again.</p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 mt-6 text-left max-w-md mx-auto space-y-5 shadow-sm">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    <Building2 className="w-6 h-6 text-gray-400" />
                    <div><p className="text-xs text-gray-500 font-bold uppercase mb-0.5">Franchise Code</p><p className="font-mono text-xl text-primary font-bold">{newCredentials.franchiseCode}</p></div>
                  </div>
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    <User className="w-6 h-6 text-gray-400" />
                    <div><p className="text-xs text-gray-500 font-bold uppercase mb-0.5">Username</p><p className="font-mono text-xl text-primary font-bold">{newCredentials.username}</p></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Key className="w-6 h-6 text-gray-400" />
                    <div><p className="text-xs text-gray-500 font-bold uppercase mb-0.5">Password</p><p className="font-mono text-xl text-primary font-bold">{newCredentials.password}</p></div>
                  </div>
                </div>
                
                <div className="flex justify-center gap-4 mt-8 pb-4">
                  <button onClick={() => navigator.clipboard.writeText(`Franchise Code: ${newCredentials.franchiseCode}\nUsername: ${newCredentials.username}\nPassword: ${newCredentials.password}`)} className="bg-gray-100 text-gray-700 font-bold py-3 px-8 rounded-xl hover:bg-gray-200 transition-colors shadow-sm">Copy Credentials</button>
                  <button onClick={() => { setIsAddModalOpen(false); setNewCredentials(null); }} className="bg-primary text-white font-bold py-3 px-10 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">Close</button>
                </div>
              </div>
            ) : (
            <div className="overflow-y-auto bg-gray-50 p-6 flex-grow">
              <form id="franchiseForm" onSubmit={handleAddSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                
                {/* Profile Information */}
                <div>
                  <h4 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Profile Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="col-span-12 md:col-span-3 flex flex-col items-center justify-start">
                      <label className={labelClass}>Franchise Profile Photo *</label>
                      <div className="relative group cursor-pointer mt-2" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-40 h-40 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group-hover:border-primary/50 group-hover:bg-primary/5 transition-all shadow-sm">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center text-gray-400 group-hover:text-primary/70">
                              <Camera className="w-10 h-10 mb-2" />
                              <span className="text-xs font-bold">Upload Photo</span>
                            </div>
                          )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                      </div>
                    </div>
                    
                    <div className="col-span-12 md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2"><label className={labelClass}>Franchise Name *</label><input required type="text" className={inputClass} value={newFranchise.name} onChange={e => setNewFranchise({...newFranchise, name: e.target.value})} placeholder="e.g. Gyanastu Delhi South" /></div>
                      <div><label className={labelClass}>Owner Name *</label><input required type="text" className={inputClass} value={newFranchise.ownerName} onChange={e => setNewFranchise({...newFranchise, ownerName: e.target.value})} placeholder="Owner's full name" /></div>
                      <div><label className={labelClass}>Date of Birth</label><input type="date" className={inputClass} value={newFranchise.dateOfBirth} onChange={e => setNewFranchise({...newFranchise, dateOfBirth: e.target.value})} /></div>
                      <div>
                        <label className={labelClass}>Gender</label>
                        <select className={inputClass} value={newFranchise.gender} onChange={e => setNewFranchise({...newFranchise, gender: e.target.value})}>
                          <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div><label className={labelClass}>Mobile Number *</label><input required type="tel" className={inputClass} value={newFranchise.mobileNumber} onChange={e => setNewFranchise({...newFranchise, mobileNumber: e.target.value})} placeholder="e.g. 9876543210" /></div>
                    <div><label className={labelClass}>Alternate Mobile Number</label><input type="tel" className={inputClass} value={newFranchise.alternateMobileNumber} onChange={e => setNewFranchise({...newFranchise, alternateMobileNumber: e.target.value})} placeholder="Optional" /></div>
                    <div><label className={labelClass}>Email Address *</label><input required type="email" className={inputClass} value={newFranchise.emailAddress} onChange={e => setNewFranchise({...newFranchise, emailAddress: e.target.value})} placeholder="franchise@example.com" /></div>
                  </div>
                </div>

                {/* Business Information */}
                <div>
                  <h4 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Business Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2"><label className={labelClass}>Institute / Center Name *</label><input required type="text" className={inputClass} value={newFranchise.name} onChange={e => setNewFranchise({...newFranchise, name: e.target.value})} placeholder="Institute / Center Name" /></div>
                    <div><label className={labelClass}>Aadhaar Number *</label><input required type="text" className={inputClass} value={newFranchise.aadhaarNumber} onChange={e => setNewFranchise({...newFranchise, aadhaarNumber: e.target.value})} placeholder="12-digit Aadhaar Number" /></div>
                    <div><label className={labelClass}>GST Number *</label><input required type="text" className={inputClass} value={newFranchise.gstNumber} onChange={e => setNewFranchise({...newFranchise, gstNumber: e.target.value})} placeholder="GSTIN" /></div>
                    <div><label className={labelClass}>PAN Number</label><input type="text" className={inputClass} value={newFranchise.panNumber} onChange={e => setNewFranchise({...newFranchise, panNumber: e.target.value})} placeholder="PAN Number" /></div>
                    <div><label className={labelClass}>Establishment Year</label><input type="text" className={inputClass} value={newFranchise.establishmentYear} onChange={e => setNewFranchise({...newFranchise, establishmentYear: e.target.value})} placeholder="YYYY" /></div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h4 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2"><Map className="w-5 h-5 text-primary" /> Address Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2"><label className={labelClass}>Address Line 1 *</label><input required type="text" className={inputClass} value={newFranchise.addressLine1} onChange={e => setNewFranchise({...newFranchise, addressLine1: e.target.value})} placeholder="Street address, building name" /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Address Line 2</label><input type="text" className={inputClass} value={newFranchise.addressLine2} onChange={e => setNewFranchise({...newFranchise, addressLine2: e.target.value})} placeholder="Apartment, suite, unit, etc. (optional)" /></div>
                    <div><label className={labelClass}>City *</label><input required type="text" className={inputClass} value={newFranchise.city} onChange={e => setNewFranchise({...newFranchise, city: e.target.value})} placeholder="City" /></div>
                    <div><label className={labelClass}>District *</label><input required type="text" className={inputClass} value={newFranchise.district} onChange={e => setNewFranchise({...newFranchise, district: e.target.value})} placeholder="District" /></div>
                    <div><label className={labelClass}>State *</label><input required type="text" className={inputClass} value={newFranchise.state} onChange={e => setNewFranchise({...newFranchise, state: e.target.value})} placeholder="State" /></div>
                    <div><label className={labelClass}>PIN Code *</label><input required type="text" className={inputClass} value={newFranchise.pinCode} onChange={e => setNewFranchise({...newFranchise, pinCode: e.target.value})} placeholder="PIN Code" /></div>
                  </div>
                </div>

                {/* System Generated Fields */}
                <div className="pt-4">
                  <h4 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2"><Key className="w-5 h-5 text-primary" /> System Generated Fields <span className="text-xs font-normal text-gray-400 ml-2 mt-1">(Auto Generated - Read Only)</span></h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-gray-50/80 p-5 rounded-xl border border-gray-200">
                    <div><label className={labelClass}>Franchise Code</label><input disabled type="text" className="w-full border border-gray-200 bg-gray-100/50 rounded-lg px-4 py-2 text-sm text-gray-500 font-mono shadow-inner" value="[Auto Generated]" /></div>
                    <div><label className={labelClass}>Username</label><input disabled type="text" className="w-full border border-gray-200 bg-gray-100/50 rounded-lg px-4 py-2 text-sm text-gray-500 font-mono shadow-inner" value="[Auto Generated]" /></div>
                    <div><label className={labelClass}>Password</label><input disabled type="text" className="w-full border border-gray-200 bg-gray-100/50 rounded-lg px-4 py-2 text-sm text-gray-500 font-mono shadow-inner" value="[Auto Generated]" /></div>
                  </div>
                </div>

              </form>
            </div>
            )}
            
            {!newCredentials && (
              <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-4 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                <button type="button" onClick={resetForm} className="px-8 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Reset</button>
                <button type="submit" form="franchiseForm" className="bg-primary text-white font-bold py-3 px-10 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">Register Franchise</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FRANCHISE PROFILE VIEW MODAL */}
      {viewProfileId && viewingFranchise && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-50 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-slide-up flex flex-col max-h-[95vh]">
            
            {/* Profile Header */}
            <div className="relative bg-gradient-to-r from-primary to-accent pt-16 pb-12 px-8 text-center shrink-0 rounded-b-[40px] shadow-sm z-10">
              <button onClick={() => setViewProfileId(null)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 p-2.5 rounded-full transition-colors"><XCircle className="w-6 h-6" /></button>
              
              <div className="w-36 h-36 rounded-full mx-auto mb-5 border-[6px] border-white shadow-2xl overflow-hidden bg-white relative -mt-10">
                <img src={viewingFranchise.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewingFranchise.name}`} alt="Profile" className="w-full h-full object-cover" />
              </div>
              
              <h2 className="text-3xl font-heading font-bold text-white mb-2">{viewingFranchise.name}</h2>
              <p className="text-white/80 font-mono text-lg mb-6 font-bold">{viewingFranchise.franchiseCode || 'CODE_PENDING'}</p>
              
              <div className="flex justify-center gap-3">
                <span className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg ${viewingFranchise.status === 'Active' ? 'bg-green-400 text-green-950' : viewingFranchise.status === 'Suspended' ? 'bg-red-400 text-red-950' : 'bg-orange-400 text-orange-950'}`}>
                  {viewingFranchise.status === 'Active' && "🟢 Active"}
                  {viewingFranchise.status === 'Suspended' && "🔴 Suspended"}
                  {viewingFranchise.status === 'Pending' && "🟡 Pending Approval"}
                </span>
                <span className="px-5 py-2 rounded-full text-sm font-bold bg-white/20 text-white flex items-center gap-2 backdrop-blur-md shadow-lg border border-white/20">
                  <Clock className="w-4 h-4" /> Since {new Date(viewingFranchise.joinedDate).getFullYear()}
                </span>
              </div>
            </div>

            <div className="overflow-y-auto p-8 space-y-8 flex-grow pb-12">
              
              {/* Owner Information */}
              <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h4 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4 mb-5 flex items-center gap-2"><User className="w-6 h-6 text-primary" /> Owner Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Owner Name</p><p className="font-bold text-gray-800 text-lg">{viewingFranchise.ownerName || viewingFranchise.adminName || '—'}</p></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Email Address</p><p className="font-bold text-gray-800 text-lg">{viewingFranchise.emailAddress || '—'}</p></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Mobile Number</p><p className="font-bold text-gray-800 text-lg">{viewingFranchise.mobileNumber || '—'}</p></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Alternate Mobile Number</p><p className="font-bold text-gray-800 text-lg">{viewingFranchise.alternateMobileNumber || '—'}</p></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Aadhaar Number</p><p className="font-mono text-gray-700 font-bold bg-gray-50 px-3 py-1.5 rounded-lg inline-block border border-gray-100">{viewingFranchise.aadhaarNumber || '—'}</p></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">GST Number</p><p className="font-mono text-gray-700 font-bold bg-gray-50 px-3 py-1.5 rounded-lg inline-block border border-gray-100">{viewingFranchise.gstNumber || '—'}</p></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">PAN Number</p><p className="font-mono text-gray-700 font-bold bg-gray-50 px-3 py-1.5 rounded-lg inline-block border border-gray-100">{viewingFranchise.panNumber || '—'}</p></div>
                </div>
              </div>

              {/* Institute Information */}
              <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h4 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4 mb-5 flex items-center gap-2"><Building2 className="w-6 h-6 text-primary" /> Institute Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Institute Name</p><p className="font-bold text-gray-800 text-lg">{viewingFranchise.name || '—'}</p></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Establishment Year</p><p className="font-bold text-gray-800 text-lg">{viewingFranchise.establishmentYear || '—'}</p></div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h4 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4 mb-5 flex items-center gap-2"><Map className="w-6 h-6 text-primary" /> Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <div className="md:col-span-2"><p className="text-xs text-gray-400 font-bold uppercase mb-1">Full Address</p><p className="font-bold text-gray-800 text-lg">{viewingFranchise.addressLine1} {viewingFranchise.addressLine2 ? `, ${viewingFranchise.addressLine2}` : ''}</p></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">City</p><p className="font-bold text-gray-800 text-lg">{viewingFranchise.city || viewingFranchise.location || '—'}</p></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">District</p><p className="font-bold text-gray-800 text-lg">{viewingFranchise.district || '—'}</p></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">State</p><p className="font-bold text-gray-800 text-lg">{viewingFranchise.state || '—'}</p></div>
                  <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">PIN Code</p><p className="font-bold text-gray-800 text-lg">{viewingFranchise.pinCode || '—'}</p></div>
                </div>
              </div>

              {/* Login Information */}
              <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h4 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4 mb-5 flex items-center gap-2"><Key className="w-6 h-6 text-primary" /> Login Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50/80 p-5 rounded-xl border border-gray-100"><p className="text-xs text-gray-500 font-bold uppercase mb-2">Username</p><p className="font-mono text-xl text-primary font-bold">{(viewingFranchise as any).username || viewingFranchise.emailAddress || '—'}</p></div>
                  <div className="bg-gray-50/80 p-5 rounded-xl border border-gray-100"><p className="text-xs text-gray-500 font-bold uppercase mb-2">Franchise Code</p><p className="font-mono text-xl text-gray-800 font-bold">{viewingFranchise.franchiseCode || '—'}</p></div>
                  <div className="bg-gray-50/80 p-5 rounded-xl border border-gray-100"><p className="text-xs text-gray-500 font-bold uppercase mb-2">Account Status</p><p className={`font-bold text-xl ${viewingFranchise.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>{viewingFranchise.status}</p></div>
                </div>
                <p className="text-sm text-gray-400 mt-5 italic flex items-center gap-1.5"><Shield className="w-4 h-4" /> Note: Passwords are encrypted in the database and cannot be viewed by administrators.</p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FranchiseManager;
