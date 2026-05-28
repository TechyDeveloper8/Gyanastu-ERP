import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, Download, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';

const StudentFeeView: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const sData: any = await api.getStudents();
        const sList = Array.isArray(sData) ? sData : sData.data || [];
        const studentProfile = sList.find((s: any) => s.email === user?.email || s.user?.email === user?.email);
        setProfile(studentProfile);

        if (studentProfile) {
          const sid = studentProfile.id || studentProfile._id;
          const tData: any = await api.getFees(sid);
          const tList = Array.isArray(tData) ? tData : tData.data || [];
          setTransactions(tList);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (user?.email) fetchData();
  }, [user]);

  if (loading || !profile) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>;

  const pendingAmount = profile.totalFees - (profile.feesPaid || 0);
  const progressPercent = profile.totalFees > 0 ? ((profile.feesPaid || 0) / profile.totalFees) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-heading font-bold text-primary">Financials & Fees</h2>
        <p className="text-gray-500 text-sm">View your fee structure, payment history, and pending dues.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Fee Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-bold uppercase mb-2">Total Course Fee</p>
          <h3 className="text-3xl font-bold text-primary">₹{profile.totalFees.toLocaleString()}</h3>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{width: '100%'}}></div>
          </div>
        </div>

        {/* Paid Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-bold uppercase mb-2">Amount Paid</p>
          <h3 className="text-3xl font-bold text-green-600">₹{(profile.feesPaid || 0).toLocaleString()}</h3>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{width: `${progressPercent}%`}}></div>
          </div>
          <p className="text-xs text-green-600 mt-2 font-bold">{Math.round(progressPercent)}% Cleared</p>
        </div>

        {/* Pending Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-bold uppercase mb-2">Pending Dues</p>
          <h3 className={`text-3xl font-bold ${pendingAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            ₹{pendingAmount.toLocaleString()}
          </h3>
          {pendingAmount > 0 && (
             <button className="mt-4 w-full bg-primary text-white py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg">
               Pay Online Now
             </button>
          )}
          {pendingAmount === 0 && (
             <div className="mt-4 flex items-center gap-2 text-green-600 font-bold text-sm">
               <CheckCircle className="w-4 h-4" /> All Dues Cleared
             </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Transaction History</h3>
          <button className="text-accent text-sm font-bold hover:underline flex items-center gap-1">
             <Download className="w-4 h-4" /> Statement
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                <th className="p-4">Date</th>
                <th className="p-4">Description</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No transactions found.</td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id || tx._id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-600">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-gray-700">{tx.type}</td>
                    <td className="p-4 text-gray-800">₹{tx.amount.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit
                        ${tx.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                          tx.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.status === 'Paid' ? <CheckCircle className="w-3 h-3" /> : 
                         tx.status === 'Pending' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {tx.status === 'Paid' && (
                        <button className="text-gray-400 hover:text-primary transition-colors">
                          <Download className="w-4 h-4 ml-auto" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentFeeView;