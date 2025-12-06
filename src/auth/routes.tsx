import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { authConfig } from "./config.js";
import { LoginPage } from "./login-page.js";
import { requireAuth, type SessionPayload } from "./middleware.js";
import { verifyCredentials } from "./service.js";

/** Default redirect after login */
const DEFAULT_REDIRECT = "/admin/queues";

/**
 * Validate redirect URL to prevent open redirect attacks
 * Only allows relative paths, blocks protocol-relative URLs
 */
function getSafeRedirectUrl(url: string | undefined): string {
	if (!url) {
		return DEFAULT_REDIRECT;
	}

	// Must start with / but not // (protocol-relative)
	if (url.startsWith("/") && !url.startsWith("//")) {
		// Block backslashes that could bypass checks
		if (!url.includes("\\")) {
			return url;
		}
	}

	return DEFAULT_REDIRECT;
}

/**
 * In-memory rate limiter for login attempts
 */
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const record = loginAttempts.get(ip);

	if (!record) return false;

	if (now > record.resetTime) {
		loginAttempts.delete(ip);
		return false;
	}

	return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
	const now = Date.now();
	const record = loginAttempts.get(ip);

	if (!record || now > record.resetTime) {
		loginAttempts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
	} else {
		record.count++;
	}
}

function clearFailedAttempts(ip: string): void {
	loginAttempts.delete(ip);
}

// Create auth router
const authRoutes = new Hono();

/**
 * GET /auth/login - Render login page
 */
authRoutes.get("/login", (c) => {
	const redirectTo = c.req.query("redirectTo");
	const error = c.req.query("error");
	return c.html(<LoginPage error={error} redirectTo={redirectTo} />);
});

/**
 * POST /auth/login - Handle login form submission
 */
authRoutes.post("/login", async (c) => {
	// Get client IP for rate limiting
	const clientIp =
		c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
		c.req.header("x-real-ip") ||
		"unknown";

	const body = await c.req.parseBody();
	const username = body.username as string | undefined;
	const password = body.password as string | undefined;
	const redirectTo = getSafeRedirectUrl(body.redirectTo as string);

	// Helper for login errors
	const loginError = (message: string) => {
		const params = new URLSearchParams({ error: message });
		if (redirectTo !== DEFAULT_REDIRECT) {
			params.set("redirectTo", redirectTo);
		}
		return c.redirect(`/auth/login?${params.toString()}`);
	};

	// Check rate limit
	if (isRateLimited(clientIp)) {
		console.warn(`Rate limited login attempt from ${clientIp}`);
		return loginError("Too many login attempts. Please try again later.");
	}

	if (!username || !password) {
		return loginError("Username and password are required");
	}

	try {
		const user = await verifyCredentials(username, password);

		if (!user) {
			recordFailedAttempt(clientIp);
			return loginError("Invalid username or password");
		}

		// Clear rate limit on success
		clearFailedAttempts(clientIp);

		// Create JWT
		const payload: SessionPayload = {
			userId: user.id,
			username: user.username,
			exp: Math.floor(Date.now() / 1000) + authConfig.cookieOptions.maxAge,
		};

		const token = await sign(payload, authConfig.sessionSecret);

		// Set session cookie
		setCookie(c, authConfig.cookieName, token, authConfig.cookieOptions);

		console.info(`User logged in: ${user.username}`);

		return c.redirect(redirectTo);
	} catch (error) {
		console.error("Login error:", error);
		return loginError("An error occurred. Please try again.");
	}
});

/**
 * GET /auth/logout - Clear session and redirect to login
 */
authRoutes.get("/logout", (c) => {
	deleteCookie(c, authConfig.cookieName, { path: "/" });
	return c.redirect("/auth/login");
});

/**
 * POST /auth/logout - Clear session (for API calls)
 */
authRoutes.post("/logout", (c) => {
	deleteCookie(c, authConfig.cookieName, { path: "/" });
	return c.json({ success: true, message: "Logged out" });
});

/**
 * GET /auth/me - Get current user info
 */
authRoutes.get("/me", requireAuth, (c) => {
	const user = c.get("user");
	return c.json({
		user: {
			userId: user.userId,
			username: user.username,
		},
	});
});

export { authRoutes };
