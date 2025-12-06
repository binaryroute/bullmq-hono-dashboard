import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { roles, userRoles, users } from "./schema.js";

// Load environment variables
if (process.env.NODE_ENV === "development") {
	config({ path: ".env.local" });
} else {
	config();
}

const defaultRoles = [
	{ name: "ROLE_ADMIN", description: "Full administrative access" },
	{ name: "ROLE_OPERATOR", description: "Can view and manage job queues" },
	{ name: "ROLE_VIEWER", description: "Read-only access to dashboard" },
];

const sampleUser = {
	username: "admin",
	password: "admin123",
	email: "admin@example.com",
	firstName: "Admin",
	lastName: "User",
};

async function seed() {
	const connection = await mysql.createConnection({
		host: process.env.DB_HOST || "localhost",
		user: process.env.DB_USER || "root",
		password: process.env.DB_PASSWORD || "password",
		database: process.env.DB_DATABASE || "job_dashboard",
	});

	const db = drizzle(connection);

	console.log("Seeding default roles...");

	for (const role of defaultRoles) {
		await db
			.insert(roles)
			.values(role)
			.onDuplicateKeyUpdate({ set: { description: role.description } });
		console.log(`  - ${role.name}`);
	}

	console.log("\nSeeding sample admin user...");

	const passwordHash = await bcrypt.hash(sampleUser.password, 10);

	await db
		.insert(users)
		.values({
			username: sampleUser.username,
			passwordHash,
			email: sampleUser.email,
			firstName: sampleUser.firstName,
			lastName: sampleUser.lastName,
		})
		.onDuplicateKeyUpdate({ set: { email: sampleUser.email } });

	// Get user and admin role IDs
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.username, sampleUser.username));
	const [adminRole] = await db
		.select()
		.from(roles)
		.where(eq(roles.name, "ROLE_ADMIN"));

	if (user && adminRole) {
		await db
			.insert(userRoles)
			.values({ userId: user.id, roleId: adminRole.id })
			.onDuplicateKeyUpdate({ set: { roleId: adminRole.id } });
		console.log(
			`  - Created user: ${sampleUser.username} (password: ${sampleUser.password})`,
		);
	}

	console.log("\nSeeding complete!");

	await connection.end();
	process.exit(0);
}

seed().catch((error) => {
	console.error("Seeding failed:", error);
	process.exit(1);
});
