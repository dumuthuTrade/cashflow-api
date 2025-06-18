const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Cheque = require('../models/Cheque');
const Supplier = require('../models/Supplier');

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
    }

    const {
      page = 1,
      limit = 10,
      status,
      supplier,
      dueDateFrom,
      dueDateTo,
      search,
      sortBy = 'dueDate',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = { createdBy: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (supplier) {
      query.supplier = supplier;
    }
    
    if (dueDateFrom || dueDateTo) {
      query.dueDate = {};
      if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) query.dueDate.$lte = new Date(dueDateTo);
    }
    
    if (search) {
      query.$or = [
        { chequeNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const cheques = await Cheque.find(query)
      .populate('supplier', 'name email phone')
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
  try {
    const cheque = await Cheque.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    }).populate('supplier', 'name email phone address bankDetails');

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
    }

    // Verify supplier exists and belongs to user
    const supplier = await Supplier.findOne({
      _id: req.body.supplier,
      createdBy: req.user.id,
      isActive: true
    });

    if (!supplier) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid supplier or supplier not found'
      });
    }

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
    });

    // Populate supplier data before sending response
    await cheque.populate('supplier', 'name email phone');

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
    }

    // If supplier is being updated, verify it exists and belongs to user
    if (req.body.supplier) {
      const supplier = await Supplier.findOne({
        _id: req.body.supplier,
        createdBy: req.user.id,
        isActive: true
      });

      if (!supplier) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid supplier or supplier not found'
        });
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
    }

    // Set clearance date if status is being changed to cleared
    if (req.body.status === 'cleared' && !req.body.clearanceDate) {
      req.body.clearanceDate = new Date();
    }

    const cheque = await Cheque.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('supplier', 'name email phone');

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

// @desc    Delete cheque
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
  try {
    const userId = req.user.id;
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
        dueDate: { $lt: today } 
      }),
      Cheque.countDocuments({ 
        createdBy: userId, 
        status: 'pending', 
        dueDate: { $gte: today, $lte: thirtyDaysFromNow } 
      }),
      Cheque.aggregate([
        { $match: { createdBy: userId } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Cheque.aggregate([
        { $match: { createdBy: userId, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
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
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('issueDate')
    .isISO8601()
    .withMessage('Please provide a valid issue date'),
  body('dueDate')
    .isISO8601()
    .withMessage('Please provide a valid due date'),
  body('supplier')
    .isMongoId()
    .withMessage('Please provide a valid supplier ID'),
  body('status')
    .optional()
    .isIn(['pending', 'cleared', 'bounced', 'cancelled'])
    .withMessage('Status must be one of: pending, cleared, bounced, cancelled'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
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
    .isIn(['pending', 'cleared', 'bounced', 'cancelled'])
    .withMessage('Status must be one of: pending, cleared, bounced, cancelled'),
  query('dueDateFrom')
    .optional()
    .isISO8601()
    .withMessage('Due date from must be a valid date'),
  query('dueDateTo')
    .optional()
    .isISO8601()
    .withMessage('Due date to must be a valid date'),
  query('sortBy')
    .optional()
    .isIn(['dueDate', 'amount', 'chequeNumber', 'issueDate', 'createdAt'])
    .withMessage('Sort by must be one of: dueDate, amount, chequeNumber, issueDate, createdAt'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Routes
router.get('/stats', getDashboardStats);
router.get('/', queryValidation, getCheques);
router.get('/:id', getCheque);
router.post('/', chequeValidation, createCheque);
router.put('/:id', chequeValidation, updateCheque);
router.delete('/:id', deleteCheque);

module.exports = router;
