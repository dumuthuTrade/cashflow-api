const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Supplier = require('../models/Supplier');

const router = express.Router();

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
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

    // Build query
    const query = { createdBy: req.user.id };
    
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

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!supplier) {
      return res.status(404).json({
        status: 'error',
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        supplier
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private
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

    // Check if supplier with same name already exists for this user
    const existingSupplier = await Supplier.findOne({
      name: req.body.name,
      createdBy: req.user.id
    });

    if (existingSupplier) {
      return res.status(400).json({
        status: 'error',
        message: 'Supplier with this name already exists'
      });
    }

    const supplier = await Supplier.create({
      ...req.body,
      createdBy: req.user.id
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

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private
const updateSupplier = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Check if supplier with same name already exists (excluding current supplier)
    if (req.body.name) {
      const existingSupplier = await Supplier.findOne({
        name: req.body.name,
        createdBy: req.user.id,
        _id: { $ne: req.params.id }
      });

      if (existingSupplier) {
        return res.status(400).json({
          status: 'error',
          message: 'Supplier with this name already exists'
        });
      }
    }

    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({
        status: 'error',
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        supplier
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
const deleteSupplier = async (req, res, next) => {
  try {
    // Check if supplier has associated cheques
    const Cheque = require('../models/Cheque');
    const chequeCount = await Cheque.countDocuments({ 
      supplier: req.params.id,
      createdBy: req.user.id 
    });

    if (chequeCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete supplier. There are ${chequeCount} cheques associated with this supplier.`
      });
    }

    const supplier = await Supplier.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!supplier) {
      return res.status(404).json({
        status: 'error',
        message: 'Supplier not found'
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

// @desc    Search suppliers for autocomplete
// @route   GET /api/suppliers/search
// @access  Private
const searchSuppliers = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query must be at least 2 characters'
      });
    }

    const suppliers = await Supplier.find({
      createdBy: req.user.id,
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name email')
    .limit(10)
    .sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      data: {
        suppliers
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
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters')
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
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Routes
router.get('/search', searchSuppliers);
router.get('/', queryValidation, getSuppliers);
router.get('/:id', getSupplier);
router.post('/', supplierValidation, createSupplier);
router.put('/:id', supplierValidation, updateSupplier);
router.delete('/:id', deleteSupplier);

module.exports = router;
