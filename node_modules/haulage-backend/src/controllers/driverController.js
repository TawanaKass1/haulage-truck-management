import { pool } from "../config/database.js";
import { logger } from "../utils/logger.js";

export const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
        'SELECT d.*, u.email, u.name as user_name FROM drivers d LEFT JOIN users u ON d.user_id = u.id ORDER BY d.id LIMIT $1 OFFSET $2',
        [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM drivers');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      drivers: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

export const create = async (req, res) => {
  try {
    const { name, license_number, phone, email, status } = req.body;

    console.log('Creating driver with data:', { name, license_number, phone, email, status });

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Driver name is required' });
    }

    if (!license_number || !license_number.trim()) {
      return res.status(400).json({ message: 'License number is required' });
    }

    // Check if driver already exists
    const existing = await pool.query(
        'SELECT * FROM drivers WHERE license_number = $1',
        [license_number.toUpperCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Driver with this license number already exists' });
    }

    // Check if email already exists
    if (email && email.trim()) {
      const existingEmail = await pool.query(
          'SELECT * FROM drivers WHERE email = $1',
          [email]
      );
      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ message: 'Driver with this email already exists' });
      }
    }

    const result = await pool.query(
        'INSERT INTO drivers (name, license_number, phone, email, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, license_number.toUpperCase(), phone || null, email || null, status || 'available']
    );

    logger.info(`Driver created: ${name}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating driver:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
        'SELECT d.*, u.email, u.name as user_name FROM drivers d LEFT JOIN users u ON d.user_id = u.id WHERE d.id = $1',
        [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, license_number, phone, email, status, current_job_id } = req.body;

    // Check if driver exists
    const existing = await pool.query('SELECT * FROM drivers WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Check business rule: Cannot update driver that's on job
    if (existing.rows[0].status === 'on_job' && status && status !== 'on_job') {
      return res.status(400).json({ message: 'Cannot update driver that is currently on a job' });
    }

    const result = await pool.query(
        'UPDATE drivers SET name = COALESCE($1, name), license_number = COALESCE($2, license_number), phone = COALESCE($3, phone), email = COALESCE($4, email), status = COALESCE($5, status), current_job_id = COALESCE($6, current_job_id), updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
        [name, license_number ? license_number.toUpperCase() : null, phone, email, status, current_job_id, id]
    );

    logger.info(`Driver updated: ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if driver has active jobs
    const activeJobs = await pool.query(
        'SELECT * FROM jobs WHERE driver_id = $1 AND status IN ($2, $3)',
        [id, 'pending', 'in_progress']
    );

    if (activeJobs.rows.length > 0) {
      return res.status(400).json({ message: 'Cannot delete driver with active jobs' });
    }

    const result = await pool.query('DELETE FROM drivers WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    logger.info(`Driver deleted: ${id}`);
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    logger.error('Error deleting driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
};