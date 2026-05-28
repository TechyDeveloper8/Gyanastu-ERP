const mongoose = require('mongoose');

const studyMaterialSchema = mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['PDF', 'Video', 'Assignment', 'Link'], required: true },
  url: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  uploadedBy: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Archived'], default: 'Active' },
}, {
  timestamps: true
});

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
