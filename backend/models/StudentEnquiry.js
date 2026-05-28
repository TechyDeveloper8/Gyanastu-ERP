const mongoose = require('mongoose');

const studentEnquirySchema = mongoose.Schema({
  student_name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  course_interest: { type: String },
  address: { type: String },
  message: { type: String },
  source: { type: String, default: 'Website Contact Page' },
  status: { type: String, enum: ['New', 'Contacted', 'Converted', 'Closed'], default: 'New' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

// Index for faster searching and filtering
studentEnquirySchema.index({ status: 1 });
studentEnquirySchema.index({ created_at: -1 });

module.exports = mongoose.model('StudentEnquiry', studentEnquirySchema);
