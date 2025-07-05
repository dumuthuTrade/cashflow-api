const mongoose = require('mongoose');

const chequeSchema = new mongoose.Schema({
  chequeNumber: {
    type: String,
    unique: true,
    trim: true,
    maxLength: [50, 'Cheque number cannot exceed 50 characters']
  },  
  type: {
    type: String,
    required: [true, 'Cheque type is required'],
    enum: {
      values: ['issued', 'received'],
      message: 'Cheque type must be issued'
    },
    default: 'issued',
    lowercase: true
  },
  relatedTransaction: {
    // transactionId: {
    //   // type: mongoose.Schema.Types.ObjectId,
    //   // required: [true, 'Transaction ID is required']
    // },
    transactionType: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['sale', 'purchase'],
        message: 'Transaction type must be either sale or purchase'
      },
      lowercase: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      validate: {
        validator: function(value) {
          // Customer ID is required for sales transactions
          if (this.relatedTransaction.transactionType === 'sale' && !value) {
            return false;
          }
          return true;
        },
        message: 'Customer ID is required for sale transactions'
      }
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      validate: {
        validator: function(value) {
          // Supplier ID is required for purchase transactions
          if (this.relatedTransaction.transactionType === 'purchase' && !value) {
            return false;
          }
          return true;
        },
        message: 'Supplier ID is required for purchase transactions'
      }
    }
  },
  chequeDetails: {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value > 0;
        },
        message: 'Amount must be a valid positive number'
      }
    },
    chequeDate: {
      type: Date,
      required: [true, 'Cheque date is required']
    },
    // depositDate: {
    //   type: Date,
    //   validate: {
    //     validator: function(value) {
    //       // Deposit date should not be before cheque date
    //       if (value && this.chequeDetails.chequeDate && value < this.chequeDetails.chequeDate) {
    //         return false;
    //       }
    //       return true;
    //     },
    //     message: 'Deposit date cannot be before cheque date'
    //   }
    // },
    // bankName: {
    //   type: String,
    //   required: [true, 'Bank name is required'],
    //   trim: true,
    //   maxLength: [100, 'Bank name cannot exceed 100 characters']
    // },
    // accountNumber: {
    //   type: String,
    //   required: [true, 'Account number is required'],
    //   trim: true,
    //   maxLength: [50, 'Account number cannot exceed 50 characters']
    // },
    // drawerName: {
    //   type: String,
    //   required: [true, 'Drawer name is required'],
    //   trim: true,
    //   maxLength: [100, 'Drawer name cannot exceed 100 characters']
    // },    
    // payeeName: {
    //   type: String,
    //   required: [true, 'Payee name is required'],
    //   trim: true,
    //   maxLength: [100, 'Payee name cannot exceed 100 characters']
    // },
    clearanceDate: {
      type: Date,
      validate: {
        validator: function(value) {
          // Clearance date should not be before cheque date
          if (value && this.chequeDetails.chequeDate && value < this.chequeDetails.chequeDate) {
            return false;
          }
          return true;
        },
        message: 'Clearance date cannot be before cheque date'
      }
    }
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['pending', 'cleared', 'bounced', 'cancelled', 'deposited'],
      message: 'Status must be pending, cleared, bounced, cancelled, or deposited'
    },
    default: 'pending',
    lowercase: true
  },
  statusHistory: [{
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['pending', 'cleared', 'bounced', 'cancelled', 'deposited'],
      lowercase: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxLength: [500, 'Status notes cannot exceed 500 characters']
    }
  }],
  bankProcessing: {
    // depositDate: {
    //   type: Date,
    //   validate: {
    //     validator: function(value) {
    //       // Deposit date should not be before cheque date
    //       if (value && this.chequeDetails.chequeDate && value < this.chequeDetails.chequeDate) {
    //         return false;
    //       }
    //       return true;
    //     },
    //     message: 'Bank deposit date cannot be before cheque date'
    //   }
    // },
    // clearanceDate: {
    //   type: Date,
    //   validate: {
    //     validator: function(value) {
    //       // Clearance date should not be before deposit date
    //       if (value && this.bankProcessing.depositDate && value < this.bankProcessing.depositDate) {
    //         return false;
    //       }
    //       return true;
    //     },
    //     message: 'Clearance date cannot be before deposit date'
    //   }
    // },
    bounceDate: {
      type: Date,
      validate: {
        validator: function(value) {
          // Bounce date should not be before deposit date
          if (value && this.bankProcessing.depositDate && value < this.bankProcessing.depositDate) {
            return false;
          }
          return true;
        },
        message: 'Bounce date cannot be before deposit date'
      }
    },
    bounceReason: {
      type: String,
      trim: true,
      maxLength: [200, 'Bounce reason cannot exceed 200 characters'],
      validate: {
        validator: function(value) {
          // Bounce reason is required when status is bounced
          if (this.status === 'bounced' && !value) {
            return false;
          }
          return true;
        },
        message: 'Bounce reason is required when cheque status is bounced'
      }
    },
    bankCharges: {
      type: Number,
      default: 0,
      min: [0, 'Bank charges cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Bank charges must be a valid positive number'
      }
    }
  },  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
chequeSchema.index({ type: 1, status: 1 });
chequeSchema.index({ 'relatedTransaction.transactionType': 1, status: 1 });
chequeSchema.index({ 'relatedTransaction.customerId': 1 });
chequeSchema.index({ 'relatedTransaction.supplierId': 1 });
chequeSchema.index({ 'chequeDetails.chequeDate': 1 });
chequeSchema.index({ 'bankProcessing.clearanceDate': 1 });
chequeSchema.index({ status: 1, 'chequeDetails.chequeDate': 1 });

// Pre-save middleware to add status history entry when status changes
chequeSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      date: new Date(),
      notes: `Status changed to ${this.status}`
    });
  } else if (this.isNew) {
    // Add initial status for new cheques
    this.statusHistory.push({
      status: this.status,
      date: new Date(),
      notes: 'Cheque created'
    });
  }
  next();
});

// Pre-save middleware to update bank processing dates and cheque details based on status
chequeSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.isModified('status')) {
    switch (this.status) {
      case 'deposited':
        if (!this.bankProcessing.depositDate) {
          this.bankProcessing.depositDate = now;
        }
        break;
      case 'cleared':
        if (!this.bankProcessing.clearanceDate) {
          this.bankProcessing.clearanceDate = now;
        }
        // Also update clearance date in chequeDetails for consistency
        if (!this.chequeDetails.clearanceDate) {
          this.chequeDetails.clearanceDate = now;
        }
        break;
      case 'bounced':
        if (!this.bankProcessing.bounceDate) {
          this.bankProcessing.bounceDate = now;
        }
        break;
    }
  }
  next();
});

// Virtual for days since cheque date
chequeSchema.virtual('daysSinceChequeDate').get(function() {
  const today = new Date();
  const diffTime = today - this.chequeDetails.chequeDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for processing duration (from deposit to clearance)
chequeSchema.virtual('processingDuration').get(function() {
  if (!this.bankProcessing.depositDate || !this.bankProcessing.clearanceDate) return null;
  const diffTime = this.bankProcessing.clearanceDate - this.bankProcessing.depositDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status (pending cheques older than 30 days)
chequeSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'pending') return false;
  return this.daysSinceChequeDate > 30;
});

// Virtual to get the current related entity (customer or supplier)
chequeSchema.virtual('relatedEntity').get(function() {
  return this.relatedTransaction.customerId || this.relatedTransaction.supplierId;
});

// Method to add status history entry
chequeSchema.methods.addStatusHistory = function(status, notes) {
  this.statusHistory.push({
    status: status.toLowerCase(),
    date: new Date(),
    notes: notes
  });
  this.status = status.toLowerCase();
  return this.save();
};

// Method to get latest status history
chequeSchema.methods.getLatestStatusHistory = function() {
  return this.statusHistory[this.statusHistory.length - 1];
};

// Ensure virtuals are included in JSON output
chequeSchema.set('toJSON', { virtuals: true });
chequeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cheque', chequeSchema);
