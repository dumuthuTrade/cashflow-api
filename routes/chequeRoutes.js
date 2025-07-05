const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Cheque = require('../models/Cheque');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');

const router = express.Router();

// @desc    Get all cheques
// @route   GET /api/cheques
// @access  Private
const getCheques = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array()
      });
    }    const {
      page = 1,
      limit = 10,
      status,
      transactionType,
      customerId,
      supplierId,
      chequeDateFrom,
      chequeDateTo,
      search,
      sortBy = 'chequeDetails.chequeDate',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = { createdBy: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (transactionType) {
      query['relatedTransaction.transactionType'] = transactionType;
    }
    
    if (customerId) {
      query['relatedTransaction.customerId'] = customerId;
    }
    
    if (supplierId) {
      query['relatedTransaction.supplierId'] = supplierId;
    }
    
    if (chequeDateFrom || chequeDateTo) {
      query['chequeDetails.chequeDate'] = {};
      if (chequeDateFrom) query['chequeDetails.chequeDate'].$gte = new Date(chequeDateFrom);
      if (chequeDateTo) query['chequeDetails.chequeDate'].$lte = new Date(chequeDateTo);
    }
    
    if (search) {
      query.$or = [
        { chequeNumber: { $regex: search, $options: 'i' } },
        { 'chequeDetails.drawerName': { $regex: search, $options: 'i' } },
        { 'chequeDetails.payeeName': { $regex: search, $options: 'i' } },
        { 'chequeDetails.bankName': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;    // Execute query with pagination
    const cheques = await Cheque.find(query)
      .populate('relatedTransaction.customerId', 'personalInfo.name personalInfo.email personalInfo.phone')
      .populate('relatedTransaction.supplierId', 'name email phone')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Cheque.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: cheques.length,
      data: {
        cheques,
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

// @desc    Get single cheque
// @route   GET /api/cheques/:id
// @access  Private
const getCheque = async (req, res, next) => {
  try {    const cheque = await Cheque.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    })
    .populate('relatedTransaction.customerId', 'personalInfo.name personalInfo.email personalInfo.phone personalInfo.address')
    .populate('relatedTransaction.supplierId', 'name email phone address bankDetails');

    if (!cheque) {
      return res.status(404).json({
        status: 'error',
        message: 'Cheque not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        cheque
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new cheque
// @route   POST /api/cheques
// @access  Private
const createCheque = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array()
      });
    }    // Verify related entity exists based on transaction type
    if (req.body.relatedTransaction.transactionType === 'purchase') {
      console.log(`Checking supplier with ID: ${req.body.relatedTransaction.supplierId}`);
      
      const supplier = await Supplier.findOne({
        _id: req.body.relatedTransaction.supplierId,
        createdBy: req.user.id,
        isActive: true
      });

      // if (!supplier) {
      //   return res.status(400).json({
      //     status: 'error',
      //     message: 'Invalid supplier or supplier not found'
      //   });
      // }
    } 
    // else if (req.body.relatedTransaction.transactionType === 'sale') {
    //   const customer = await Customer.findOne({
    //     _id: req.body.relatedTransaction.customerId,
    //     createdBy: req.user.id,
    //     status: 'active'
    //   });

    //   if (!customer) {
    //     return res.status(400).json({
    //       status: 'error',
    //       message: 'Invalid customer or customer not found'
    //     });
    //   }
    // }

    // Check if cheque number already exists for this user
    const existingCheque = await Cheque.findOne({
      chequeNumber: req.body.chequeNumber,
      createdBy: req.user.id
    });

    if (existingCheque) {
      return res.status(400).json({
        status: 'error',
        message: 'Cheque with this number already exists'
      });
    }

    const cheque = await Cheque.create({
      ...req.body,
      createdBy: req.user.id
    });    // Populate related entities before sending response
    await cheque.populate([
      { path: 'relatedTransaction.customerId', select: 'personalInfo.name personalInfo.email personalInfo.phone' },
      { path: 'relatedTransaction.supplierId', select: 'name email phone' }
    ]);

    res.status(201).json({
      status: 'success',
      data: {
        cheque
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cheque
// @route   PUT /api/cheques/:id
// @access  Private
const updateCheque = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array()
      });
    }    // If related transaction is being updated, verify entities exist
    if (req.body.relatedTransaction) {
      if (req.body.relatedTransaction.transactionType === 'purchase' && req.body.relatedTransaction.supplierId) {
        const supplier = await Supplier.findOne({
          _id: req.body.relatedTransaction.supplierId,
          createdBy: req.user.id,
          isActive: true
        });

        // if (!supplier) {
        //   return res.status(400).json({
        //     status: 'error',
        //     message: 'Invalid supplier or supplier not found'
        //   });
        // }
      } else if (req.body.relatedTransaction.transactionType === 'sale' && req.body.relatedTransaction.customerId) {
        const customer = await Customer.findOne({
          _id: req.body.relatedTransaction.customerId,
          createdBy: req.user.id,
          status: 'active'
        });

        if (!customer) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid customer or customer not found'
          });
        }
      }
    }

    // Check if cheque number already exists (excluding current cheque)
    if (req.body.chequeNumber) {
      const existingCheque = await Cheque.findOne({
        chequeNumber: req.body.chequeNumber,
        createdBy: req.user.id,
        _id: { $ne: req.params.id }
      });

      if (existingCheque) {
        return res.status(400).json({
          status: 'error',
          message: 'Cheque with this number already exists'
        });
      }
    }    // Set clearance date if status is being changed to cleared
    if (req.body.status === 'cleared') {
      if (!req.body.chequeDetails) req.body.chequeDetails = {};
      if (!req.body.chequeDetails.clearanceDate) {
        req.body.chequeDetails.clearanceDate = new Date();
      }
    }

    const cheque = await Cheque.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    )
    .populate('relatedTransaction.customerId', 'personalInfo.name personalInfo.email personalInfo.phone')
    .populate('relatedTransaction.supplierId', 'name email phone');

    if (!cheque) {
      return res.status(404).json({
        status: 'error',
        message: 'Cheque not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        cheque
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cheque status
// @route   PATCH /api/cheques/:id/status
// @access  Private
const updateChequeStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required'
      });
    }

    const cheque = await Cheque.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!cheque) {
      return res.status(404).json({
        status: 'error',
        message: 'Cheque not found'
      });
    }

    // Use the model's method to update status and add history
    await cheque.addStatusHistory(status, notes || `Status changed to ${status}`);

    // Populate related entities
    await cheque.populate([
      { path: 'relatedTransaction.customerId', select: 'personalInfo.name personalInfo.email personalInfo.phone' },
      { path: 'relatedTransaction.supplierId', select: 'name email phone' }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        cheque
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/cheques/:id
// @access  Private
const deleteCheque = async (req, res, next) => {
  try {
    const cheque = await Cheque.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!cheque) {
      return res.status(404).json({
        status: 'error',
        message: 'Cheque not found'
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

// @desc    Get dashboard stats
// @route   GET /api/cheques/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {    const userId = req.user.id;
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

    // Get various statistics
    const [
      totalCheques,
      pendingCheques,
      clearedCheques,
      overdueCheques,
      upcomingCheques,
      totalAmount,
      pendingAmount
    ] = await Promise.all([
      Cheque.countDocuments({ createdBy: userId }),
      Cheque.countDocuments({ createdBy: userId, status: 'pending' }),
      Cheque.countDocuments({ createdBy: userId, status: 'cleared' }),
      Cheque.countDocuments({ 
        createdBy: userId, 
        status: 'pending', 
        'chequeDetails.chequeDate': { $lt: new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000)) }
      }),
      Cheque.countDocuments({ 
        createdBy: userId, 
        status: 'pending', 
        'chequeDetails.chequeDate': { $gte: today, $lte: thirtyDaysFromNow } 
      }),
      Cheque.aggregate([
        { $match: { createdBy: userId } },
        { $group: { _id: null, total: { $sum: '$chequeDetails.amount' } } }
      ]),
      Cheque.aggregate([
        { $match: { createdBy: userId, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$chequeDetails.amount' } } }
      ])
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalCheques,
        pendingCheques,
        clearedCheques,
        overdueCheques,
        upcomingCheques,
        totalAmount: totalAmount[0]?.total || 0,
        pendingAmount: pendingAmount[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Validation middleware
const chequeValidation = [
  body('chequeNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Cheque number must be between 1 and 50 characters'),
  body('type')
    .optional()
    .isIn(['issued', 'received'])
    .withMessage('Type must be either issued or received'),
  // body('relatedTransaction.transactionId')
  //   .isMongoId()
  //   .withMessage('Please provide a valid transaction ID'),
  body('relatedTransaction.transactionType')
    .isIn(['sale', 'purchase'])
    .withMessage('Transaction type must be either sale or purchase'),
  body('relatedTransaction.customerId')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid customer ID'),
  body('relatedTransaction.supplierId')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid supplier ID'),
  body('chequeDetails.amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('chequeDetails.chequeDate')
    .isISO8601()
    .withMessage('Please provide a valid cheque date'),
  // body('chequeDetails.depositDate')
  //   .optional()
  //   .isISO8601()
  //   .withMessage('Please provide a valid deposit date'),
  // body('chequeDetails.bankName')
  //   .trim()
  //   .isLength({ min: 1, max: 100 })
  //   .withMessage('Bank name must be between 1 and 100 characters'),
  // body('chequeDetails.accountNumber')
  //   .trim()
  //   .isLength({ min: 1, max: 50 })
  //   .withMessage('Account number must be between 1 and 50 characters'),
  // body('chequeDetails.drawerName')
  //   .trim()
  //   .isLength({ min: 1, max: 100 })
  //   .withMessage('Drawer name must be between 1 and 100 characters'),
  // body('chequeDetails.payeeName')
  //   .trim()
  //   .isLength({ min: 1, max: 100 })
  //   .withMessage('Payee name must be between 1 and 100 characters'),
  // body('chequeDetails.clearanceDate')
  //   .optional()
  //   .isISO8601()
  //   .withMessage('Please provide a valid clearance date'),
  body('status')
    .optional()
    .isIn(['pending', 'cleared', 'bounced', 'cancelled', 'deposited'])
    .withMessage('Status must be one of: pending, cleared, bounced, cancelled, deposited'),
  // body('bankProcessing.bounceReason')
  //   .optional()
  //   .trim()
  //   .isLength({ max: 200 })
  //   .withMessage('Bounce reason cannot exceed 200 characters'),
  // body('bankProcessing.bankCharges')
  //   .optional()
  //   .isFloat({ min: 0 })
  //   .withMessage('Bank charges must be a positive number')
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
    .isIn(['pending', 'cleared', 'bounced', 'cancelled', 'deposited'])
    .withMessage('Status must be one of: pending, cleared, bounced, cancelled, deposited'),
  query('transactionType')
    .optional()
    .isIn(['sale', 'purchase'])
    .withMessage('Transaction type must be either sale or purchase'),
  query('customerId')
    .optional()
    .isMongoId()
    .withMessage('Customer ID must be a valid MongoDB ID'),
  query('supplierId')
    .optional()
    .isMongoId()
    .withMessage('Supplier ID must be a valid MongoDB ID'),
  query('chequeDateFrom')
    .optional()
    .isISO8601()
    .withMessage('Cheque date from must be a valid date'),
  query('chequeDateTo')
    .optional()
    .isISO8601()
    .withMessage('Cheque date to must be a valid date'),
  query('sortBy')
    .optional()
    .isIn(['chequeDetails.chequeDate', 'chequeDetails.amount', 'chequeNumber', 'createdAt', 'status'])
    .withMessage('Sort by must be one of: chequeDetails.chequeDate, chequeDetails.amount, chequeNumber, createdAt, status'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Status update validation
const statusUpdateValidation = [
  body('status')
    .isIn(['pending', 'cleared', 'bounced', 'cancelled', 'deposited'])
    .withMessage('Status must be one of: pending, cleared, bounced, cancelled, deposited'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Routes
router.get('/stats', getDashboardStats);
router.get('/', queryValidation, getCheques);
router.get('/:id', getCheque);
router.post('/', chequeValidation, createCheque);
router.put('/:id', chequeValidation, updateCheque);
router.patch('/:id/status', statusUpdateValidation, updateChequeStatus);
router.delete('/:id', deleteCheque);

module.exports = router;
