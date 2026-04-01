import { useState, useEffect } from "react";
import api from "../services/api.js";

export const JobManagement = () => {
    const [jobs, setJobs] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        pickup_location: '',
        delivery_location: '',
        status: 'pending'
    });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchJobs();
    }, [page]);

    const fetchJobs = async () => {
        try {
            const response = await api.get(`/jobs?page=${page}&limit=10`);
            setJobs(response.data.jobs);
            setTotalPages(response.data.pagination.pages);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setError('Failed to fetch jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.title || !formData.title.trim()) {
            setError('Job title is required');
            return;
        }

        if (!formData.pickup_location || !formData.pickup_location.trim()) {
            setError('Pickup location is required');
            return;
        }

        if (!formData.delivery_location || !formData.delivery_location.trim()) {
            setError('Delivery location is required');
            return;
        }

        try {
            if (editingJob) {
                await api.put(`/jobs/${editingJob.id}`, formData);
                setSuccess('Job updated successfully!');
            } else {
                await api.post('/jobs', formData);
                setSuccess('Job created successfully!');
            }
            setShowForm(false);
            setEditingJob(null);
            setFormData({ title: '', description: '', pickup_location: '', delivery_location: '', status: 'pending' });
            fetchJobs();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error saving job:', error);
            setError(error.response?.data?.message || 'Failed to save job');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this job?')) {
            try {
                await api.delete(`/jobs/${id}`);
                setSuccess('Job deleted successfully!');
                fetchJobs();
                setTimeout(() => setSuccess(''), 3000);
            } catch (error) {
                console.error('Error deleting job:', error);
                setError(error.response?.data?.message || 'Failed to delete job');
            }
        }
    };

    const handleEdit = (job) => {
        setEditingJob(job);
        setFormData({
            title: job.title,
            description: job.description || '',
            pickup_location: job.pickup_location,
            delivery_location: job.delivery_location,
            status: job.status
        });
        setShowForm(true);
        setError('');
        setSuccess('');
    };

    if (loading) {
        return <div className="loading-spinner"></div>;
    }

    return (
        <div className="dashboard-stack">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3>Job Management</h3>
                        <p className="eyebrow">Create and manage delivery jobs</p>
                    </div>
                    <button className="primary-button" onClick={() => {
                        setEditingJob(null);
                        setFormData({ title: '', description: '', pickup_location: '', delivery_location: '', status: 'pending' });
                        setShowForm(!showForm);
                        setError('');
                        setSuccess('');
                    }}>
                        {showForm ? 'Cancel' : '+ Create Job'}
                    </button>
                </div>

                {error && <div className="error-banner">{error}</div>}
                {success && <div className="success-banner">{success}</div>}

                {showForm && (
                    <form onSubmit={handleSubmit} className="form-grid" style={{ marginBottom: '2rem' }}>
                        <div className="full-span">
                            <label>Job Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Downtown Delivery"
                                required
                            />
                        </div>
                        <div className="full-span">
                            <label>Description</label>
                            <textarea
                                rows="3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Detailed description of the job..."
                            />
                        </div>
                        <div>
                            <label>Pickup Location *</label>
                            <input
                                type="text"
                                value={formData.pickup_location}
                                onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                                placeholder="123 Main St, City"
                                required
                            />
                        </div>
                        <div>
                            <label>Delivery Location *</label>
                            <input
                                type="text"
                                value={formData.delivery_location}
                                onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
                                placeholder="456 Oak Ave, City"
                                required
                            />
                        </div>
                        <div>
                            <label>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="full-span">
                            <button type="submit" className="primary-button">
                                {editingJob ? 'Update Job' : 'Create Job'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Pickup Location</th>
                            <th>Delivery Location</th>
                            <th>Truck</th>
                            <th>Driver</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {jobs.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center' }}>No jobs found. Click "Create Job" to create one.</td>
                            </tr>
                        ) : (
                            jobs.map(job => (
                                <tr key={job.id}>
                                    <td>#{job.id}</td>
                                    <td><strong>{job.title}</strong></td>
                                    <td>{job.pickup_location}</td>
                                    <td>{job.delivery_location}</td>
                                    <td>{job.truck_registration || '-'}</td>
                                    <td>{job.driver_name || '-'}</td>
                                    <td>
                      <span className={`status-badge status-${job.status}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                                    </td>
                                    <td className="action-cell">
                                        <button className="secondary-button" onClick={() => handleEdit(job)}>
                                            Edit
                                        </button>
                                        <button className="danger-text" onClick={() => handleDelete(job.id)}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            ← Previous
                        </button>
                        <span>Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};