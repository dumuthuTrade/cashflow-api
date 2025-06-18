const mongoose = require('mongoose');

const chequeSchema = new mongoose.Schema({
  chequeNumber: {
    type: String,
    required: [true, 'Cheque number is required'],
    trim: true,
    maxLength: [50, 'Cheque number cannot exceed 50 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  status: {
    type: String,
    enum: ['pending', 'cleared', 'bounced', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  bankAccount: {
    type: String,
    trim: true,
    maxLength: [100, 'Bank account cannot exceed 100 characters']
  },
  reference: {
    type: String,
    trim: true,
    maxLength: [100, 'Reference cannot exceed 100 characters']
  },
  clearanceDate: {
    type: Date
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }],
  notes: {
    type: String,
    trim: true,
    maxLength: [1000, 'Notes cannot exceed 1000 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
chequeSchema.index({ dueDate: 1 });
chequeSchema.index({ status: 1 });
chequeSchema.index({ supplier: 1 });
chequeSchema.index({ chequeNumber: 1 });
chequeSchema.index({ createdBy: 1 });

// Virtual for days until due
chequeSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  const diffTime = this.dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status
chequeSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && new Date() > this.dueDate;
});

// Ensure virtuals are included in JSON output
chequeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Cheque', chequeSchema);
