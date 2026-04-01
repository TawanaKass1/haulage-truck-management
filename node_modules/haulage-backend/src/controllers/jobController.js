import { pool } from "../config/database.js";
import { logger } from "../utils/logger.js";

export const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT j.*, 
             t.registration_number as truck_registration, 
             d.name as driver_name,
             u.email as driver_email
      FROM jobs j
      LEFT JOIN trucks t ON j.truck_id = t.id
      LEFT JOIN drivers d ON j.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY j.id DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await pool.query('SELECT COUNT(*) FROM jobs');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      jobs: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

export const create = async (req, res) => {
  try {
    const { title, description, pickup_location, delivery_location, status, truck_id, driver_id } = req.body;

    console.log('Creating job with data:', { title, pickup_location, delivery_location });

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Job title is required' });
    }

    if (!pickup_location || !pickup_location.trim()) {
      return res.status(400).json({ message: 'Pickup location is required' });
    }

    if (!delivery_location || !delivery_location.trim()) {
      return res.status(400).json({ message: 'Delivery location is required' });
    }

    const result = await pool.query(
        'INSERT INTO jobs (title, description, pickup_location, delivery_location, status, truck_id, driver_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [title, description || null, pickup_location, delivery_location, status || 'pending', truck_id || null, driver_id || null]
    );

    logger.info(`Job created: ${title}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating job:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT j.*, 
             t.registration_number as truck_registration, 
             t.status as truck_status,
             d.name as driver_name,
             d.phone as driver_phone,
             u.email as driver_email
      FROM jobs j
      LEFT JOIN trucks t ON j.truck_id = t.id
      LEFT JOIN drivers d ON j.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE j.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, pickup_location, delivery_location, status, truck_id, driver_id } = req.body;

    // Check if job exists
    const existing = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Business rules check
    if (status === 'in_progress' || status === 'completed') {
      // Update truck status if needed
      if (truck_id) {
        const newTruckStatus = status === 'completed' ? 'available' : 'in_transit';
        await pool.query('UPDATE trucks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newTruckStatus, truck_id]);
      }

      // Update driver status if needed
      if (driver_id) {
        const newDriverStatus = status === 'completed' ? 'available' : 'on_job';
        await pool.query('UPDATE drivers SET status = $1, current_job_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            [newDriverStatus, status === 'in_progress' ? id : null, driver_id]);
      }
    }

    const result = await pool.query(
        `UPDATE jobs 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           pickup_location = COALESCE($3, pickup_location), 
           delivery_location = COALESCE($4, delivery_location), 
           status = COALESCE($5, status), 
           truck_id = COALESCE($6, truck_id), 
           driver_id = COALESCE($7, driver_id), 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $8 
       RETURNING *`,
        [title, description, pickup_location, delivery_location, status, truck_id, driver_id, id]
    );

    logger.info(`Job updated: ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if job is in progress
    const job = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    if (job.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.rows[0].status === 'in_progress') {
      return res.status(400).json({ message: 'Cannot delete a job that is in progress' });
    }

    const result = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING *', [id]);

    logger.info(`Job deleted: ${id}`);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    logger.error('Error deleting job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};