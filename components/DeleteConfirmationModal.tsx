import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title = "Delete User" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up transform transition-all">
        {/* Header */}
        <div className="bg-red-50 p-6 flex flex-col items-center border-b border-red-100">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-700 text-center uppercase tracking-wide">Warning</h3>
          <p className="text-red-600/80 text-sm mt-1 font-medium text-center">{title}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 font-medium mb-4 text-center">
            This action will permanently delete:
          </p>
          <ul className="space-y-2 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <li className="flex items-center gap-2 text-sm text-gray-600 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> User Account</li>
            <li className="flex items-center gap-2 text-sm text-gray-600 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Documents & Files</li>
            <li className="flex items-center gap-2 text-sm text-gray-600 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Attendance Records</li>
            <li className="flex items-center gap-2 text-sm text-gray-600 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Fees & Payments</li>
            <li className="flex items-center gap-2 text-sm text-gray-600 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Certificates</li>
            <li className="flex items-center gap-2 text-sm text-gray-600 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> All Linked Records</li>
          </ul>
          
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm text-center font-bold">
            This action cannot be undone.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 flex gap-3 justify-end border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-600/30 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
