
const mongoose = require('mongoose');

const batchSchema = mongoose.Schema({
  name: { type: String, required: true }, // e.g. WD-2023-A
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
  
  schedule: { type: String }, // e.g. "Mon, Wed, Fri - 10:00 AM"
  startDate: { type: Date },
  endDate: { type: Date },
  
  maxStudents: { type: Number, default: 30 },
  currentStudents: { type: Number, default: 0 },
  
  status: { type: String, enum: ['Upcoming', 'Active', 'Completed'], default: 'Active' }
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

module.exports = mongoose.model('Batch', batchSchema);
