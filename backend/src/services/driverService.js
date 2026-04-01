import { pool } from "../config/database.js";
import { createCode } from "../utils/ids.js";
import { getMeta, getPagination } from "../utils/pagination.js";

export const listDrivers = async (params) => {
  const { page, limit, offset } = getPagination(params);
  const countResult = await pool("SELECT COUNT(*)::int AS total FROM drivers");
  const rows = await pool(
    "SELECT id, driver_id AS \"driverId\", name, license_number AS \"licenseNumber\", phone_number AS \"phoneNumber\", created_at AS \"createdAt\" FROM drivers ORDER BY id DESC LIMIT $1 OFFSET $2",
    [limit, offset]
  );

  return { items: rows.rows, meta: getMeta(page, limit, countResult.rows[0].total) };
};

export const getDriverById = async (id) => {
  const result = await pool(
    "SELECT id, driver_id AS \"driverId\", name, license_number AS \"licenseNumber\", phone_number AS \"phoneNumber\", created_at AS \"createdAt\" FROM drivers WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

export const createDriver = async ({ name, licenseNumber, phoneNumber }) => {
  const result = await pool(
    "INSERT INTO drivers (driver_id, name, license_number, phone_number) VALUES ($1, $2, $3, $4) RETURNING id, driver_id AS \"driverId\", name, license_number AS \"licenseNumber\", phone_number AS \"phoneNumber\", created_at AS \"createdAt\"",
    [createCode("DRV"), name, licenseNumber, phoneNumber]
  );

  return result.rows[0];
};

export const updateDriver = async (id, { name, licenseNumber, phoneNumber }) => {
  const result = await pool(
    "UPDATE drivers SET name = $1, license_number = $2, phone_number = $3 WHERE id = $4 RETURNING id, driver_id AS \"driverId\", name, license_number AS \"licenseNumber\", phone_number AS \"phoneNumber\", created_at AS \"createdAt\"",
    [name, licenseNumber, phoneNumber, id]
  );

  return result.rows[0];
};

export const deleteDriver = async (id) => {
  await pool("DELETE FROM drivers WHERE id = $1", [id]);
};
