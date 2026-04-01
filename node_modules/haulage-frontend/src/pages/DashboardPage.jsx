import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

export const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    trucks: 0,
    drivers: 0,
    jobs: 0,
    activeJobs: 0
  });
  const [currentJob, setCurrentJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminStats();
      fetchRecentJobs();
    } else {
      fetchDriverJob();
    }
  }, [user]);

  const fetchAdminStats = async () => {
    try {
      const [trucksRes, driversRes, jobsRes] = await Promise.all([
        api.get('/trucks?page=1&limit=100'),
        api.get('/drivers?page=1&limit=100'),
        api.get('/jobs?page=1&limit=100')
      ]);

      const activeJobs = jobsRes.data.jobs.filter(job =>
          job.status === 'in_progress' || job.status === 'pending'
      ).length;

      setStats({
        trucks: trucksRes.data.trucks.length,
        drivers: driversRes.data.drivers.length,
        jobs: jobsRes.data.jobs.length,
        activeJobs
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentJobs = async () => {
    try {
      const response = await api.get('/jobs?page=1&limit=5');
      setRecentJobs(response.data.jobs);
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
    }
  };

  const fetchDriverJob = async () => {
    try {
      const response = await api.get('/assignments/driver-current-job');
      if (response.data.id) {
        setCurrentJob(response.data);
      }
    } catch (error) {
      console.error('Error fetching current job:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (status) => {
    if (!currentJob) return;

    setUpdating(true);
    try {
      await api.put(`/assignments/update-job-status/${currentJob.id}`, { status });
      await fetchDriverJob();
    } catch (error) {
      console.error('Error updating job status:', error);
      alert(error.response?.data?.message || 'Failed to update job status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  if (user?.role === 'admin') {
    return (
        <div className="dashboard-stack">
          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <div>
                  <p className="eyebrow">Total Fleet</p>
                  <h2>{stats.trucks}</h2>
                </div>
                <span style={{ fontSize: '2rem' }}>🚛</span>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <p className="eyebrow">Active Drivers</p>
                  <h2>{stats.drivers}</h2>
                </div>
                <span style={{ fontSize: '2rem' }}>👨‍✈️</span>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <p className="eyebrow">Total Jobs</p>
                  <h2>{stats.jobs}</h2>
                </div>
                <span style={{ fontSize: '2rem' }}>📋</span>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <p className="eyebrow">Active Jobs</p>
                  <h2>{stats.activeJobs}</h2>
                </div>
                <span style={{ fontSize: '2rem' }}>⚡</span>
              </div>
            </div>
          </div>

          {recentJobs.length > 0 && (
              <div className="card">
                <h3>Recent Jobs</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                    <tr>
                      <th>Job Title</th>
                      <th>Pickup</th>
                      <th>Delivery</th>
                      <th>Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {recentJobs.map(job => (
                        <tr key={job.id}>
                          <td>{job.title}</td>
                          <td>{job.pickup_location}</td>
                          <td>{job.delivery_location}</td>
                          <td>
                        <span className={`status-badge status-${job.status}`}>
                          {job.status}
                        </span>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
          )}
        </div>
    );
  }

  // Driver Dashboard
  return (
      <div className="dashboard-stack">
        <div className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Welcome, {user?.name}</p>
              <h2>{currentJob ? 'On Job' : 'Available'}</h2>
            </div>
            <span style={{ fontSize: '2rem' }}>{currentJob ? '🚛' : '✅'}</span>
          </div>
        </div>

        {currentJob ? (
            <div className="card">
              <h3>Current Assignment</h3>
              <div style={{ marginTop: '1rem' }}>
                <p><strong>Job Title:</strong> {currentJob.title}</p>
                <p><strong>Pickup Location:</strong> {currentJob.pickup_location}</p>
                <p><strong>Delivery Location:</strong> {currentJob.delivery_location}</p>
                <p><strong>Truck:</strong> {currentJob.truck_registration}</p>
                <p><strong>Status:</strong>
                  <span className={`status-badge status-${currentJob.status}`}>
                {currentJob.status}
              </span>
                </p>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  {currentJob.status === 'in_progress' && (
                      <button className="primary-button" onClick={() => updateJobStatus('completed')} disabled={updating}>
                        {updating ? 'Updating...' : 'Mark as Completed'}
                      </button>
                  )}
                  {currentJob.status === 'pending' && (
                      <button className="primary-button" onClick={() => updateJobStatus('in_progress')} disabled={updating}>
                        {updating ? 'Updating...' : 'Start Job'}
                      </button>
                  )}
                </div>
              </div>
            </div>
        ) : (
            <div className="card">
              <h3>No Active Job</h3>
              <p>You don't have any active jobs at the moment. Please wait for assignments from the admin.</p>
            </div>
        )}
      </div>
  );
};