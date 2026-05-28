
const mongoose = require('mongoose');

const verificationLogSchema = mongoose.Schema({
  certificateId: { type: String, required: true },
  searchedAt: { type: Date, default: Date.now },
  found: { type: Boolean, default: false },
  source: { type: String, enum: ['active', 'archive', 'not_found'], default: 'not_found' }
}, {
  timestamps: false,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('VerificationLog', verificationLogSchema);
