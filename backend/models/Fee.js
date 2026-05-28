
const mongoose = require('mongoose');

const feeSchema = mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Tuition', 'Registration', 'Exam', 'Late Fee'], default: 'Tuition' },
  paymentMode: { type: String, enum: ['Cash', 'Online', 'Cheque', 'Bank Transfer'], default: 'Online' },
  transactionId: { type: String },
  
  status: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Paid' },
  receiptId: { type: String, unique: true },
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Fee', feeSchema);
