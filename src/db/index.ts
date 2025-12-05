import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import config from "../config.js";

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  connectionLimit: config.db.connectionLimit,
});

const db = drizzle(pool);

export default db;
