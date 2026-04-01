import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const RoleSelect = () => {
    const [role, setRole] = useState('driver');
    const navigate = useNavigate();

    const handleContinue = () => {
        if (role === 'admin') {
            navigate('/admin-login');
        } else {
            navigate('/driver-login');
        }
    };

    return (
        <div className="login-screen">
            <div className="login-card">
                <p className="eyebrow">Welcome to Haulage Ops</p>
                <h1>Select Your Role</h1>

                <div style={{ display: 'flex', gap: '1rem', margin: '1.5rem 0' }}>
                    <button
                        className={role === 'driver' ? "primary-button" : "secondary-button"}
                        onClick={() => setRole('driver')}
                        style={{ flex: 1 }}
                    >
                        🚛 Driver
                    </button>
                    <button
                        className={role === 'admin' ? "primary-button" : "secondary-button"}
                        onClick={() => setRole('admin')}
                        style={{ flex: 1 }}
                    >
                        👨‍💼 Admin
                    </button>
                </div>

                <button className="primary-button" onClick={handleContinue}>
                    Continue
                </button>

                <button
                    className="link-button"
                    onClick={() => navigate('/driver-register')}
                    style={{ marginTop: '1rem' }}
                >
                    New Driver? Register here →
                </button>

                <button
                    className="link-button"
                    onClick={() => navigate('/')}
                    style={{ marginTop: '0.5rem' }}
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    );
};