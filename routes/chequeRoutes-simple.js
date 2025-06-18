const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Cheque = require('../models/Cheque');
const Supplier = require('../models/Supplier');

const router = express.Router();

// Mock user for testing without auth
const mockUser = { id: '507f1f77bcf86cd799439011' };

// @desc    Get all cheques
// @route   GET /api/cheques
// @access  Public (temporary)
const getCheques = async (req, res, next) => {
  try {
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

    // Build query (using mock user for now)
    const query = { createdBy: mockUser.id };
    
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
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const cheques = await Cheque.find(query)
      .populate('supplier', 'name email phone')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
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

// @desc    Create new cheque
// @route   POST /api/cheques
// @access  Public (temporary)
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

    const cheque = await Cheque.create({
      ...req.body,
      createdBy: mockUser.id
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

// Validation middleware
const chequeValidation = [
  body('chequeNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Cheque number must be between 1 and 50 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('issueDate')
    .isISO8601()
    .withMessage('Please provide a valid issue date'),
  body('dueDate')
    .isISO8601()
    .withMessage('Please provide a valid due date'),
  body('supplier')
    .isMongoId()
    .withMessage('Please provide a valid supplier ID')
];

// Routes
router.get('/', getCheques);
router.post('/', chequeValidation, createCheque);

module.exports = router;
