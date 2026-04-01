import { useState, useEffect, useRef } from "react";
import api from "../api/client.js";

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="notification-icon" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                className="secondary-button"
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ position: 'relative', padding: '0.7rem 1rem' }}
            >
                🔔 Notifications
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#bf6a39',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
            {unreadCount}
          </span>
                )}
            </button>

            {showDropdown && (
                <div style={{
                    position: 'absolute',
                    top: '50px',
                    right: '0',
                    width: '380px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    maxHeight: '500px',
                    overflowY: 'auto',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{
                        padding: '1rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        background: 'white',
                        borderRadius: '16px 16px 0 0'
                    }}>
                        <h3 style={{ margin: 0 }}>Notifications</h3>
                        {unreadCount > 0 && (
                            <button className="link-button" onClick={markAllAsRead}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#60707f' }}>
                            No notifications
                        </div>
                    ) : (
                        notifications.map(notification => (
                            <div
                                key={notification.id}
                                onClick={() => markAsRead(notification.id)}
                                style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--border)',
                                    cursor: 'pointer',
                                    background: !notification.read ? 'rgba(191, 106, 57, 0.05)' : 'white',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                                onMouseLeave={(e) => e.currentTarget.style.background = !notification.read ? 'rgba(191, 106, 57, 0.05)' : 'white'}
                            >
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{notification.title}</div>
                                <div style={{ fontSize: '0.85rem', color: '#60707f', marginBottom: '0.25rem' }}>{notification.message}</div>
                                <div style={{ fontSize: '0.75rem', color: '#9aaebf' }}>{formatTime(notification.created_at)}</div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};