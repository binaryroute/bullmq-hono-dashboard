import {
  mysqlTable,
  varchar,
  bigint,
  bit,
  timestamp,
  primaryKey,
  unique,
} from "drizzle-orm/mysql-core";

/**
 * Users table - stores user credentials and profile
 */
export const users = mysqlTable(
  "users",
  {
    id: bigint({ mode: "number" }).autoincrement().notNull(),
    username: varchar({ length: 50 }).notNull(),
    passwordHash: varchar("password_hash", { length: 60 }).notNull(),
    email: varchar({ length: 191 }),
    firstName: varchar("first_name", { length: 50 }),
    lastName: varchar("last_name", { length: 50 }),
    activated: bit("activated").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "users_pkey" }),
    unique("users_username_unique").on(table.username),
    unique("users_email_unique").on(table.email),
  ]
);

/**
 * Roles table - defines available roles
 */
export const roles = mysqlTable(
  "roles",
  {
    id: bigint({ mode: "number" }).autoincrement().notNull(),
    name: varchar({ length: 50 }).notNull(),
    description: varchar({ length: 255 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "roles_pkey" }),
    unique("roles_name_unique").on(table.name),
  ]
);

/**
 * User-Role junction table - many-to-many relationship
 */
export const userRoles = mysqlTable(
  "user_roles",
  {
    id: bigint({ mode: "number" }).autoincrement().notNull(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: bigint("role_id", { mode: "number" })
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "user_roles_pkey" }),
    unique("user_roles_unique").on(table.userId, table.roleId),
  ]
);
