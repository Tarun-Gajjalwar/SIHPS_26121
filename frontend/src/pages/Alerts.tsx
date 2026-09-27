import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
  Info,
  RefreshCw,
  CheckCircle,
  Copy,
  ExternalLink,
  Flame,
  SlidersHorizontal,
} from 'lucide-react';
import { fetchAlerts, fetchActiveWell } from '../api';
import type { Alert, AlertsResponse, ActiveWell } from '../types';
import { ACTIVE_WELL_LAT, ACTIVE_WELL_LNG, EVENT_TYPE_ICONS, formatDepth, getSeverityClass } from '../utils/constants';

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string; glow: string }> = {
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
    icon: 'text-red-400',
    glow: 'shadow-red-500/10',
  },
  high: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/40',
    icon: 'text-orange-400',
    glow: 'shadow-orange-500/10',
  },
  medium: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    icon: 'text-amber-400',
    glow: 'shadow-amber-500/10',
  },
  low: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/40',
    icon: 'text-green-400',
    glow: 'shadow-green-500/10',
  },
};

function AlertCard({
  alert,
  expanded,
  onToggle,
  isAcknowledged,
  onAcknowledge,
}: {
  alert: Alert;
  expanded: boolean;
  onToggle: () => void;
  isAcknowledged: boolean;
  onAcknowledge: () => void;
}) {
  const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.low;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden animate-slide-up ${
        isAcknowledged
          ? 'bg-navy-800/80 border-navy-600/70 opacity-90'
          : `${style.bg} ${style.border} shadow-lg ${style.glow}`
      }`}
    >
      {/* Card header */}
      <div className="w-full flex items-start gap-3 p-4">
        <button
          className="flex items-start gap-3 flex-1 text-left min-w-0"
          onClick={onToggle}
          type="button"
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl border ${
              isAcknowledged ? 'bg-navy-700 border-navy-500 text-teal-400' : `${style.bg} ${style.border}`
            }`}
          >
            {EVENT_TYPE_ICONS[alert.eventType] ?? '⚠️'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-base font-bold text-gray-100">{alert.eventType}</span>
              <span className={getSeverityClass(alert.severity)}>{alert.severity.toUpperCase()}</span>

              {isAcknowledged ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-teal-400 bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded-full">
                  <CheckCircle size={12} /> Acknowledged by Driller
                </span>
              ) : (
                <span className="text-xs text-amber-400/90 font-medium">Pending Review</span>
              )}

              <span className="text-xs text-gray-500 ml-auto hidden sm:inline">
                {alert.affectedWellCount} offset well{alert.affectedWellCount !== 1 ? 's' : ''} · {alert.depthRange.min}–{alert.depthRange.max} m
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{alert.message}</p>
          </div>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0 pt-1">
          <button
            type="button"
            onClick={onAcknowledge}
            title={isAcknowledged ? 'Mark as Unacknowledged' : 'Acknowledge this hazard'}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              isAcknowledged
                ? 'bg-navy-700 text-teal-300 hover:bg-navy-600 border border-teal-500/30'
                : 'bg-teal-500 text-navy-950 hover:bg-teal-400 shadow-md shadow-teal-500/20'
            }`}
          >
            <CheckCircle size={13} />
            <span className="hidden sm:inline">{isAcknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded-lg hover:bg-navy-700 text-gray-400 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3.5 border-t border-navy-700/50 pt-3">
          {/* Plain English AI / Rule Engine Explanation */}
          <div className="bg-navy-900/60 border border-navy-700 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <Info size={13} className="text-teal-400" /> Why this alert was triggered:
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your bit is at <strong className="text-amber-400">{formatDepth(alert.currentDepth)}</strong>. Historical records show{' '}
              <strong className="text-white">{alert.affectedWellCount} nearby well(s)</strong> had {alert.eventType.toLowerCase()} events between{' '}
              <strong className="text-teal-300">{alert.depthRange.min} m and {alert.depthRange.max} m</strong>, which falls within the{' '}
              <strong className="text-white">±150 m hazard corridor</strong>.
            </p>
          </div>

          {/* Mitigation */}
          <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-3.5">
            <p className="text-xs font-semibold text-teal-400 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={14} /> Recommended Action & Mitigation
            </p>
            <p className="text-sm text-gray-200 leading-relaxed font-medium">{alert.mitigation}</p>
          </div>

          {/* Affected wells table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                Contributing Offset Well Events ({alert.events.length})
              </p>
              <span className="text-[11px] text-gray-500">Sorted by proximity</span>
            </div>
            <div className="space-y-1.5">
              {alert.events.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-xs bg-navy-700/60 hover:bg-navy-700 rounded-lg px-3 py-2.5 transition-colors"
                >
                  <Link
                    to={`/wells/${e.wellId}`}
                    className="text-teal-400 hover:text-teal-300 font-semibold w-24 flex items-center gap-1 flex-shrink-0"
                    title="View Well Profile"
                  >
                    {e.wellName ?? e.wellId}
                    <ExternalLink size={10} />
                  </Link>
                  <span className="text-amber-400 font-mono font-medium">{formatDepth(e.depth)}</span>
                  <span className="text-gray-300 flex-1 truncate">{e.formation}</span>
                  <span className={getSeverityClass(e.severity)}>{e.severity}</span>
                  {e.distanceKm !== undefined && (
                    <span className="text-gray-400 bg-navy-800 px-2 py-0.5 rounded border border-navy-600/50">
                      {e.distanceKm} km away
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Alerts() {
  const [activeWell, setActiveWell] = useState<ActiveWell | null>(null);
  const [depth, setDepth] = useState(2100);
  const [radius, setRadius] = useState(25);
  const [response, setResponse] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'critical' | 'high_critical'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedBriefing, setCopiedBriefing] = useState(false);

  useEffect(() => {
    fetchActiveWell().then((w) => {
      setActiveWell(w);
      setDepth(w.currentDepth);
      loadAlerts(w.currentDepth, radius);
    });
  }, []);

  const loadAlerts = useCallback(async (d: number, r: number) => {
    setLoading(true);
    try {
      const data = await fetchAlerts({ depth: d, radius: r, lat: ACTIVE_WELL_LAT, lng: ACTIVE_WELL_LNG });
      setResponse(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = Number(e.target.value);
    setDepth(d);
    loadAlerts(d, radius);
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const r = Number(e.target.value);
    setRadius(r);
    loadAlerts(depth, r);
  };

  const toggleAcknowledge = (id: string) => {
    setAcknowledgedAlerts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const progressPct = activeWell ? Math.round((depth / activeWell.plannedTD) * 100) : 0;
  const rawAlerts = response?.alerts ?? [];

  // Filter alerts based on UI selections
  const filteredAlerts = rawAlerts.filter((a) => {
    if (selectedSeverity === 'critical' && a.severity !== 'critical') return false;
    if (selectedSeverity === 'high_critical' && a.severity !== 'critical' && a.severity !== 'high') return false;
    if (selectedCategory !== 'all' && a.eventType !== selectedCategory) return false;
    return true;
  });

  const criticalCount = rawAlerts.filter((a) => a.severity === 'critical').length;
  const highCount = rawAlerts.filter((a) => a.severity === 'high').length;
  const acknowledgedCount = rawAlerts.filter((a) => acknowledgedAlerts.has(a.id)).length;

  // Get distinct categories present
  const availableCategories = Array.from(new Set(rawAlerts.map((a) => a.eventType)));

  // Copy handover safety briefing
  const handleCopyBriefing = () => {
    const lines = [
      `🚨 OIL INDIA eRTMAC-NWIS — RIG SHIFT SAFETY BRIEFING`,
      `Rig: OIL RIG-14 | Target: DLJ-NEW-01 | Simulated Depth: ${depth} m`,
      `Radius: ${radius} km | Checked Wells: ${response?.nearbyWellsChecked ?? 0}`,
      `Critical Hazards: ${criticalCount} | High Hazards: ${highCount}`,
      `--------------------------------------------------`,
      ...rawAlerts.map((a, i) => `${i + 1}. [${a.severity.toUpperCase()}] ${a.eventType}: ${a.message}\n   Mitigation: ${a.mitigation}`),
      `--------------------------------------------------`,
      `Exported on: ${new Date().toLocaleString('en-IN')}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedBriefing(true);
    setTimeout(() => setCopiedBriefing(false), 2500);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left control panel */}
      <div className="w-80 flex-shrink-0 bg-navy-800 border-r border-navy-600/50 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-navy-600/50 flex items-center justify-between">
          <h2 className="section-title">
            <SlidersHorizontal size={16} className="text-teal-400" />
            Alert Simulator Controls
          </h2>
          <span className="text-[11px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30 font-medium">
            Live
          </span>
        </div>

        {/* Explain the AI / Rule engine clearly */}
        <div className="mx-4 mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <Cpu size={14} className="text-purple-400" />
            <span className="text-xs font-semibold text-purple-300">Rule-Based Hazard Engine</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Evaluates offset well DDR/WCR reports within <strong className="text-gray-200">±150 m</strong> of bit depth and{' '}
            <strong className="text-gray-200">{radius} km</strong> radius to anticipate kicks, losses, and stuck pipe incidents.
          </p>
        </div>

        {/* Quick Scenario Buttons */}
        <div className="p-4 border-b border-navy-600/50">
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-2">
            1-Click Geological Scenarios
          </label>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {[
              { label: 'Tipam Loss', d: 1240, tag: 'Mud Loss' },
              { label: 'Barail Kick', d: 2100, tag: 'Gas Kick' },
              { label: 'Kopili Stuck', d: 3120, tag: 'Stuck Pipe' },
              { label: 'Sylhet Kick', d: 3980, tag: 'High Pressure' },
            ].map((sc) => (
              <button
                key={sc.d}
                type="button"
                onClick={() => {
                  setDepth(sc.d);
                  loadAlerts(sc.d, radius);
                }}
                className={`py-2 px-2 rounded-lg text-left transition-all ${
                  depth === sc.d
                    ? 'bg-amber-500 text-navy-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-navy-700/80 text-gray-300 hover:bg-navy-600 hover:text-white'
                }`}
              >
                <p className="text-xs font-semibold">{sc.label}</p>
                <p className="text-[10px] opacity-80">{sc.d} m · {sc.tag}</p>
              </button>
            ))}
          </div>

          {/* Depth Slider */}
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm text-gray-300 font-medium">Drill Bit Depth</label>
            <span className="text-amber-400 font-bold text-sm font-mono">{depth.toLocaleString()} m</span>
          </div>
          <input
            type="range"
            min={0}
            max={activeWell?.plannedTD ?? 4200}
            step={50}
            value={depth}
            onChange={handleDepthChange}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 m</span>
            <span>{activeWell?.plannedTD ?? 4200} m (TD)</span>
          </div>
          <div className="mt-2.5 depth-progress">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{progressPct}% of planned TD reached</p>
        </div>

        {/* Radius Slider */}
        <div className="p-4 border-b border-navy-600/50">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-300 font-medium">Offset Radius</label>
            <span className="text-teal-400 font-bold text-sm">{radius} km</span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={radius}
            onChange={handleRadiusChange}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5 km (Immediate)</span>
            <span>60 km (Regional)</span>
          </div>
        </div>

        {/* Alert Stats */}
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Incident Overview</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5">
              <p className="text-lg font-bold text-red-400">{criticalCount}</p>
              <p className="text-[10px] text-gray-400">Critical</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-2.5">
              <p className="text-lg font-bold text-orange-400">{highCount}</p>
              <p className="text-[10px] text-gray-400">High</p>
            </div>
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-2.5">
              <p className="text-lg font-bold text-teal-400">{acknowledgedCount}</p>
              <p className="text-[10px] text-gray-400">Acknowledged</p>
            </div>
          </div>

          {response && (
            <p className="text-xs text-gray-400 leading-relaxed bg-navy-900/50 p-2.5 rounded-lg border border-navy-700">
              Scanned <strong className="text-teal-300">{response.nearbyWellsChecked} offset wells</strong> within {radius} km.
            </p>
          )}

          {/* Copy safety handover briefing button */}
          <button
            type="button"
            onClick={handleCopyBriefing}
            className="w-full py-2.5 px-3 rounded-xl bg-navy-700 hover:bg-navy-600 border border-navy-500/60 text-xs font-semibold text-gray-200 hover:text-white flex items-center justify-center gap-2 transition-all"
          >
            {copiedBriefing ? <CheckCircle size={14} className="text-teal-400" /> : <Copy size={14} />}
            <span>{copiedBriefing ? 'Copied Briefing to Clipboard!' : 'Copy Rig Handover Briefing'}</span>
          </button>
        </div>
      </div>

      {/* Main alerts content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header & Filter Bar */}
        <div className="p-4 bg-navy-800/80 border-b border-navy-600/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <AlertTriangle
                  size={20}
                  className={criticalCount > 0 ? 'text-red-400 animate-bounce' : highCount > 0 ? 'text-orange-400' : 'text-green-400'}
                />
                Predictive Hazard Intelligence
              </h1>
              <p className="text-gray-400 text-xs mt-0.5">
                Real-time hazard mitigation recommendations based on historical offset well performance
              </p>
            </div>
            <button
              onClick={() => loadAlerts(depth, radius)}
              className="btn-secondary"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs text-gray-500 font-medium">Filter by:</span>

            {/* Severity filter pills */}
            <div className="flex items-center gap-1 bg-navy-900/80 p-0.5 rounded-lg border border-navy-700">
              {[
                { id: 'all', label: 'All Severities' },
                { id: 'high_critical', label: 'High & Critical' },
                { id: 'critical', label: 'Critical Only' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSeverity(s.id as any)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    selectedSeverity === s.id
                      ? 'bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Category pills if available */}
            {availableCategories.length > 1 && (
              <div className="flex items-center gap-1 bg-navy-900/80 p-0.5 rounded-lg border border-navy-700 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  All Types
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alert cards list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-gray-500 gap-3">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <ShieldCheck size={28} className="text-green-400" />
              </div>
              <div className="text-center max-w-md">
                <p className="text-green-400 font-semibold text-base">No Matching Hazards Found</p>
                <p className="text-xs text-gray-400 mt-1">
                  At depth {formatDepth(depth)} with {radius} km offset radius, no matching historical incidents match your filter.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeverity('all');
                      setSelectedCategory('all');
                    }}
                    className="btn-secondary text-xs"
                  >
                    Reset Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDepth(2100);
                      loadAlerts(2100, radius);
                    }}
                    className="btn-primary text-xs"
                  >
                    Jump to Barail Kick Zone (2,100 m)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 max-w-4xl mx-auto">
              {/* Critical banner */}
              {criticalCount > 0 && selectedSeverity !== 'all' && (
                <div className="bg-red-500/15 border border-red-500/50 rounded-xl p-3 flex items-center gap-3">
                  <Flame size={20} className="text-red-400 flex-shrink-0 animate-pulse" />
                  <div>
                    <p className="text-red-400 font-bold text-sm">
                      ⚠ CRITICAL HAZARD ACTIVE: {criticalCount} high-risk condition(s) detected near bit depth
                    </p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Review recommended mud weight adjustments and standby LCM pills before continuing drilling.
                    </p>
                  </div>
                </div>
              )}

              {filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  expanded={expanded === alert.id}
                  onToggle={() => setExpanded(expanded === alert.id ? null : alert.id)}
                  isAcknowledged={acknowledgedAlerts.has(alert.id)}
                  onAcknowledge={() => toggleAcknowledge(alert.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
