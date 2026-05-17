import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/dateHelpers';
import { useState } from 'react';
import { useBreakpoint } from '../utils/useBreakpoint';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { isMobile } = useBreakpoint();
  const [menuOpen, setMenuOpen] = useState(false);
  const balance  = Number(user?.balance || 0);
  const balColor = balance < 5000 ? 'var(--red-soft)' : balance < 20000 ? 'var(--amber)' : 'var(--green)';

  const initials = user?.name
    ?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const isActive = (path) => location.pathname === path;

  if (isMobile) {
  return (
    <>
      <nav style={{ ...styles.nav, padding: '10px 14px' }}>
        <div style={styles.logo}>◈ SubVault</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={styles.avatar}>{initials}</div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--text)', fontSize: 16 }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
            {user?.name} — <span style={{ color: balColor, fontWeight: 700 }}>{formatCurrency(balance)}</span>
          </div>
          <Link to="/" onClick={() => setMenuOpen(false)}
            style={{ ...styles.tab, ...(isActive('/') ? styles.tabActive : {}), textAlign: 'center' }}>
            Dashboard
          </Link>
          {user?.isAdmin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)}
              style={{ ...styles.tab, ...(isActive('/admin') ? styles.tabActive : {}), textAlign: 'center' }}>
              Admin
            </Link>
          )}
          <button className="btn btn-sm" onClick={logout}
            style={{ width: '100%', justifyContent: 'center' }}>
            Logout
          </button>
        </div>
      )}
    </>
  );
}
  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>◈ SubVault</div>

      <div style={styles.tabs}>
        <Link to="/" style={{ ...styles.tab, ...(isActive('/') ? styles.tabActive : {}) }}>
          Dashboard
        </Link>
        {user?.isAdmin && (
          <Link to="/admin" style={{ ...styles.tab, ...(isActive('/admin') ? styles.tabActive : {}) }}>
            Admin
          </Link>
        )}
      </div>

      <div style={styles.right}>
        <div style={styles.balanceBox}>
          <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>BALANCE</span>
          <span style={{
            fontSize: 14, fontWeight: 700,
            color: user?.balance < 5000 ? 'var(--red-soft)' : user?.balance < 20000 ? 'var(--amber)' : 'var(--green)',
          }}>
            {formatCurrency(user?.balance || 0)}
          </span>
        </div>

        <div style={styles.avatar}>{initials}</div>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{user?.name}</span>

        {user?.isAdmin && (
          <span className="badge badge-blue" style={{ fontSize: 9 }}>ADMIN</span>
        )}

        <button className="btn btn-sm" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 20px', background: 'var(--surface)',
    borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50,
  },
  logo: { fontSize: 13, fontWeight: 700, letterSpacing: 2, color: 'var(--accent)', textTransform: 'uppercase' },
  tabs: { display: 'flex', gap: 4 },
  tab: {
    padding: '6px 14px', borderRadius: 6, fontSize: 12,
    color: 'var(--muted)', border: '1px solid transparent', transition: 'all .15s',
  },
  tabActive: { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' },
  right: { display: 'flex', alignItems: 'center', gap: 10 },
  balanceBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: 4 },
  avatar: {
    width: 30, height: 30, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
  },
};
