import { prisma } from '../lib/prisma';

// Fixed letterhead/bank/signature data for each invoice template, configured
// once by the admin under Settings rather than re-entered per invoice.
export class IssuerProfileService {
  async findAll() {
    return prisma.issuerProfile.findMany();
  }

  async findByType(type: 'individual' | 'beulix') {
    return prisma.issuerProfile.findUnique({ where: { type } });
  }

  async upsert(type: 'individual' | 'beulix', data: Record<string, any>) {
    return prisma.issuerProfile.upsert({
      where: { type },
      update: data,
      create: { ...data, type } as any,
    });
  }
}

export default new IssuerProfileService();
