import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Loader } from 'lucide-react';

const ROLE_DEMO = [
  { username: 'admin',    password: 'admin123',    role: 'SUPER_ADMIN',    badge: 'bg-red-100 text-red-700'    },
  { username: 'analyst',  password: 'analyst123',  role: 'ANALYST',        badge: 'bg-blue-100 text-blue-700'  },
  { username: 'operator', password: 'operator123', role: 'OPERATOR',       badge: 'bg-yellow-100 text-yellow-700' },
  { username: 'viewer',   password: 'viewer123',   role: 'VIEWER',         badge: 'bg-gray-100 text-gray-600'  },
];

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check credentials and ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (u, p) => { setUsername(u); setPassword(p); };

  return (
    <div className="min-h-screen bg-tactical-dark flex items-center justify-center p-4 relative overflow-hidden font-mono text-tactical-text">
      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-40 z-0"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Terminal Header */}
        <div className="text-center mb-8 animate-glitch">
          <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-tactical-neon bg-tactical-neon/10 mb-6 relative">
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-tactical-neon -translate-x-1 -translate-y-1"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-tactical-neon translate-x-1 -translate-y-1"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-tactical-neon -translate-x-1 translate-y-1"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-tactical-neon translate-x-1 translate-y-1"></div>
            <Shield size={40} className="text-tactical-neon hud-text-glow" />
          </div>
          <h1 className="text-4xl font-bold text-tactical-neon tracking-[0.2em] uppercase hud-text-glow">AI-NIDS</h1>
          <p className="text-tactical-text mt-2 text-xs uppercase tracking-widest opacity-80">[ MILITARY GRADE THREAT MONITOR ]</p>
        </div>

        {/* Login card */}
        <div className="hud-panel p-8">
          <div className="flex items-center justify-between border-b border-tactical-border pb-4 mb-6">
            <h2 className="text-sm font-bold text-tactical-neon tracking-widest uppercase">AUTH_REQUIREMENT_</h2>
            <span className="w-3 h-3 bg-tactical-neon animate-blink rounded-sm shadow-[0_0_8px_#00ff41]"></span>
          </div>

          {error && (
            <div className="bg-tactical-alert/10 border border-tactical-alert text-tactical-alert px-4 py-3 mb-5 text-xs font-bold uppercase tracking-wider flex items-center gap-3">
              <Shield size={16} className="shrink-0 animate-pulse" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-tactical-text mb-2 tracking-widest uppercase">USER_ID_</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full bg-tactical-grid border border-tactical-border text-tactical-neon px-4 py-3 text-sm focus:outline-none focus:border-tactical-neon focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all placeholder:text-tactical-text/30 font-mono"
                placeholder="ENTER OPERATIVE ID"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-tactical-text mb-2 tracking-widest uppercase">PASSKEY_</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-tactical-grid border border-tactical-border text-tactical-neon px-4 py-3 pr-10 text-sm focus:outline-none focus:border-tactical-neon focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all placeholder:text-tactical-text/30 font-mono tracking-widest"
                  placeholder="********"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tactical-text hover:text-tactical-neon transition-colors p-1">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tactical-neon/10 hover:bg-tactical-neon/20 border border-tactical-neon text-tactical-neon font-bold py-3 uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(0,255,65,0.4)]"
            >
              {loading ? <><Loader size={16} className="animate-spin" /> ESTABLISHING LINK...</> : 'INITIATE OVERRIDE'}
            </button>
          </form>

          {/* Quick-login demo panel */}
          <div className="mt-8 pt-6 border-t border-tactical-border">
            <p className="text-[10px] font-bold text-tactical-text/60 uppercase tracking-widest mb-4">AVAILABLE BYPASS PROTOCOLS</p>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_DEMO.map(({ username: u, password: p, role, badge }) => (
                <button
                  key={u}
                  onClick={() => quickLogin(u, p)}
                  className="flex flex-col items-start p-3 border border-tactical-border bg-tactical-grid hover:border-tactical-neon hover:bg-tactical-neon/5 transition-all group"
                >
                  <span className="text-xs font-bold text-tactical-text group-hover:text-tactical-neon transition-colors">[{u}]</span>
                  <span className={`mt-2 text-[9px] font-bold tracking-widest uppercase text-tactical-warn`}>{role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-8 space-y-1">
          <p className="text-tactical-alert text-[10px] uppercase font-bold tracking-[0.2em] animate-pulse">WARNING: RESTRICTED SYSTEM</p>
          <p className="text-tactical-text/50 text-[10px] uppercase tracking-widest">UNAUTHORIZED ACCESS WILL BE LOGGED</p>
        </div>
      </div>
    </div>
  );
}
