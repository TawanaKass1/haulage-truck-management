import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";

export const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: 'admin@marytechenock.com',
    password: 'Password123!',
    secretCode: 'ADMIN2024!'
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
      const response = await api.post('/auth/login-admin', formData);
      login(response.data.token, response.data.user);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="login-screen">
        <div className="login-card">
          <p className="eyebrow">Administrator Access</p>
          <h1>Admin Login</h1>

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

            <div style={{ marginTop: '1rem' }}>
              <label>Admin Secret Code</label>
              <input
                  type="password"
                  name="secretCode"
                  value={formData.secretCode}
                  onChange={handleChange}
                  placeholder="Enter admin secret code"
                  required
              />
            </div>

            <button type="submit" className="primary-button" disabled={loading} style={{ marginTop: '1.5rem', width: '100%' }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <button className="link-button" onClick={() => navigate('/role-select')} style={{ marginTop: '1rem' }}>
            ← Back to role selection
          </button>
        </div>
      </div>
  );
};