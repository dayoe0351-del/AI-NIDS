import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Shield, AlertTriangle, Monitor, Settings, Network, Activity, LogOut, User } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login         from './pages/Login';
import Dashboard     from './pages/Dashboard';
import AlertConsole  from './pages/AlertConsole';
import FlowViewer    from './pages/FlowViewer';
import ResponseLog   from './pages/ResponseLog';
import Configuration from './pages/Configuration';

const NAV = [
  { to: '/',          icon: Monitor,       label: 'Dashboard',     perm: null            },
  { to: '/alerts',    icon: AlertTriangle, label: 'Alerts',        perm: null            },
  { to: '/flows',     icon: Network,       label: 'Traffic Flows', perm: null            },
  { to: '/responses', icon: Activity,      label: 'Responses',     perm: 'execute_response' },
  { to: '/config',    icon: Settings,      label: 'Configuration', perm: 'manage_config' },
];

const ROLE_BADGE = {
  SUPER_ADMIN:    'bg-red-900 text-red-200',
  SECURITY_ADMIN: 'bg-orange-900 text-orange-200',
  ANALYST:        'bg-blue-900 text-blue-200',
  OPERATOR:       'bg-yellow-900 text-yellow-200',
  VIEWER:         'bg-slate-700 text-slate-300',
};

function AppLayout() {
  const { user, logout, can } = useAuth();

  if (!user) return <Login />;

  const visibleNav = NAV.filter(n => !n.perm || can(n.perm));

  return (
    <div className="flex h-screen bg-tactical-dark font-mono">
      {/* Sidebar */}
      <aside className="w-64 bg-tactical-panel text-tactical-text flex flex-col shrink-0 border-r border-tactical-neon/20 relative z-20">
        {/* Scanline overlay */}
        <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-30 z-10"></div>

        <div className="p-5 border-b border-tactical-border relative z-20">
          <h1 className="text-xl font-bold flex items-center gap-3 tracking-widest text-tactical-neon uppercase hud-text-glow">
            <Shield size={22} className="text-tactical-neon" />
            AI-NIDS
          </h1>
          <p className="text-[9px] font-bold tracking-[0.3em] text-tactical-text/60 mt-1.5 uppercase">CALEB UNIVERSITY // CAMPUS SEC</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto tactical-scroll relative z-20">
          {visibleNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-150 border ${
                  isActive
                    ? 'bg-tactical-neon/10 text-tactical-neon border-tactical-neon/40 hud-text-glow shadow-[inset_0_0_15px_rgba(0,255,65,0.05)]'
                    : 'text-tactical-text/70 hover:text-tactical-neon hover:bg-tactical-neon/5 border-transparent hover:border-tactical-neon/20'
                }`
              }
            >
              <Icon size={16} />
              [ {label.toUpperCase()} ]
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-tactical-border relative z-20">
          <div className="flex items-center gap-3 mb-3 bg-tactical-dark/50 p-3 border border-tactical-border">
            <div className="w-8 h-8 border border-tactical-neon/50 flex items-center justify-center bg-tactical-neon/10">
              <User size={14} className="text-tactical-neon" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-tactical-neon truncate uppercase">{user.username}</p>
              <span className="text-[9px] text-tactical-warn font-bold tracking-widest uppercase">
                {user.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-tactical-text/70 hover:text-tactical-alert text-xs font-bold uppercase tracking-widest px-3 py-2 bg-tactical-dark/50 border border-tactical-border hover:border-tactical-alert/50 hover:bg-tactical-alert/10 transition-all"
          >
            <LogOut size={14} /> DISCONNECT
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto tactical-scroll bg-tactical-dark">
        <Routes>
          <Route path="/"          element={<Dashboard />}    />
          <Route path="/alerts"    element={<AlertConsole />}  />
          <Route path="/flows"     element={<FlowViewer />}    />
          <Route path="/responses" element={can('execute_response') ? <ResponseLog /> : <Navigate to="/" />} />
          <Route path="/config"    element={can('manage_config')    ? <Configuration /> : <Navigate to="/" />} />
          <Route path="*"          element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}
