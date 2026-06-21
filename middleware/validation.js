const { body, query, param, validationResult } = require('express-validator');

/**
 * Handle validation errors and format response
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Validation rules for creating a new user profile
 */
const validateUserCreation = [
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('internship_start_date').notEmpty().isDate().withMessage('Valid date is required')
];

/**
 * Validation rules for selecting habits for a user
 */
const validateHabitSelection = [
  param('userId').isInt().toInt(),
  body('habitIds').isArray().withMessage('habitIds must be an array'),
  body('habitIds.*').isInt().toInt()
];

/**
 * Validation rules for logging a new daily action
 */
const validateLogEntry = [
  body('user_id').isInt().toInt(),
  body('habit_id').isInt().toInt(),
  body('date').isDate().withMessage('Valid date is required'),
  body('quantity').optional().isFloat({ min: 0.1 }).toFloat(),
  body('notes').optional().trim().escape()
];

/**
 * Validation rules for fetching data with a date range
 */
const validateDateRange = [
  query('startDate').optional({ checkFalsy: true }).isDate().withMessage('Valid start date required'),
  query('endDate').optional({ checkFalsy: true }).isDate().withMessage('Valid end date required')
];

/**
 * Validation rules for user ID param
 */
const validateUserIdParam = [
  param('userId').isInt().toInt()
];

module.exports = {
  handleValidationErrors,
  validateUserCreation,
  validateHabitSelection,
  validateLogEntry,
  validateDateRange,
  validateUserIdParam
};
