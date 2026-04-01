import { useState, useEffect } from "react";
import api from "../services/api.js";

export const AssignmentPage = () => {
    const [availableTrucks, setAvailableTrucks] = useState([]);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [pendingJobs, setPendingJobs] = useState([]);
    const [selectedTruck, setSelectedTruck] = useState('');
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedJob, setSelectedJob] = useState('');
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            console.log('Fetching assignment data...');

            const [trucksRes, driversRes, jobsRes] = await Promise.all([
                api.get('/assignments/available-trucks'),
                api.get('/assignments/available-drivers'),
                api.get('/assignments/pending-jobs')
            ]);

            console.log('Available trucks:', trucksRes.data);
            console.log('Available drivers:', driversRes.data);
            console.log('Pending jobs:', jobsRes.data);

            setAvailableTrucks(trucksRes.data || []);
            setAvailableDrivers(driversRes.data || []);
            setPendingJobs(jobsRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            console.error('Error response:', error.response?.data);
            setError(error.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!selectedJob || !selectedTruck || !selectedDriver) {
            setError('Please select a job, truck, and driver');
            return;
        }

        setAssigning(true);
        setError('');
        setSuccess('');

        try {
            console.log('Assigning:', { jobId: selectedJob, truckId: selectedTruck, driverId: selectedDriver });

            await api.post('/assignments/assign', {
                jobId: parseInt(selectedJob),
                truckId: parseInt(selectedTruck),
                driverId: parseInt(selectedDriver)
            });
            setSuccess('Assignment successful!');
            setSelectedJob('');
            setSelectedTruck('');
            setSelectedDriver('');
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error assigning:', error);
            setError(error.response?.data?.message || 'Failed to assign');
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-stack">
                <div className="card">
                    <h3>Loading Assignment Data...</h3>
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-stack">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3>Assign Jobs</h3>
                        <p className="eyebrow">Assign drivers and trucks to pending jobs</p>
                    </div>
                    <button className="secondary-button" onClick={fetchData}>
                        🔄 Refresh
                    </button>
                </div>

                {error && <div className="error-banner">{error}</div>}
                {success && <div className="success-banner">{success}</div>}

                <form onSubmit={handleAssign} className="form-grid">
                    <div>
                        <label>Select Job *</label>
                        <select
                            value={selectedJob}
                            onChange={(e) => setSelectedJob(e.target.value)}
                            required
                        >
                            <option value="">-- Select a job --</option>
                            {pendingJobs.map(job => (
                                <option key={job.id} value={job.id}>
                                    #{job.id} - {job.title} ({job.pickup_location} → {job.delivery_location})
                                </option>
                            ))}
                        </select>
                        {pendingJobs.length === 0 && (
                            <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#bf6a39' }}>
                                No pending jobs available. Create a job first in the Jobs page.
                            </p>
                        )}
                    </div>

                    <div>
                        <label>Select Truck *</label>
                        <select
                            value={selectedTruck}
                            onChange={(e) => setSelectedTruck(e.target.value)}
                            required
                        >
                            <option value="">-- Select a truck --</option>
                            {availableTrucks.map(truck => (
                                <option key={truck.id} value={truck.id}>
                                    {truck.registration_number} ({truck.capacity} tons)
                                </option>
                            ))}
                        </select>
                        {availableTrucks.length === 0 && (
                            <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#bf6a39' }}>
                                No available trucks. Add a truck or check truck status.
                            </p>
                        )}
                    </div>

                    <div>
                        <label>Select Driver *</label>
                        <select
                            value={selectedDriver}
                            onChange={(e) => setSelectedDriver(e.target.value)}
                            required
                        >
                            <option value="">-- Select a driver --</option>
                            {availableDrivers.map(driver => (
                                <option key={driver.id} value={driver.id}>
                                    {driver.name} ({driver.license_number})
                                </option>
                            ))}
                        </select>
                        {availableDrivers.length === 0 && (
                            <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#bf6a39' }}>
                                No available drivers. Add a driver or check driver status.
                            </p>
                        )}
                    </div>

                    <div className="full-span">
                        <button
                            type="submit"
                            className="primary-button"
                            disabled={assigning || pendingJobs.length === 0 || availableTrucks.length === 0 || availableDrivers.length === 0}
                        >
                            {assigning ? 'Assigning...' : 'Assign Job'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="card">
                <h3>Current Status</h3>
                <div className="grid-2">
                    <div>
                        <p className="eyebrow">Available Trucks</p>
                        <h2>{availableTrucks.length}</h2>
                    </div>
                    <div>
                        <p className="eyebrow">Available Drivers</p>
                        <h2>{availableDrivers.length}</h2>
                    </div>
                    <div>
                        <p className="eyebrow">Pending Jobs</p>
                        <h2>{pendingJobs.length}</h2>
                    </div>
                </div>
            </div>

            {pendingJobs.length > 0 && (
                <div className="card">
                    <h3>Pending Jobs</h3>
                    <div className="table-wrap">
                        <table>
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Pickup</th>
                                <th>Delivery</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pendingJobs.map(job => (
                                <tr key={job.id}>
                                    <td>#{job.id}</td>
                                    <td><strong>{job.title}</strong></td>
                                    <td>{job.pickup_location}</td>
                                    <td>{job.delivery_location}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};