import { PrismaClient } from '../prisma/generated/client';

// Every service writes audit entries directly to the document schema's
// audit_logs table via this client — see prisma/schema.prisma in this
// package for why a separate, minimal Prisma Client lives here instead of
// reusing document-service's own client.
//
// Prisma forbids field names starting with an underscore, so the AuditLog
// primary key is the real field `id`. The pre-existing frontend and controllers
// expect `_id` (legacy dynamoose contract), so this client extension transparently
// mirrors `id` onto `_id` on every result returned by any query/operation.
const addUnderscoreId = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(addUnderscoreId);
  if (obj && typeof obj === 'object' && 'id' in obj && !('_id' in obj)) {
    return { ...obj, _id: obj.id };
  }
  return obj;
};

const baseAuditPrisma = new PrismaClient();

export const auditPrisma = baseAuditPrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const result = await query(args);
        return addUnderscoreId(result);
      },
    },
  },
});
