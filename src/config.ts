import { config as dotenvConfig } from "dotenv";
import type { RedisOptions } from "ioredis";

// Load environment variables
if (process.env.NODE_ENV === "development") {
  dotenvConfig({ path: ".env.local" });
} else {
  dotenvConfig();
}

// Validate required environment variables
const requiredEnv = ["REDIS_HOST", "DB_HOST", "DB_USER", "DB_PASSWORD"];

const missingEnv = requiredEnv.filter((env) => !process.env[env]);
if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

// Redis configuration
const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
};

export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || "development",

  // Server
  port: Number(process.env.PORT || "3000"),

  // Redis
  redis: redisConfig,

  // Database
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE || "job_dashboard",
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || "10"),
  },

  // Dashboard
  dashboard: {
    basePath: process.env.DASHBOARD_BASE_PATH || "/admin/queues",
  },
};

export default config;
