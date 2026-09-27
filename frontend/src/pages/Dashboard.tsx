import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Map,
  Search,
  GitMerge,
  ArrowRight,
  TrendingDown,
  Droplets,
  Zap,
  Clock,
  Gauge,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fetchActiveWell, fetchAlerts, fetchNearbyWells } from '../api';
import type { ActiveWell, Alert, Well } from '../types';
import { ACTIVE_WELL_LAT, ACTIVE_WELL_LNG, formatDepth, getSeverityClass, EVENT_TYPE_ICONS } from '../utils/constants';

// Mini sparkline data generator
function makeSparkline(base: number, variance: number, points = 12) {
  return Array.from({ length: points }, (_, i) => ({
    t: i,
    v: +(base + (Math.sin(i * 0.8) * variance + (Math.random() - 0.5) * variance * 0.5)).toFixed(2),
  }));
}

const ROP_DATA = makeSparkline(8.4, 2.5);
const MW_DATA = makeSparkline(1.38, 0.02);
const TORQUE_DATA = makeSparkline(12.3, 2);

const NAV_TILES = [
  { to: '/map', icon: Map, label: 'Geospatial Map', desc: 'View offset wells on interactive map', color: 'from-[#758BFD]/25 to-[#758BFD]/5', border: 'border-[#758BFD]/40' },
  { to: '/wells', icon: Activity, label: 'Well Profiles', desc: 'Full DDR & WCR offset well records', color: 'from-[#AEB8FE]/25 to-[#AEB8FE]/5', border: 'border-[#AEB8FE]/40' },
  { to: '/search', icon: Search, label: 'Knowledge Search', desc: 'AI-powered extracted report search', color: 'from-[#27187E]/60 to-[#27187E]/20', border: 'border-[#758BFD]/40' },
  { to: '/correlation', icon: GitMerge, label: 'Correlation', desc: 'Cross-well parameter overlay charts', color: 'from-[#FF8600]/25 to-[#FF8600]/5', border: 'border-[#FF8600]/40' },
  { to: '/alerts', icon: AlertTriangle, label: 'Predictive Alerts', desc: 'Rule-based hazard detection engine', color: 'from-[#FF8600]/30 to-[#FF8600]/10', border: 'border-[#FF8600]/50' },
];

export default function Dashboard() {
  const [activeWell, setActiveWell] = useState<ActiveWell | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [nearbyWells, setNearbyWells] = useState<Well[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatedDepth, setSimulatedDepth] = useState(2100);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const [showBriefing, setShowBriefing] = useState(false);

  const loadAlertsForDepth = async (depth: number) => {
    setAlertsLoading(true);
    try {
      const alertsResp = await fetchAlerts({
        depth,
        radius: 25,
        lat: ACTIVE_WELL_LAT,
        lng: ACTIVE_WELL_LNG,
      });
      setAlerts(alertsResp.alerts);
    } finally {
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchActiveWell(),
      fetchNearbyWells(ACTIVE_WELL_LAT, ACTIVE_WELL_LNG, 25),
      fetchAlerts({ depth: 2100, radius: 25, lat: ACTIVE_WELL_LAT, lng: ACTIVE_WELL_LNG }),
    ]).then(([well, nearby, alertsResp]) => {
      setActiveWell(well);
      setNearbyWells(nearby);
      setAlerts(alertsResp.alerts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleDepthChange = (depth: number) => {
    setSimulatedDepth(depth);
    loadAlertsForDepth(depth);
  };

  const progressPct = activeWell
    ? Math.round((simulatedDepth / activeWell.plannedTD) * 100)
    : 0;

  const openAlerts = alerts.filter((a) => a.severity === 'high' || a.severity === 'critical').length;

  // Preset demo scenarios for easy presentation
  const SCENARIOS = [
    { label: 'Normal Drilling', depth: 850, formation: 'Girujan Clay', tag: 'Safe', color: 'border-green-500/30 text-green-400 bg-green-500/10' },
    { label: 'Tipam Loss Zone', depth: 1240, formation: 'Tipam Sandstone', tag: 'Mud Loss', color: 'border-amber-500/30 text-amber-400 bg-amber-500/10' },
    { label: 'Barail Gas Kick (Live)', depth: 2100, formation: 'Barail Group', tag: 'High Hazard', color: 'border-orange-500/30 text-orange-400 bg-orange-500/10' },
    { label: 'Kopili Stuck Pipe', depth: 3120, formation: 'Barail / Kopili', tag: 'Severe Risk', color: 'border-purple-500/30 text-purple-400 bg-purple-500/10' },
    { label: 'Sylhet Gas Influx', depth: 3980, formation: 'Sylhet Limestone', tag: 'Critical Kick', color: 'border-red-500/30 text-red-400 bg-red-500/10' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            Operations Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            eRTMAC-NWIS · Real-Time Decision Support · Oil India Limited (Upper Assam Asset)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowBriefing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-teal-300 border border-teal-500/30 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <span>📋 Rig Shift Briefing</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-lg">
            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
            <span className="text-teal-400 text-xs font-semibold uppercase tracking-wider">Telemetry Live</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="kpi-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Active Well</p>
          <p className="text-lg font-bold text-teal-400">{activeWell?.name ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">{activeWell?.rig ?? '—'}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Simulated Bit Depth</p>
          <p className="text-lg font-bold text-amber-400">{formatDepth(simulatedDepth)}</p>
          <div className="mt-2 depth-progress">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{progressPct}% of {formatDepth(activeWell?.plannedTD ?? 4200)} TD</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Offset Wells (25 km)</p>
          <p className="text-lg font-bold text-blue-400">{nearbyWells.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {nearbyWells.filter((w) => w.riskLevel === 'high' || w.riskLevel === 'critical').length} high-risk nearby
          </p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hazard Alerts</p>
          <p className={`text-lg font-bold ${openAlerts > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {alertsLoading ? '…' : openAlerts > 0 ? `${openAlerts} Critical/High` : '0 Active'}
          </p>
          <p className="text-xs text-gray-400 mt-1">{alerts.length} total events at depth</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Formation Zone</p>
          <p className="text-lg font-bold text-emerald-400 truncate">
            {simulatedDepth < 1000 ? 'Girujan Clay' : simulatedDepth < 1800 ? 'Tipam Sandstone' : simulatedDepth < 3000 ? 'Barail Group' : simulatedDepth < 3800 ? 'Kopili Shale' : 'Sylhet Limestone'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Day {activeWell?.daysOnWell ?? 69} on well</p>
        </div>
      </div>

      {/* Interactive Simulation / Test Hazard Controller */}
      <div className="glass-card p-4 border-teal-500/30 bg-gradient-to-r from-navy-800 via-navy-800 to-teal-950/20">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30 uppercase tracking-wide">
              Prototype Live Simulation
            </span>
            <span className="text-sm font-semibold text-gray-200">Test Depth Scenarios:</span>
            <span className="text-xs text-gray-400">(Click a scenario or drag slider to see real-time alert engine react)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Current Test Depth:</span>
            <span className="text-sm font-bold text-amber-400 font-mono bg-navy-900 px-2 py-0.5 rounded border border-navy-700">
              {formatDepth(simulatedDepth)}
            </span>
          </div>
        </div>

        {/* Preset scenario buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.depth}
              type="button"
              onClick={() => handleDepthChange(s.depth)}
              className={`p-2 rounded-lg border text-left transition-all ${
                simulatedDepth === s.depth
                  ? 'bg-teal-500/20 border-teal-400 shadow-md shadow-teal-500/10'
                  : 'bg-navy-900/60 border-navy-700 hover:border-navy-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-200">{s.depth} m</span>
                <span className={`text-[10px] font-semibold px-1 rounded border ${s.color}`}>{s.tag}</span>
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-1">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Depth Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 flex-shrink-0">0 m</span>
          <input
            type="range"
            min={100}
            max={4200}
            step={50}
            value={simulatedDepth}
            onChange={(e) => handleDepthChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-500 flex-shrink-0">4,200 m (TD)</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Active Well Status */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">
            <Activity size={18} className="text-teal-400" />
            Active Well — Real-Time Parameters
          </h2>
          <div className="space-y-3">
            {[
              {
                label: 'Rate of Penetration (ROP)',
                value: `${activeWell?.rop ?? '—'} m/hr`,
                desc: 'Drilling penetration velocity',
                icon: TrendingDown,
                data: ROP_DATA,
                color: '#758BFD',
              },
              {
                label: 'Mud Weight (MW)',
                value: `${activeWell?.mudWeight ?? '—'} SG`,
                desc: 'Hydrostatic formation balance',
                icon: Droplets,
                data: MW_DATA,
                color: '#AEB8FE',
              },
              {
                label: 'Rotary Torque',
                value: `${activeWell?.torque ?? '—'} kN·m`,
                desc: 'Drillstring rotational resistance',
                icon: Zap,
                data: TORQUE_DATA,
                color: '#FF8600',
              },
            ].map(({ label, value, desc, icon: Icon, data, color }) => (
              <div key={label} className="flex items-center gap-3 bg-navy-700/50 rounded-lg p-3">
                <Icon size={16} style={{ color }} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 font-semibold">{label}</p>
                  <p className="text-sm font-bold text-gray-100">{value}</p>
                  <p className="text-[10px] text-gray-500">{desc}</p>
                </div>
                <div className="w-20 h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-navy-700/40 rounded p-2 border border-navy-600/30">
              <p className="text-gray-400 font-medium">WOB (Weight on Bit)</p>
              <p className="text-gray-100 font-bold">{activeWell?.wob} kN</p>
              <p className="text-[10px] text-gray-500">Downward bit force</p>
            </div>
            <div className="bg-navy-700/40 rounded p-2 border border-navy-600/30">
              <p className="text-gray-400 font-medium">RPM (Rotary Speed)</p>
              <p className="text-gray-100 font-bold">{activeWell?.rpm} rpm</p>
              <p className="text-[10px] text-gray-500">Drillstring rotation</p>
            </div>
            <div className="bg-navy-700/40 rounded p-2 border border-navy-600/30">
              <p className="text-gray-400 font-medium">SPPA (Standpipe)</p>
              <p className="text-gray-100 font-bold">{activeWell?.sppa} psi</p>
              <p className="text-[10px] text-gray-500">Pump pressure</p>
            </div>
            <div className="bg-navy-700/40 rounded p-2 border border-navy-600/30">
              <p className="text-gray-400 font-medium">Target Zone</p>
              <p className="text-emerald-400 font-bold truncate">{activeWell?.currentFormation}</p>
              <p className="text-[10px] text-gray-500">Upper Assam rock</p>
            </div>
          </div>
        </div>

        {/* Recent Alerts Feed */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">
            <AlertTriangle size={18} className="text-red-400" />
            Predictive Alerts Feed
          </h2>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                ✓
              </div>
              <p className="text-sm">No hazards at current depth</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg p-3 border ${
                    alert.severity === 'critical'
                      ? 'bg-red-500/10 border-red-500/30'
                      : alert.severity === 'high'
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : alert.severity === 'medium'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-green-500/10 border-green-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-200 flex items-center gap-1.5">
                      {EVENT_TYPE_ICONS[alert.eventType]} {alert.eventType}
                    </span>
                    <span className={getSeverityClass(alert.severity)}>{alert.severity}</span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock size={11} className="text-gray-500" />
                    <span className="text-xs text-gray-500">
                      {alert.depthRange.min}–{alert.depthRange.max} m · {alert.affectedWellCount} wells
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link
            to="/alerts"
            className="mt-3 flex items-center justify-center gap-2 text-xs text-teal-400 hover:text-teal-300 transition-colors py-2 border-t border-navy-600/50"
          >
            View all alerts <ArrowRight size={12} />
          </Link>
        </div>

        {/* Nearest Offset Wells */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">
            <Gauge size={18} className="text-blue-400" />
            Nearest Offset Wells
          </h2>
          <div className="space-y-2">
            {nearbyWells.slice(0, 6).map((well) => (
              <Link
                key={well.id}
                to={`/wells/${well.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-navy-700/40 hover:bg-navy-700 transition-colors group"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      well.riskLevel === 'high' || well.riskLevel === 'critical'
                        ? '#f97316'
                        : well.riskLevel === 'medium'
                        ? '#f59e0b'
                        : '#22c55e',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 group-hover:text-teal-400 transition-colors truncate">
                    {well.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {well.distanceKm} km · TD {formatDepth(well.totalDepth)}
                  </p>
                </div>
                <span className={getSeverityClass(well.riskLevel)}>{well.riskLevel}</span>
              </Link>
            ))}
          </div>
          <Link
            to="/map"
            className="mt-3 flex items-center justify-center gap-2 text-xs text-teal-400 hover:text-teal-300 transition-colors py-2 border-t border-navy-600/50"
          >
            Open map view <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Navigation Tiles */}
      <div>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Quick Access Modules</h2>
        <div className="grid grid-cols-5 gap-4">
          {NAV_TILES.map(({ to, icon: Icon, label, desc, color, border }) => (
            <Link
              key={to}
              to={to}
              className={`glass-card p-4 bg-gradient-to-br ${color} border ${border} hover:scale-105 transition-all duration-200 group`}
            >
              <Icon size={22} className="text-gray-300 group-hover:text-white mb-3 transition-colors" />
              <p className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
                {label}
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-snug">{desc}</p>
              <ArrowRight size={14} className="text-gray-500 group-hover:text-teal-400 mt-2 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Rig Shift Briefing Modal */}
      {showBriefing && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-800 border border-navy-600/90 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-slide-up">
            <div className="flex items-center justify-between border-b border-navy-700 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-teal-500/20 text-teal-400 font-bold">OIL</span>
                <div>
                  <h3 className="text-base font-bold text-gray-100">Rig Shift Handover Briefing</h3>
                  <p className="text-xs text-teal-400">eRTMAC-NWIS · Automated Decision Support Export</p>
                </div>
              </div>
              <button
                onClick={() => setShowBriefing(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-navy-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-gray-300 max-h-[65vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-2 bg-navy-900/60 p-3 rounded-xl border border-navy-700">
                <div>
                  <span className="text-gray-500 block">Rig Name</span>
                  <span className="font-bold text-gray-100">{activeWell?.rig ?? 'OIL RIG-14'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Active Well</span>
                  <span className="font-bold text-teal-400">{activeWell?.name ?? 'DLJ-NEW-01'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Current Depth</span>
                  <span className="font-bold text-amber-400">{formatDepth(simulatedDepth)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Current Formation</span>
                  <span className="font-bold text-emerald-400">
                    {simulatedDepth < 1800 ? 'Tipam Sandstone' : simulatedDepth < 3000 ? 'Barail Group' : 'Kopili Shale'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Mud Weight</span>
                  <span className="font-bold text-blue-400">{activeWell?.mudWeight} SG</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Open Hazard Alerts</span>
                  <span className={`font-bold ${openAlerts > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {alerts.length} Detected
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide mb-1.5">
                  Critical Hazard Advisories at Current Depth
                </h4>
                {alerts.length === 0 ? (
                  <p className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400">
                    ✓ No offset well drilling hazards recorded within ±150 m depth window.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {alerts.slice(0, 3).map((a) => (
                      <div key={a.id} className="p-2.5 rounded-lg bg-navy-900/70 border border-navy-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-200">{a.eventType}</span>
                          <span className={getSeverityClass(a.severity)}>{a.severity}</span>
                        </div>
                        <p className="text-gray-400 text-[11px] mb-1">{a.message}</p>
                        <p className="text-teal-300 font-mono text-[10px] bg-teal-950/40 p-1.5 rounded border border-teal-900/50">
                          <strong>Mitigation:</strong> {a.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-navy-700">
              <span className="text-[11px] text-gray-500">Generated for Shift Supervisor · OIL Upper Assam Asset</span>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-1.5 rounded-lg bg-teal-500 text-navy-950 font-bold text-xs hover:bg-teal-400 transition-colors shadow"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
