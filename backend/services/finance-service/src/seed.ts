import { prisma } from './lib/prisma';
import { logger } from '@procurement/common';

export async function seedDemoData() {
  const existingCustomer = await prisma.customer.findFirst();
  if (existingCustomer) return; // already seeded

  logger.info('Seeding demo finance data...');

  const adminId = 'seed';

  await prisma.customer.createMany({
    data: [
      {
        customerCode: 'CUST-001',
        companyName: 'Acme Technologies Pvt. Ltd.',
        contactPerson: 'Vikram Mehta',
        email: 'vikram@acmetech.in',
        phone: '+91-98001-12345',
        gstin: '29AABCA1234A1Z5',
        pan: 'AABCA1234A',
        paymentTerms: 'Net 30',
        creditLimit: 500000,
        status: 'active',
        industry: 'Technology',
        gstTreatment: 'Registered Business',
        placeOfSupply: 'Karnataka',
        address: { street: '101 Electronic City', city: 'Bangalore', state: 'Karnataka', country: 'India', zipCode: '560100' },
        createdBy: adminId,
      },
      {
        customerCode: 'CUST-002',
        companyName: 'Horizon Retail Pvt. Ltd.',
        contactPerson: 'Sneha Kapoor',
        email: 'sneha@horizonretail.in',
        phone: '+91-99002-23456',
        gstin: '27AABCH5678B2Z6',
        pan: 'AABCH5678B',
        paymentTerms: 'Net 15',
        creditLimit: 300000,
        status: 'active',
        industry: 'Retail',
        gstTreatment: 'Registered Business',
        placeOfSupply: 'Maharashtra',
        address: { street: '22 Lower Parel', city: 'Mumbai', state: 'Maharashtra', country: 'India', zipCode: '400013' },
        createdBy: adminId,
      },
      {
        customerCode: 'CUST-003',
        companyName: 'Ravi Kumar (Individual)',
        contactPerson: 'Ravi Kumar',
        email: 'ravi.kumar@gmail.com',
        phone: '+91-97003-34567',
        pan: 'AABCK9012C',
        paymentTerms: 'Due on Receipt',
        status: 'active',
        taxPreference: 'taxable',
        placeOfSupply: 'Telangana',
        address: { street: '5 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', country: 'India', zipCode: '500033' },
        createdBy: adminId,
      },
    ],
  });

  const dueDate30 = new Date();
  dueDate30.setDate(dueDate30.getDate() + 30);
  const dueDate15 = new Date();
  dueDate15.setDate(dueDate15.getDate() + 15);

  await prisma.invoice.createMany({
    data: [
      {
        invoiceNumber: 'INV-2025-001',
        invoiceType: 'CUSTOMER_INVOICE',
        templateType: 'beulix',
        partyName: 'Acme Technologies Pvt. Ltd.',
        partyGstin: '29AABCA1234A1Z5',
        dueDate: dueDate30,
        placeOfSupply: 'Karnataka',
        taxType: 'intra_state',
        lineItems: [
          {
            description: 'Software Consulting Services',
            hsnSacCode: '998314',
            quantity: 1,
            unit: 'Month',
            rate: 100000,
            discount: 0,
            taxableAmount: 100000,
            gstPercentage: 18,
            cgstAmount: 9000,
            sgstAmount: 9000,
            igstAmount: 0,
            totalAmount: 118000,
          },
        ],
        subTotal: 100000,
        totalCgst: 9000,
        totalSgst: 9000,
        totalIgst: 0,
        totalGst: 18000,
        tdsPercentage: 10,
        tdsAmount: 10000,
        grossAmount: 118000,
        companyReceivable: 108000,
        vendorPayable: 0,
        totalAmount: 118000,
        amountInWords: 'One Lakh Eighteen Thousand Rupees Only',
        status: 'approved',
        createdBy: adminId,
      },
      {
        invoiceNumber: 'INV-2025-002',
        invoiceType: 'CUSTOMER_INVOICE',
        templateType: 'individual',
        partyName: 'Ravi Kumar',
        partyPan: 'AABCK9012C',
        dueDate: dueDate15,
        courseActivityName: 'Advanced Python & Machine Learning',
        classroomLocation: 'Hyderabad Tech Hub',
        modeOfLecture: 'In-person',
        lineItems: [
          {
            description: 'Python ML Training — 20 sessions',
            quantity: 20,
            unit: 'Session',
            rate: 5000,
            taxableAmount: 100000,
            totalAmount: 100000,
          },
        ],
        subTotal: 100000,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        totalGst: 0,
        tdsPercentage: 10,
        tdsAmount: 10000,
        grossAmount: 100000,
        companyReceivable: 90000,
        vendorPayable: 0,
        totalAmount: 100000,
        amountInWords: 'One Lakh Rupees Only',
        status: 'pending',
        createdBy: adminId,
      },
    ],
  });

  const purchaseDate = new Date();
  purchaseDate.setDate(purchaseDate.getDate() - 7);

  await prisma.purchase.create({
    data: {
      supplierName: 'Amazon Web Services India',
      supplierGstin: '07AAECE4737C1Z3',
      billedTo: 'ProcureFlow Technologies',
      invoiceNumber: 'AWS-IN-2025-05891',
      purchaseDate,
      taxableAmount: 45000,
      cgst: 4050,
      sgst: 4050,
      igst: 0,
      invoiceValue: 53100,
      tdsPercentage: 10,
      tdsAmount: 4500,
      description: 'Cloud infrastructure — EC2, S3, RDS (May 2025)',
      createdBy: adminId,
    },
  });

  logger.info('Demo finance data seeded successfully');
}
