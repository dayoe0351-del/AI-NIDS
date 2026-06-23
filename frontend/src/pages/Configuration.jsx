import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Settings, RefreshCw, Users, ShieldCheck, Lock, Network, Database, Bell, ChevronDown, ChevronUp, Trash2, Edit2, Check, X } from 'lucide-react';

const CATEGORY_ICONS = {
  DETECTION: ShieldCheck,
  RESPONSE:  Lock,
  NETWORK:   Network,
  RETENTION: Database,
  ALERTING:  Bell,
};

const CATEGORY_COLORS = {
  DETECTION: 'text-blue-600 bg-blue-50',
  RESPONSE:  'text-red-600 bg-red-50',
  NETWORK:   'text-green-600 bg-green-50',
  RETENTION: 'text-purple-600 bg-purple-50',
  ALERTING:  'text-orange-600 bg-orange-50',
};

const ROLE_BADGE = {
  SUPER_ADMIN:    'bg-red-100 text-red-800',
  SECURITY_ADMIN: 'bg-orange-100 text-orange-800',
  ANALYST:        'bg-blue-100 text-blue-800',
  OPERATOR:       'bg-yellow-100 text-yellow-800',
  VIEWER:         'bg-gray-100 text-gray-600',
};

// ── Config Section ─────────────────────────────────────────────────────────

function ConfigRow({ item, canEdit, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(item.value);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(item.id, val);
    setSaving(false);
    setEditing(false);
  };

  return (
    <tr className="border-t border-gray-50 hover:bg-gray-50">
      <td className="px-5 py-3">
        <p className="font-mono text-sm text-gray-800">{item.key}</p>
        <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
      </td>
      <td className="px-5 py-3 w-64">
        {editing ? (
          <input
            className="border border-blue-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={val}
            onChange={e => setVal(e.target.value)}
          />
        ) : (
          <span className={`font-mono text-sm ${item.is_sensitive ? 'blur-sm hover:blur-none transition-all' : 'text-gray-700'}`}>
            {item.value || <span className="text-gray-300 italic">not set</span>}
          </span>
        )}
      </td>
      <td className="px-5 py-3 w-28">
        {canEdit && (
          <div className="flex items-center gap-1">
            {editing ? (
              <>
                <button onClick={save} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button onClick={() => { setEditing(false); setVal(item.value); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                  <X size={14} />
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="p-1 text-blue-500 hover:bg-blue-50 rounded">
                <Edit2 size={14} />
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function ConfigSection({ category, items, canEdit, onSave }) {
  const [open, setOpen] = useState(true);
  const Icon = CATEGORY_ICONS[category] ?? Settings;
  const colorClass = CATEGORY_COLORS[category] ?? 'text-gray-600 bg-gray-50';

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className={`p-2 rounded-lg ${colorClass}`}><Icon size={16} /></span>
          <span className="font-semibold text-gray-700">{category.charAt(0) + category.slice(1).toLowerCase()} Settings</span>
          <span className="text-xs text-gray-400">({items.length} keys)</span>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-5 py-2 text-left">Key / Description</th>
              <th className="px-5 py-2 text-left">Value</th>
              <th className="px-5 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <ConfigRow key={item.id} item={item} canEdit={canEdit} onSave={onSave} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── User Management Section ────────────────────────────────────────────────

function UserRow({ user, canManage, onDelete, onRoleChange }) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(user.profile?.role || 'VIEWER');

  const save = async () => {
    await onRoleChange(user.id, role);
    setEditing(false);
  };

  return (
    <tr className="border-t border-gray-50 hover:bg-gray-50">
      <td className="px-5 py-3">
        <p className="font-medium text-gray-800">{user.first_name || user.username} {user.last_name}</p>
        <p className="text-xs text-gray-400">{user.username}</p>
      </td>
      <td className="px-5 py-3 text-sm text-gray-500">{user.email || '—'}</td>
      <td className="px-5 py-3 text-sm text-gray-500">{user.profile?.department || '—'}</td>
      <td className="px-5 py-3">
        {editing ? (
          <select value={role} onChange={e => setRole(e.target.value)}
            className="border border-blue-300 rounded px-2 py-1 text-xs focus:outline-none">
            {['SUPER_ADMIN','SECURITY_ADMIN','ANALYST','OPERATOR','VIEWER'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        ) : (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[user.profile?.role] ?? 'bg-gray-100 text-gray-600'}`}>
            {user.profile?.role ?? 'VIEWER'}
          </span>
        )}
      </td>
      <td className="px-5 py-3">
        <span className={`text-xs font-medium ${user.is_active ? 'text-green-600' : 'text-red-500'}`}>
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-5 py-3">
        {canManage && (
          <div className="flex items-center gap-1">
            {editing ? (
              <>
                <button onClick={save} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
                <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                <button onClick={() => onDelete(user.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

// ── Main Configuration Page ────────────────────────────────────────────────

export default function Configuration() {
  const { can } = useAuth();
  const [configs, setConfigs] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('config');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, uRes] = await Promise.all([
        axios.get('http://localhost:8000/api/v1/config/'),
        axios.get('http://localhost:8000/api/v1/users/'),
      ]);
      setConfigs(cRes.data.results ?? cRes.data);
      setUsers(uRes.data.results ?? uRes.data);
    } catch {
      showToast('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfigSave = async (id, value) => {
    await axios.patch(`http://localhost:8000/api/v1/config/${id}/`, { value });
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, value } : c));
    showToast('Configuration saved');
  };

  const handleRoleChange = async (id, role) => {
    await axios.patch(`http://localhost:8000/api/v1/users/${id}/`, { role });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, profile: { ...u.profile, role } } : u));
    showToast('Role updated');
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await axios.delete(`http://localhost:8000/api/v1/users/${id}/`);
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast('User deleted');
  };

  // Group configs by category
  const grouped = configs.reduce((acc, c) => {
    acc[c.category] = acc[c.category] || [];
    acc[c.category].push(c);
    return acc;
  }, {});

  const canEdit = can('manage_config');
  const canManageUsers = can('manage_users');

  return (
    <div className="p-6 space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2">
          <Check size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Configuration & User Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">System settings, detection thresholds, and RBAC controls</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'config', label: 'System Config',    icon: Settings },
          { id: 'users',  label: 'User Management',  icon: Users    },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Config tab */}
      {tab === 'config' && (
        <div className="space-y-4">
          {!canEdit && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <Lock size={14} /> Your role is read-only for configuration. Contact a Security Admin to make changes.
            </div>
          )}
          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm">Loading configuration…</div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <ConfigSection key={cat} category={cat} items={items} canEdit={canEdit} onSave={handleConfigSave} />
            ))
          )}
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div className="space-y-4">
          {!canManageUsers && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <Lock size={14} /> Your role cannot manage users. Contact a Super Admin.
            </div>
          )}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2"><Users size={16} /> System Users</h3>
              <span className="text-xs text-gray-400">{users.length} users</span>
            </div>
            {loading ? (
              <div className="text-center py-10 text-gray-400 text-sm">Loading users…</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-400">
                  <tr>
                    <th className="px-5 py-3">Name / Username</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <UserRow
                      key={u.id}
                      user={u}
                      canManage={canManageUsers}
                      onDelete={handleDeleteUser}
                      onRoleChange={handleRoleChange}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Role permissions reference */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><ShieldCheck size={16} /> RBAC Permission Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="text-gray-500 uppercase">
                    <th className="text-left px-3 py-2 border-b border-gray-100">Permission</th>
                    {['SUPER_ADMIN','SECURITY_ADMIN','ANALYST','OPERATOR','VIEWER'].map(r => (
                      <th key={r} className="px-3 py-2 border-b border-gray-100">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${ROLE_BADGE[r]}`}>{r.replace('_',' ')}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Read dashboards / alerts',   true, true, true, true, true],
                    ['Create / update records',     true, true, true, false, false],
                    ['Execute response actions',    true, true, true, true, false],
                    ['Rollback responses',          true, true, false, false, false],
                    ['Manage system configuration', true, true, false, false, false],
                    ['Manage users & roles',        true, false, false, false, false],
                  ].map(([label, ...perms]) => (
                    <tr key={label} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="text-left px-3 py-2 text-gray-700 font-medium">{label}</td>
                      {perms.map((p, i) => (
                        <td key={i} className="px-3 py-2">
                          {p
                            ? <span className="text-green-600 font-bold">✓</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
