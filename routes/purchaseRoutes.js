const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');

const router = express.Router();

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
const getPurchases = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      status,
      supplierId,
      paymentMethod,
      deliveryStatus,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { createdBy: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (supplierId) {
      query.supplierId = supplierId;
    }
    
    if (paymentMethod) {
      query['paymentDetails.paymentMethod'] = paymentMethod;
    }
    
    if (deliveryStatus) {
      query['deliveryInfo.deliveryStatus'] = deliveryStatus;
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    
    if (search) {
      query.$or = [
        { purchaseOrderId: { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const purchases = await Purchase.find(query)
      .populate('supplierId', 'name email phone')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Purchase.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: purchases.length,
      data: {
        purchases,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Private
const getPurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    }).populate('supplierId', 'name email phone address bankDetails');

    if (!purchase) {
      return res.status(404).json({
        status: 'error',
        message: 'Purchase not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        purchase
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new purchase
// @route   POST /api/purchases
// @access  Private
const createPurchase = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Verify supplier exists and is active
    const supplier = await Supplier.findOne({
      _id: req.body.supplierId,
      createdBy: req.user.id,
      isActive: true
    });

    if (!supplier) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid supplier or supplier not active'
      });
    }

    // Check if purchase order ID already exists
    const existingPurchase = await Purchase.findOne({
      purchaseOrderId: req.body.purchaseOrderId,
      createdBy: req.user.id
    });

    if (existingPurchase) {
      return res.status(400).json({
        status: 'error',
        message: 'Purchase order with this ID already exists'
      });
    }

    const purchase = await Purchase.create({
      ...req.body,
      createdBy: req.user.id
    });

    // Populate supplier data before sending response
    await purchase.populate('supplierId', 'name email phone');

    res.status(201).json({
      status: 'success',
      data: {
        purchase
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update purchase
// @route   PUT /api/purchases/:id
// @access  Private
const updatePurchase = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Verify supplier if being updated
    if (req.body.supplierId) {
      const supplier = await Supplier.findOne({
        _id: req.body.supplierId,
        createdBy: req.user.id,
        isActive: true
      });

      if (!supplier) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid supplier or supplier not active'
        });
      }
    }

    // Check purchase order ID uniqueness
    if (req.body.purchaseOrderId) {
      const existingPurchase = await Purchase.findOne({
        purchaseOrderId: req.body.purchaseOrderId,
        createdBy: req.user.id,
        _id: { $ne: req.params.id }
      });

      if (existingPurchase) {
        return res.status(400).json({
          status: 'error',
          message: 'Purchase order with this ID already exists'
        });
      }
    }

    const purchase = await Purchase.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('supplierId', 'name email phone');

    if (!purchase) {
      return res.status(404).json({
        status: 'error',
        message: 'Purchase not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        purchase
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update purchase status
// @route   PATCH /api/purchases/:id/status
// @access  Private
const updatePurchaseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required'
      });
    }

    const purchase = await Purchase.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { status },
      { new: true, runValidators: true }
    ).populate('supplierId', 'name email phone');

    if (!purchase) {
      return res.status(404).json({
        status: 'error',
        message: 'Purchase not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        purchase
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery status
// @route   PATCH /api/purchases/:id/delivery
// @access  Private
const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { deliveryStatus, actualDate } = req.body;

    if (!deliveryStatus) {
      return res.status(400).json({
        status: 'error',
        message: 'Delivery status is required'
      });
    }

    const updateData = { 'deliveryInfo.deliveryStatus': deliveryStatus };
    if (actualDate) {
      updateData['deliveryInfo.actualDate'] = actualDate;
    }

    const purchase = await Purchase.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      updateData,
      { new: true, runValidators: true }
    ).populate('supplierId', 'name email phone');

    if (!purchase) {
      return res.status(404).json({
        status: 'error',
        message: 'Purchase not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        purchase
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record payment
// @route   PATCH /api/purchases/:id/payment
// @access  Private
const recordPayment = async (req, res, next) => {
  try {
    const { paidAmount, paymentMethod, chequeDetails } = req.body;

    if (!paidAmount || paidAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid paid amount is required'
      });
    }

    const purchase = await Purchase.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!purchase) {
      return res.status(404).json({
        status: 'error',
        message: 'Purchase not found'
      });
    }

    // Update payment details
    purchase.paymentDetails.paidAmount += paidAmount;
    if (paymentMethod) purchase.paymentDetails.paymentMethod = paymentMethod;
    if (chequeDetails) purchase.paymentDetails.chequeDetails = chequeDetails;

    await purchase.save();
    await purchase.populate('supplierId', 'name email phone');

    res.status(200).json({
      status: 'success',
      data: {
        purchase
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete purchase
// @route   DELETE /api/purchases/:id
// @access  Private
const deletePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!purchase) {
      return res.status(404).json({
        status: 'error',
        message: 'Purchase not found'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get purchase statistics
// @route   GET /api/purchases/stats
// @access  Private
const getPurchaseStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      totalPurchases,
      completedPurchases,
      pendingPurchases,
      overduePurchases,
      monthlyPurchases,
      yearlyPurchases,
      paymentMethodStats,
      deliveryStats
    ] = await Promise.all([
      Purchase.countDocuments({ createdBy: userId }),
      Purchase.countDocuments({ createdBy: userId, status: 'completed' }),
      Purchase.countDocuments({ createdBy: userId, status: 'ordered' }),
      Purchase.countDocuments({
        createdBy: userId,
        'paymentDetails.remainingAmount': { $gt: 0 },
        'paymentDetails.dueDate': { $lt: today }
      }),
      Purchase.aggregate([
        { $match: { createdBy: userId, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$transactionSummary.totalAmount' }, count: { $sum: 1 } } }
      ]),
      Purchase.aggregate([
        { $match: { createdBy: userId, createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$transactionSummary.totalAmount' }, count: { $sum: 1 } } }
      ]),
      Purchase.aggregate([
        { $match: { createdBy: userId } },
        { $group: { _id: '$paymentDetails.paymentMethod', count: { $sum: 1 }, total: { $sum: '$transactionSummary.totalAmount' } } }
      ]),
      Purchase.aggregate([
        { $match: { createdBy: userId } },
        { $group: { _id: '$deliveryInfo.deliveryStatus', count: { $sum: 1 } } }
      ])
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalPurchases,
        completedPurchases,
        pendingPurchases,
        overduePurchases,
        monthlyPurchases: monthlyPurchases[0] || { total: 0, count: 0 },
        yearlyPurchases: yearlyPurchases[0] || { total: 0, count: 0 },
        paymentMethodStats,
        deliveryStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Validation middleware
const purchaseValidation = [
  body('purchaseOrderId')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Purchase order ID must be between 1 and 30 characters'),
  body('supplierId')
    .isMongoId()
    .withMessage('Please provide a valid supplier ID'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.productName')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
  body('items.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  body('items.*.unitCost')
    .isFloat({ min: 0 })
    .withMessage('Unit cost must be a positive number'),
  body('transactionSummary.subtotal')
    .isFloat({ min: 0 })
    .withMessage('Subtotal must be a positive number'),
  body('transactionSummary.tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax must be a positive number'),
  body('transactionSummary.shipping')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping must be a positive number'),
  body('transactionSummary.totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('paymentDetails.paymentMethod')
    .isIn(['cash', 'credit', 'cheque', 'bank_transfer'])
    .withMessage('Payment method must be cash, credit, cheque, or bank_transfer'),
  body('deliveryInfo.expectedDate')
    .isISO8601()
    .withMessage('Please provide a valid expected delivery date'),
  body('status')
    .optional()
    .isIn(['ordered', 'received', 'paid', 'completed'])
    .withMessage('Status must be ordered, received, paid, or completed')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['ordered', 'received', 'paid', 'completed'])
    .withMessage('Status must be ordered, received, paid, or completed'),
  query('supplierId')
    .optional()
    .isMongoId()
    .withMessage('Supplier ID must be a valid MongoDB ID'),
  query('paymentMethod')
    .optional()
    .isIn(['cash', 'credit', 'cheque', 'bank_transfer'])
    .withMessage('Payment method must be cash, credit, cheque, or bank_transfer'),
  query('deliveryStatus')
    .optional()
    .isIn(['pending', 'shipped', 'delivered', 'delayed'])
    .withMessage('Delivery status must be pending, shipped, delivered, or delayed'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'transactionSummary.totalAmount', 'purchaseOrderId', 'status', 'deliveryInfo.expectedDate'])
    .withMessage('Sort by must be one of: createdAt, transactionSummary.totalAmount, purchaseOrderId, status, deliveryInfo.expectedDate'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const statusUpdateValidation = [
  body('status')
    .isIn(['ordered', 'received', 'paid', 'completed'])
    .withMessage('Status must be ordered, received, paid, or completed')
];

const deliveryUpdateValidation = [
  body('deliveryStatus')
    .isIn(['pending', 'shipped', 'delivered', 'delayed'])
    .withMessage('Delivery status must be pending, shipped, delivered, or delayed'),
  body('actualDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid actual delivery date')
];

const paymentValidation = [
  body('paidAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Paid amount must be greater than 0'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'credit', 'cheque', 'bank_transfer'])
    .withMessage('Payment method must be cash, credit, cheque, or bank_transfer')
];

// Routes
router.get('/stats', getPurchaseStats);
router.get('/', queryValidation, getPurchases);
router.get('/:id', getPurchase);
router.post('/', purchaseValidation, createPurchase);
router.put('/:id', purchaseValidation, updatePurchase);
router.patch('/:id/status', statusUpdateValidation, updatePurchaseStatus);
router.patch('/:id/delivery', deliveryUpdateValidation, updateDeliveryStatus);
router.patch('/:id/payment', paymentValidation, recordPayment);
router.delete('/:id', deletePurchase);

module.exports = router;
