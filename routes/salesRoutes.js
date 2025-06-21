const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Sales = require('../models/Sales');
const Customer = require('../models/Customer');

const router = express.Router();

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res, next) => {
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
      customerId,
      paymentMethod,
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
    
    if (customerId) {
      query.customerId = customerId;
    }
    
    if (paymentMethod) {
      query['paymentDetails.paymentMethod'] = paymentMethod;
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } },
        { salesPerson: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const sales = await Sales.find(query)
      .populate('customerId', 'customerCode personalInfo.name personalInfo.email personalInfo.phone')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sales.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: sales.length,
      data: {
        sales,
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

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
const getSale = async (req, res, next) => {
  try {
    const sale = await Sales.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    }).populate('customerId', 'customerCode personalInfo creditProfile');

    if (!sale) {
      return res.status(404).json({
        status: 'error',
        message: 'Sale not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        sale
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Verify customer exists and is active
    const customer = await Customer.findOne({
      _id: req.body.customerId,
      createdBy: req.user.id,
      status: 'active'
    });

    if (!customer) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid customer or customer not active'
      });
    }

    // Check if transaction ID already exists
    const existingSale = await Sales.findOne({
      transactionId: req.body.transactionId,
      createdBy: req.user.id
    });

    if (existingSale) {
      return res.status(400).json({
        status: 'error',
        message: 'Transaction with this ID already exists'
      });
    }

    // Check credit limit for credit transactions
    if (req.body.paymentDetails && req.body.paymentDetails.creditAmount > 0) {
      const creditAmount = req.body.paymentDetails.creditAmount;
      if (creditAmount > customer.creditProfile.availableCredit) {
        return res.status(400).json({
          status: 'error',
          message: 'Credit amount exceeds available credit limit'
        });
      }
    }

    const sale = await Sales.create({
      ...req.body,
      createdBy: req.user.id
    });

    // Update customer's available credit if credit is used
    if (sale.paymentDetails.creditAmount > 0) {
      customer.creditProfile.availableCredit -= sale.paymentDetails.creditAmount;
      await customer.save();
    }

    // Populate customer data before sending response
    await sale.populate('customerId', 'customerCode personalInfo.name personalInfo.email');

    res.status(201).json({
      status: 'success',
      data: {
        sale
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update sale
// @route   PUT /api/sales/:id
// @access  Private
const updateSale = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Get current sale
    const currentSale = await Sales.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!currentSale) {
      return res.status(404).json({
        status: 'error',
        message: 'Sale not found'
      });
    }

    // Verify customer if being updated
    if (req.body.customerId && req.body.customerId !== currentSale.customerId.toString()) {
      const customer = await Customer.findOne({
        _id: req.body.customerId,
        createdBy: req.user.id,
        status: 'active'
      });

      if (!customer) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid customer or customer not active'
        });
      }
    }

    // Check transaction ID uniqueness
    if (req.body.transactionId && req.body.transactionId !== currentSale.transactionId) {
      const existingSale = await Sales.findOne({
        transactionId: req.body.transactionId,
        createdBy: req.user.id,
        _id: { $ne: req.params.id }
      });

      if (existingSale) {
        return res.status(400).json({
          status: 'error',
          message: 'Transaction with this ID already exists'
        });
      }
    }

    const sale = await Sales.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('customerId', 'customerCode personalInfo.name personalInfo.email');

    res.status(200).json({
      status: 'success',
      data: {
        sale
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update sale status
// @route   PATCH /api/sales/:id/status
// @access  Private
const updateSaleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required'
      });
    }

    const sale = await Sales.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { status },
      { new: true, runValidators: true }
    ).populate('customerId', 'customerCode personalInfo.name personalInfo.email');

    if (!sale) {
      return res.status(404).json({
        status: 'error',
        message: 'Sale not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        sale
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete sale
// @route   DELETE /api/sales/:id
// @access  Private
const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sales.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!sale) {
      return res.status(404).json({
        status: 'error',
        message: 'Sale not found'
      });
    }

    // Restore customer credit if credit was used
    if (sale.paymentDetails.creditAmount > 0) {
      const customer = await Customer.findById(sale.customerId);
      if (customer) {
        customer.creditProfile.availableCredit += sale.paymentDetails.creditAmount;
        await customer.save();
      }
    }

    await Sales.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales statistics
// @route   GET /api/sales/stats
// @access  Private
const getSalesStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      totalSales,
      completedSales,
      pendingSales,
      monthlySales,
      yearlySales,
      paymentMethodStats,
      overdueSales
    ] = await Promise.all([
      Sales.countDocuments({ createdBy: userId }),
      Sales.countDocuments({ createdBy: userId, status: 'completed' }),
      Sales.countDocuments({ createdBy: userId, status: 'pending' }),
      Sales.aggregate([
        { $match: { createdBy: userId, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$transactionSummary.totalAmount' }, count: { $sum: 1 } } }
      ]),
      Sales.aggregate([
        { $match: { createdBy: userId, createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$transactionSummary.totalAmount' }, count: { $sum: 1 } } }
      ]),
      Sales.aggregate([
        { $match: { createdBy: userId } },
        { $group: { _id: '$paymentDetails.paymentMethod', count: { $sum: 1 }, total: { $sum: '$transactionSummary.totalAmount' } } }
      ]),
      Sales.countDocuments({
        createdBy: userId,
        status: 'pending',
        'paymentDetails.dueDate': { $lt: today }
      })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalSales,
        completedSales,
        pendingSales,
        overdueSales,
        monthlySales: monthlySales[0] || { total: 0, count: 0 },
        yearlySales: yearlySales[0] || { total: 0, count: 0 },
        paymentMethodStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Validation middleware
const salesValidation = [
  body('transactionId')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Transaction ID must be between 1 and 30 characters'),
  body('customerId')
    .isMongoId()
    .withMessage('Please provide a valid customer ID'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.productName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Product name cannot exceed 200 characters'),
  body('items.*.quantity')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  body('transactionSummary.subtotal')
    .isFloat({ min: 0 })
    .withMessage('Subtotal must be a positive number'),
  body('transactionSummary.tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax must be a positive number'),
  body('transactionSummary.discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a positive number'),
  body('transactionSummary.totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('paymentDetails.paymentMethod')
    .isIn(['cash', 'credit', 'mixed'])
    .withMessage('Payment method must be cash, credit, or mixed'),
  body('paymentDetails.cashAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cash amount must be a positive number'),
  body('paymentDetails.creditAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit amount must be a positive number'),
  body('paymentDetails.dueDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid due date'),
  body('status')
    .optional()
    .isIn(['completed', 'pending', 'cancelled'])
    .withMessage('Status must be completed, pending, or cancelled'),
  body('salesPerson')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Sales person must be between 1 and 100 characters')
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
    .isIn(['completed', 'pending', 'cancelled'])
    .withMessage('Status must be completed, pending, or cancelled'),
  query('customerId')
    .optional()
    .isMongoId()
    .withMessage('Customer ID must be a valid MongoDB ID'),
  query('paymentMethod')
    .optional()
    .isIn(['cash', 'credit', 'mixed'])
    .withMessage('Payment method must be cash, credit, or mixed'),
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
    .isIn(['createdAt', 'transactionSummary.totalAmount', 'transactionId', 'status'])
    .withMessage('Sort by must be one of: createdAt, transactionSummary.totalAmount, transactionId, status'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const statusUpdateValidation = [
  body('status')
    .isIn(['completed', 'pending', 'cancelled'])
    .withMessage('Status must be completed, pending, or cancelled')
];

// Routes
router.get('/stats', getSalesStats);
router.get('/', queryValidation, getSales);
router.get('/:id', getSale);
router.post('/', salesValidation, createSale);
router.put('/:id', salesValidation, updateSale);
router.patch('/:id/status', statusUpdateValidation, updateSaleStatus);
router.delete('/:id', deleteSale);

module.exports = router;
