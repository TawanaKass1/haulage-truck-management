import { useState, useEffect } from "react";
import api from "../services/api.js";

export const TruckManagement = () => {
    const [trucks, setTrucks] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingTruck, setEditingTruck] = useState(null);
    const [formData, setFormData] = useState({
        registration_number: '',
        capacity: '',
        status: 'available'
    });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchTrucks();
    }, [page]);

    const fetchTrucks = async () => {
        try {
            const response = await api.get(`/trucks?page=${page}&limit=10`);
            setTrucks(response.data.trucks);
            setTotalPages(response.data.pagination.pages);
        } catch (error) {
            console.error('Error fetching trucks:', error);
            setError('Failed to fetch trucks');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate required fields
        if (!formData.registration_number || !formData.registration_number.trim()) {
            setError('Registration number is required');
            return;
        }

        if (!formData.capacity || formData.capacity <= 0) {
            setError('Valid capacity is required');
            return;
        }

        console.log('Submitting truck data:', formData);

        try {
            if (editingTruck) {
                await api.put(`/trucks/${editingTruck.id}`, formData);
                setSuccess('Truck updated successfully!');
            } else {
                await api.post('/trucks', formData);
                setSuccess('Truck created successfully!');
            }
            setShowForm(false);
            setEditingTruck(null);
            setFormData({ registration_number: '', capacity: '', status: 'available' });
            fetchTrucks();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error saving truck:', error);
            console.error('Error response:', error.response?.data);
            setError(error.response?.data?.message || 'Failed to save truck');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this truck?')) {
            try {
                await api.delete(`/trucks/${id}`);
                setSuccess('Truck deleted successfully!');
                fetchTrucks();
                setTimeout(() => setSuccess(''), 3000);
            } catch (error) {
                console.error('Error deleting truck:', error);
                setError(error.response?.data?.message || 'Failed to delete truck');
            }
        }
    };

    const handleEdit = (truck) => {
        setEditingTruck(truck);
        setFormData({
            registration_number: truck.registration_number,
            capacity: truck.capacity,
            status: truck.status
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
                        <h3>Truck Management</h3>
                        <p className="eyebrow">Manage your fleet vehicles</p>
                    </div>
                    <button className="primary-button" onClick={() => {
                        setEditingTruck(null);
                        setFormData({ registration_number: '', capacity: '', status: 'available' });
                        setShowForm(!showForm);
                        setError('');
                        setSuccess('');
                    }}>
                        {showForm ? 'Cancel' : '+ Add Truck'}
                    </button>
                </div>

                {error && <div className="error-banner">{error}</div>}
                {success && <div className="success-banner">{success}</div>}

                {showForm && (
                    <form onSubmit={handleSubmit} className="form-grid" style={{ marginBottom: '2rem' }}>
                        <div>
                            <label>Registration Number *</label>
                            <input
                                type="text"
                                value={formData.registration_number}
                                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value.toUpperCase() })}
                                placeholder="e.g., ABC-1234"
                                required
                            />
                            {!formData.registration_number && (
                                <p className="error-text" style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#b42318' }}>
                                    Registration number is required
                                </p>
                            )}
                        </div>
                        <div>
                            <label>Capacity (tons) *</label>
                            <input
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                placeholder="e.g., 15"
                                required
                                min="1"
                            />
                        </div>
                        <div>
                            <label>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="available">Available</option>
                                <option value="in_transit">In Transit</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                        <div className="full-span">
                            <button type="submit" className="primary-button">
                                {editingTruck ? 'Update Truck' : 'Create Truck'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>Truck ID</th>
                            <th>Registration</th>
                            <th>Capacity (tons)</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {trucks.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center' }}>No trucks found. Click "Add Truck" to create one.</td>
                            </tr>
                        ) : (
                            trucks.map(truck => (
                                <tr key={truck.id}>
                                    <td>#{truck.id}</td>
                                    <td><strong>{truck.registration_number}</strong></td>
                                    <td>{truck.capacity} tons</td>
                                    <td>
                      <span className={`status-badge status-${truck.status}`}>
                        {truck.status.replace('_', ' ')}
                      </span>
                                    </td>
                                    <td className="action-cell">
                                        <button className="secondary-button" onClick={() => handleEdit(truck)}>
                                            Edit
                                        </button>
                                        <button className="danger-text" onClick={() => handleDelete(truck.id)}>
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