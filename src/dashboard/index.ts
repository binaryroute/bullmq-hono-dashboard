import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { authRoutes, requireAuth } from "../auth/index.js";
import config from "../config.js";
import { registerHealthRoutes } from "../health.js";
import { queueManager } from "../queues/index.js";

interface DashboardOptions {
	port?: number;
	basePath?: string;
}

/**
 * Start the dashboard server with Bull Board
 */
export function startDashboard(options?: DashboardOptions): void {
	const port = options?.port ?? config.port;
	const basePath = options?.basePath ?? config.dashboard.basePath;

	// Create Hono adapter for Bull Board
	// serveStatic is required for serving Bull Board's static assets
	const serverAdapter = new HonoAdapter(serveStatic);
	serverAdapter.setBasePath(basePath);

	// Get all queues and create Bull Board adapters
	const queues = queueManager.getAllQueues();
	const queueAdapters = queues.map((queue) => new BullMQAdapter(queue));

	// Initialize Bull Board
	createBullBoard({
		queues: queueAdapters,
		serverAdapter,
		options: {
			uiConfig: {
				boardTitle: "Job Dashboard",
				miscLinks: [{ text: "Logout", url: "/auth/logout" }],
			},
		},
	});

	// Create main Hono app
	const app = new Hono();

	// Normalize URLs (remove trailing slashes)
	app.use(trimTrailingSlash());

	// Public routes: Health checks
	registerHealthRoutes(app);

	// Public routes: Authentication
	app.route("/auth", authRoutes);

	// Redirect root to login
	app.get("/", (c) => c.redirect("/auth/login"));

	// Protected routes: Bull Board
	// Apply auth middleware to dashboard paths
	app.use(`${basePath}`, requireAuth);
	app.use(`${basePath}/*`, requireAuth);

	// Mount Bull Board
	app.route(basePath, serverAdapter.registerPlugin());

	// Start server
	serve(
		{
			fetch: app.fetch,
			port,
		},
		(info) => {
			console.log(`Dashboard server started on http://localhost:${info.port}`);
			console.log(`  - Health:     http://localhost:${info.port}/health`);
			console.log(`  - Login:      http://localhost:${info.port}/auth/login`);
			console.log(`  - Dashboard:  http://localhost:${info.port}${basePath}`);
		},
	);
}
