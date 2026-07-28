import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

interface NavbarProps {
  title?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'info' | 'success' | 'alert';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Hospital Bed Update',
    message: 'Apollo Hospital updated live ICU bed availability.',
    time: '5 mins ago',
    unread: true,
    type: 'info',
  },
  {
    id: 'n2',
    title: 'Appointment Reminder',
    message: 'Upcoming consultation scheduled with Dr. Asha Mehta.',
    time: '1 hour ago',
    unread: true,
    type: 'success',
  },
  {
    id: 'n3',
    title: 'AI Health Assessment',
    message: 'New AI Disease Predictor module is active on your dashboard.',
    time: '2 hours ago',
    unread: true,
    type: 'alert',
  },
];

export default function Navbar({ title = 'Dashboard' }: NavbarProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="navbar">
      <div className="navbar__left">
        <h1 className="navbar__title">{title}</h1>
      </div>

      <div className="navbar__right">
        {/* Interactive Notification Button */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="navbar__icon-btn"
            aria-label="Notifications"
            onClick={() => setNotifOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {unreadCount > 0 && <span className="navbar__badge">{unreadCount}</span>}
          </button>

          {notifOpen && (
            <div
              className="navbar__dropdown fade-in-up"
              style={{ right: 0, width: '320px', padding: '0.75rem' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-color, #e2e8f0)',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4f46e5',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '0.5rem 0.6rem',
                      borderRadius: '8px',
                      marginBottom: '0.4rem',
                      backgroundColor: n.unread ? '#f0fdf4' : '#f8fafc',
                      borderLeft: n.unread ? '3px solid #22c55e' : '3px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span>{n.title}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{n.time}</span>
                    </div>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="navbar__profile" ref={dropdownRef}>
          <button className="navbar__profile-btn" onClick={() => setDropdownOpen((v) => !v)}>
            <span className="navbar__avatar">{initials}</span>
            <span className="navbar__profile-info">
              <span className="navbar__profile-name">{user?.name}</span>
              <span className="navbar__profile-id mono">{user?.id}</span>
            </span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="navbar__dropdown fade-in-up">
              <div className="navbar__dropdown-header">
                <span className="navbar__dropdown-name">{user?.name}</span>
                <span className="navbar__dropdown-email">{user?.email}</span>
              </div>
              <a href="/profile" className="navbar__dropdown-item">My Profile</a>
              <a href="/appointment-status" className="navbar__dropdown-item">My Appointments</a>
              <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={logout}>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}