const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Customer = require('../models/Customer');

const router = express.Router();

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res, next) => {
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
      riskCategory,
      search,
      sortBy = 'personalInfo.name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = { createdBy: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (riskCategory) {
      query['creditProfile.riskCategory'] = riskCategory;
    }
    
    if (search) {
      query.$or = [
        { customerCode: { $regex: search, $options: 'i' } },
        { 'personalInfo.name': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } },
        { 'personalInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const customers = await Customer.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: customers.length,
      data: {
        customers,
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

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        customer
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Check if customer code already exists
    const existingCustomer = await Customer.findOne({
      customerCode: req.body.customerCode,
      createdBy: req.user.id
    });

    if (existingCustomer) {
      return res.status(400).json({
        status: 'error',
        message: 'Customer with this code already exists'
      });
    }

    const customer = await Customer.create({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: {
        customer
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Check if customer code already exists (excluding current customer)
    if (req.body.customerCode) {
      const existingCustomer = await Customer.findOne({
        customerCode: req.body.customerCode,
        createdBy: req.user.id,
        _id: { $ne: req.params.id }
      });

      if (existingCustomer) {
        return res.status(400).json({
          status: 'error',
          message: 'Customer with this code already exists'
        });
      }
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        customer
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer credit rating
// @route   PATCH /api/customers/:id/credit-rating
// @access  Private
const updateCreditRating = async (req, res, next) => {
  try {
    const { rating, reason } = req.body;

    if (!rating || !reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating and reason are required'
      });
    }

    const customer = await Customer.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    // Add to credit history
    customer.creditProfile.creditHistory.push({
      previousRating: customer.creditProfile.rating,
      newRating: rating,
      reason: reason
    });

    // Update rating
    customer.creditProfile.rating = rating;
    
    await customer.save();

    res.status(200).json({
      status: 'success',
      data: {
        customer
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
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

// @desc    Get customer statistics
// @route   GET /api/customers/stats
// @access  Private
const getCustomerStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [
      totalCustomers,
      activeCustomers,
      suspendedCustomers,
      riskDistribution,
      creditStats
    ] = await Promise.all([
      Customer.countDocuments({ createdBy: userId }),
      Customer.countDocuments({ createdBy: userId, status: 'active' }),
      Customer.countDocuments({ createdBy: userId, status: 'suspended' }),
      Customer.aggregate([
        { $match: { createdBy: userId } },
        { $group: { _id: '$creditProfile.riskCategory', count: { $sum: 1 } } }
      ]),
      Customer.aggregate([
        { $match: { createdBy: userId } },
        { $group: { 
          _id: null, 
          totalCreditLimit: { $sum: '$creditProfile.creditLimit' },
          totalAvailableCredit: { $sum: '$creditProfile.availableCredit' },
          avgCreditRating: { $avg: '$creditProfile.rating' }
        }}
      ])
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalCustomers,
        activeCustomers,
        suspendedCustomers,
        riskDistribution,
        creditStats: creditStats[0] || {
          totalCreditLimit: 0,
          totalAvailableCredit: 0,
          avgCreditRating: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Validation middleware
const customerValidation = [
  body('customerCode')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Customer code must be between 1 and 20 characters'),
  body('personalInfo.name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Customer name must be between 1 and 100 characters'),
  body('personalInfo.phone')
    .matches(/^(?:\+94|0)(?:(11|21|23|24|25|26|27|31|32|33|34|35|36|37|38|41|45|47|51|52|54|55|57|63|65|66|67|81|91)(0|2|3|4|5|7|9)|7(?:0|1|2|4|5|6|7|8)\d)\d{6}$/)
    .withMessage('Please enter a valid Sri Lankan phone number'),
  body('personalInfo.email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('personalInfo.identificationNumber')
    .optional()
    .matches(/^(?:\d{9}[vVxX]|\d{12})$/)
    .withMessage('Please enter a valid Sri Lankan NIC number'),
  body('creditProfile.rating')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Credit rating must be between 1 and 10'),
  body('creditProfile.creditLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be a positive number'),
  body('creditProfile.riskCategory')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Risk category must be low, medium, or high'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended')
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
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended'),
  query('riskCategory')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Risk category must be low, medium, or high'),
  query('sortBy')
    .optional()
    .isIn(['personalInfo.name', 'customerCode', 'creditProfile.rating', 'createdAt'])
    .withMessage('Sort by must be one of: personalInfo.name, customerCode, creditProfile.rating, createdAt'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const creditRatingValidation = [
  body('rating')
    .isInt({ min: 1, max: 10 })
    .withMessage('Rating must be between 1 and 10'),
  body('reason')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason must be between 1 and 500 characters')
];

// Routes
router.get('/stats', getCustomerStats);
router.get('/', queryValidation, getCustomers);
router.get('/:id', getCustomer);
router.post('/', customerValidation, createCustomer);
router.put('/:id', customerValidation, updateCustomer);
router.patch('/:id/credit-rating', creditRatingValidation, updateCreditRating);
router.delete('/:id', deleteCustomer);

module.exports = router;
