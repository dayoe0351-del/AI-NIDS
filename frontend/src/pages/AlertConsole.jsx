import { useState } from 'react';
import { useLiveFeed } from '../hooks/useLiveFeed';
import { fetchIncidents } from '../api';
import { AlertTriangle, RefreshCw, WifiOff, ChevronDown, ChevronUp } from 'lucide-react';

const SEVERITY_COLOR = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH:     'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM:   'bg-yellow-100 text-yellow-800 border-yellow-300',
  LOW:      'bg-green-100 text-green-800 border-green-300',
};

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function LiveBadge({ lastUpdated }) {
  if (!lastUpdated) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      Live · {lastUpdated.toLocaleTimeString()}
    </span>
  );
}

function ExpandedRow({ incident }) {
  return (
    <tr className="bg-blue-50">
      <td colSpan={7} className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Description / XAI Explanation</p>
            <p className="text-gray-700">{incident.description || 'No explanation available.'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Metadata</p>
            <p><span className="text-gray-500">Attack Type:</span> <strong>{incident.attack_type}</strong></p>
            <p><span className="text-gray-500">Confidence Score:</span> <strong>{(incident.confidence_score * 100).toFixed(1)}%</strong></p>
            <p><span className="text-gray-500">Detected At:</span> <strong>{new Date(incident.timestamp).toLocaleString()}</strong></p>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function AlertConsole() {
  const { data: incidents, loading, error, lastUpdated } = useLiveFeed(fetchIncidents, 3000);
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = [...incidents]
    .filter(i => filter === 'ALL' || i.severity === filter)
    .filter(i =>
      !search ||
      i.attack_type.toLowerCase().includes(search.toLowerCase()) ||
      i.source_ip.includes(search) ||
      i.destination_ip.includes(search)
    )
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Alert Console</h2>
          <p className="text-sm text-gray-500 mt-0.5">Prioritised intrusion detection events</p>
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by IP or attack type…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filter === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200 hover:border-slate-400'
            }`}
          >
            {s}
            {s !== 'ALL' && (
              <span className="ml-1 opacity-70">
                ({incidents.filter(i => i.severity === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {filtered.length === 0 && !loading ? (
          <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
            <AlertTriangle size={32} className="text-gray-300" />
            <p className="text-sm">No alerts match your filters. Run the attack simulator to generate data.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Attack Type</th>
                <th className="px-5 py-3">Source IP</th>
                <th className="px-5 py-3">Destination IP</th>
                <th className="px-5 py-3">Confidence</th>
                <th className="px-5 py-3">Detected</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inc => (
                <>
                  <tr
                    key={inc.id}
                    className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpanded(expanded === inc.id ? null : inc.id)}
                  >
                    <td className="px-5 py-3 font-mono text-gray-400">#{inc.id}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEVERITY_COLOR[inc.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">{inc.attack_type}</td>
                    <td className="px-5 py-3 font-mono text-gray-600">{inc.source_ip}</td>
                    <td className="px-5 py-3 font-mono text-gray-600">{inc.destination_ip}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(inc.confidence_score * 100).toFixed(0)}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{(inc.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(inc.timestamp).toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-400">
                      {expanded === inc.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </td>
                  </tr>
                  {expanded === inc.id && <ExpandedRow key={`exp-${inc.id}`} incident={inc} />}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
