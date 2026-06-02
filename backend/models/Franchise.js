
const mongoose = require('mongoose');

const franchiseSchema = mongoose.Schema({
  franchiseCode: { type: String, unique: true, sparse: true },
  avatarUrl: { type: String },

  name: { type: String, required: true }, // Institute Name
  location: { type: String, required: true }, // Mapped to City for backwards compatibility

  ownerName: { type: String, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String },

  mobileNumber: { type: String, required: true },
  alternateMobileNumber: { type: String },
  emailAddress: { type: String, required: true },

  aadhaarNumber: { type: String, required: true },
  gstNumber: { type: String, required: true },
  panNumber: { type: String },
  establishmentYear: { type: String },

  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pinCode: { type: String, required: true },

  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminName: { type: String }, // Can still be used or derived from ownerName
  
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
