import {
	bigint,
	boolean,
	mysqlTable,
	timestamp,
	unique,
	varchar,
} from "drizzle-orm/mysql-core";

/**
 * Users table - stores user credentials and profile
 */
export const users = mysqlTable("users", {
	id: bigint({ mode: "number" }).autoincrement().notNull().primaryKey(),
	username: varchar({ length: 50 }).notNull().unique(),
	passwordHash: varchar("password_hash", { length: 60 }).notNull(),
	email: varchar({ length: 191 }).unique(),
	firstName: varchar("first_name", { length: 50 }),
	lastName: varchar("last_name", { length: 50 }),
	activated: boolean("activated").notNull().default(true),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

/**
 * Roles table - defines available roles
 */
export const roles = mysqlTable("roles", {
	id: bigint({ mode: "number" }).autoincrement().notNull().primaryKey(),
	name: varchar({ length: 50 }).notNull().unique(),
	description: varchar({ length: 255 }),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

/**
 * User-Role junction table - many-to-many relationship
 */
export const userRoles = mysqlTable(
	"user_roles",
	{
		id: bigint({ mode: "number" }).autoincrement().notNull().primaryKey(),
		userId: bigint("user_id", { mode: "number" })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		roleId: bigint("role_id", { mode: "number" })
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		userRoleUnique: unique("user_roles_unique").on(table.userId, table.roleId),
	}),
);
