import { pool } from "../config/database.js";
import { createCode } from "../utils/ids.js";
import {
  ACTIVE_JOB_STATUSES,
  isDriverBlocked,
  resolveTruckStatusFromJob,
  truckBusyStatuses
} from "../utils/jobRules.js";
import { getMeta, getPagination } from "../utils/pagination.js";

const getTruck = async (id) => {
  const result = await pool("SELECT * FROM trucks WHERE id = $1", [id]);
  return result.rows[0];
};

const getDriver = async (id) => {
  const result = await pool("SELECT * FROM drivers WHERE id = $1", [id]);
  return result.rows[0];
};

const getJob = async (id) => {
  const result = await pool("SELECT * FROM jobs WHERE id = $1", [id]);
  return result.rows[0];
};

const validateJobPayload = ({ assignedTruckId, assignedDriverId, status }) => {
  if ((assignedTruckId && !assignedDriverId) || (!assignedTruckId && assignedDriverId)) {
    throw new Error("Truck and driver must be assigned together");
  }

  if (!assignedTruckId && ["assigned", "in_transit"].includes(status)) {
    throw new Error("Active job statuses require an assigned truck and driver");
  }
};

const getDriverActiveJobs = async (driverId, excludeJobId = null) => {
  const params = [driverId, ACTIVE_JOB_STATUSES];
  let sql = "SELECT id, status FROM jobs WHERE assigned_driver_id = $1 AND status = ANY($2)";

  if (excludeJobId) {
    params.push(excludeJobId);
    sql += " AND id <> $3";
  }

  const result = await pool(sql, params);
  return result.rows;
};

const validateAssignment = async ({ assignedTruckId, assignedDriverId, excludeJobId }) => {
  if (!assignedTruckId || !assignedDriverId) {
    return;
  }

  const truck = await getTruck(assignedTruckId);
  if (!truck) {
    throw new Error("Assigned truck not found");
  }

  const currentJob = excludeJobId ? await getJob(excludeJobId) : null;
  const isSameTruckOnCurrentJob = currentJob?.assigned_truck_id === assignedTruckId;

  if (truckBusyStatuses.includes(truck.status) && !isSameTruckOnCurrentJob) {
    throw new Error("Truck is not available for assignment");
  }

  const driver = await getDriver(assignedDriverId);
  if (!driver) {
    throw new Error("Assigned driver not found");
  }

  const activeJobs = await getDriverActiveJobs(assignedDriverId, excludeJobId);
  if (isDriverBlocked(activeJobs)) {
    throw new Error("Driver already has an active job");
  }
};

const syncTruckStatus = async (job) => {
  if (!job.assigned_truck_id) {
    return;
  }

  const nextTruckStatus = resolveTruckStatusFromJob(job.status);
  await pool("UPDATE trucks SET status = $1 WHERE id = $2", [nextTruckStatus, job.assigned_truck_id]);
};

export const listJobs = async (params) => {
  const { page, limit, offset } = getPagination(params);
  const countResult = await pool("SELECT COUNT(*)::int AS total FROM jobs");
  const result = await pool(
    `SELECT
      j.id,
      j.job_id AS "jobId",
      j.pickup_location AS "pickupLocation",
      j.delivery_location AS "deliveryLocation",
      j.cargo_description AS "cargoDescription",
      j.status,
      j.created_at AS "createdAt",
      j.assigned_truck_id AS "assignedTruckId",
      j.assigned_driver_id AS "assignedDriverId",
      t.registration_number AS "truckRegistrationNumber",
      d.name AS "driverName"
    FROM jobs j
    LEFT JOIN trucks t ON t.id = j.assigned_truck_id
    LEFT JOIN drivers d ON d.id = j.assigned_driver_id
    ORDER BY j.id DESC
    LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return { items: result.rows, meta: getMeta(page, limit, countResult.rows[0].total) };
};

export const getJobById = async (id) => {
  const result = await pool(
    `SELECT
      j.id,
      j.job_id AS "jobId",
      j.pickup_location AS "pickupLocation",
      j.delivery_location AS "deliveryLocation",
      j.cargo_description AS "cargoDescription",
      j.status,
      j.created_at AS "createdAt",
      j.assigned_truck_id AS "assignedTruckId",
      j.assigned_driver_id AS "assignedDriverId",
      t.registration_number AS "truckRegistrationNumber",
      d.name AS "driverName"
    FROM jobs j
    LEFT JOIN trucks t ON t.id = j.assigned_truck_id
    LEFT JOIN drivers d ON d.id = j.assigned_driver_id
    WHERE j.id = $1`,
    [id]
  );

  return result.rows[0];
};

export const createJob = async (payload) => {
  validateJobPayload(payload);
  await validateAssignment(payload);
  const status =
    payload.assignedTruckId && payload.assignedDriverId
      ? payload.status || "assigned"
      : payload.status || "pending";
  const result = await pool(
    `INSERT INTO jobs (
      job_id, pickup_location, delivery_location, cargo_description, status, assigned_truck_id, assigned_driver_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      createCode("JOB"),
      payload.pickupLocation,
      payload.deliveryLocation,
      payload.cargoDescription,
      status,
      payload.assignedTruckId || null,
      payload.assignedDriverId || null
    ]
  );

  await syncTruckStatus(result.rows[0]);
  return getJobById(result.rows[0].id);
};

export const updateJob = async (id, payload) => {
  const existing = await getJob(id);

  if (!existing) {
    return null;
  }

  validateJobPayload(payload);

  await validateAssignment({
    assignedTruckId: payload.assignedTruckId,
    assignedDriverId: payload.assignedDriverId,
    excludeJobId: id
  });

  if (existing.assigned_truck_id && existing.assigned_truck_id !== payload.assignedTruckId) {
    await pool("UPDATE trucks SET status = 'available' WHERE id = $1", [existing.assigned_truck_id]);
  }

  const result = await pool(
    `UPDATE jobs
      SET pickup_location = $1,
          delivery_location = $2,
          cargo_description = $3,
          status = $4,
          assigned_truck_id = $5,
          assigned_driver_id = $6
      WHERE id = $7
      RETURNING *`,
    [
      payload.pickupLocation,
      payload.deliveryLocation,
      payload.cargoDescription,
      payload.status,
      payload.assignedTruckId || null,
      payload.assignedDriverId || null,
      id
    ]
  );

  await syncTruckStatus(result.rows[0]);
  return getJobById(id);
};

export const deleteJob = async (id) => {
  const existingResult = await pool("SELECT * FROM jobs WHERE id = $1", [id]);
  const existing = existingResult.rows[0];

  if (existing?.assigned_truck_id) {
    await pool("UPDATE trucks SET status = 'available' WHERE id = $1", [existing.assigned_truck_id]);
  }

  await pool("DELETE FROM jobs WHERE id = $1", [id]);
};
