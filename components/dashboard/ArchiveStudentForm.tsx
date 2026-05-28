import React, { useState, useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { ArchiveStudent } from '../../types';

interface Props {
  student?: ArchiveStudent | null;
  onClose: () => void;
  onSave: (data: Partial<ArchiveStudent>) => Promise<void>;
}

const ArchiveStudentForm: React.FC<Props> = ({ student, onClose, onSave }) => {
  const [form, setForm] = useState({
    studentName: '',
    fatherName: '',
    motherName: '',
    mobileNumber: '',
    enrollmentNumber: '',
    certificateId: '',
    courseName: '',
    aadharNumber: '',
    batch: '',
    session: '',
    admissionDate: '',
    completionDate: '',
    grade: '',
    resultStatus: 'Pass' as string,
    remarks: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (student) {
      setForm({
        studentName: student.studentName || '',
        fatherName: student.fatherName || '',
        motherName: student.motherName || '',
        mobileNumber: student.mobileNumber || '',
        enrollmentNumber: student.enrollmentNumber || '',
        certificateId: student.certificateId || '',
        courseName: student.courseName || '',
        aadharNumber: student.aadharNumber || '',
        batch: student.batch || '',
        session: student.session || '',
        admissionDate: student.admissionDate ? student.admissionDate.split('T')[0] : '',
        completionDate: student.completionDate ? student.completionDate.split('T')[0] : '',
        grade: student.grade || '',
        resultStatus: student.resultStatus || 'Pass',
        remarks: student.remarks || ''
      });
    }
  }, [student]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName.trim() || !form.certificateId.trim()) {
      setError('Student Name and Certificate ID are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data: any = { ...form };
      if (data.admissionDate) data.admissionDate = new Date(data.admissionDate).toISOString();
      else delete data.admissionDate;
      if (data.completionDate) data.completionDate = new Date(data.completionDate).toISOString();
      else delete data.completionDate;
      await onSave(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-xl font-heading font-bold text-primary">
            {student ? 'Edit Archive Record' : 'Add Archive Record'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Student Name *</label>
              <input name="studentName" value={form.studentName} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Certificate ID *</label>
              <input name="certificateId" value={form.certificateId} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono" placeholder="e.g. CERT-2020-001" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Father's Name</label>
              <input name="fatherName" value={form.fatherName} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Mother's Name</label>
              <input name="motherName" value={form.motherName} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Mobile Number</label>
              <input name="mobileNumber" value={form.mobileNumber} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" placeholder="10-digit mobile" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Enrollment Number</label>
              <input name="enrollmentNumber" value={form.enrollmentNumber} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Course Name</label>
              <input name="courseName" value={form.courseName} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Batch</label>
              <input name="batch" value={form.batch} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Session</label>
              <input name="session" value={form.session} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" placeholder="e.g. 2020-21" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Grade</label>
              <input name="grade" value={form.grade} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" placeholder="e.g. A+" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Aadhar Last 4 Digits *</label>
              <input name="aadharNumber" value={form.aadharNumber} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" placeholder="e.g. 1234" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Result Status </label>
              <select name="resultStatus" value={form.resultStatus} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm bg-white">
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="Distinction">Distinction</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Admission Date</label>
              <input type="date" name="admissionDate" value={form.admissionDate} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Completion Date</label>
              <input type="date" name="completionDate" value={form.completionDate} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Remarks</label>
            <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none" placeholder="Any additional notes..." />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {student ? 'Update Record' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArchiveStudentForm;
