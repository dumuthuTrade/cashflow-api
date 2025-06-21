const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxLength: [30, 'Transaction ID cannot exceed 30 characters']
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required']
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
    //   required: [true, 'Product ID is required']
    },
    productName: {
      type: String,
    //   required: [true, 'Product name is required'],
      trim: true,
      maxLength: [200, 'Product name cannot exceed 200 characters']
    },
    quantity: {
      type: Number,
    //   required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than 0'],
      validate: {
        validator: function(value) {
          return value > 0;
        },
        message: 'Quantity must be a positive number'
      }
    },
    unitPrice: {
      type: Number,
    //   required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Unit price must be a valid positive number'
      }
    },
    totalPrice: {
      type: Number,
    //   required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Total price must be a valid positive number'
      }
    }
  }],
  transactionSummary: {
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Subtotal must be a valid positive number'
      }
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Tax must be a valid positive number'
      }
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Discount must be a valid positive number'
      }
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Total amount must be a valid positive number'
      }
    }
  },
  paymentDetails: {
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['cash', 'credit', 'mixed'],
        message: 'Payment method must be either cash, credit, or mixed'
      },
      lowercase: true
    },
    cashAmount: {
      type: Number,
      default: 0,
      min: [0, 'Cash amount cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Cash amount must be a valid positive number'
      }
    },
    creditAmount: {
      type: Number,
      default: 0,
      min: [0, 'Credit amount cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Credit amount must be a valid positive number'
      }
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function(value) {
          // Only validate due date if there's a credit amount
          if (this.paymentDetails.creditAmount > 0 && !value) {
            return false;
          }
          // If due date is provided, it should be in the future
          if (value && value <= new Date()) {
            return false;
          }
          return true;
        },
        message: 'Due date is required for credit transactions and must be in the future'
      }
    }
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['completed', 'pending', 'cancelled'],
      message: 'Status must be either completed, pending, or cancelled'
    },
    default: 'pending',
    lowercase: true
  },
  salesPerson: {
    type: String,
    required: [true, 'Sales person is required'],
    trim: true,
    maxLength: [100, 'Sales person name cannot exceed 100 characters']
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
salesSchema.index({ transactionId: 'text', 'items.productName': 'text', salesPerson: 'text' });

// Compound indexes for efficient queries
salesSchema.index({ customerId: 1, status: 1 });
salesSchema.index({ status: 1, createdAt: -1 });
salesSchema.index({ 'paymentDetails.paymentMethod': 1, status: 1 });
salesSchema.index({ 'paymentDetails.dueDate': 1, status: 1 });

// Pre-save middleware to validate payment amounts
salesSchema.pre('save', function(next) {
  const paymentTotal = this.paymentDetails.cashAmount + this.paymentDetails.creditAmount;
  const totalAmount = this.transactionSummary.totalAmount;
  
  // Check if payment amounts match total amount
  if (Math.abs(paymentTotal - totalAmount) > 0.01) {
    return next(new Error('Payment amounts must equal the total transaction amount'));
  }
  
  // Set payment method based on amounts
  if (this.paymentDetails.cashAmount > 0 && this.paymentDetails.creditAmount > 0) {
    this.paymentDetails.paymentMethod = 'mixed';
  } else if (this.paymentDetails.cashAmount > 0) {
    this.paymentDetails.paymentMethod = 'cash';
  } else if (this.paymentDetails.creditAmount > 0) {
    this.paymentDetails.paymentMethod = 'credit';
  }
  
  next();
});

// Pre-save middleware to calculate item totals
salesSchema.pre('save', function(next) {
  // Calculate total price for each item
  this.items.forEach(item => {
    item.totalPrice = item.quantity * item.unitPrice;
  });
  
  // Calculate subtotal
  this.transactionSummary.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate total amount
  this.transactionSummary.totalAmount = 
    this.transactionSummary.subtotal + 
    this.transactionSummary.tax - 
    this.transactionSummary.discount;
  
  next();
});

// Virtual for checking if transaction is overdue
salesSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'pending' || !this.paymentDetails.dueDate) return false;
  return this.paymentDetails.dueDate < new Date();
});

// Virtual for days until due/overdue
salesSchema.virtual('daysUntilDue').get(function() {
  if (!this.paymentDetails.dueDate) return null;
  const today = new Date();
  const diffTime = this.paymentDetails.dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
salesSchema.set('toJSON', { virtuals: true });
salesSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Sales', salesSchema);