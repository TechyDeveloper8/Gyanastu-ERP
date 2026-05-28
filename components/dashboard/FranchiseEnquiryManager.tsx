import React, { useState, useEffect } from 'react';
import { FranchiseEnquiry } from '../../types';
import { Search, Filter, Phone, Mail, Trash2, Download, MapPin, DollarSign, Briefcase } from 'lucide-react';
import { api } from '../../services/api';

const FranchiseEnquiryManager: React.FC = () => {
  const [enquiries, setEnquiries] = useState<FranchiseEnquiry[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const data = await api.getFranchiseEnquiries(statusFilter) as FranchiseEnquiry[];
      setEnquiries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.updateFranchiseEnquiryStatus(id, newStatus);
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus as any } : e));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this franchise enquiry?')) return;
    try {
      await api.deleteFranchiseEnquiry(id);
      setEnquiries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert('Failed to delete enquiry');
    }
  };

  const handleExport = () => {
    const headers = ['Date', 'Full Name', 'Email', 'Mobile', 'City', 'State', 'Experience', 'Investment', 'Location Interest', 'Source', 'Message', 'Status'];
    const csvContent = [
      headers.join(','),
      ...enquiries.map(e => [
        new Date(e.created_at).toLocaleDateString(),
        `"${e.full_name}"`,
        `"${e.email}"`,
        `"${e.mobile}"`,
        `"${e.city || ''}"`,
        `"${e.state || ''}"`,
        `"${(e.business_experience || '').replace(/"/g, '""')}"`,
        `"${e.investment_budget || ''}"`,
        `"${e.location_interest || ''}"`,
        `"${e.source}"`,
        `"${(e.message || '').replace(/"/g, '""')}"`,
        `"${e.status}"`
      ].join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'franchise_enquiries.csv';
    link.click();
  };

  const filteredEnquiries = enquiries.filter(e => 
    e.full_name.toLowerCase().includes(search.toLowerCase()) || 
    e.email.toLowerCase().includes(search.toLowerCase()) || 
    e.mobile.includes(search) ||
    (e.city && e.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-900 text-white p-8 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-heading font-bold mb-2">Franchise Enquiries</h2>
            <p className="opacity-80 text-sm">Manage franchise partner applications and leads.</p>
          </div>
          <button onClick={handleExport} className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-white/20 shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative flex-grow max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, mobile, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              className="w-full md:w-auto border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Pending">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500 font-bold">Loading franchise leads...</div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No franchise enquiries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Applicant Details</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Location & Budget</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Message & Source</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredEnquiries.map(enquiry => (
                  <tr key={enquiry.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-500 whitespace-nowrap text-xs">
                      {new Date(enquiry.created_at).toLocaleDateString()}<br/>
                      <span className="opacity-70">{new Date(enquiry.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{enquiry.full_name}</p>
                      <div className="flex flex-col gap-1 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-blue-500" /> {enquiry.email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-green-500" /> {enquiry.mobile}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 mt-1 text-xs text-gray-600">
                        <span className="flex items-center gap-1 font-bold text-gray-800"><MapPin className="w-3 h-3 text-red-500" /> {enquiry.location_interest || enquiry.city || 'Not specified'}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-500" /> {enquiry.investment_budget || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700 max-w-xs">
                      <p className="truncate text-xs text-gray-500 mb-1 font-semibold uppercase">{enquiry.source}</p>
                      <p className="text-sm truncate" title={enquiry.message}>{enquiry.message || '—'}</p>
                    </td>
                    <td className="p-4">
                       <select 
                         value={enquiry.status}
                         onChange={(e) => handleStatusChange(enquiry.id, e.target.value)}
                         className={`px-3 py-1.5 rounded-lg text-xs font-bold border focus:ring-0 cursor-pointer shadow-sm
                           ${enquiry.status === 'New' ? 'bg-green-50 text-green-700 border-green-200' : 
                             enquiry.status === 'Contacted' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                             enquiry.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                             enquiry.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                             'bg-gray-100 text-gray-600 border-gray-200'}`}
                       >
                         <option value="New">New</option>
                         <option value="Contacted">Contacted</option>
                         <option value="Pending">Pending Review</option>
                         <option value="Approved">Approved</option>
                         <option value="Closed">Closed</option>
                       </select>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(enquiry.id)} className="text-gray-400 hover:text-red-500 p-2 transition-colors" title="Delete Enquiry">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FranchiseEnquiryManager;
