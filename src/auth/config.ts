/**
 * Parse comma-separated roles from environment
 */
function parseAllowedRoles(): string[] {
  const rolesEnv = process.env.DASHBOARD_ALLOWED_ROLES;
  if (!rolesEnv) {
    return ["ROLE_ADMIN"]; // Default to admin only
  }
  return rolesEnv
    .split(",")
    .map((role) => role.trim())
    .filter((role) => role.length > 0);
}

/**
 * Authentication configuration
 */
export const authConfig = {
  /**
   * Secret for signing JWT tokens
   * MUST be changed in production!
   */
  sessionSecret: process.env.SESSION_SECRET || "change-me-in-production",

  /** Cookie name for session token */
  cookieName: "session",

  /** Cookie options */
  cookieOptions: {
    httpOnly: true,
    /**
     * Set to true if behind HTTPS load balancer
     * Internal VPC access can use HTTP
     */
    secure: process.env.COOKIE_SECURE === "true",
    /** Strict prevents CSRF attacks */
    sameSite: "strict" as const,
    path: "/",
    /** Session duration: 15 minutes */
    maxAge: 60 * 15,
  },

  /** Roles allowed to access the dashboard */
  allowedRoles: parseAllowedRoles(),
};

// Production warning
if (
  process.env.NODE_ENV === "production" &&
  authConfig.sessionSecret === "change-me-in-production"
) {
  console.warn(
    "WARNING: SESSION_SECRET not set! This is insecure in production."
  );
}
