import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { authConfig } from "./config.js";

/**
 * JWT payload structure
 */
export interface SessionPayload {
	userId: number;
	username: string;
	exp: number;
	[key: string]: unknown;
}

/**
 * Extend Hono context with user data
 */
declare module "hono" {
	interface ContextVariableMap {
		user: SessionPayload;
	}
}

/**
 * Build login URL with redirect parameter
 */
function getLoginRedirectUrl(originalPath: string): string {
	const redirectTo = encodeURIComponent(originalPath);
	return `/auth/login?redirectTo=${redirectTo}`;
}

/**
 * Middleware that requires valid authentication
 * Redirects to login if no valid session exists
 */
export const requireAuth = createMiddleware(async (c, next) => {
	const token = getCookie(c, authConfig.cookieName);
	const originalUrl = c.req.path;

	if (!token) {
		return c.redirect(getLoginRedirectUrl(originalUrl));
	}

	try {
		const payload = (await verify(
			token,
			authConfig.sessionSecret,
		)) as SessionPayload;

		// Check expiration
		if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
			return c.redirect(getLoginRedirectUrl(originalUrl));
		}

		// Store user in context
		c.set("user", payload);
		return next();
	} catch {
		// Invalid token
		return c.redirect(getLoginRedirectUrl(originalUrl));
	}
});
