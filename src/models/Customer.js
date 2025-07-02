const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerCode: {
    type: String,
    required: [true, 'Customer code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxLength: [20, 'Customer code cannot exceed 20 characters']
  },
  personalInfo: {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxLength: [100, 'Customer name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^(?:\+94|0)(?:(11|21|23|24|25|26|27|31|32|33|34|35|36|37|38|41|45|47|51|52|54|55|57|63|65|66|67|81|91)(0|2|3|4|5|7|9)|7(?:0|1|2|4|5|6|7|8)\d)\d{6}$/, 'Please enter a valid Sri Lankan phone number'],
      trim: true,
      maxLength: [20, 'Phone number cannot exceed 20 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    address: {
        type: String,
        trim: true,
        maxLength: [255, 'Address cannot exceed 255 characters']
    },
    identificationNumber: {
      type: String,
      trim: true,
    }
  },
  creditProfile: {
    rating: {
      type: Number,
      min: [1, 'Credit rating must be at least 1'],
      max: [10, 'Credit rating cannot exceed 10'],
      default: 5
    },
    creditLimit: {
      type: Number,
      min: [0, 'Credit limit cannot be negative'],
      default: 0
    },
    availableCredit: {
      type: Number,
      min: [0, 'Available credit cannot be negative'],
      default: 0
    },
    paymentTerms: {
      type: Number,
      min: [0, 'Payment terms cannot be negative'],
      default: 30,
      validate: {
        validator: Number.isInteger,
        message: 'Payment terms must be a whole number of days'
      }
    },
    riskCategory: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Risk category must be either low, medium, or high'
      },
      default: 'medium',
      lowercase: true
    },
    creditHistory: [{
      date: {
        type: Date,
        default: Date.now
      },
      previousRating: {
        type: Number,
        min: [1, 'Previous rating must be at least 1'],
        max: [10, 'Previous rating cannot exceed 10']
      },
      newRating: {
        type: Number,
        min: [1, 'New rating must be at least 1'],
        max: [10, 'New rating cannot exceed 10']
      },
      reason: {
        type: String,
        trim: true,
        maxLength: [500, 'Reason cannot exceed 500 characters']
      }
    }]
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'suspended'],
      message: 'Status must be either active, inactive, or suspended'
    },
    default: 'active',
    lowercase: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for search functionality
customerSchema.index({ 'personalInfo.name': 'text', 'personalInfo.phone': 'text', customerCode: 'text' });

// Compound index for efficient queries
customerSchema.index({ status: 1, 'creditProfile.riskCategory': 1 });

// Pre-save middleware to ensure availableCredit doesn't exceed creditLimit
customerSchema.pre('save', function(next) {
  if (this.creditProfile.availableCredit > this.creditProfile.creditLimit) {
    this.creditProfile.availableCredit = this.creditProfile.creditLimit;
  }
  next();
});

// Virtual for credit utilization percentage
customerSchema.virtual('creditProfile.utilizationPercentage').get(function() {
  if (this.creditProfile.creditLimit === 0) return 0;
  const used = this.creditProfile.creditLimit - this.creditProfile.availableCredit;
  return Math.round((used / this.creditProfile.creditLimit) * 100);
});

// Ensure virtual fields are serialized
customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);