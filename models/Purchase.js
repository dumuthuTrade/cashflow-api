const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  purchaseOrderId: {
    type: String,
    required: [true, 'Purchase order ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxLength: [30, 'Purchase order ID cannot exceed 30 characters']
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier ID is required']
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Product ID is required']
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxLength: [200, 'Product name cannot exceed 200 characters']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than 0'],
      validate: {
        validator: function(value) {
          return value > 0;
        },
        message: 'Quantity must be a positive number'
      }
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Unit cost must be a valid positive number'
      }
    },
    totalCost: {
      type: Number,
      required: [true, 'Total cost is required'],
      min: [0, 'Total cost cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Total cost must be a valid positive number'
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
    shipping: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Shipping must be a valid positive number'
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
        values: ['cash', 'credit', 'cheque', 'bank_transfer'],
        message: 'Payment method must be cash, credit, cheque, or bank_transfer'
      },
      lowercase: true
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Paid amount must be a valid positive number'
      }
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Remaining amount cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Remaining amount must be a valid positive number'
      }
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function(value) {
          // Only validate due date if there's a remaining amount
          if (this.paymentDetails.remainingAmount > 0 && !value) {
            return false;
          }
          return true;
        },
        message: 'Due date is required when there is a remaining amount to pay'
      }
    },
    chequeDetails: {
      chequeNumber: {
        type: String,
        trim: true,
        maxLength: [20, 'Cheque number cannot exceed 20 characters'],
        validate: {
          validator: function(value) {
            // Only validate cheque number if payment method is cheque
            if (this.parent().paymentMethod === 'cheque' && !value) {
              return false;
            }
            return true;
          },
          message: 'Cheque number is required when payment method is cheque'
        }
      },
      bankName: {
        type: String,
        trim: true,
        maxLength: [100, 'Bank name cannot exceed 100 characters'],
        validate: {
          validator: function(value) {
            // Only validate bank name if payment method is cheque
            if (this.parent().paymentMethod === 'cheque' && !value) {
              return false;
            }
            return true;
          },
          message: 'Bank name is required when payment method is cheque'
        }
      },
      chequeDate: {
        type: Date,
        validate: {
          validator: function(value) {
            // Only validate cheque date if payment method is cheque
            if (this.parent().paymentMethod === 'cheque' && !value) {
              return false;
            }
            return true;
          },
          message: 'Cheque date is required when payment method is cheque'
        }
      }
    }
  },
  deliveryInfo: {
    expectedDate: {
      type: Date,
      required: [true, 'Expected delivery date is required'],
      validate: {
        validator: function(value) {
          return value >= new Date().setHours(0, 0, 0, 0);
        },
        message: 'Expected delivery date cannot be in the past'
      }
    },
    actualDate: {
      type: Date,
      validate: {
        validator: function(value) {
          // Actual date can only be set if status is received or completed
          if (value && !['received', 'completed'].includes(this.status)) {
            return false;
          }
          return true;
        },
        message: 'Actual delivery date can only be set when status is received or completed'
      }
    },
    deliveryStatus: {
      type: String,
      enum: {
        values: ['pending', 'shipped', 'delivered', 'delayed'],
        message: 'Delivery status must be pending, shipped, delivered, or delayed'
      },
      default: 'pending',
      lowercase: true
    }
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['ordered', 'received', 'paid', 'completed'],
      message: 'Status must be ordered, received, paid, or completed'
    },
    default: 'ordered',
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
purchaseSchema.index({ purchaseOrderId: 'text', 'items.productName': 'text' });

// Compound indexes for efficient queries
purchaseSchema.index({ supplierId: 1, status: 1 });
purchaseSchema.index({ status: 1, createdAt: -1 });
purchaseSchema.index({ 'paymentDetails.paymentMethod': 1, status: 1 });
purchaseSchema.index({ 'paymentDetails.dueDate': 1, status: 1 });
purchaseSchema.index({ 'deliveryInfo.expectedDate': 1, status: 1 });

// Pre-save middleware to calculate item totals and remaining amounts
purchaseSchema.pre('save', function(next) {
  // Calculate total cost for each item
  this.items.forEach(item => {
    item.totalCost = item.quantity * item.unitCost;
  });
  
  // Calculate subtotal
  this.transactionSummary.subtotal = this.items.reduce((sum, item) => sum + item.totalCost, 0);
  
  // Calculate total amount
  this.transactionSummary.totalAmount = 
    this.transactionSummary.subtotal + 
    this.transactionSummary.tax + 
    this.transactionSummary.shipping;
  
  // Calculate remaining amount
  this.paymentDetails.remainingAmount = 
    this.transactionSummary.totalAmount - this.paymentDetails.paidAmount;
  
  // Ensure remaining amount is not negative
  if (this.paymentDetails.remainingAmount < 0) {
    this.paymentDetails.remainingAmount = 0;
  }
  
  // Auto-update delivery status based on actual date
  if (this.deliveryInfo.actualDate && this.deliveryInfo.deliveryStatus === 'pending') {
    this.deliveryInfo.deliveryStatus = 'delivered';
  }
  
  next();
});

// Pre-save middleware to validate payment completion
purchaseSchema.pre('save', function(next) {
  // If status is paid or completed, remaining amount should be 0
  if (['paid', 'completed'].includes(this.status) && this.paymentDetails.remainingAmount > 0) {
    return next(new Error('Remaining amount must be 0 when status is paid or completed'));
  }
  
  // If paid amount equals total amount, status should be at least paid
  if (this.paymentDetails.paidAmount >= this.transactionSummary.totalAmount) {
    if (this.status === 'ordered') {
      this.status = 'paid';
    }
  }
  
  next();
});

// Virtual for checking if purchase is overdue
purchaseSchema.virtual('isOverdue').get(function() {
  if (this.paymentDetails.remainingAmount <= 0 || !this.paymentDetails.dueDate) return false;
  return this.paymentDetails.dueDate < new Date();
});

// Virtual for days until due/overdue
purchaseSchema.virtual('daysUntilDue').get(function() {
  if (!this.paymentDetails.dueDate) return null;
  const today = new Date();
  const diffTime = this.paymentDetails.dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for payment completion percentage
purchaseSchema.virtual('paymentCompletionPercentage').get(function() {
  if (this.transactionSummary.totalAmount === 0) return 100;
  return Math.round((this.paymentDetails.paidAmount / this.transactionSummary.totalAmount) * 100);
});

// Virtual for delivery delay status
purchaseSchema.virtual('isDeliveryDelayed').get(function() {
  if (this.deliveryInfo.actualDate) return false;
  return this.deliveryInfo.expectedDate < new Date();
});

// Ensure virtual fields are serialized
purchaseSchema.set('toJSON', { virtuals: true });
purchaseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
