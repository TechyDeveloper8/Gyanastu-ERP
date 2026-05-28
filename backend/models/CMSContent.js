
const mongoose = require('mongoose');

const cmsContentSchema = mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g., 'home_hero'
  section: { type: String, required: true },
  content: { type: Map, of: String }, // Flexible key-value pairs
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      // id is already defined as a string field, no need to map _id
      delete ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('CMSContent', cmsContentSchema);
