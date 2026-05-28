
const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  date: { type: Date, required: true },
  
  status: { type: String, enum: ['Present', 'Absent', 'Late'], required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Faculty User ID
  isLocked: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Prevent duplicate attendance for same student in same batch on same day
attendanceSchema.index({ student: 1, batch: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
