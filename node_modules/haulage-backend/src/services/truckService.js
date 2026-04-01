import { pool } from "../config/database.js";

export const getAllTrucks = async () => {
  try {
    const result = await pool.query('SELECT * FROM trucks ORDER BY id');
    return result.rows;
  } catch (error) {
    throw error;
  }
};

export const getTruckById = async (id) => {
  try {
    const result = await pool.query('SELECT * FROM trucks WHERE id = $1', [id]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const createTruck = async (truckData) => {
  const { registration_number, capacity, status } = truckData;
  try {
    const result = await pool.query(
        'INSERT INTO trucks (registration_number, capacity, status) VALUES ($1, $2, $3) RETURNING *',
        [registration_number, capacity, status || 'available']
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const updateTruck = async (id, truckData) => {
  const { registration_number, capacity, status } = truckData;
  try {
    const result = await pool.query(
        'UPDATE trucks SET registration_number = COALESCE($1, registration_number), capacity = COALESCE($2, capacity), status = COALESCE($3, status), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
        [registration_number, capacity, status, id]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const deleteTruck = async (id) => {
  try {
    const result = await pool.query('DELETE FROM trucks WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};