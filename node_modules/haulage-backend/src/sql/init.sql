CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trucks (
  id SERIAL PRIMARY KEY,
  truck_id VARCHAR(30) UNIQUE NOT NULL,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  capacity NUMERIC(10,2) NOT NULL CHECK (capacity > 0),
  status VARCHAR(30) NOT NULL CHECK (status IN ('available', 'in_transit', 'maintenance')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  driver_id VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  license_number VARCHAR(60) UNIQUE NOT NULL,
  phone_number VARCHAR(30) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(30) UNIQUE NOT NULL,
  pickup_location VARCHAR(120) NOT NULL,
  delivery_location VARCHAR(120) NOT NULL,
  cargo_description TEXT NOT NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'assigned', 'in_transit', 'completed', 'cancelled')),
  assigned_truck_id INTEGER REFERENCES trucks(id) ON DELETE SET NULL,
  assigned_driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_assigned_truck_id ON jobs(assigned_truck_id);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_driver_id ON jobs(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

INSERT INTO users (name, email, password_hash)
VALUES (
  'Assessment Admin',
  'admin@marytechenock.com',
  '$2a$10$olvcZnun/bBezSGhz8pfPOpJcjUEVbg8zqvn/Wg9Nk1eizMJ5i6pu'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password_hash)
VALUES
  (
    'Demo Operations Manager',
    'manager@marytechenock.com',
    '$2a$10$olvcZnun/bBezSGhz8pfPOpJcjUEVbg8zqvn/Wg9Nk1eizMJ5i6pu'
  ),
  (
    'Demo Dispatcher',
    'dispatcher@marytechenock.com',
    '$2a$10$olvcZnun/bBezSGhz8pfPOpJcjUEVbg8zqvn/Wg9Nk1eizMJ5i6pu'
  ),
  (
    'Demo Fleet Supervisor',
    'fleet@marytechenock.com',
    '$2a$10$olvcZnun/bBezSGhz8pfPOpJcjUEVbg8zqvn/Wg9Nk1eizMJ5i6pu'
  )
ON CONFLICT (email) DO NOTHING;
