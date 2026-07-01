import Joi from 'joi';

const lineItemSchema = Joi.object({
  description: Joi.string().required(),
  hsnSacCode: Joi.string().allow('', null),
  quantity: Joi.number().min(0).required(),
  unit: Joi.string().allow('', null).default('Nos'),
  rate: Joi.number().min(0).required(),
  discount: Joi.number().min(0).max(100).default(0),
  gstPercentage: Joi.number().min(0).default(18),
  taxableAmount: Joi.number().min(0).default(0),
  cgstAmount: Joi.number().min(0).default(0),
  sgstAmount: Joi.number().min(0).default(0),
  igstAmount: Joi.number().min(0).default(0),
  totalAmount: Joi.number().min(0).default(0),
});

export const invoiceSchema = Joi.object({
  // New rich invoice fields
  invoiceType: Joi.string().valid('CUSTOMER_INVOICE', 'VENDOR_INVOICE').default('VENDOR_INVOICE'),
  templateType: Joi.string().valid('individual', 'beulix').default('beulix'),
  vendorId: Joi.string().allow('', null),
  customerId: Joi.string().allow('', null),
  partyName: Joi.string().required(),
  partyGstin: Joi.string().allow('', null),
  partyPan: Joi.string().allow('', null),
  partyAddress: Joi.string().allow('', null),

  // References
  purchaseOrderId: Joi.string().allow('', null),
  contractId: Joi.string().allow('', null),
  poNumber: Joi.string().allow('', null),

  // Dates
  issueDate: Joi.date().default(() => new Date()),
  dueDate: Joi.date().required(),

  // Place of supply (for CGST/SGST vs IGST) and the explicit tax-type selector
  placeOfSupply: Joi.string().allow('', null),
  taxType: Joi.string().valid('intra_state', 'inter_state').default('intra_state'),

  // Individual/trainer-template-only fields
  courseActivityName: Joi.string().allow('', null),
  classroomLocation: Joi.string().allow('', null),
  modeOfLecture: Joi.string().allow('', null),
  contactPerson: Joi.string().allow('', null),
  contactNumber: Joi.string().allow('', null),

  // Line items
  lineItems: Joi.array().items(lineItemSchema).min(1).required(),

  // TDS
  tdsPercentage: Joi.number().min(0).max(100).default(0),

  // Bank details (for PDF)
  bankName: Joi.string().allow('', null),
  accountNumber: Joi.string().allow('', null),
  ifscCode: Joi.string().allow('', null),
  accountHolder: Joi.string().allow('', null),
  upiId: Joi.string().allow('', null),

  // Notes
  description: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
  termsAndConditions: Joi.string().allow('', null),

  // Legacy fields (backward compatibility)
  vendor: Joi.string().allow('', null),
  purchaseOrder: Joi.string().allow('', null),
  contract: Joi.string().allow('', null),
  amount: Joi.number().min(0),
  tax: Joi.number().min(0),
  documentUrl: Joi.string().allow('', null),
});

export const paymentSchema = Joi.object({
  invoiceId: Joi.string().required(),
  paymentMethod: Joi.string().valid('wire_transfer', 'check', 'ach', 'credit_card').required(),
  notes: Joi.string().allow(''),
});

export const purchaseSchema = Joi.object({
  registeredCustomerId: Joi.string().allow('', null),
  supplierName: Joi.string().required(),
  supplierGstin: Joi.string().allow('', null),
  billedTo: Joi.string().allow('', null),
  customerGstin: Joi.string().allow('', null),
  hsnSac: Joi.string().allow('', null),
  invoiceNumber: Joi.string().required(),
  purchaseDate: Joi.date().default(() => new Date()),
  taxableAmount: Joi.number().min(0).required(),
  cgst: Joi.number().min(0).default(0),
  sgst: Joi.number().min(0).default(0),
  igst: Joi.number().min(0).default(0),
  invoiceValue: Joi.number().min(0),
  description: Joi.string().allow('', null),
  tdsPercentage: Joi.number().min(0).max(100).default(10),
});
