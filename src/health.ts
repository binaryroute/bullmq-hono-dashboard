import type { Hono } from "hono";
import { queueManager } from "./queues/index.js";

type HealthStatus = "healthy" | "degraded" | "unhealthy";

interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  environment: string;
  queues?: Record<string, unknown>;
  memory: NodeJS.MemoryUsage;
  error?: string;
}

/**
 * Compute overall health status
 */
async function getHealthStatus(): Promise<HealthResponse> {
  try {
    const queueStats = await queueManager.getAllStats();

    // Determine health based on queue state
    const anyPaused = Object.values(queueStats).some((q) => q.paused);
    const highFailures = Object.values(queueStats).some((q) => q.failed > 100);

    let status: HealthStatus = "healthy";
    if (anyPaused || highFailures) {
      status = "degraded";
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      queues: queueStats,
      memory: process.memoryUsage(),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      memory: process.memoryUsage(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Register health endpoints on Hono app
 */
export function registerHealthRoutes(app: Hono): void {
  // Full health check with queue stats
  app.get("/health", async (c) => {
    const health = await getHealthStatus();
    const statusCode = health.status === "unhealthy" ? 503 : 200;
    return c.json(health, statusCode);
  });

  // Simple liveness probe (is the process running?)
  app.get("/health/live", (c) => {
    return c.json({ status: "alive" });
  });

  // Readiness probe (is the service ready to accept traffic?)
  app.get("/health/ready", async (c) => {
    const health = await getHealthStatus();
    const statusCode = health.status === "unhealthy" ? 503 : 200;
    return c.json({ status: health.status }, statusCode);
  });
}
