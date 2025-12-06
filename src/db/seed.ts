import { config } from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { roles } from "./schema.js";

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

	console.log("Seeding complete!");

	await connection.end();
	process.exit(0);
}

seed().catch((error) => {
	console.error("Seeding failed:", error);
	process.exit(1);
});
