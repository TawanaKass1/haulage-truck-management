import { useNavigate } from "react-router-dom";

export const WelcomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="login-screen">
            <div className="login-card" style={{ maxWidth: '600px', textAlign: 'center' }}>
                <p className="eyebrow">Marytechenock Solutions</p>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Haulage Ops</h1>
                <p>Manage fleet, drivers, and delivery jobs from one place.</p>

                <div style={{ margin: '2rem 0' }}>
                    <button
                        className="primary-button"
                        onClick={() => navigate('/role-select')}
                        style={{ width: '100%', marginBottom: '1rem' }}
                    >
                        Get Started
                    </button>
                    <button
                        className="secondary-button"
                        onClick={() => navigate('/role-select')}
                        style={{ width: '100%' }}
                    >
                        Sign In
                    </button>
                </div>

                <div className="demo-box">
                    <p>🚛 Professional haulage logistics platform</p>
                    <p>⚡ Real-time fleet tracking & job assignments</p>
                    <p>🔐 Secure driver authentication with OTP</p>
                </div>
            </div>
        </div>
    );
};