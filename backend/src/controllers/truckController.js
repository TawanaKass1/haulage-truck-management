import { pool } from "../config/database.js";
import { logger } from "../utils/logger.js";

export const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
        'SELECT * FROM trucks ORDER BY id LIMIT $1 OFFSET $2',
        [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM trucks');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      trucks: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching trucks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const create = async (req, res) => {
  try {
    const { registration_number, capacity, status } = req.body;

    console.log('Creating truck with data:', { registration_number, capacity, status });

    // Validate required fields
    if (!registration_number || !registration_number.trim()) {
      return res.status(400).json({ message: 'Registration number is required' });
    }

    if (!capacity || capacity <= 0) {
      return res.status(400).json({ message: 'Valid capacity is required' });
    }

    // Check if truck already exists
    const existing = await pool.query(
        'SELECT * FROM trucks WHERE registration_number = $1',
        [registration_number.toUpperCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Truck with this registration number already exists' });
    }

    const result = await pool.query(
        'INSERT INTO trucks (registration_number, capacity, status) VALUES ($1, $2, $3) RETURNING *',
        [registration_number.toUpperCase(), capacity, status || 'available']
    );

    logger.info(`Truck created: ${registration_number}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating truck:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM trucks WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching truck:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { registration_number, capacity, status } = req.body;

    // Check if truck exists
    const existing = await pool.query('SELECT * FROM trucks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    // Check business rule: Cannot update truck that's in transit
    if (existing.rows[0].status === 'in_transit' && status && status !== 'in_transit') {
      return res.status(400).json({ message: 'Cannot update truck that is currently in transit' });
    }

    const result = await pool.query(
        'UPDATE trucks SET registration_number = COALESCE($1, registration_number), capacity = COALESCE($2, capacity), status = COALESCE($3, status), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
        [registration_number ? registration_number.toUpperCase() : null, capacity, status, id]
    );

    logger.info(`Truck updated: ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating truck:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if truck has active jobs
    const activeJobs = await pool.query(
        'SELECT * FROM jobs WHERE truck_id = $1 AND status IN ($2, $3)',
        [id, 'pending', 'in_progress']
    );

    if (activeJobs.rows.length > 0) {
      return res.status(400).json({ message: 'Cannot delete truck with active jobs' });
    }

    const result = await pool.query('DELETE FROM trucks WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    logger.info(`Truck deleted: ${id}`);
    res.json({ message: 'Truck deleted successfully' });
  } catch (error) {
    logger.error('Error deleting truck:', error);
    res.status(500).json({ message: 'Server error' });
  }
};