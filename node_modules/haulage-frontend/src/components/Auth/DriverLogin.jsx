import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";

export const DriverLogin = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login-driver', formData);
            login(response.data.token, response.data.user);
            navigate('/driver');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-card">
                <p className="eyebrow">Driver Portal</p>
                <h1>Driver Login</h1>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="primary-button" disabled={loading} style={{ marginTop: '1.5rem', width: '100%' }}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <button className="link-button" onClick={() => navigate('/driver-register')} style={{ marginTop: '1rem' }}>
                    New Driver? Register here
                </button>

                <button className="link-button" onClick={() => navigate('/role-select')}>
                    ← Back
                </button>
            </div>
        </div>
    );
};