import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js";

export const DriverRegister = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        license_number: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setShowOtp(false);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...registerData } = formData;
            const response = await api.post('/auth/register-driver', registerData);

            // Check if OTP is returned in response (development mode)
            if (response.data.otp) {
                setGeneratedOtp(response.data.otp);
                setShowOtp(true);
            }

            setSuccess(response.data.message);
            setTimeout(() => {
                navigate('/verify-otp', { state: { email: formData.email } });
            }, 3000);
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-card">
                <p className="eyebrow">Join Haulage Ops</p>
                <h1>Driver Registration</h1>

                {error && <div className="error-banner">{error}</div>}
                {success && <div className="success-banner">{success}</div>}

                {showOtp && (
                    <div className="success-banner" style={{ background: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' }}>
                        <strong>⚠️ Development Mode</strong>
                        <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                            Your OTP is: <strong style={{ fontSize: '1.2rem' }}>{generatedOtp}</strong>
                        </p>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                            (In production, this would be sent to your email)
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Full Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label>Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label>Password *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label>Confirm Password *</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label>License Number *</label>
                        <input
                            type="text"
                            name="license_number"
                            value={formData.license_number}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label>Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="primary-button" disabled={loading} style={{ marginTop: '1.5rem', width: '100%' }}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <button className="link-button" onClick={() => navigate('/driver-login')} style={{ marginTop: '1rem' }}>
                    Already have an account? Login
                </button>

                <button className="link-button" onClick={() => navigate('/role-select')}>
                    ← Back
                </button>
            </div>
        </div>
    );
};