import { useState } from 'react';
import { useLiveFeed } from '../hooks/useLiveFeed';
import { fetchIncidents, fetchFlows, fetchResponses } from '../api';
import { Activity, AlertTriangle, Network, RefreshCw, Wifi, WifiOff, Crosshair, Shield } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

/* ── Severity color maps ──────────────────────────────────────────────── */

const SEVERITY_COLOR = {
  CRITICAL: 'border-red-500 text-red-400 bg-red-500/10',
  HIGH:     'border-orange-500 text-orange-400 bg-orange-500/10',
  MEDIUM:   'border-yellow-500 text-yellow-400 bg-yellow-500/10',
  LOW:      'border-green-500 text-green-400 bg-green-500/10',
};

const SEVERITY_DOT_COLOR = {
  CRITICAL: '#ff003c',
  HIGH:     '#f97316',
  MEDIUM:   '#ffb000',
  LOW:      '#00ff41',
};

/* ── HUD Stat Card ────────────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, sub, borderColor }) {
  return (
    <div className="hud-panel p-5 flex items-center gap-4 border-l-2" style={{ borderLeftColor: borderColor }}>
      <div className="relative z-20">
        <Icon size={20} className="text-tactical-neon opacity-80" />
      </div>
      <div className="relative z-20">
        <p className="text-[10px] font-bold text-tactical-text/60 uppercase tracking-[0.2em]">{label}</p>
        <p className="text-3xl font-bold text-tactical-neon mt-0.5 hud-text-glow">{value}</p>
        {sub && <p className="text-[10px] font-bold text-tactical-text/40 mt-1 uppercase tracking-wider">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Live / Error badges ──────────────────────────────────────────────── */

function LiveBadge({ lastUpdated }) {
  if (!lastUpdated) return null;
  return (
    <span className="inline-flex items-center gap-2 text-[10px] font-bold bg-tactical-neon/10 text-tactical-neon border border-tactical-neon/30 px-3 py-1 uppercase tracking-widest">
      <span className="w-2 h-2 bg-tactical-neon animate-pulse shadow-[0_0_6px_#00ff41]" />
      LIVE · {lastUpdated.toLocaleTimeString()}
    </span>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-3 bg-tactical-alert/10 border border-tactical-alert text-tactical-alert px-4 py-3 mb-4 text-xs font-bold uppercase tracking-wider">
      <WifiOff size={16} /> {message}
    </div>
  );
}

/* ── Tactical Chart Tooltip ────────────────────────────────────────────── */

function IntrusionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  const severityColor = SEVERITY_DOT_COLOR[d.severity] ?? '#333';

  return (
    <div className="bg-tactical-dark border border-tactical-border p-4 shadow-[0_0_15px_rgba(0,0,0,0.8)] font-mono min-w-[200px] z-50">
      <div className="flex items-center gap-2 mb-3 border-b border-tactical-border pb-2">
        <span className="w-2 h-2" style={{ backgroundColor: severityColor }}></span>
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: severityColor }}>
          {d.severity} THREAT
        </span>
      </div>
      
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-tactical-text/50 uppercase">TYPE:</span>
          <span className="text-tactical-neon font-bold">{d.attack_type}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-tactical-text/50 uppercase">SRC_IP:</span>
          <span className="text-tactical-text/90">{d.source_ip}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-tactical-text/50 uppercase">DST_IP:</span>
          <span className="text-tactical-text/90">{d.dest_ip}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-tactical-text/50 uppercase">CONF:</span>
          <span className="text-tactical-neon">{d.confidence}%</span>
        </div>
      </div>
    </div>
  );
}

/* ── Custom chart dot renderers (severity-colored) ─────────────────────── */

function SeverityDot(props) {
  const { cx, cy, payload, onLockTarget } = props;
  if (cx == null || cy == null) return null;
  const fill = SEVERITY_DOT_COLOR[payload?.severity] ?? '#333';
  return (
    <g onClick={(e) => { e.stopPropagation(); onLockTarget && onLockTarget(payload); }} style={{ cursor: 'crosshair', pointerEvents: 'all' }}>
      <rect x={cx - 12} y={cy - 12} width={24} height={24} fill="transparent" />
      <rect x={cx - 6} y={cy - 6} width={12} height={12} fill={fill} opacity={0.15} />
      <rect x={cx - 3} y={cy - 3} width={6} height={6} fill={fill} stroke="#111" strokeWidth={1} />
    </g>
  );
}

function SeverityActiveDot(props) {
  const { cx, cy, payload, onLockTarget } = props;
  if (cx == null || cy == null) return null;
  const fill = SEVERITY_DOT_COLOR[payload?.severity] ?? '#333';
  return (
    <g onClick={(e) => { e.stopPropagation(); onLockTarget && onLockTarget(payload); }} style={{ cursor: 'crosshair', pointerEvents: 'all' }}>
      <rect x={cx - 18} y={cy - 18} width={36} height={36} fill="transparent" />
      <rect x={cx - 10} y={cy - 10} width={20} height={20} fill={fill} opacity={0.12} />
      <rect x={cx - 5} y={cy - 5} width={10} height={10} fill={fill} stroke={fill} strokeWidth={1} />
      {/* Crosshair lines */}
      <line x1={cx} y1={cy - 18} x2={cx} y2={cy - 8} stroke={fill} strokeWidth={1} opacity={0.6} />
      <line x1={cx} y1={cy + 8} x2={cx} y2={cy + 18} stroke={fill} strokeWidth={1} opacity={0.6} />
      <line x1={cx - 18} y1={cy} x2={cx - 8} y2={cy} stroke={fill} strokeWidth={1} opacity={0.6} />
      <line x1={cx + 8} y1={cy} x2={cx + 18} y2={cy} stroke={fill} strokeWidth={1} opacity={0.6} />
    </g>
  );
}

/* ── Target Analysis HUD Panel ─────────────────────────────────────────── */

function TargetAnalysisPanel({ target }) {
  if (!target) {
    return (
      <div className="hud-panel border-t-2 border-tactical-neon/30 p-6 mt-4">
        <div className="relative z-20 flex items-center justify-center gap-3 text-tactical-text/30 py-4">
          <Crosshair size={20} className="animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-[0.3em]">AWAITING TARGET ACQUISITION</span>
        </div>
      </div>
    );
  }

  // Defensively extract data in case of Recharts nesting it inside another payload object
  const data = target.payload || target;

  const severityColor = SEVERITY_DOT_COLOR[data.severity] ?? '#666';

  return (
    <div className="hud-panel border-t-2 p-5 mt-4" style={{ borderTopColor: severityColor }}>
      <div className="relative z-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Crosshair size={18} style={{ color: severityColor }} className="animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: severityColor }}>
              TARGET LOCKED // INCIDENT #{data.id}
            </span>
          </div>
          <span className="text-[10px] text-tactical-text/50 font-bold tracking-widest">{data.time}</span>
        </div>

        {/* Data grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCell label="ATTACK_TYPE" value={data.attack_type} color={severityColor} />
          <DataCell label="SEVERITY" value={data.severity} color={severityColor} />
          <DataCell label="CONFIDENCE" value={`${data.confidence}%`} color="#00ff41" />
          <DataCell label="PROTOCOL" value="TCP/IP" color="#ffb000" />
          <DataCell label="SOURCE_IP" value={data.source_ip} mono />
          <DataCell label="DEST_IP" value={data.dest_ip} mono />
          <DataCell label="STATUS" value="ACTIVE" color="#ff003c" />
          <DataCell label="ML_ENGINE" value="RF_v1.0" color="#00ff41" />
        </div>

        {/* Description */}
        {data.description && (
          <div className="mt-4 p-3 bg-tactical-dark border border-tactical-border text-tactical-text/70 text-xs leading-relaxed">
            <span className="text-tactical-neon/60 font-bold text-[9px] uppercase tracking-widest">SIGNATURE_DESC: </span>
            {data.description}
          </div>
        )}
      </div>
    </div>
  );
}

function DataCell({ label, value, color, mono }) {
  return (
    <div className="bg-tactical-dark border border-tactical-border p-3">
      <p className="text-[9px] font-bold text-tactical-text/40 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className={`text-sm font-bold ${mono ? 'font-mono' : ''}`} style={{ color: color || '#c8d4c9' }}>
        {value}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   DASHBOARD COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const { data: incidents, loading: iL, error: iE, lastUpdated: iU } = useLiveFeed(fetchIncidents);
  const { data: flows,     loading: fL, error: fE, lastUpdated: fU } = useLiveFeed(fetchFlows);
  const { data: responses } = useLiveFeed(fetchResponses);

  const [lockedTarget, setLockedTarget] = useState(null);

  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
  const highCount     = incidents.filter(i => i.severity === 'HIGH').length;

  // Build enriched chart data
  const chartData = [...incidents]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-12)
    .map((inc) => ({
      label: new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      confidence: parseFloat((inc.confidence_score * 100).toFixed(1)),
      severity:    inc.severity,
      attack_type: inc.attack_type,
      source_ip:   inc.source_ip,
      dest_ip:     inc.destination_ip,
      description: inc.description,
      time:        new Date(inc.timestamp).toLocaleString(),
      id:          inc.id,
    }));

  const loading = iL && fL;

  // Handle chart click to lock target
  const handleChartClick = (chartState) => {
    if (chartState?.activePayload?.length) {
      setLockedTarget(chartState.activePayload[0].payload);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-tactical-neon tracking-[0.2em] uppercase hud-text-glow flex items-center gap-3">
            <Shield size={20} /> SYSTEM_DASHBOARD
          </h2>
          <p className="text-[10px] font-bold text-tactical-text/50 mt-1 tracking-widest uppercase">
            REAL-TIME CAMPUS NETWORK THREAT MONITOR // CALEB UNIVERSITY
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveBadge lastUpdated={iU ?? fU} />
          {loading && <RefreshCw size={16} className="text-tactical-neon animate-spin" />}
        </div>
      </div>

      {/* Error banners */}
      {iE && <ErrorBanner message={iE} />}
      {fE && <ErrorBanner message={fE} />}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Network}       label="FLOWS CAPTURED"   value={flows.length}     sub="Since deployment"    borderColor="#00ff41" />
        <StatCard icon={AlertTriangle} label="INCIDENTS"        value={incidents.length} sub="ML detections"       borderColor="#ff003c" />
        <StatCard icon={Activity}      label="CRITICAL"         value={criticalCount}    sub={`${highCount} HIGH`} borderColor="#f97316" />
        <StatCard icon={Wifi}          label="RESPONSES"        value={responses.length} sub="Auto + manual"       borderColor="#ffb000" />
      </div>

      {/* ── Intrusion Detection Chart + Target Analysis ────────────── */}
      {incidents.length > 0 && (
        <div className="space-y-0">
          {/* Chart */}
          <div className="hud-panel p-5 border-b-0">
            <div className="flex items-center justify-between mb-5 relative z-20">
              <div>
                <h3 className="text-xs font-bold text-tactical-neon tracking-[0.2em] uppercase hud-text-glow flex items-center gap-2">
                  <Crosshair size={14} /> INTRUSION_TIMELINE
                </h3>
                <p className="text-[9px] text-tactical-text/40 mt-1 font-bold tracking-widest uppercase">
                  HOVER FOR QUICK SUMMARY // CLICK TO LOCK TARGET
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-tactical-text/60 uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#ff003c] inline-block" /> CRIT</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#f97316] inline-block" /> HIGH</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#ffb000] inline-block" /> MED</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#00ff41] inline-block" /> LOW</span>
              </div>
            </div>

            <div className="relative z-20">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }} onClick={handleChartClick} style={{ cursor: 'crosshair' }}>
                  <defs>
                    <linearGradient id="gradConfidence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00ff41" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#00ff41" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke="#222" vertical={true} />
                  <XAxis
                    dataKey="id"
                    tickFormatter={(value) => chartData.find(d => d.id === value)?.label || ''}
                    tick={{ fontSize: 10, fill: '#555', fontFamily: 'Share Tech Mono, monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: '#333' }}
                    dy={8}
                  />
                  <YAxis
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fontSize: 10, fill: '#555', fontFamily: 'Share Tech Mono, monospace' }}
                    tickLine={false}
                    axisLine={false}
                    width={45}
                  />
                  <ReferenceLine y={80} stroke="#ff003c" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'THREAT_THRESHOLD', position: 'insideTopRight', fontSize: 9, fill: '#ff003c', fontFamily: 'Share Tech Mono, monospace' }} />
                  <Tooltip content={<IntrusionTooltip />} cursor={{ fill: 'rgba(0, 255, 65, 0.05)' }} />
                  <Area
                    type="stepAfter"
                    dataKey="confidence"
                    stroke="#00ff41"
                    strokeWidth={2}
                    fill="url(#gradConfidence)"
                    dot={<SeverityDot onLockTarget={setLockedTarget} />}
                    activeDot={<SeverityActiveDot onLockTarget={setLockedTarget} />}
                    name="Confidence %"
                    animationDuration={600}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Target Analysis Panel — immediately below chart */}
          <TargetAnalysisPanel target={lockedTarget} />
        </div>
      )}

      {/* ── Recent Incidents Table ──────────────────────────────────── */}
      <div className="hud-panel">
        <div className="px-5 py-4 border-b border-tactical-border flex items-center justify-between relative z-20">
          <h3 className="text-xs font-bold text-tactical-neon tracking-[0.2em] uppercase hud-text-glow">RECENT_INCIDENTS</h3>
          <span className="text-[10px] font-bold text-tactical-text/40 tracking-widest uppercase">
            [{Math.min(incidents.length, 5)}/{incidents.length}]
          </span>
        </div>
        {incidents.length === 0 && !iL ? (
          <p className="p-8 text-xs font-bold text-tactical-text/30 text-center uppercase tracking-widest relative z-20">
            NO INCIDENTS DETECTED // AWAITING TRAFFIC DATA
          </p>
        ) : (
          <div className="overflow-x-auto relative z-20">
            <table className="w-full text-xs text-left">
              <thead className="bg-tactical-dark text-tactical-text/50 uppercase text-[10px] font-bold tracking-widest border-b border-tactical-border">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">ATTACK_TYPE</th>
                  <th className="px-5 py-3">SRC_IP</th>
                  <th className="px-5 py-3">DST_IP</th>
                  <th className="px-5 py-3">SEVERITY</th>
                  <th className="px-5 py-3">CONF</th>
                  <th className="px-5 py-3">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tactical-border">
                {[...incidents]
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .slice(0, 5)
                  .map(inc => (
                    <tr key={inc.id} className="hover:bg-tactical-neon/5 transition-colors cursor-pointer" onClick={() => setLockedTarget({
                      id: inc.id,
                      attack_type: inc.attack_type,
                      severity: inc.severity,
                      confidence: (inc.confidence_score * 100).toFixed(1),
                      source_ip: inc.source_ip,
                      dest_ip: inc.destination_ip,
                      description: inc.description,
                      time: new Date(inc.timestamp).toLocaleString(),
                    })}>
                      <td className="px-5 py-3 font-mono text-tactical-text/40">#{inc.id}</td>
                      <td className="px-5 py-3 font-bold text-tactical-neon">{inc.attack_type}</td>
                      <td className="px-5 py-3 font-mono text-tactical-text/70">{inc.source_ip}</td>
                      <td className="px-5 py-3 font-mono text-tactical-text/70">{inc.destination_ip}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider border ${SEVERITY_COLOR[inc.severity] ?? 'border-tactical-border text-tactical-text/50'}`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-tactical-dark border border-tactical-border h-1.5 overflow-hidden">
                            <div className="h-1.5" style={{ width: `${(inc.confidence_score * 100).toFixed(0)}%`, backgroundColor: SEVERITY_DOT_COLOR[inc.severity] ?? '#00ff41' }} />
                          </div>
                          <span className="text-[10px] font-bold text-tactical-text/60">{(inc.confidence_score * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-tactical-text/40 text-[10px] font-bold tracking-wider">{new Date(inc.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
