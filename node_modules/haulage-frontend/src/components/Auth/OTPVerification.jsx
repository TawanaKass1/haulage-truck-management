import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";

export const OTPVerification = () => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/driver-register');
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/verify-otp', { email, otp });
            login(response.data.token, response.data.user);
            navigate('/driver');
        } catch (err) {
            console.error('Verification error:', err);
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await api.post('/auth/resend-otp', { email });
            setMessage(response.data.message || 'OTP resent successfully!');
            if (response.data.otp) {
                setMessage(`OTP resent: ${response.data.otp} (Development mode)`);
            }
            setCountdown(60);
            const interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            console.error('Resend error:', err);
            setError(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-card">
                <p className="eyebrow">Email Verification</p>
                <h1>Verify Your Account</h1>
                <p>We've sent a verification code to <strong>{email}</strong></p>

                {error && <div className="error-banner">{error}</div>}
                {message && <div className="success-banner">{message}</div>}

                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Enter OTP Code</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="6-digit code"
                            maxLength="6"
                            required
                        />
                    </div>

                    <button type="submit" className="primary-button" disabled={loading} style={{ marginTop: '1.5rem', width: '100%' }}>
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button
                        className="link-button"
                        onClick={handleResendOTP}
                        disabled={countdown > 0}
                    >
                        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                    </button>
                </div>

                <button className="link-button" onClick={() => navigate('/driver-login')}>
                    ← Back to Login
                </button>
            </div>
        </div>
    );
};