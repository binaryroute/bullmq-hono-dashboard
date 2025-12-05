import type { QueueOptions, WorkerOptions } from "bullmq";
import config from "../config.js";

/**
 * Redis connection for BullMQ
 * Note: maxRetriesPerRequest must be null for BullMQ blocking operations
 */
export const redisConnection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
};

/**
 * Default options applied to all queues
 */
export const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000, // 1s, 2s, 4s
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep for 24 hours
      count: 1000, // Max 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};

/**
 * Default options for workers
 */
export const defaultWorkerOptions: WorkerOptions = {
  connection: redisConnection,
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000, // Max 10 jobs per second
  },
};

/**
 * Queue name constants
 * Add your queue names here
 */
export const QUEUES = {
  EMAIL: "email",
  NOTIFICATIONS: "notifications",
  REPORTS: "reports",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
