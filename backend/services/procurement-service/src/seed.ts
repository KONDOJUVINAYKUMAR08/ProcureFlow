import { prisma } from './lib/prisma';
import { logger } from '@procurement/common';

export async function seedDemoData() {
  const existingVendor = await prisma.vendor.findFirst();
  if (existingVendor) return; // already seeded

  logger.info('Seeding demo procurement data...');

  const adminId = 'seed';

  await prisma.vendor.createMany({
    data: [
      {
        vendorCode: 'VND-001',
        vendorName: 'TechVision Solutions Pvt. Ltd.',
        contactPerson: 'Arjun Sharma',
        email: 'arjun@techvision.in',
        phone: '+91-98765-43210',
        taxId: 'AABCT1234A',
        bankAccount: 'SBI-0012345678',
        status: 'active',
        rating: 4.5,
        address: { street: '42 MG Road', city: 'Bangalore', state: 'Karnataka', country: 'India', zipCode: '560001' },
        createdBy: adminId,
      },
      {
        vendorCode: 'VND-002',
        vendorName: 'BuildRight Infrastructure Ltd.',
        contactPerson: 'Priya Nair',
        email: 'priya@buildright.co.in',
        phone: '+91-97654-32109',
        taxId: 'AABCB5678B',
        bankAccount: 'HDFC-00987654321',
        status: 'active',
        rating: 4.2,
        address: { street: '15 Brigade Road', city: 'Mumbai', state: 'Maharashtra', country: 'India', zipCode: '400001' },
        createdBy: adminId,
      },
      {
        vendorCode: 'VND-003',
        vendorName: 'CloudNova Systems',
        contactPerson: 'Rahul Gupta',
        email: 'rahul@cloudnova.io',
        phone: '+91-96543-21098',
        taxId: 'AABCC9012C',
        bankAccount: 'ICICI-001122334455',
        status: 'pending',
        rating: 0,
        address: { street: '7 Cyber Towers', city: 'Hyderabad', state: 'Telangana', country: 'India', zipCode: '500081' },
        createdBy: adminId,
      },
    ],
  });

  await prisma.purchaseRequest.createMany({
    data: [
      {
        title: 'Laptops for Engineering Team',
        department: 'Engineering',
        priority: 'high',
        description: 'Procurement of 10 high-performance laptops for the engineering team for software development.',
        estimatedCost: 850000,
        vendor: 'TechVision Solutions Pvt. Ltd.',
        status: 'approved',
        requestedBy: adminId,
        approvedBy: adminId,
        items: [
          { name: 'Dell XPS 15 Laptop', description: 'Core i7, 32GB RAM, 1TB SSD', quantity: 10, unitPrice: 85000 },
        ],
      },
      {
        title: 'Office Furniture Upgrade',
        department: 'Admin',
        priority: 'medium',
        description: 'Replacement of old office chairs and desks in the main hall.',
        estimatedCost: 120000,
        vendor: 'BuildRight Infrastructure Ltd.',
        status: 'pending',
        requestedBy: adminId,
        items: [
          { name: 'Ergonomic Chair', description: 'Lumbar support, adjustable height', quantity: 20, unitPrice: 4500 },
          { name: 'Standing Desk', description: 'Height-adjustable, 120x60cm', quantity: 5, unitPrice: 6000 },
        ],
      },
    ],
  });

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 30);

  await prisma.purchaseOrder.createMany({
    data: [
      {
        poNumber: 'PO-2025-001',
        vendor: 'TechVision Solutions Pvt. Ltd.',
        subtotal: 850000,
        tax: 153000,
        totalAmount: 1003000,
        status: 'issued',
        expectedDeliveryDate: deliveryDate,
        notes: 'Urgent — required before Q3 kickoff',
        createdBy: adminId,
        items: [
          { name: 'Dell XPS 15 Laptop', description: 'Core i7, 32GB RAM, 1TB SSD', quantity: 10, unitPrice: 85000, totalPrice: 850000 },
        ],
      },
      {
        poNumber: 'PO-2025-002',
        vendor: 'CloudNova Systems',
        subtotal: 240000,
        tax: 43200,
        totalAmount: 283200,
        status: 'draft',
        notes: 'Annual cloud infrastructure subscription',
        createdBy: adminId,
        items: [
          { name: 'Cloud Hosting Plan', description: 'Annual enterprise plan — 50TB storage', quantity: 1, unitPrice: 240000, totalPrice: 240000 },
        ],
      },
    ],
  });

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  await prisma.contract.create({
    data: {
      contractNumber: 'CTR-2025-001',
      contractName: 'Annual IT Support & Maintenance',
      vendor: 'TechVision Solutions Pvt. Ltd.',
      effectiveDate: new Date(),
      expiryDate,
      contractValue: 1200000,
      status: 'active',
      description: 'Annual IT support, hardware maintenance and software licensing agreement.',
      createdBy: adminId,
    },
  });

  logger.info('Demo procurement data seeded successfully');
}
