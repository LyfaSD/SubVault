import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [mode, setMode]         = useState('login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (mode === 'register' && !name)) {
      toast('Please fill in all fields', 'warn'); return;
    }
    setLoading(true);
    try {
      mode === 'login' ? await login(email, password) : await register(name, email, password);
      navigate('/');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:'100%', maxWidth:380 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:28, color:'var(--accent)', fontWeight:700, letterSpacing:2, marginBottom:4 }}>◈ SubVault</div>
          <div style={{ fontSize:12, color:'var(--muted)' }}>Subscription Manager</div>
        </div>

        {/* Toggle */}
        <div style={{ display:'flex', background:'var(--surface2)', borderRadius:8, padding:3, marginBottom:20 }}>
          {['login','register'].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex:1, padding:7, borderRadius:6, border:'none', fontSize:12, fontWeight:600,
              background: mode===m ? 'var(--accent)' : 'transparent',
              color: mode===m ? '#fff' : 'var(--muted)',
              cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize', transition:'all .15s',
            }}>{m}</button>
          ))}
        </div>

        {mode === 'register' && (
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className="form-input" placeholder="Jean Diallo" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key==='Enter' && handleSubmit()} />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="••••••••" value={password}
            onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key==='Enter' && handleSubmit()} />
        </div>

        <button className="btn btn-primary" style={{ width:'100%', padding:11, fontSize:13, marginTop:4 }}
          onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>

        {/* Demo hint */}
        <div style={{ marginTop:16, padding:12, background:'var(--surface2)', borderRadius:8, fontSize:11, color:'var(--muted)' }}>
          <div style={{ fontWeight:700, marginBottom:4, color:'var(--text)' }}>Demo credentials</div>
          <div>Admin: admin@subvault.com / admin123</div>
          <div>User:  jean@example.com / password123</div>
        </div>
      </div>
    </div>
  );
}
