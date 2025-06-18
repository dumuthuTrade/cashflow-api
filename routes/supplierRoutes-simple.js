const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Supplier = require('../models/Supplier');

const router = express.Router();

// Mock user for testing without auth
const mockUser = { id: '507f1f77bcf86cd799439011' };

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Public (temporary)
const getSuppliers = async (req, res, next) => {
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
      search,
      isActive
    } = req.query;

    // Build query (using mock user for now)
    const query = { createdBy: mockUser.id };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Execute query with pagination
    const suppliers = await Supplier.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Supplier.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: suppliers.length,
      data: {
        suppliers,
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

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Public (temporary)
const createSupplier = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const supplier = await Supplier.create({
      ...req.body,
      createdBy: mockUser.id
    });

    res.status(201).json({
      status: 'success',
      data: {
        supplier
      }
    });
  } catch (error) {
    next(error);
  }
};

// Validation middleware
const supplierValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Supplier name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters')
];

// Routes
router.get('/', getSuppliers);
router.post('/', supplierValidation, createSupplier);

module.exports = router;
