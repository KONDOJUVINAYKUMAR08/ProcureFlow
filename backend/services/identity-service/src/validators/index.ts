import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Used by the admin-only POST /users endpoint — there is no public
// self-registration route.
export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  role: Joi.string().valid('procurement_manager', 'finance', 'vendor', 'auditor', 'employee').default('employee'),
  department: Joi.string().min(1).max(100).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

export const userUpdateSchema = Joi.object({
  firstName: Joi.string().min(1).max(100),
  lastName: Joi.string().min(1).max(100),
  role: Joi.string().valid('admin', 'procurement_manager', 'finance', 'vendor', 'auditor'),
  department: Joi.string(),
  isActive: Joi.boolean(),
});
