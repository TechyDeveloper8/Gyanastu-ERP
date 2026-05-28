
const mongoose = require('mongoose');

const studentSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  
  rollNumber: { type: String, unique: true, sparse: true },
  admissionDate: { type: Date, default: Date.now },
  guardianName: { type: String },
  aadhaarNumber: { type: String },
  bloodGroup: { type: String },
  idCardGeneratedAt: { type: Date },
  
  // Academic & Fees
  attendancePercentage: { type: Number, default: 0 },
  totalFees: { type: Number, required: true },
  feesPaid: { type: Number, default: 0 },
  paymentMode: { type: String, enum: ['Cash', 'Online', 'Cheque'], default: 'Online' },
  
  // ERP Status
  certificateStatus: { type: String, enum: ['Not Eligible', 'Eligible', 'Issued'], default: 'Not Eligible' },
  idCardIssued: { type: Boolean, default: false },
  
  status: { type: String, enum: ['Active', 'Inactive', 'Graduated', 'Suspended', 'Pending'], default: 'Pending' }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('Student', studentSchema);
