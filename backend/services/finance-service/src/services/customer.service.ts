import { prisma } from '../lib/prisma';

const generateCustomerCode = () => `CUST-${Date.now().toString(36).toUpperCase()}`;

export class CustomerService {
  async findAll(query: Record<string, any> = {}, skip = 0, limit = 20) {
    const where: Record<string, any> = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      const search = query.search as string;
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { customerCode: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.customer.count({ where }),
    ]);

    return { customers, total };
  }

  async findById(id: string) {
    const customer = await prisma.customer.findUnique({ where: { id: id } });
    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  async create(data: Record<string, any>, userId: string) {
    const customerCode = generateCustomerCode();
    return prisma.customer.create({ data: { ...data, customerCode, createdBy: userId } as any });
  }

  async update(id: string, data: Record<string, any>) {
    const customer = await prisma.customer.findUnique({ where: { id: id } });
    if (!customer) throw new Error('Customer not found');
    return prisma.customer.update({ where: { id: id }, data });
  }

  async delete(id: string) {
    const customer = await prisma.customer.findUnique({ where: { id: id } });
    if (!customer) throw new Error('Customer not found');
    await prisma.customer.delete({ where: { id: id } });
  }

  async getStats() {
    const [total, active] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'active' } }),
    ]);
    return { total, active, inactive: total - active };
  }
}

export default new CustomerService();
