
const mongoose = require('mongoose');

const facultySchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
  
  employeeCode: { type: String, unique: true, sparse: true },
  designation: { type: String },
  qualification: { type: String },
  bloodGroup: { type: String },
  emergencyContact: { type: String },
  joinDate: { type: Date, default: Date.now },

  expertise: [{ type: String }],
  assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  assignedBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  
  rating: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Faculty', facultySchema);
