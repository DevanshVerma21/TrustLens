/**
 * validate — Joi validation middleware factory.
 * Usage: router.post('/path', validate(mySchema), handler)
 *
 * Validates req.body against the provided Joi schema.
 * Returns 422 with structured errors on failure.
 */
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,      // collect all errors, not just the first
    stripUnknown: true,     // silently drop unrecognised fields
    convert: true,          // coerce types (string → number etc.)
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));

    return res.status(422).json({
      error: 'ValidationError',
      message: 'Input validation failed',
      details,
    });
  }

  // Replace req.body with the sanitized + coerced value
  req.body = value;
  next();
};
