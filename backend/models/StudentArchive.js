
const mongoose = require('mongoose');

const studentArchiveSchema = mongoose.Schema({
  studentName: { type: String, required: true },
  fatherName: { type: String },
  motherName: { type: String },
  mobileNumber: { type: String },
  enrollmentNumber: { type: String },
  certificateId: { type: String, required: true, unique: true },
  courseName: { type: String },
  batch: { type: String },
  session: { type: String },
  aadharNumber: { type: Number, required: true, unique: true },
  admissionDate: { type: Date },
  completionDate: { type: Date },
  grade: { type: String },
  resultStatus: { type: String, enum: ['Pass', 'Fail', 'Distinction'], default: 'Pass' },
  remarks: { type: String }
}, {
  timestamps: true,
  collection: 'student_archive_records',
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret.__v;
    }
  }
});

// Index for fast text search lookups\nstudentArchiveSchema.index({ studentName: 'text', courseName: 'text', session: 'text', batch: 'text' });

module.exports = mongoose.model('StudentArchive', studentArchiveSchema);
