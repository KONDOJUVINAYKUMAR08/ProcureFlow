import { PrismaClient } from '../../prisma/generated/client';

// Prisma forbids field names starting with an underscore, so every model's
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

const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const result = await query(args);
        return addUnderscoreId(result);
      },
    },
  },
});

export * from '../../prisma/generated/client';
