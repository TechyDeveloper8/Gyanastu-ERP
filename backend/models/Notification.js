const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // If null, it could be a global notification
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Info', 'Alert', 'Success', 'Warning'],
    default: 'Info'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId, // Could be Student ID, Franchise ID, etc.
    required: false
  },
  relatedModel: {
    type: String,
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
