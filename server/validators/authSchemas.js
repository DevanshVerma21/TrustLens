import Joi from 'joi';

const passwordRules = Joi.string()
  .min(8)
  .max(72)                          // bcrypt max input length
  .pattern(/[A-Z]/, 'uppercase')   // at least 1 uppercase
  .pattern(/[0-9]/, 'number')      // at least 1 digit
  .required()
  .messages({
    'string.min':     'Password must be at least 8 characters',
    'string.pattern.name': 'Password must contain at least one {#name} character',
    'any.required':   'Password is required',
  });

export const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email':   'Please provide a valid email address',
      'any.required':   'Email is required',
    }),
  password: passwordRules,
  name: Joi.string().trim().min(1).max(100).optional().allow(''),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required(),
  password: Joi.string().required(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});
