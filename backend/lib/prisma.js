const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} else {
  // Prevent connection leaks across serverless lambdas in production
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma;
  }
}

module.exports = prisma;