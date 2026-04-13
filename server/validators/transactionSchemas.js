import Joi from 'joi';

export const submitTransactionSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .max(1_000_000)
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Amount must be a positive number',
      'number.max':      'Amount exceeds the maximum allowed value of ₹10,00,000',
      'any.required':    'Transaction amount is required',
    }),

  location: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min':   'Location must be at least 2 characters',
      'any.required': 'Transaction location is required',
    }),

  deviceId: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      'any.required': 'Device ID is required',
    }),

  deviceName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'any.required': 'Device name is required',
    }),

  category: Joi.string()
    .valid('shopping', 'dining', 'utilities', 'entertainment', 'transfer', 'withdrawal')
    .default('shopping')
    .messages({
      'any.only': 'Category must be one of: shopping, dining, utilities, entertainment, transfer, withdrawal',
    }),

  currency: Joi.string()
    .uppercase()
    .length(3)
    .default('USD'),
});
