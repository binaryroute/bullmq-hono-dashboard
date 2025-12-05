import { startDashboard } from "./dashboard/index.js";
import { queueManager } from "./queues/index.js";

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    try {
      await queueManager.shutdown();
      console.log("Shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  console.log("Starting job dashboard service...");

  try {
    // Setup shutdown handlers
    setupGracefulShutdown();

    // Start dashboard server
    startDashboard();

    console.log("Service started successfully");
  } catch (error) {
    console.error("Failed to start service:", error);
    process.exit(1);
  }
}

main();
