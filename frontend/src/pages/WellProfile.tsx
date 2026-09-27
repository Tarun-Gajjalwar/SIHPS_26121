import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Calendar,
  MapPin,
  Layers,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Droplets,
  Zap,
  Weight,
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ReferenceLine,
} from 'recharts';
import { fetchWellProfile, fetchAllWells, fetchDrillingParams } from '../api';
import type { WellProfile, Well, DrillingParam } from '../types';
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_ICONS,
  FORMATION_COLORS,
  formatDepth,
  formatDate,
  getSeverityClass,
} from '../utils/constants';
import SeverityBadge from '../components/SeverityBadge';

function FormationColumn({ formations, totalDepth }: { formations: any[]; totalDepth: number }) {
  return (
    <div className="flex gap-4">
      {/* Formation bar */}
      <div className="w-12 flex-shrink-0">
        {formations.map((f) => {
          const pct = ((f.baseDepth - f.topDepth) / totalDepth) * 100;
          return (
            <div
              key={f.id}
              className="w-full relative border border-navy-600/30"
              style={{
                height: `${pct * 3.5}px`,
                backgroundColor: f.color + '40',
                borderLeft: `4px solid ${f.color}`,
              }}
            >
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-gray-400 text-right">
                {f.topDepth}m
              </div>
            </div>
          );
        })}
        <div className="text-xs text-gray-500 ml-5 mt-0.5">{totalDepth}m</div>
      </div>
      {/* Formation labels */}
      <div className="flex-1 space-y-1">
        {formations.map((f) => {
          const pct = ((f.baseDepth - f.topDepth) / totalDepth) * 100;
          return (
            <div
              key={f.id}
              className="relative rounded-lg px-3 py-2 border border-navy-600/30"
              style={{
                minHeight: `${Math.max(pct * 3.5, 40)}px`,
                backgroundColor: f.color + '15',
                borderLeft: `3px solid ${f.color}`,
              }}
            >
              <p className="text-sm font-semibold" style={{ color: f.color }}>
                {f.name}
              </p>
              <p className="text-xs text-gray-400">
                {f.topDepth}–{f.baseDepth} m
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{f.lithology}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Custom Recharts tooltip for drilling params
function DrillTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1 font-medium">{formatDepth(d.depth)}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function WellSelector({ wells, selectedId, onSelect }: { wells: Well[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm text-gray-400">Well:</span>
      <select
        className="select-dark flex-1"
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
      >
        {wells.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name} ({w.id})
          </option>
        ))}
      </select>
    </div>
  );
}

export default function WellProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [wells, setWells] = useState<Well[]>([]);
  const [profile, setProfile] = useState<WellProfile | null>(null);
  const [drillingParams, setDrillingParams] = useState<DrillingParam[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [activeParam, setActiveParam] = useState<'rop' | 'mudWeight' | 'torque' | 'wob'>('rop');

  const wellId = id || (wells.length > 0 ? wells[0].id : '');

  useEffect(() => {
    fetchAllWells().then(setWells);
  }, []);

  useEffect(() => {
    if (!wellId) return;
    setLoading(true);
    Promise.all([fetchWellProfile(wellId), fetchDrillingParams(wellId)]).then(
      ([prof, params]) => {
        setProfile(prof);
        setDrillingParams(params);
        setLoading(false);
      }
    );
  }, [wellId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-6 text-gray-400">Well not found.</div>;
  }

  const PARAM_CONFIG = {
    rop: { label: 'ROP (m/hr)', color: '#758BFD', icon: TrendingDown },
    mudWeight: { label: 'Mud Weight (SG)', color: '#AEB8FE', icon: Droplets },
    torque: { label: 'Torque (kN·m)', color: '#FF8600', icon: Zap },
    wob: { label: 'WOB (kN)', color: '#F1F2F6', icon: Weight },
  };

  // Transform drilling params for depth-vs-value chart (y=depth, x=value)
  const chartData = drillingParams.map((p) => ({
    ...p,
    depth: -p.depth, // negate for "downward" orientation
  }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-navy-700 text-gray-400 hover:text-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{profile.name}</h1>
          <p className="text-gray-400 text-sm">
            {profile.id} · {profile.wellType} · {profile.operator}
          </p>
        </div>
        <SeverityBadge severity={profile.riskLevel} className="ml-2" />
        <div className="ml-auto">
          <WellSelector
            wells={wells}
            selectedId={wellId}
            onSelect={(newId) => navigate(`/wells/${newId}`)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column: Metadata + Formation column */}
        <div className="space-y-4">
          {/* Metadata */}
          <div className="glass-card p-4">
            <h2 className="section-title mb-3">
              <Activity size={15} className="text-[#758BFD]" /> Well Metadata
            </h2>
            <table className="data-table">
              <tbody>
                {[
                  { k: 'Well ID', v: profile.id },
                  { k: 'Spud Date', v: formatDate(profile.spudDate) },
                  { k: 'Total Depth', v: formatDepth(profile.totalDepth) },
                  { k: 'Status', v: profile.status },
                  { k: 'Well Type', v: profile.wellType },
                  { k: 'Coordinates', v: `${profile.lat.toFixed(4)}°N, ${profile.lng.toFixed(4)}°E` },
                ].map(({ k, v }) => (
                  <tr key={k}>
                    <td className="text-gray-500 text-xs w-32">{k}</td>
                    <td className="text-gray-200 text-xs font-medium">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 pt-3 border-t border-navy-600/50">
              <p className="text-xs text-gray-500 leading-relaxed">{profile.remarks}</p>
            </div>
          </div>

          {/* Formation Column */}
          <div className="glass-card p-4">
            <h2 className="section-title mb-3">
              <Layers size={14} className="text-amber-400" /> Formation Column
            </h2>
            <FormationColumn
              formations={profile.formations}
              totalDepth={profile.totalDepth}
            />
          </div>
        </div>

        {/* Middle column: Event Timeline + Casing */}
        <div className="space-y-4">
          {/* Events */}
          <div className="glass-card p-4">
            <h2 className="section-title mb-3">
              <AlertTriangle size={14} className="text-red-400" />
              DDR Event Log ({profile.events.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {profile.events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-navy-600/50 overflow-hidden"
                >
                  <button
                    className="w-full flex items-center gap-2 p-2.5 hover:bg-navy-700/50 transition-colors text-left"
                    onClick={() =>
                      setExpandedEvent(expandedEvent === event.id ? null : event.id)
                    }
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: EVENT_TYPE_COLORS[event.eventType] }}
                    />
                    <span className="text-xs text-gray-300 font-medium flex-1">
                      {EVENT_TYPE_ICONS[event.eventType]} {event.eventType}
                    </span>
                    <span className="text-xs text-gray-500">{formatDepth(event.depth)}</span>
                    <SeverityBadge severity={event.severity} />
                    {expandedEvent === event.id ? (
                      <ChevronUp size={12} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={12} className="text-gray-500" />
                    )}
                  </button>
                  {expandedEvent === event.id && (
                    <div className="px-3 pb-3 text-xs text-gray-400 space-y-2 bg-navy-700/30">
                      <div>
                        <span className="text-gray-500">Date: </span>
                        {formatDate(event.date)} · <span className="text-gray-500">Formation: </span>
                        {event.formation}
                      </div>
                      <div>
                        <p className="text-gray-300 font-medium mb-1">📋 Remark:</p>
                        <p className="leading-relaxed">{event.remark}</p>
                      </div>
                      <div>
                        <p className="text-teal-400 font-medium mb-1">✅ Mitigation:</p>
                        <p className="leading-relaxed">{event.mitigation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Casing Program */}
          {profile.casingInfo && (
            <div className="glass-card p-4">
              <h2 className="section-title mb-3">
                🏗️ Casing Program
              </h2>
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Type</th>
                    <th>Set Depth</th>
                    <th>TOC</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.casingInfo.casingProgram.map((c, i) => (
                    <tr key={i}>
                      <td className="font-mono font-medium text-amber-400">{c.size}</td>
                      <td>{c.type}</td>
                      <td className="font-medium">{formatDepth(c.depth)}</td>
                      <td className="text-gray-400">{c.cementTOC}</td>
                      <td className="text-gray-400">{c.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 pt-3 border-t border-navy-600/50 text-xs text-gray-400 leading-relaxed">
                <p className="text-gray-300 font-medium mb-1">Cementing Summary</p>
                <p>{profile.casingInfo.cementingSummary}</p>
              </div>
              <div className="mt-2 text-xs">
                <p className="text-gray-300 font-medium">Completion Zone</p>
                <p className="text-teal-400">{profile.casingInfo.completionZone}</p>
              </div>
              <div className="mt-2 text-xs">
                <p className="text-gray-300 font-medium">Well Result</p>
                <p className="text-amber-400 font-medium">{profile.casingInfo.wellResult}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Drilling Params Chart */}
        <div className="glass-card p-4">
          <h2 className="section-title mb-3">
            <Activity size={14} className="text-teal-400" />
            Drilling Parameters vs Depth
          </h2>

          {/* Param selector */}
          <div className="flex gap-2 flex-wrap mb-4">
            {Object.entries(PARAM_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setActiveParam(key as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  activeParam === key
                    ? 'border-transparent text-white'
                    : 'border-navy-500 text-gray-400 hover:text-gray-200'
                }`}
                style={
                  activeParam === key
                    ? { backgroundColor: cfg.color + '40', borderColor: cfg.color }
                    : {}
                }
              >
                {cfg.label}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={420}>
            <LineChart
              data={drillingParams}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1d2f6b" />
              <YAxis
                dataKey="depth"
                type="number"
                domain={[0, profile.totalDepth]}
                reversed
                tickFormatter={(v) => `${v}m`}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                width={48}
              />
              <XAxis
                dataKey={activeParam}
                type="number"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
              />
              <Tooltip content={<DrillTooltip />} />

              {/* Formation reference lines */}
              {profile.formations.map((f) => (
                <ReferenceLine
                  key={f.id}
                  y={f.topDepth}
                  stroke={f.color}
                  strokeDasharray="4 3"
                  strokeWidth={1}
                  label={{ value: f.name.split(' ')[0], position: 'insideTopRight', fontSize: 9, fill: f.color }}
                />
              ))}

              <Line
                dataKey={activeParam}
                stroke={PARAM_CONFIG[activeParam].color}
                strokeWidth={2}
                dot={false}
                name={PARAM_CONFIG[activeParam].label}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Event scatter overlay info */}
          <div className="mt-3 pt-3 border-t border-navy-600/50">
            <p className="text-xs text-gray-500">
              Formation boundaries shown as dashed lines. Events at:{' '}
              <span className="text-gray-300">
                {profile.events.map((e) => `${e.depth}m`).join(', ')}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Local tiny icon wrapper
function Info14() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
