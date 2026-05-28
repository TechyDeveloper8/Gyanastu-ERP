
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'FACULTY', 'STUDENT', 'GUEST'],
    required: true
  },
  status: { type: String, enum: ['Active', 'Blocked', 'Suspended'], default: 'Active' },
  avatarUrl: { type: String },
  phone: { type: String },
  address: { type: String },
  lastLogin: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String, unique: true, sparse: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  isFirstLogin: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
    }
  }
});

module.exports = mongoose.model('User', userSchema);
