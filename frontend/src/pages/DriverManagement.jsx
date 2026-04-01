import { useState, useEffect } from "react";
import api from "../services/api.js";

export const DriverManagement = () => {
    const [drivers, setDrivers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        license_number: '',
        phone: '',
        email: '',
        status: 'available'
    });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchDrivers();
    }, [page]);

    const fetchDrivers = async () => {
        try {
            const response = await api.get(`/drivers?page=${page}&limit=10`);
            setDrivers(response.data.drivers);
            setTotalPages(response.data.pagination.pages);
        } catch (error) {
            console.error('Error fetching drivers:', error);
            setError('Failed to fetch drivers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.name || !formData.name.trim()) {
            setError('Driver name is required');
            return;
        }

        if (!formData.license_number || !formData.license_number.trim()) {
            setError('License number is required');
            return;
        }

        try {
            if (editingDriver) {
                await api.put(`/drivers/${editingDriver.id}`, formData);
                setSuccess('Driver updated successfully!');
            } else {
                await api.post('/drivers', formData);
                setSuccess('Driver created successfully!');
            }
            setShowForm(false);
            setEditingDriver(null);
            setFormData({ name: '', license_number: '', phone: '', email: '', status: 'available' });
            fetchDrivers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error saving driver:', error);
            setError(error.response?.data?.message || 'Failed to save driver');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this driver?')) {
            try {
                await api.delete(`/drivers/${id}`);
                setSuccess('Driver deleted successfully!');
                fetchDrivers();
                setTimeout(() => setSuccess(''), 3000);
            } catch (error) {
                console.error('Error deleting driver:', error);
                setError(error.response?.data?.message || 'Failed to delete driver');
            }
        }
    };

    const handleEdit = (driver) => {
        setEditingDriver(driver);
        setFormData({
            name: driver.name,
            license_number: driver.license_number,
            phone: driver.phone || '',
            email: driver.email || '',
            status: driver.status
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
                        <h3>Driver Management</h3>
                        <p className="eyebrow">Manage your driver roster</p>
                    </div>
                    <button className="primary-button" onClick={() => {
                        setEditingDriver(null);
                        setFormData({ name: '', license_number: '', phone: '', email: '', status: 'available' });
                        setShowForm(!showForm);
                        setError('');
                        setSuccess('');
                    }}>
                        {showForm ? 'Cancel' : '+ Add Driver'}
                    </button>
                </div>

                {error && <div className="error-banner">{error}</div>}
                {success && <div className="success-banner">{success}</div>}

                {showForm && (
                    <form onSubmit={handleSubmit} className="form-grid" style={{ marginBottom: '2rem' }}>
                        <div>
                            <label>Full Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div>
                            <label>License Number *</label>
                            <input
                                type="text"
                                value={formData.license_number}
                                onChange={(e) => setFormData({ ...formData, license_number: e.target.value.toUpperCase() })}
                                placeholder="DL123456789"
                                required
                            />
                        </div>
                        <div>
                            <label>Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1234567890"
                            />
                        </div>
                        <div>
                            <label>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="driver@example.com"
                            />
                        </div>
                        <div>
                            <label>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="available">Available</option>
                                <option value="on_job">On Job</option>
                            </select>
                        </div>
                        <div className="full-span">
                            <button type="submit" className="primary-button">
                                {editingDriver ? 'Update Driver' : 'Create Driver'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>License</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {drivers.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center' }}>No drivers found. Click "Add Driver" to create one.</td>
                            </tr>
                        ) : (
                            drivers.map(driver => (
                                <tr key={driver.id}>
                                    <td>#{driver.id}</td>
                                    <td><strong>{driver.name}</strong></td>
                                    <td>{driver.license_number}</td>
                                    <td>{driver.phone || '-'}</td>
                                    <td>{driver.email || '-'}</td>
                                    <td>
                      <span className={`status-badge status-${driver.status}`}>
                        {driver.status.replace('_', ' ')}
                      </span>
                                    </td>
                                    <td className="action-cell">
                                        <button className="secondary-button" onClick={() => handleEdit(driver)}>
                                            Edit
                                        </button>
                                        <button className="danger-text" onClick={() => handleDelete(driver.id)}>
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