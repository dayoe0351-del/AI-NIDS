import { useState } from 'react';
import api, { fetchResponses } from '../api';
import { useLiveFeed } from '../hooks/useLiveFeed';
import { RefreshCw, WifiOff, ArrowUp, RotateCcw, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function LiveBadge({ lastUpdated }) {
  if (!lastUpdated) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      Live · {lastUpdated.toLocaleTimeString()}
    </span>
  );
}

const ACTION_COLOR = {
  MONITOR:   'bg-gray-100 text-gray-700',
  CHALLENGE: 'bg-blue-100 text-blue-700',
  THROTTLE:  'bg-yellow-100 text-yellow-700',
  REDIRECT:  'bg-indigo-100 text-indigo-700',
  BLOCK:     'bg-orange-100 text-orange-700',
  ISOLATE:   'bg-red-100 text-red-700',
};

const STATUS_COLOR = {
  PENDING:      'text-yellow-600',
  ACTIVE:       'text-blue-600',
  COMPLETED:    'text-green-600',
  ROLLED_BACK:  'text-gray-400',
};

export default function ResponseLog() {
  const { can } = useAuth();
  const { data: responses, loading, error, lastUpdated, } = useLiveFeed(fetchResponses, 3000);
  const [working, setWorking] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const doAction = async (id, action) => {
    setWorking(id + action);
    try {
      await api.post(`/responses/${id}/${action}/`);
      showToast(`${action === 'rollback' ? 'Rolled back' : 'Escalated'} successfully`);
    } catch {
      showToast('Action failed');
    } finally {
      setWorking(null);
    }
  };

  const sorted = [...responses].sort((a, b) => new Date(b.executed_at) - new Date(a.executed_at));

  return (
    <div className="p-6 space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2">
          <Check size={16} /> {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Response Log</h2>
          <p className="text-sm text-gray-500 mt-0.5">Layer 4 — graduated automated response actions</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveBadge lastUpdated={lastUpdated} />
          {loading && <RefreshCw size={16} className="text-gray-400 animate-spin" />}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <WifiOff size={16} /> {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {sorted.length === 0 && !loading ? (
          <p className="p-10 text-sm text-gray-400 text-center">No automated responses recorded yet.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Incident</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">XAI Explanation</th>
                <th className="px-5 py-3">Executed At</th>
                {can('execute_response') && <th className="px-5 py-3">Controls</th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-gray-400">#{r.id}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLOR[r.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {r.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">Incident #{r.incident}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium ${STATUS_COLOR[r.status] ?? 'text-gray-500'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 max-w-xs truncate" title={r.explanation}>{r.explanation || '—'}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(r.executed_at).toLocaleString()}</td>
                  {can('execute_response') && (
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {r.status !== 'ROLLED_BACK' && (
                          <>
                            {can('rollback') && (
                              <button
                                onClick={() => doAction(r.id, 'rollback')}
                                disabled={working === r.id + 'rollback'}
                                title="Rollback"
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 transition-colors"
                              >
                                {working === r.id + 'rollback' ? <RefreshCw size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                              </button>
                            )}
                            <button
                              onClick={() => doAction(r.id, 'escalate')}
                              disabled={working === r.id + 'escalate' || r.action === 'ISOLATE'}
                              title="Escalate"
                              className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg border border-gray-200 transition-colors disabled:opacity-30"
                            >
                              {working === r.id + 'escalate' ? <RefreshCw size={13} className="animate-spin" /> : <ArrowUp size={13} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
