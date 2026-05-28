
const mongoose = require('mongoose');

const franchiseSchema = mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminName: { type: String },
  status: { type: String, enum: ['Active', 'Pending', 'Suspended'], default: 'Pending' },
  studentCount: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  joinedDate: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('Franchise', franchiseSchema);
