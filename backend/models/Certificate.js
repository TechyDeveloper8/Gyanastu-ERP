
const mongoose = require('mongoose');

const certificateSchema = mongoose.Schema({
  certificateId: { type: String, required: true, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  
  issueDate: { type: Date, default: Date.now },
  validUntil: { type: Date },
  qrCodeData: { type: String }, // URL or hash
  
  grade: { type: String, default: 'A' },
  regNo: { type: String },
  studentName: { type: String },
  courseName: { type: String },
  templateId: { type: String, default: 'certi.pdf' },
  pdfUrl: { type: String },

  status: { type: String, enum: ['Valid', 'Revoked', 'Expired'], default: 'Valid' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Super Admin
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret.certificateId; // Frontend uses ID
      delete ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('Certificate', certificateSchema);
