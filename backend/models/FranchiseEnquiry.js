const mongoose = require('mongoose');

const franchiseEnquirySchema = mongoose.Schema({
  full_name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  business_experience: { type: String },
  investment_budget: { type: String },
  location_interest: { type: String },
  message: { type: String },
  source: { type: String, default: 'Website Franchise Page' },
  status: { type: String, enum: ['New', 'Contacted', 'Approved', 'Pending', 'Closed'], default: 'New' }
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
franchiseEnquirySchema.index({ status: 1 });
franchiseEnquirySchema.index({ created_at: -1 });

module.exports = mongoose.model('FranchiseEnquiry', franchiseEnquirySchema);
