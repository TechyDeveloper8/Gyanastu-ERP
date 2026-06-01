const mongoose = require('mongoose');

const passwordResetOTPSchema = mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expires_at: { type: Date, required: true },
  used: { type: Boolean, default: false },
  attempt_count: { type: Number, default: 0 },
  resend_count: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('PasswordResetOTP', passwordResetOTPSchema);
