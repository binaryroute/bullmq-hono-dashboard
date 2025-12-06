import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import db from "../db/index.js";
import { roles, userRoles, users } from "../db/schema.js";
import { authConfig } from "./config.js";

/**
 * Authenticated user data
 */
export interface AuthenticatedUser {
	id: number;
	username: string;
	email: string | null;
	firstName: string | null;
	lastName: string | null;
}

/**
 * Check if user has any allowed role
 */
async function hasAllowedRole(userId: number): Promise<boolean> {
	const { allowedRoles } = authConfig;
	const allowedRolesUpper = allowedRoles.map((r) => r.toUpperCase());

	const userRolesList = await db
		.select({ roleName: roles.name })
		.from(userRoles)
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.where(eq(userRoles.userId, userId));

	return userRolesList.some((row) =>
		allowedRolesUpper.includes(row.roleName.toUpperCase()),
	);
}

/**
 * Verify user credentials and role
 *
 * @param username - The username to verify
 * @param password - Plain text password
 * @returns User data if valid, null otherwise
 */
export async function verifyCredentials(
	username: string,
	password: string,
): Promise<AuthenticatedUser | null> {
	try {
		// Find user by username
		const result = await db
			.select({
				id: users.id,
				username: users.username,
				email: users.email,
				firstName: users.firstName,
				lastName: users.lastName,
				passwordHash: users.passwordHash,
				activated: users.activated,
			})
			.from(users)
			.where(eq(users.username, username))
			.limit(1);

		const user = result[0];

		if (!user) {
			console.debug(`Login failed: user not found - ${username}`);
			return null;
		}

		// Check if account is activated
		if (!user.activated) {
			console.debug(`Login failed: account not activated - ${username}`);
			return null;
		}

		// Verify password
		const isValid = await bcrypt.compare(password, user.passwordHash);
		if (!isValid) {
			console.debug(`Login failed: invalid password - ${username}`);
			return null;
		}

		// Check role
		const hasRole = await hasAllowedRole(user.id);
		if (!hasRole) {
			console.debug(`Login failed: insufficient role - ${username}`);
			return null;
		}

		console.info(`User authenticated: ${username}`);

		return {
			id: user.id,
			username: user.username,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
		};
	} catch (error) {
		console.error("Credential verification error:", error);
		return null;
	}
}
