import { useLiveFeed } from '../hooks/useLiveFeed';
import { fetchFlows } from '../api';
import { RefreshCw, WifiOff } from 'lucide-react';

function LiveBadge({ lastUpdated }) {
  if (!lastUpdated) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      Live · {lastUpdated.toLocaleTimeString()}
    </span>
  );
}

const PROTO_COLOR = {
  TCP: 'bg-blue-100 text-blue-700',
  UDP: 'bg-purple-100 text-purple-700',
  ICMP: 'bg-yellow-100 text-yellow-700',
};

export default function FlowViewer() {
  const { data: flows, loading, error, lastUpdated } = useLiveFeed(fetchFlows, 3000);

  const sorted = [...flows].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Traffic Flows</h2>
          <p className="text-sm text-gray-500 mt-0.5">Layer 1 — captured network flow records</p>
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
          <p className="p-10 text-sm text-gray-400 text-center">No flow records yet. Run the attack simulator.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Protocol</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Destination</th>
                <th className="px-5 py-3">Bytes</th>
                <th className="px-5 py-3">Packets</th>
                <th className="px-5 py-3">Captured</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(flow => (
                <tr key={flow.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-gray-400">#{flow.id}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PROTO_COLOR[flow.protocol] ?? 'bg-gray-100 text-gray-600'}`}>
                      {flow.protocol}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-gray-600">{flow.src_ip}:{flow.src_port}</td>
                  <td className="px-5 py-3 font-mono text-gray-600">{flow.dst_ip}:{flow.dst_port}</td>
                  <td className="px-5 py-3 text-gray-700">{flow.byte_count.toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-700">{flow.packet_count.toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(flow.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
