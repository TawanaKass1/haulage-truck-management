import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        "DATABASE_URL is missing. Create backend/.env and set your Neon or PostgreSQL connection string."
    );
}

const useSsl =
    connectionString.includes("sslmode=") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("aws.neon.tech");

export const pool = new Pool({
    connectionString,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
});

export const query = (text, params = []) => pool.query(text, params);
