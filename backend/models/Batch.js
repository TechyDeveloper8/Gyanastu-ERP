
const mongoose = require('mongoose');

const batchSchema = mongoose.Schema({
  batchName: { type: String, required: true }, 
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference User model since Faculty are Users
  franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise', required: true }, // Required for franchise ownership
  
  timing: { type: String }, 
  startDate: { type: Date },
  endDate: { type: Date },
  
  capacity: { type: Number, default: 30 },
  classroom: { type: String },
  remarks: { type: String },
  
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
