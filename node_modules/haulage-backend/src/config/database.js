import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';

dotenv.config();

// Use your Neon database connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('📡 Connecting to Neon PostgreSQL...');

pool.on('connect', () => {
  console.log('✅ Connected to Neon PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err);
});

export const initDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('Initializing database tables...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        is_verified BOOLEAN DEFAULT FALSE,
        otp_code VARCHAR(6),
        otp_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trucks (
        id SERIAL PRIMARY KEY,
        registration_number VARCHAR(50) UNIQUE NOT NULL,
        capacity INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        license_number VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'available',
        current_job_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        pickup_location TEXT NOT NULL,
        delivery_location TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        truck_id INTEGER REFERENCES trucks(id),
        driver_id INTEGER REFERENCES drivers(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const adminCheck = await client.query('SELECT * FROM users WHERE email = $1', ['admin@marytechenock.com']);

    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await client.query(
          'INSERT INTO users (email, password, name, role, is_verified) VALUES ($1, $2, $3, $4, $5)',
          ['admin@marytechenock.com', hashedPassword, 'Admin User', 'admin', true]
      );
      console.log('✅ Default admin user created');
    } else {
      console.log('✅ Admin user exists');
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await client.query(
          'UPDATE users SET password = $1 WHERE email = $2',
          [hashedPassword, 'admin@marytechenock.com']
      );
      console.log('✅ Admin password updated');
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

export { pool };