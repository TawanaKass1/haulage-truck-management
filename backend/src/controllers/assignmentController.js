import { pool } from "../config/database.js";

export const getAvailableTrucks = async (req, res) => {
    try {
        console.log('📊 getAvailableTrucks called');
        const result = await pool.query(
            'SELECT * FROM trucks WHERE status = $1 ORDER BY id',
            ['available']
        );
        console.log(`Found ${result.rows.length} available trucks`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getAvailableDrivers = async (req, res) => {
    try {
        console.log('📊 getAvailableDrivers called');
        const result = await pool.query(
            'SELECT d.*, u.email FROM drivers d LEFT JOIN users u ON d.user_id = u.id WHERE d.status = $1 ORDER BY d.id',
            ['available']
        );
        console.log(`Found ${result.rows.length} available drivers`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getPendingJobs = async (req, res) => {
    try {
        console.log('📊 getPendingJobs called');
        const result = await pool.query(
            'SELECT * FROM jobs WHERE status = $1 ORDER BY created_at ASC',
            ['pending']
        );
        console.log(`Found ${result.rows.length} pending jobs`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const assign = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { jobId, truckId, driverId } = req.body;

        console.log('Assignment attempt:', { jobId, truckId, driverId });

        const truckResult = await client.query(
            'SELECT * FROM trucks WHERE id = $1 FOR UPDATE',
            [truckId]
        );

        if (truckResult.rows.length === 0) {
            throw new Error('Truck not found');
        }

        const truck = truckResult.rows[0];
        if (truck.status !== 'available') {
            throw new Error(`Truck is not available. Current status: ${truck.status}`);
        }

        const driverResult = await client.query(
            'SELECT * FROM drivers WHERE id = $1 FOR UPDATE',
            [driverId]
        );

        if (driverResult.rows.length === 0) {
            throw new Error('Driver not found');
        }

        const driver = driverResult.rows[0];
        if (driver.status !== 'available') {
            throw new Error(`Driver is not available. Current status: ${driver.status}`);
        }

        const activeJobsResult = await client.query(
            'SELECT * FROM jobs WHERE driver_id = $1 AND status IN ($2, $3)',
            [driverId, 'in_progress', 'pending']
        );

        if (activeJobsResult.rows.length > 0) {
            throw new Error('Driver already has an active job');
        }

        const jobResult = await client.query(
            'SELECT * FROM jobs WHERE id = $1 FOR UPDATE',
            [jobId]
        );

        if (jobResult.rows.length === 0) {
            throw new Error('Job not found');
        }

        const job = jobResult.rows[0];
        if (job.status !== 'pending') {
            throw new Error(`Job is not pending. Current status: ${job.status}`);
        }

        await client.query(
            'UPDATE jobs SET truck_id = $1, driver_id = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
            [truckId, driverId, 'in_progress', jobId]
        );

        await client.query(
            'UPDATE trucks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['in_transit', truckId]
        );

        await client.query(
            'UPDATE drivers SET status = $1, current_job_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            ['on_job', jobId, driverId]
        );

        await client.query('COMMIT');

        console.log('Assignment successful!');

        res.json({
            message: 'Assignment successful',
            assignment: {
                jobId,
                truckId,
                driverId,
                truckRegistration: truck.registration_number,
                driverName: driver.name
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Assignment error:', error);
        res.status(400).json({ message: error.message });
    } finally {
        client.release();
    }
};

export const getDriverCurrentJob = async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ message: 'Driver access required' });
        }

        const driverResult = await pool.query('SELECT * FROM drivers WHERE user_id = $1', [req.user.id]);

        if (driverResult.rows.length === 0) {
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        const driver = driverResult.rows[0];

        if (!driver.current_job_id) {
            return res.json({ message: 'No active job' });
        }

        const jobResult = await pool.query(`
      SELECT j.*, t.registration_number as truck_registration
      FROM jobs j
      LEFT JOIN trucks t ON j.truck_id = t.id
      WHERE j.id = $1
    `, [driver.current_job_id]);

        res.json(jobResult.rows[0] || { message: 'No active job' });
    } catch (error) {
        console.error('Error fetching driver current job:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

export const updateJobStatus = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { jobId } = req.params;
        const { status } = req.body;

        console.log('Updating job status:', { jobId, status });

        const jobResult = await client.query('SELECT * FROM jobs WHERE id = $1 FOR UPDATE', [jobId]);

        if (jobResult.rows.length === 0) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const job = jobResult.rows[0];

        await client.query(
            'UPDATE jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [status, jobId]
        );

        if (status === 'completed') {
            if (job.truck_id) {
                await client.query(
                    'UPDATE trucks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    ['available', job.truck_id]
                );
            }

            if (job.driver_id) {
                await client.query(
                    'UPDATE drivers SET status = $1, current_job_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    ['available', job.driver_id]
                );
            }
        }

        await client.query('COMMIT');

        console.log('Job status updated successfully');

        res.json({ message: 'Job status updated successfully', status });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating job status:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    } finally {
        client.release();
    }
};