
const mongoose = require('mongoose');

const courseSchema = mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true },
  category: { type: String, required: true },
  duration: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  description: { type: String },
  learningOutcomes: [{ type: String }],
  price: { type: Number, required: true },
  thumbnail: { type: String },
  syllabusUrl: { type: String },
  status: { type: String, enum: ['Active', 'Inactive', 'Archived'], default: 'Active' }
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

module.exports = mongoose.model('Course', courseSchema);
