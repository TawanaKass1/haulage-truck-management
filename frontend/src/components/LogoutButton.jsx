import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export const LogoutButton = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <button
            onClick={handleLogout}
            className="logout-button"
            style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 59, 48, 0.2)',
                border: '1px solid rgba(255, 59, 48, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 59, 48, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.6)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 59, 48, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.3)';
            }}
        >
            🚪 Sign Out
        </button>
    );
};