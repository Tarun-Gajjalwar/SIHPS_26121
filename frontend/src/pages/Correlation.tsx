import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { GitMerge, Info, Sparkles, SlidersHorizontal, Layers, CheckCircle2, RotateCcw } from 'lucide-react';
import { fetchAllWells, fetchDrillingParams, fetchWellProfile } from '../api';
import type { Well, DrillingParam, WellEvent, Formation } from '../types';
import { EVENT_TYPE_COLORS, formatDepth } from '../utils/constants';

const WELL_LINE_COLORS = ['#FF8600', '#758BFD', '#AEB8FE', '#F1F2F6', '#ffa742'];

const PARAM_OPTIONS = [
  { value: 'rop', label: 'Rate of Penetration (m/hr)', unit: 'm/hr', domain: [0, 20] },
  { value: 'mudWeight', label: 'Mud Weight (SG)', unit: 'SG', domain: [1.0, 1.6] },
  { value: 'torque', label: 'Torque (kN·m)', unit: 'kN·m', domain: [0, 25] },
  { value: 'wob', label: 'Weight on Bit (kN)', unit: 'kN', domain: [0, 30] },
];

const FORMATION_INTERVALS = [
  { name: 'Girujan Clay', top: 0, base: 900, color: '#758BFD', desc: 'Soft clay & alluvium' },
  { name: 'Tipam Sandstone', top: 900, base: 1850, color: '#FF8600', desc: 'Porous reservoir sand' },
  { name: 'Barail Group', top: 1850, base: 3100, color: '#AEB8FE', desc: 'Main producing sandstones' },
  { name: 'Kopili Shale', top: 3100, base: 3900, color: '#758BFD', desc: 'Swelling marine shales' },
  { name: 'Sylhet Limestone', top: 3900, base: 4500, color: '#F1F2F6', desc: 'Hard fractured carbonate' },
];

function getFormationAtDepth(d: number) {
  return FORMATION_INTERVALS.find((f) => d >= f.top && d <= f.base)?.name ?? 'Subsurface';
}

interface WellData {
  well: Well;
  params: DrillingParam[];
  events: WellEvent[];
  formations: Formation[];
}

// Enhanced Custom Tooltip
function CorrelationTooltip({ active, payload, label, paramUnit, orientation }: any) {
  if (!active || !payload?.length) return null;
  const depthVal = orientation === 'vertical' ? payload[0]?.payload?.depth : label;
  const formation = getFormationAtDepth(Number(depthVal));

  return (
    <div className="bg-navy-800/95 backdrop-blur-md border border-navy-600 rounded-xl p-3 text-xs shadow-2xl min-w-44 z-50 animate-fade-in">
      <div className="border-b border-navy-700 pb-1.5 mb-2">
        <p className="text-gray-100 font-bold font-mono text-sm">{formatDepth(Number(depthVal))}</p>
        <p className="text-teal-400 text-[11px] font-medium">{formation}</p>
      </div>
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-gray-300 font-medium">{p.name}:</span>
            </div>
            <span className="text-white font-mono font-bold">
              {p.value} <span className="text-gray-400 font-normal text-[10px]">{paramUnit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Correlation() {
  const [allWells, setAllWells] = useState<Well[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [wellDataMap, setWellDataMap] = useState<Record<string, WellData>>({});
  const [param, setParam] = useState<'rop' | 'mudWeight' | 'torque' | 'wob'>('rop');
  const [loading, setLoading] = useState(false);
  const [depthMin, setDepthMin] = useState(0);
  const [depthMax, setDepthMax] = useState(4500);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [showFormationBands, setShowFormationBands] = useState(true);
  const [showEventLines, setShowEventLines] = useState(true);

  useEffect(() => {
    fetchAllWells().then((wells) => {
      setAllWells(wells);
      // Default: select first 3 wells
      const defaults = wells.slice(0, 3).map((w) => w.id);
      setSelectedIds(defaults);
      loadWellData(defaults);
    });
  }, []);

  const loadWellData = async (ids: string[]) => {
    setLoading(true);
    const entries = await Promise.all(
      ids.map(async (id) => {
        const [profile, params] = await Promise.all([
          fetchWellProfile(id),
          fetchDrillingParams(id),
        ]);
        return [id, { well: profile, params, events: profile.events, formations: profile.formations }] as [string, WellData];
      })
    );
    setWellDataMap(Object.fromEntries(entries));
    setLoading(false);
  };

  const addWell = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= 5) return;
    const next = [...selectedIds, id];
    setSelectedIds(next);
    loadWellData(next);
  };

  const removeWell = (id: string) => {
    const next = selectedIds.filter((s) => s !== id);
    setSelectedIds(next);
    setWellDataMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Merge param data across selected wells at common depth points
  const mergedData: Record<number, any> = {};
  selectedIds.forEach((id) => {
    const data = wellDataMap[id];
    if (!data) return;
    data.params
      .filter((p) => p.depth >= depthMin && p.depth <= depthMax)
      .forEach((p) => {
        if (!mergedData[p.depth]) mergedData[p.depth] = { depth: p.depth };
        mergedData[p.depth][id] = p[param];
      });
  });
  const chartData = Object.values(mergedData).sort((a, b) => a.depth - b.depth);

  // Collect all historical event bands from selected wells
  const eventBands: Array<{ depth: number; eventType: string; wellId: string; severity: string }> = [];
  selectedIds.forEach((id) => {
    const data = wellDataMap[id];
    if (!data) return;
    data.events.forEach((e) => {
      if (e.depth >= depthMin && e.depth <= depthMax) {
        eventBands.push({ depth: e.depth, eventType: e.eventType, wellId: id, severity: e.severity });
      }
    });
  });

  const activeParamMeta = PARAM_OPTIONS.find((p) => p.value === param) || PARAM_OPTIONS[0];

  return (
    <div className="p-6 space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <GitMerge size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100">Cross-Well Stratigraphic Correlation</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              Multi-well telemetry overlays across Upper Assam formations with historical hazard bands
            </p>
          </div>
        </div>

        {/* View Orientation Mode Toggle */}
        <div className="flex items-center gap-2 bg-navy-800 border border-navy-700 p-1 rounded-xl shadow-lg">
          <span className="text-xs text-gray-400 px-2 font-medium">Layout:</span>
          <button
            type="button"
            onClick={() => setOrientation('horizontal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              orientation === 'horizontal'
                ? 'bg-teal-500 text-navy-950 shadow-md shadow-teal-500/20'
                : 'text-gray-400 hover:text-white hover:bg-navy-700'
            }`}
          >
            📊 Parameter vs Depth (Standard)
          </button>
          <button
            type="button"
            onClick={() => setOrientation('vertical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              orientation === 'vertical'
                ? 'bg-teal-500 text-navy-950 shadow-md shadow-teal-500/20'
                : 'text-gray-400 hover:text-white hover:bg-navy-700'
            }`}
          >
            🛢️ Subsurface Log Track (Vertical)
          </button>
        </div>
      </div>

      {/* Control Card */}
      <div className="glass-card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Well Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Selected Wells ({selectedIds.length}/5)
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const preset = ['DLJ-01', 'DLJ-02', 'DLJ-03'];
                    setSelectedIds(preset);
                    loadWellData(preset);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-navy-700 hover:bg-navy-600 text-emerald-300 border border-navy-600"
                >
                  🏛️ Assam
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const preset = ['DML-01', 'KHR-01', 'KMC-01'];
                    setSelectedIds(preset);
                    loadWellData(preset);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-navy-700 hover:bg-navy-600 text-cyan-300 border border-navy-600"
                >
                  🏔️ Arunachal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const preset = ['TZT-01', 'CHM-01', 'DLJ-01'];
                    setSelectedIds(preset);
                    loadWellData(preset);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-navy-700 hover:bg-navy-600 text-purple-300 border border-navy-600"
                >
                  🌿 Nagaland
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const preset = ['BAR-01', 'ROK-01', 'AGT-01'];
                    setSelectedIds(preset);
                    loadWellData(preset);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-navy-700 hover:bg-navy-600 text-amber-300 border border-navy-600"
                >
                  🛢️ Tripura
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const preset = ['KLS-01', 'BKH-01', 'DLJ-01'];
                    setSelectedIds(preset);
                    loadWellData(preset);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-navy-700 hover:bg-navy-600 text-rose-300 border border-navy-600"
                >
                  🌄 Mizoram
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const preset = ['JRB-01', 'IMP-01', 'DLJ-01'];
                    setSelectedIds(preset);
                    loadWellData(preset);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-navy-700 hover:bg-navy-600 text-indigo-300 border border-navy-600"
                >
                  🎋 Manipur
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const preset = ['JNT-01', 'DHK-01', 'DLJ-01'];
                    setSelectedIds(preset);
                    loadWellData(preset);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-navy-700 hover:bg-navy-600 text-sky-300 border border-navy-600"
                >
                  ☁️ Meghalaya
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[32px]">
              {selectedIds.map((id, idx) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm"
                  style={{
                    borderColor: WELL_LINE_COLORS[idx % WELL_LINE_COLORS.length],
                    backgroundColor: WELL_LINE_COLORS[idx % WELL_LINE_COLORS.length] + '20',
                    color: WELL_LINE_COLORS[idx % WELL_LINE_COLORS.length],
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: WELL_LINE_COLORS[idx % WELL_LINE_COLORS.length] }} />
                  {wellDataMap[id]?.well.name ?? id}
                  <button
                    type="button"
                    onClick={() => removeWell(id)}
                    className="hover:opacity-75 p-0.5 rounded-full"
                    title="Remove well"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <select
              className="select-dark w-full text-xs"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) addWell(e.target.value);
                e.target.value = '';
              }}
            >
              <option value="">+ Add offset well to correlation chart…</option>
              {allWells
                .filter((w) => !selectedIds.includes(w.id))
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    [{w.state || 'Assam'}] {w.name} ({w.id}) — TD {w.totalDepth}m · {w.riskLevel} risk
                  </option>
                ))}
            </select>
          </div>

          {/* Parameter Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2">
              Drilling Telemetry Parameter
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PARAM_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setParam(p.value as any)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    param === p.value
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-md shadow-teal-500/10'
                      : 'bg-navy-800/80 border-navy-700 text-gray-400 hover:bg-navy-700 hover:text-gray-200'
                  }`}
                >
                  <p className="text-xs font-bold truncate">{p.label.split('(')[0]}</p>
                  <p className="text-[11px] opacity-75">Unit: {p.unit}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Depth Window & Display Options */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2">
              Depth Window (m) & Display Toggles
            </label>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="number"
                value={depthMin}
                step={100}
                onChange={(e) => setDepthMin(Number(e.target.value))}
                className="input-dark w-full text-xs"
                placeholder="0"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="number"
                value={depthMax}
                step={100}
                onChange={(e) => setDepthMax(Number(e.target.value))}
                className="input-dark w-full text-xs"
                placeholder="4500"
              />
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-300">
              <label className="flex items-center gap-2 cursor-pointer hover:text-teal-300 transition-colors">
                <input
                  type="checkbox"
                  checked={showFormationBands}
                  onChange={(e) => setShowFormationBands(e.target.checked)}
                  className="w-3.5 h-3.5 accent-teal-500 rounded"
                />
                <span>Formations background</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-teal-300 transition-colors">
                <input
                  type="checkbox"
                  checked={showEventLines}
                  onChange={(e) => setShowEventLines(e.target.checked)}
                  className="w-3.5 h-3.5 accent-teal-500 rounded"
                />
                <span>Hazard lines ({eventBands.length})</span>
              </label>
            </div>
          </div>
        </div>

        {/* Formation Legend Ribbon */}
        <div className="pt-2 border-t border-navy-700/60">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold mb-2">
            Upper Assam Stratigraphic Formations (Surface to Basement):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {FORMATION_INTERVALS.map((f) => (
              <div
                key={f.name}
                className="p-2 rounded-lg border text-xs"
                style={{
                  borderColor: f.color + '40',
                  backgroundColor: f.color + '15',
                }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                  <p className="font-bold text-gray-100 truncate">{f.name}</p>
                </div>
                <p className="text-[10px] text-gray-400">
                  {f.top}m – {f.base}m
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-100">
              {activeParamMeta.label}
            </h2>
            <span className="text-xs text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30 font-medium">
              Smooth Spline Curves (No Jitter)
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {selectedIds.length} wells overlaid across {depthMin}m – {depthMax}m depth
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-2">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Calculating multi-well depth alignment…</p>
          </div>
        ) : orientation === 'horizontal' ? (
          /* STANDARD HORIZONTAL VIEW: Depth on X-axis (0 -> 4500m), Parameter on Y-axis */
          <div className="w-full">
            <ResponsiveContainer width="100%" height={460}>
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2f6b" vertical={false} />
                <XAxis
                  dataKey="depth"
                  type="number"
                  domain={[depthMin, depthMax]}
                  tickFormatter={(v) => `${v}m`}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  label={{ value: 'Bit Depth (meters True Vertical Depth)', position: 'insideBottom', offset: -15, fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  domain={activeParamMeta.domain}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  label={{ value: `${activeParamMeta.label}`, angle: -90, position: 'insideLeft', offset: -5, fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip content={<CorrelationTooltip paramUnit={activeParamMeta.unit} orientation="horizontal" />} />
                <Legend
                  verticalAlign="top"
                  wrapperStyle={{ fontSize: '12px', color: '#9ca3af', paddingBottom: '12px' }}
                />

                {/* Formation background reference areas */}
                {showFormationBands &&
                  FORMATION_INTERVALS.map((f) => (
                    <ReferenceArea
                      key={f.name}
                      x1={Math.max(depthMin, f.top)}
                      x2={Math.min(depthMax, f.base)}
                      fill={f.color}
                      fillOpacity={0.06}
                    />
                  ))}

                {/* Event reference lines */}
                {showEventLines &&
                  eventBands.map((band, i) => (
                    <ReferenceLine
                      key={`band-${i}`}
                      x={band.depth}
                      stroke={EVENT_TYPE_COLORS[band.eventType] || '#6b7280'}
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      strokeOpacity={0.7}
                    />
                  ))}

                {/* Well parameter curves - smooth monotone spline without zigzag */}
                {selectedIds.map((id, idx) => (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={id}
                    stroke={WELL_LINE_COLORS[idx % WELL_LINE_COLORS.length]}
                    strokeWidth={2.8}
                    dot={false}
                    activeDot={{ r: 5 }}
                    name={wellDataMap[id]?.well.name ?? id}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* VERTICAL WELL LOG VIEW: Depth descending down Y-axis (0m at Top to 4500m at Bottom) */
          <div className="w-full">
            <ResponsiveContainer width="100%" height={520}>
              <LineChart
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2f6b" horizontal={false} />
                <XAxis
                  type="number"
                  domain={activeParamMeta.domain}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  label={{ value: `${activeParamMeta.label}`, position: 'insideBottom', offset: -10, fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis
                  dataKey="depth"
                  type="number"
                  domain={[depthMin, depthMax]}
                  reversed={true}
                  tickFormatter={(v) => `${v}m`}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  width={60}
                  label={{ value: 'Subsurface Depth (m)', angle: -90, position: 'insideLeft', offset: -10, fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip content={<CorrelationTooltip paramUnit={activeParamMeta.unit} orientation="vertical" />} />
                <Legend
                  verticalAlign="top"
                  wrapperStyle={{ fontSize: '12px', color: '#9ca3af', paddingBottom: '12px' }}
                />

                {/* Formation background reference areas in vertical orientation */}
                {showFormationBands &&
                  FORMATION_INTERVALS.map((f) => (
                    <ReferenceArea
                      key={f.name}
                      y1={Math.max(depthMin, f.top)}
                      y2={Math.min(depthMax, f.base)}
                      fill={f.color}
                      fillOpacity={0.06}
                    />
                  ))}

                {/* Event hazard reference lines */}
                {showEventLines &&
                  eventBands.map((band, i) => (
                    <ReferenceLine
                      key={`band-${i}`}
                      y={band.depth}
                      stroke={EVENT_TYPE_COLORS[band.eventType] || '#6b7280'}
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      strokeOpacity={0.7}
                    />
                  ))}

                {/* Well lines */}
                {selectedIds.map((id, idx) => (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={id}
                    stroke={WELL_LINE_COLORS[idx % WELL_LINE_COLORS.length]}
                    strokeWidth={2.8}
                    dot={false}
                    activeDot={{ r: 5 }}
                    name={wellDataMap[id]?.well.name ?? id}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Hazard event legend strip */}
        {eventBands.length > 0 && (
          <div className="pt-3 border-t border-navy-700/60 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-gray-400 font-semibold">Incident Flags ({eventBands.length}):</span>
              {[...new Set(eventBands.map((b) => b.eventType))].map((et) => (
                <div key={et} className="flex items-center gap-1.5">
                  <div className="w-3.5 h-0.5 border-t border-dashed" style={{ borderColor: EVENT_TYPE_COLORS[et] }} />
                  <span className="text-gray-300">{et}</span>
                </div>
              ))}
            </div>
            <span className="text-gray-500 text-[11px]">
              Dashed indicators align with historical well events in the depth window
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
