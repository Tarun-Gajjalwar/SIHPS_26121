import React, { useEffect, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Circle,
  Polyline,
  Tooltip,
  ScaleControl,
  useMap,
} from 'react-leaflet';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Info,
  Layers,
  Sliders,
  Search,
  Crosshair,
  GitMerge,
  Navigation,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Compass,
  Target,
  RotateCcw,
  Activity,
  AlertTriangle,
  FileText,
  Gauge,
  X,
  Radio,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { fetchNearbyWells, fetchActiveWell } from '../api';
import type { Well, ActiveWell } from '../types';
import {
  ACTIVE_WELL_LAT,
  ACTIVE_WELL_LNG,
  MAP_CENTER,
  MAP_ZOOM,
  RISK_MARKER_COLORS,
  formatDepth,
  getSeverityClass,
  EVENT_TYPE_ICONS,
} from '../utils/constants';

export interface FocalWell {
  id: string;
  name: string;
  lat: number;
  lng: number;
  state: string;
  district?: string;
  isActiveRig: boolean;
}

const DEFAULT_FOCAL_WELL: FocalWell = {
  id: 'DLJ-NEW-01',
  name: 'Active Rig (DLJ-NEW-01)',
  lat: ACTIVE_WELL_LAT,
  lng: ACTIVE_WELL_LNG,
  state: 'Assam',
  district: 'Dibrugarh',
  isActiveRig: true,
};

function haversineDist(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// Helper component to control map camera programmatically
function MapController({
  center,
  zoom,
}: {
  center: [number, number] | null;
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 13, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Initial auto-bounds fitter
function MapFitBounds({
  wells,
  hasInitialized,
  setHasInitialized,
}: {
  wells: Well[];
  hasInitialized: boolean;
  setHasInitialized: (val: boolean) => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (wells.length > 0 && !hasInitialized) {
      const latLngs = wells.map((w) => [w.lat, w.lng] as [number, number]);
      latLngs.push([ACTIVE_WELL_LAT, ACTIVE_WELL_LNG]);
      map.fitBounds(latLngs, { padding: [50, 50] });
      setHasInitialized(true);
    }
  }, [wells, map, hasInitialized, setHasInitialized]);
  return null;
}

const TILE_LAYERS = [
  {
    id: 'dark',
    label: 'Dark Geological (ArcGIS)',
    desc: 'High contrast dark theme',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  },
  {
    id: 'satellite',
    label: 'Satellite Imagery (ArcGIS)',
    desc: 'High-res satellite terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS',
  },
  {
    id: 'osm',
    label: 'OpenStreetMap Standard',
    desc: 'Roads, towns & rivers',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    id: 'topo',
    label: 'Topographic Contours (ArcGIS)',
    desc: 'Elevation & contours',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom',
  },
];

const STATE_CONFIG: Record<string, { badge: string; text: string; dot: string; bg: string; icon: string }> = {
  Assam: {
    badge: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    text: 'text-emerald-400',
    dot: '#10b981',
    bg: 'bg-emerald-500/10',
    icon: '🏛️',
  },
  'Arunachal Pradesh': {
    badge: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
    text: 'text-cyan-400',
    dot: '#06b6d4',
    bg: 'bg-cyan-500/10',
    icon: '🏔️',
  },
  Nagaland: {
    badge: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
    text: 'text-purple-400',
    dot: '#a855f7',
    bg: 'bg-purple-500/10',
    icon: '🌿',
  },
  Tripura: {
    badge: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    text: 'text-amber-400',
    dot: '#f59e0b',
    bg: 'bg-amber-500/10',
    icon: '🛢️',
  },
  Mizoram: {
    badge: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
    text: 'text-rose-400',
    dot: '#f43f5e',
    bg: 'bg-rose-500/10',
    icon: '🌄',
  },
  Manipur: {
    badge: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300',
    text: 'text-indigo-400',
    dot: '#6366f1',
    bg: 'bg-indigo-500/10',
    icon: '🎋',
  },
  Meghalaya: {
    badge: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
    text: 'text-sky-400',
    dot: '#38bdf8',
    bg: 'bg-sky-500/10',
    icon: '☁️',
  },
};

export default function MapView() {
  const [focalWell, setFocalWell] = useState<FocalWell>(DEFAULT_FOCAL_WELL);
  const [radius, setRadius] = useState(60);
  const [wells, setWells] = useState<Well[]>([]);
  const [allWells, setAllWells] = useState<Well[]>([]);
  const [activeWell, setActiveWell] = useState<ActiveWell | null>(null);
  const [selectedTile, setSelectedTile] = useState(0);
  const [showRadius, setShowRadius] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showTooltips, setShowTooltips] = useState(true);
  const [activeRigSelected, setActiveRigSelected] = useState(false);
  const [showRigDrawer, setShowRigDrawer] = useState(false);
  const [showSonar, setShowSonar] = useState(true);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [stateFilter, setStateFilter] = useState<'all' | 'Assam' | 'Arunachal Pradesh' | 'Nagaland' | 'Tripura' | 'Mizoram' | 'Manipur' | 'Meghalaya'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusTarget, setFocusTarget] = useState<[number, number] | null>(null);
  const [focusZoom, setFocusZoom] = useState<number>(10);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectActiveRigAndOpenOptions = () => {
    setActiveRigSelected(true);
    setShowRigDrawer(true);
    setFocusTarget([ACTIVE_WELL_LAT, ACTIVE_WELL_LNG]);
    setFocusZoom(12);
  };

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${ACTIVE_WELL_LAT}, ${ACTIVE_WELL_LNG}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const loadWells = useCallback(async (lat: number, lng: number, r: number) => {
    const data = await fetchNearbyWells(lat, lng, r);
    setWells(data);
  }, []);

  useEffect(() => {
    Promise.all([
      fetchActiveWell(),
      fetchNearbyWells(focalWell.lat, focalWell.lng, 1000), // all wells in regional NER basin
    ]).then(([aw, all]) => {
      setActiveWell(aw);
      setAllWells(all);
      setLoading(false);
    });
    loadWells(focalWell.lat, focalWell.lng, radius);
  }, [loadWells, focalWell.lat, focalWell.lng, radius]);

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const r = Number(e.target.value);
    setRadius(r);
    loadWells(focalWell.lat, focalWell.lng, r);
  };

  const setRadiusPreset = (r: number) => {
    setRadius(r);
    loadWells(focalWell.lat, focalWell.lng, r);
  };

  const selectFocalWell = (well: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    state?: string;
    district?: string;
  }) => {
    const isRig = well.id === 'DLJ-NEW-01';
    const nextFocal: FocalWell = {
      id: well.id,
      name: isRig ? 'Active Rig (DLJ-NEW-01)' : well.name,
      lat: well.lat,
      lng: well.lng,
      state: well.state || 'Assam',
      district: well.district,
      isActiveRig: isRig,
    };
    setFocalWell(nextFocal);
    loadWells(well.lat, well.lng, radius);
    setFocusTarget([well.lat, well.lng]);
    setFocusZoom(11);
  };

  const resetToActiveRig = () => {
    setFocalWell(DEFAULT_FOCAL_WELL);
    loadWells(ACTIVE_WELL_LAT, ACTIVE_WELL_LNG, radius);
    setFocusTarget([ACTIVE_WELL_LAT, ACTIVE_WELL_LNG]);
    setFocusZoom(11);
    setStateFilter('all');
    setActiveRigSelected(true);
  };

  const flyToWell = (lat: number, lng: number) => {
    setFocusTarget([lat, lng]);
    setFocusZoom(14);
  };

  // State-wise quick focus navigation across all 7 NER States
  const focusStateCluster = (st: string) => {
    setStateFilter(st as any);
    if (st === 'Arunachal Pradesh') {
      setFocusTarget([27.46, 95.72]); // Changlang/Tirap foothills
      setFocusZoom(10);
    } else if (st === 'Nagaland') {
      setFocusTarget([26.90, 95.08]); // Mon/Wokha foothills
      setFocusZoom(10);
    } else if (st === 'Tripura') {
      setFocusTarget([23.78, 91.35]); // Agartala / Baramura fold belt
      setFocusZoom(9);
    } else if (st === 'Mizoram') {
      setFocusTarget([24.26, 92.70]); // Kolasib thrust belt
      setFocusZoom(9);
    } else if (st === 'Manipur') {
      setFocusTarget([24.79, 93.50]); // Jiribam / Imphal basin
      setFocusZoom(9);
    } else if (st === 'Meghalaya') {
      setFocusTarget([25.26, 91.32]); // South Shillong shelf
      setFocusZoom(9);
    } else if (st === 'Assam') {
      setFocusTarget([27.37, 95.32]); // Duliajan/Naharkatiya basin
      setFocusZoom(11);
    } else {
      setFocusTarget([25.80, 93.60]); // Center on entire North East India region
      setFocusZoom(7);
    }
  };

  const tile = TILE_LAYERS[selectedTile];

  // Count wells by state in current selected radius across all 7 NER states
  const stateCounts: Record<string, number> = {
    Assam: wells.filter((w) => (w.state || 'Assam') === 'Assam').length,
    'Arunachal Pradesh': wells.filter((w) => w.state === 'Arunachal Pradesh').length,
    Nagaland: wells.filter((w) => w.state === 'Nagaland').length,
    Tripura: wells.filter((w) => w.state === 'Tripura').length,
    Mizoram: wells.filter((w) => w.state === 'Mizoram').length,
    Manipur: wells.filter((w) => w.state === 'Manipur').length,
    Meghalaya: wells.filter((w) => w.state === 'Meghalaya').length,
  };

  // Filter nearby wells list based on search, state, and risk filters
  const filteredWells = wells.filter((w) => {
    const wellState = w.state || 'Assam';
    if (stateFilter !== 'all' && wellState !== stateFilter) return false;

    const matchSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wellState.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.district && w.district.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;
    if (riskFilter === 'high') return w.riskLevel === 'high' || w.riskLevel === 'critical';
    if (riskFilter === 'medium') return w.riskLevel === 'medium';
    if (riskFilter === 'low') return w.riskLevel === 'low';
    return true;
  });

  // Active rig distance from focal well
  const rigDistFromFocal = haversineDist(focalWell.lat, focalWell.lng, ACTIVE_WELL_LAT, ACTIVE_WELL_LNG);

  // Wells that get vector lines (exclude the focal well itself)
  const vectorWells = (
    stateFilter === 'all'
      ? wells
      : wells.filter((w) => (w.state || 'Assam') === stateFilter)
  ).filter((w) => w.id !== focalWell.id);

  return (
    <div className="flex h-full overflow-hidden bg-navy-900">
      {/* Left controls panel */}
      {!panelCollapsed && (
        <div className="w-80 flex-shrink-0 bg-navy-800 border-r border-navy-600/50 flex flex-col overflow-y-auto animate-fade-in z-20">
          {/* Header */}
          <div className="p-4 border-b border-navy-600/50 bg-navy-800/80">
            <div className="flex items-center justify-between">
              <h1 className="text-base font-bold text-gray-100 flex items-center gap-2">
                <Sliders size={17} className="text-teal-400" />
                Geospatial Controls
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                  {wells.filter((w) => w.id !== focalWell.id).length} in {radius} km
                </span>
                <button
                  type="button"
                  onClick={() => setPanelCollapsed(true)}
                  className="p-1 text-gray-400 hover:text-white rounded hover:bg-navy-700 transition-colors"
                  title="Collapse side panel"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">North Eastern Region (NER) 7-state basin corridor</p>
          </div>

          {/* FOCAL WELL SELECTOR (Center Point for Radius) */}
          <div className="p-4 border-b border-navy-600/50 bg-navy-800/95">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
                <Target size={14} className={focalWell.isActiveRig ? 'text-teal-400' : 'text-amber-400'} />
                Radius Center Well
              </label>
              {!focalWell.isActiveRig && (
                <button
                  type="button"
                  onClick={resetToActiveRig}
                  className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                  title="Reset center point to Active Rig (DLJ-NEW-01)"
                >
                  <RotateCcw size={10} /> Reset to Rig
                </button>
              )}
            </div>

            {/* Current center well card */}
            <div className={`p-2.5 rounded-xl border mb-2.5 transition-all ${
              focalWell.isActiveRig
                ? 'bg-teal-500/10 border-teal-500/40 shadow-sm'
                : 'bg-amber-500/15 border-amber-500/60 shadow-md'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 ${
                    focalWell.isActiveRig ? 'bg-teal-400 text-navy-950' : 'bg-amber-400 text-navy-950 animate-pulse'
                  }`}>
                    ●
                  </span>
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-100 flex items-center gap-1.5 truncate">
                      <span className="truncate">{focalWell.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase flex-shrink-0 ${
                        focalWell.isActiveRig ? 'bg-teal-500/20 text-teal-300' : 'bg-amber-500/25 text-amber-300'
                      }`}>
                        {focalWell.isActiveRig ? 'Active Rig' : 'Focal Center'}
                      </span>
                    </p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">
                      {focalWell.state} {focalWell.district ? `· ${focalWell.district}` : ''} · ({focalWell.lat.toFixed(3)}°N, {focalWell.lng.toFixed(3)}°E)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick button to select active rig & open options */}
            <button
              type="button"
              onClick={selectActiveRigAndOpenOptions}
              className="w-full mb-2.5 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gradient-to-r from-teal-500/20 via-teal-600/20 to-teal-700/20 hover:from-teal-500/30 hover:to-teal-600/30 border border-teal-500/40 text-teal-300 font-bold text-xs rounded-lg transition-all shadow-sm cursor-pointer hover:scale-[1.01]"
              title="Select Active Rig (DLJ-NEW-01) and open operations & modules drawer"
            >
              <Activity size={12} className="animate-pulse text-teal-400" />
              <span>Select Active Rig & Open Options</span>
              <ChevronRight size={12} className="text-teal-400" />
            </button>

            {/* Quick dropdown to select any well as radius center */}
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">
                Select any well as radius center:
              </label>
              <select
                value={focalWell.id}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'DLJ-NEW-01') {
                    resetToActiveRig();
                  } else {
                    const found = allWells.find((w) => w.id === val);
                    if (found) selectFocalWell(found);
                  }
                }}
                className="select-dark w-full text-xs py-1.5 font-medium"
              >
                <option value="DLJ-NEW-01">🎯 Active Rig: DLJ-NEW-01 (Duliajan, Assam)</option>
                <optgroup label="── Offset Wells Across 7 NER States ──">
                  {allWells.map((w) => (
                    <option key={w.id} value={w.id}>
                      [{w.state || 'Assam'}] {w.name} ({w.id}) — {w.district ?? ''} · TD {w.totalDepth}m
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Radius Slider & Quick Presets */}
          <div className="p-4 border-b border-navy-600/50">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Correlation Radius
              </label>
              <span className="text-teal-400 font-bold text-sm bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
                {radius} km
              </span>
            </div>

            {/* Quick preset buttons for NER */}
            <div className="grid grid-cols-5 gap-1 mb-2.5">
              {[25, 60, 150, 350, 600].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRadiusPreset(preset)}
                  className={`py-1 text-xs font-semibold rounded transition-all ${
                    radius === preset
                      ? 'bg-teal-500 text-navy-900 shadow font-bold'
                      : 'bg-navy-700/80 text-gray-300 hover:bg-navy-600 border border-navy-600/60'
                  }`}
                  title={
                    preset === 25
                      ? 'Upper Assam local field'
                      : preset === 60
                      ? 'Tri-state (Assam, Arunachal, Nagaland)'
                      : preset === 150
                      ? 'Naga Thrust & Sub-Himalayan belt'
                      : preset === 350
                      ? 'Central NER Corridor'
                      : 'Full North Eastern Region (7 States)'
                  }
                >
                  {preset >= 600 ? 'All NER' : `${preset}k`}
                </button>
              ))}
            </div>

            <input
              type="range"
              min={10}
              max={650}
              step={10}
              value={radius}
              onChange={handleRadiusChange}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-500 mt-1">
              <span>10 km (Local Pad)</span>
              <span>650 km (All 7 NER States)</span>
            </div>

            {/* Layer toggles */}
            <div className="mt-3 space-y-1.5 pt-2 border-t border-navy-700/60">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-teal-300 transition-colors">
                <input
                  type="checkbox"
                  checked={showRadius}
                  onChange={(e) => setShowRadius(e.target.checked)}
                  className="w-3.5 h-3.5 accent-teal-500 rounded"
                />
                <span>Radius boundary ring ({radius} km)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-teal-300 transition-colors">
                <input
                  type="checkbox"
                  checked={showVectors}
                  onChange={(e) => setShowVectors(e.target.checked)}
                  className="w-3.5 h-3.5 accent-teal-500 rounded"
                />
                <span>Proximity vectors to active rig ({vectorWells.length})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-teal-300 transition-colors">
                <input
                  type="checkbox"
                  checked={showTooltips}
                  onChange={(e) => setShowTooltips(e.target.checked)}
                  className="w-3.5 h-3.5 accent-teal-500 rounded"
                />
                <span>Hover tooltips on markers</span>
              </label>
            </div>
          </div>

          {/* STATE CORRIDOR FILTER (STATE-WISE ACCESS) */}
          <div className="p-4 border-b border-navy-600/50 bg-navy-800/40">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin size={14} className="text-teal-400" />
                NER State-Wise Access ({radius} km)
              </p>
              {stateFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => focusStateCluster('all')}
                  className="text-[10px] text-teal-400 hover:underline"
                >
                  Show All NER
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-2 max-h-[195px] overflow-y-auto pr-0.5">
              {[
                { id: 'all', label: 'All NER States', count: wells.length, icon: '🌐' },
                { id: 'Assam', label: 'Assam', count: stateCounts.Assam, icon: '🏛️' },
                { id: 'Arunachal Pradesh', label: 'Arunachal', count: stateCounts['Arunachal Pradesh'], icon: '🏔️' },
                { id: 'Nagaland', label: 'Nagaland', count: stateCounts.Nagaland, icon: '🌿' },
                { id: 'Tripura', label: 'Tripura', count: stateCounts.Tripura, icon: '🛢️' },
                { id: 'Mizoram', label: 'Mizoram', count: stateCounts.Mizoram, icon: '🌄' },
                { id: 'Manipur', label: 'Manipur', count: stateCounts.Manipur, icon: '🎋' },
                { id: 'Meghalaya', label: 'Meghalaya', count: stateCounts.Meghalaya, icon: '☁️' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => focusStateCluster(st.id)}
                  className={`px-2 py-1.5 rounded-lg text-left transition-all border ${
                    stateFilter === st.id
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 font-bold shadow-sm'
                      : 'bg-navy-900/60 text-gray-400 hover:text-white border-navy-700/80 hover:bg-navy-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs flex items-center gap-1 truncate">
                      <span>{st.icon}</span> {st.label}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      st.count > 0 ? 'bg-navy-800 text-teal-400' : 'text-gray-600'
                    }`}>
                      {st.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="text-[11px] text-gray-400 leading-relaxed bg-navy-900/60 p-2 rounded border border-navy-700">
              {stateFilter === 'all' ? (
                <span>
                  Found <strong className="text-teal-300">{wells.length} wells</strong> in selected {radius} km radius across North Eastern Region basins.
                </span>
              ) : (
                <span>
                  Viewing <strong className="text-white">{filteredWells.length} wells</strong> in{' '}
                  <strong className="text-teal-300">{stateFilter}</strong> within {radius} km radius.
                </span>
              )}
            </div>
          </div>

          {/* Base map selector */}
          <div className="p-4 border-b border-navy-600/50">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Layers size={13} />
              Basemap Layer
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {TILE_LAYERS.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTile(i)}
                  className={`text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedTile === i
                      ? 'bg-teal-600/20 text-teal-400 border border-teal-500/50 shadow-sm'
                      : 'bg-navy-700/50 text-gray-400 hover:bg-navy-700 border border-navy-700'
                  }`}
                >
                  <div className="font-semibold truncate">{t.label.split(' ')[0]}</div>
                  <div className="text-[10px] text-gray-500 truncate mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Risk Legend */}
          <div className="p-4 border-b border-navy-600/50">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Info size={13} />
              Subsurface Risk Legend
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { color: '#ef4444', label: 'Critical Risk', count: filteredWells.filter((w) => w.riskLevel === 'critical').length },
                { color: '#f97316', label: 'High Risk', count: filteredWells.filter((w) => w.riskLevel === 'high').length },
                { color: '#f59e0b', label: 'Medium Risk', count: filteredWells.filter((w) => w.riskLevel === 'medium').length },
                { color: '#22c55e', label: 'Low Risk', count: filteredWells.filter((w) => w.riskLevel === 'low').length },
              ].map(({ color, label, count }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-gray-300 flex-1 truncate">{label}</span>
                  <span className="text-[11px] font-mono text-gray-500">({count})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby well list with search */}
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Wells In Range ({filteredWells.length})
              </p>
              <span className="text-[11px] text-teal-400">Click to focus</span>
            </div>

            {/* Search box */}
            <div className="flex items-center gap-2 bg-navy-900 border border-navy-700 rounded-lg px-2.5 py-1.5 mb-2">
              <Search size={13} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search well name, state, district…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-gray-100 placeholder-gray-500 outline-none w-full"
              />
            </div>

            {/* Risk Filter pills */}
            <div className="flex items-center gap-1 mb-2">
              {(['all', 'high', 'medium', 'low'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setRiskFilter(lvl)}
                  className={`flex-1 py-0.5 text-[10px] uppercase font-bold rounded transition-colors ${
                    riskFilter === lvl
                      ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
                      : 'bg-navy-900/60 text-gray-500 hover:text-gray-300 border border-navy-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Scrollable wells */}
            <div className="space-y-1.5 overflow-y-auto flex-1 max-h-60 pr-1">
              {filteredWells.map((well) => {
                const wellState = well.state || 'Assam';
                const stateStyle = STATE_CONFIG[wellState] || STATE_CONFIG.Assam;
                return (
                  <button
                    key={well.id}
                    type="button"
                    onClick={() => flyToWell(well.lat, well.lng)}
                    className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-lg hover:bg-navy-700/80 bg-navy-900/50 border text-left transition-colors group ${
                      focalWell.id === well.id
                        ? 'border-amber-500/70 bg-amber-500/10 shadow-sm'
                        : 'border-navy-700/60'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: RISK_MARKER_COLORS[well.riskLevel] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-200 group-hover:text-teal-300 truncate">
                          {well.name}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-mono text-teal-400 bg-teal-500/10 px-1 rounded">
                            {well.distanceKm} km
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectFocalWell(well);
                            }}
                            title={focalWell.id === well.id ? 'Current radius center point' : 'Center radius on this well'}
                            className={`p-1 rounded text-[10px] transition-all cursor-pointer ${
                              focalWell.id === well.id
                                ? 'bg-amber-500 text-navy-950 font-bold'
                                : 'text-gray-400 hover:text-amber-300 hover:bg-navy-800'
                            }`}
                          >
                            <Crosshair size={11} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[9px] font-bold px-1 rounded ${stateStyle.badge}`}>
                          {stateStyle.icon} {wellState}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate">
                          {well.district ?? 'Upper Assam'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {EVENT_TYPE_ICONS[well.worstEvent]} {well.worstEvent}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Map Area */}
      <div className="flex-1 relative">
        {/* Floating button to reopen controls panel if collapsed */}
        {panelCollapsed && (
          <button
            type="button"
            onClick={() => setPanelCollapsed(false)}
            className="absolute top-4 left-4 z-[400] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy-800/90 backdrop-blur-md border border-navy-600/80 text-teal-300 font-bold text-xs shadow-2xl hover:bg-navy-700 transition-all hover:scale-105 cursor-pointer"
          >
            <Sliders size={14} className="text-teal-400" />
            <span>Show Map Controls & Wells ({wells.length})</span>
          </button>
        )}

        {loading && (
          <div className="absolute inset-0 bg-navy-900/80 flex items-center justify-center z-[999]">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Loading geospatial telemetry…</p>
            </div>
          </div>
        )}

        {/* Floating Active Rig Quick-Select & Options Pill */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] pointer-events-auto">
          <button
            type="button"
            onClick={selectActiveRigAndOpenOptions}
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl backdrop-blur-md border shadow-2xl transition-all cursor-pointer hover:scale-105 ${
              activeRigSelected || showRigDrawer
                ? 'bg-navy-800/95 border-teal-400 text-teal-300 ring-2 ring-teal-400/40 shadow-teal-500/20'
                : 'bg-navy-800/90 border-navy-600/80 text-gray-200 hover:border-teal-500/60'
            }`}
            title="Click to select Active Rig and open all operations & options"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500" />
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-teal-400">ACTIVE RIG:</span>
              <span className="text-white">{activeWell?.name ?? 'DLJ-NEW-01'}</span>
              <span className="text-gray-400 font-normal">· {formatDepth(activeWell?.currentDepth ?? 2100)}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
              ⚡ Options & Actions <ChevronRight size={10} />
            </span>
          </button>
        </div>

        {/* Floating Quick Action & State Breakdown Overlay */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col items-end gap-2 pointer-events-auto">
          {/* Map summary card with live state breakdown */}
          <div className="bg-navy-800/95 backdrop-blur-md border border-navy-600/70 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[230px]">
            <div className="flex items-center justify-between border-b border-navy-700 pb-1.5 mb-1">
              <span className="text-teal-400 font-bold flex items-center gap-1.5 truncate">
                <Navigation size={13} /> {focalWell.isActiveRig ? 'Rig Proximity' : 'Offset Proximity'}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                focalWell.isActiveRig ? 'bg-navy-900 text-gray-300' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {focalWell.id}
              </span>
            </div>

            <div className="flex justify-between text-gray-400">
              <span>Center Point:</span>
              <span className="text-gray-100 font-semibold truncate max-w-[125px]" title={focalWell.name}>
                {focalWell.name}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Correlation Radius:</span>
              <span className="text-teal-400 font-bold">{radius} km</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Wells in Radius:</span>
              <span className="text-gray-100 font-bold">
                {vectorWells.length} / {allWells.filter((w) => w.id !== focalWell.id).length}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>High/Critical Hazards:</span>
              <span className="text-orange-400 font-bold">
                {vectorWells.filter((w) => w.riskLevel === 'high' || w.riskLevel === 'critical').length}
              </span>
            </div>

            {/* State-wise breakdown in selected radius */}
            <div className="pt-2 border-t border-navy-700/80 space-y-1">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                NER State Breakdown ({radius} km):
              </span>
              <div className="space-y-1 max-h-[160px] overflow-y-auto pr-0.5">
                {[
                  { state: 'Assam', count: stateCounts.Assam, config: STATE_CONFIG.Assam },
                  { state: 'Arunachal Pradesh', count: stateCounts['Arunachal Pradesh'], config: STATE_CONFIG['Arunachal Pradesh'] },
                  { state: 'Nagaland', count: stateCounts.Nagaland, config: STATE_CONFIG.Nagaland },
                  { state: 'Tripura', count: stateCounts.Tripura, config: STATE_CONFIG.Tripura },
                  { state: 'Mizoram', count: stateCounts.Mizoram, config: STATE_CONFIG.Mizoram },
                  { state: 'Manipur', count: stateCounts.Manipur, config: STATE_CONFIG.Manipur },
                  { state: 'Meghalaya', count: stateCounts.Meghalaya, config: STATE_CONFIG.Meghalaya },
                ].map((s) => (
                  <button
                    key={s.state}
                    type="button"
                    onClick={() => focusStateCluster(s.state)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded transition-colors text-[11px] ${
                      stateFilter === s.state
                        ? 'bg-teal-500/20 font-bold text-white border border-teal-500/50 shadow-sm'
                        : 'hover:bg-navy-700/70 text-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{s.config.icon}</span>
                      <span>{s.state}</span>
                    </span>
                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${s.config.badge}`}>
                      {s.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Focus Buttons */}
          <div className="flex items-center gap-1.5">
            {!focalWell.isActiveRig && (
              <button
                type="button"
                onClick={resetToActiveRig}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-navy-950 font-bold text-xs shadow-lg hover:bg-amber-400 transition-all cursor-pointer hover:scale-105"
                title="Reset radius center point back to Active Rig (DLJ-NEW-01)"
              >
                <RotateCcw size={12} />
                Reset Center to Rig
              </button>
            )}
            <button
              type="button"
              onClick={resetToActiveRig}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 text-navy-950 font-bold text-xs shadow-lg hover:bg-teal-400 transition-all cursor-pointer hover:scale-105"
              title="Recenter camera on active drilling well DLJ-NEW-01"
            >
              <Crosshair size={13} />
              Focus Active Rig
            </button>
          </div>
        </div>

        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer key={tile.id} url={tile.url} attribution={tile.attribution} />
          <ScaleControl position="bottomright" />

          {/* Radius boundary ring around selected focal well */}
          {showRadius && (
            <Circle
              center={[focalWell.lat, focalWell.lng]}
              radius={radius * 1000}
              pathOptions={{
                color: focalWell.isActiveRig ? '#758BFD' : '#FF8600',
                fillColor: focalWell.isActiveRig ? '#758BFD' : '#FF8600',
                fillOpacity: 0.08,
                weight: 2.5,
                dashArray: '8 6',
              }}
            />
          )}

          {/* Proximity Vectors to offset wells from selected focal well */}
          {showVectors &&
            vectorWells.map((well) => {
              const wellState = well.state || 'Assam';
              const stateVectorColor =
                wellState === 'Arunachal Pradesh'
                  ? '#06b6d4'
                  : wellState === 'Nagaland'
                  ? '#a855f7'
                  : wellState === 'Tripura'
                  ? '#f59e0b'
                  : wellState === 'Mizoram'
                  ? '#f43f5e'
                  : wellState === 'Manipur'
                  ? '#6366f1'
                  : wellState === 'Meghalaya'
                  ? '#38bdf8'
                  : well.riskLevel === 'critical' || well.riskLevel === 'high'
                  ? '#f97316'
                  : '#14b8a6';

              return (
                <Polyline
                  key={`vector-${well.id}`}
                  positions={[
                    [focalWell.lat, focalWell.lng],
                    [well.lat, well.lng],
                  ]}
                  pathOptions={{
                    color: stateVectorColor,
                    weight: stateFilter !== 'all' ? 2.2 : 1.2,
                    dashArray: '4 4',
                    opacity: stateFilter !== 'all' ? 0.8 : 0.5,
                  }}
                />
              );
            })}

          {/* If focal well is an offset well, draw proximity vector to Active Rig (if within radius) */}
          {showVectors && !focalWell.isActiveRig && rigDistFromFocal <= radius && (
            <Polyline
              key="vector-to-rig"
              positions={[
                [focalWell.lat, focalWell.lng],
                [ACTIVE_WELL_LAT, ACTIVE_WELL_LNG],
              ]}
              pathOptions={{
                color: '#5eead4',
                weight: 2.5,
                dashArray: '5 5',
                opacity: 0.9,
              }}
            />
          )}

          {/* Target reticle on selected focal well if it is an offset well */}
          {!focalWell.isActiveRig && (
            <CircleMarker
              center={[focalWell.lat, focalWell.lng]}
              radius={18}
              pathOptions={{
                color: '#FF8600',
                fillColor: '#FF8600',
                fillOpacity: 0.2,
                weight: 3,
                dashArray: '4 4',
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -20]} opacity={0.95}>
                <span className="bg-[#FF8600] text-white font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider shadow flex items-center gap-1 border border-[#F1F2F6]">
                  🎯 FOCAL CENTER: {focalWell.name}
                </span>
              </Tooltip>
            </CircleMarker>
          )}

          {/* All offset wells */}
          {allWells.map((well) => {
            const wellState = well.state || 'Assam';
            const isInside = (well.distanceKm ?? 999) <= radius;
            const matchesState = stateFilter === 'all' || wellState === stateFilter;
            const isHighlighted = isInside && matchesState;
            const color = RISK_MARKER_COLORS[well.riskLevel];
            const stateStyle = STATE_CONFIG[wellState] || STATE_CONFIG.Assam;

            return (
              <CircleMarker
                key={well.id}
                center={[well.lat, well.lng]}
                radius={isHighlighted ? 11 : isInside ? 7 : 5}
                pathOptions={{
                  color: isHighlighted
                    ? stateFilter !== 'all'
                      ? stateStyle.dot
                      : color
                    : '#64748b',
                  fillColor: isHighlighted ? color : '#334155',
                  fillOpacity: isHighlighted ? 0.95 : 0.25,
                  weight: isHighlighted ? 3 : 1,
                }}
              >
                {/* Hover tooltip */}
                {showTooltips && (
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                    <div className="font-semibold text-xs text-gray-100 flex items-center gap-1.5">
                      <span>{EVENT_TYPE_ICONS[well.worstEvent]}</span>
                      <span>{well.name}</span>
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${stateStyle.badge}`}>
                        {wellState}
                      </span>
                      <span className="text-teal-400 font-mono text-[10px]">({well.distanceKm} km)</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      District: <span className="text-gray-200">{well.district ?? 'Upper Assam'}</span> · Risk:{' '}
                      <span className="font-bold uppercase" style={{ color }}>{well.riskLevel}</span> · TD: {formatDepth(well.totalDepth)}
                    </div>
                  </Tooltip>
                )}

                {/* Click popup */}
                <Popup>
                  <div className="min-w-[230px] p-0 font-sans">
                    <div className="p-3 border-b border-navy-600 bg-navy-800/90">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-gray-100 text-sm">{well.name}</p>
                        <span className={getSeverityClass(well.riskLevel)}>{well.riskLevel}</span>
                      </div>
                      <p className="text-xs text-gray-400">{well.id} · {well.wellType} · {well.operator}</p>
                    </div>

                    <div className="p-3 space-y-1.5 bg-navy-900/90 text-xs">
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-400">State / Region</span>
                        <span className={`font-semibold px-2 py-0.5 rounded text-[10px] border ${stateStyle.badge}`}>
                          {stateStyle.icon} {wellState}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">District</span>
                        <span className="text-gray-200 font-medium">{well.district ?? 'Upper Assam'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Depth</span>
                        <span className="text-gray-100 font-semibold">{formatDepth(well.totalDepth)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          {focalWell.id === well.id ? 'Center Reference' : `Distance from ${focalWell.id}`}
                        </span>
                        <span className="text-teal-400 font-bold">{well.distanceKm} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Historical Hazard</span>
                        <span className="text-orange-400 font-semibold flex items-center gap-1">
                          {EVENT_TYPE_ICONS[well.worstEvent]} {well.worstEvent}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Spud Date</span>
                        <span className="text-gray-300">{well.spudDate}</span>
                      </div>
                      <p className="text-xs text-gray-300 mt-2 leading-relaxed border-t border-navy-700/80 pt-2 italic">
                        "{well.remarks}"
                      </p>
                    </div>

                    <div className="p-2.5 bg-navy-800 border-t border-navy-700 flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => selectFocalWell(well)}
                        className={`flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          focalWell.id === well.id
                            ? 'bg-amber-500/25 border-amber-500 text-amber-300 font-extrabold shadow-sm'
                            : 'bg-teal-500/20 hover:bg-teal-500/30 border-teal-500/50 text-teal-300 hover:scale-[1.02]'
                        }`}
                      >
                        <Crosshair size={12} />
                        {focalWell.id === well.id ? '✓ Current Radius Center Point' : '🎯 Center Radius on this Well'}
                      </button>
                      <Link
                        to={`/wells/${well.id}`}
                        className="flex items-center justify-center gap-1.5 w-full py-1 bg-navy-700/80 hover:bg-navy-700 text-gray-200 text-xs font-semibold rounded-lg border border-navy-600 transition-colors"
                      >
                        Inspect DDR & Logs <ExternalLink size={11} />
                      </Link>
                      <Link
                        to="/correlation"
                        className="flex items-center justify-center gap-1.5 w-full py-1 bg-navy-700 hover:bg-navy-600 text-gray-300 text-[11px] rounded border border-navy-600 transition-colors"
                      >
                        <GitMerge size={11} /> Compare in Correlation
                      </Link>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Active well — Distinct multi-ring animated radar marker */}
          <CircleMarker
            center={[ACTIVE_WELL_LAT, ACTIVE_WELL_LNG]}
            radius={activeRigSelected ? 16 : 14}
            eventHandlers={{
              click: () => {
                selectActiveRigAndOpenOptions();
              },
            }}
            pathOptions={{
              color: activeRigSelected ? '#FF8600' : '#758BFD',
              fillColor: '#FF8600',
              fillOpacity: 0.95,
              weight: activeRigSelected ? 4.5 : 3.5,
            }}
          >
            <Tooltip direction="bottom" offset={[0, 12]} permanent opacity={0.95}>
              <span className={`font-bold text-[11px] flex items-center gap-1 ${
                activeRigSelected ? 'text-[#FF8600]' : 'text-[#758BFD]'
              }`}>
                🎯 {activeRigSelected ? 'SELECTED RIG' : 'ACTIVE RIG'}: DLJ-NEW-01
              </span>
            </Tooltip>
            <Popup>
              <div className="min-w-[270px] p-0 font-sans">
                <div className="p-3 border-b border-navy-600 bg-gradient-to-r from-teal-900/60 via-navy-800 to-navy-800">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-ping" />
                    <p className="font-bold text-teal-300 text-sm">
                      {activeWell?.name ?? 'DLJ-NEW-01'}
                    </p>
                    <span className="badge-info ml-auto">DRILLING AHEAD</span>
                  </div>
                  <p className="text-xs text-gray-300">{activeWell?.rig ?? 'OIL RIG-14 (BHEL BH-350)'}</p>
                </div>
                <div className="p-3 space-y-1.5 bg-navy-900/95 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Depth</span>
                    <span className="text-amber-400 font-bold">
                      {formatDepth(activeWell?.currentDepth ?? 2100)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Planned TD</span>
                    <span className="text-gray-200">{formatDepth(activeWell?.plannedTD ?? 4200)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Formation</span>
                    <span className="text-emerald-400 font-semibold">{activeWell?.currentFormation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mud System & Wt</span>
                    <span className="text-blue-400 font-semibold">{activeWell?.mudWeight} SG · {activeWell?.mudType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Telemetry (ROP / WOB)</span>
                    <span className="text-gray-200 font-medium">8.4 m/h · 18.5 klbs</span>
                  </div>
                </div>

                <div className="p-2.5 bg-navy-800 border-t border-navy-700 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={selectActiveRigAndOpenOptions}
                    className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-extrabold rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-navy-950 shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    <Zap size={13} />
                    ⚡ Open Active Rig Action Hub & All Options
                  </button>

                  <div className="grid grid-cols-2 gap-1 mt-0.5">
                    <button
                      type="button"
                      onClick={resetToActiveRig}
                      className={`flex items-center justify-center gap-1 py-1.5 px-1 text-[11px] font-bold rounded border transition-all cursor-pointer ${
                        focalWell.isActiveRig
                          ? 'bg-teal-500/25 border-teal-500 text-teal-300 font-extrabold'
                          : 'bg-navy-700/80 hover:bg-navy-700 border-navy-600 text-gray-200'
                      }`}
                    >
                      <Crosshair size={11} />
                      {focalWell.isActiveRig ? '✓ Radius Center' : '🎯 Set Center'}
                    </button>
                    <Link
                      to="/"
                      className="flex items-center justify-center gap-1 py-1.5 px-1 bg-navy-700/80 hover:bg-navy-700 text-gray-200 text-[11px] font-semibold rounded border border-navy-600 transition-colors"
                    >
                      <Gauge size={11} className="text-teal-400" />
                      Live Dashboard
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <Link
                      to="/wells/DLJ-NEW-01"
                      className="flex items-center justify-center gap-1 py-1.5 px-1 bg-navy-700/80 hover:bg-navy-700 text-gray-200 text-[11px] font-semibold rounded border border-navy-600 transition-colors"
                    >
                      <FileText size={11} className="text-blue-400" />
                      DDR & Logs
                    </Link>
                    <Link
                      to="/correlation"
                      className="flex items-center justify-center gap-1 py-1.5 px-1 bg-navy-700/80 hover:bg-navy-700 text-gray-200 text-[11px] font-semibold rounded border border-navy-600 transition-colors"
                    >
                      <GitMerge size={11} className="text-purple-400" />
                      Correlation
                    </Link>
                  </div>

                  <Link
                    to="/alerts"
                    className="flex items-center justify-center gap-1 py-1 px-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold rounded transition-colors"
                  >
                    <AlertTriangle size={11} />
                    Geohazard Alerts (Kick / Loss / Fault)
                  </Link>
                </div>
              </div>
            </Popup>
          </CircleMarker>

          {/* Active rig selected glowing halo */}
          {activeRigSelected && (
            <Circle
              center={[ACTIVE_WELL_LAT, ACTIVE_WELL_LNG]}
              radius={1400}
              pathOptions={{
                color: '#FF8600',
                fillColor: '#FF8600',
                fillOpacity: 0.15,
                weight: 2.5,
                dashArray: '4 4',
              }}
            />
          )}

          {/* Sonar pulse rings for active well */}
          {showSonar && (
            <>
              <Circle
                center={[ACTIVE_WELL_LAT, ACTIVE_WELL_LNG]}
                radius={800}
                pathOptions={{
                  color: '#758BFD',
                  fillColor: '#758BFD',
                  fillOpacity: 0.12,
                  weight: 1.5,
                }}
              />
              <Circle
                center={[ACTIVE_WELL_LAT, ACTIVE_WELL_LNG]}
                radius={2000}
                pathOptions={{
                  color: '#AEB8FE',
                  fillColor: 'transparent',
                  weight: 1.2,
                  dashArray: '3 6',
                }}
              />
            </>
          )}

          <MapController center={focusTarget} zoom={focusZoom} />
          <MapFitBounds
            wells={allWells}
            hasInitialized={hasInitialized}
            setHasInitialized={setHasInitialized}
          />
        </MapContainer>

        {/* ACTIVE RIG OPERATIONS & INTELLIGENCE DRAWER (Slide-over) */}
        {showRigDrawer && (
          <div className="absolute top-0 right-0 bottom-0 w-[420px] max-w-[92vw] bg-navy-900/98 backdrop-blur-2xl border-l border-teal-500/40 shadow-2xl z-[600] flex flex-col animate-fade-in overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 border-b border-navy-700/80 bg-gradient-to-r from-teal-950/60 via-navy-800 to-navy-800 flex items-start justify-between flex-shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center flex-shrink-0 text-teal-400 mt-0.5">
                  <Activity size={20} className="animate-pulse" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-white truncate">
                      {activeWell?.name ?? 'DLJ-NEW-01'}
                    </h2>
                    <span className="badge-info text-[10px] px-2 py-0.5 font-bold animate-pulse">
                      DRILLING AHEAD
                    </span>
                  </div>
                  <p className="text-xs text-teal-300 font-semibold truncate mt-0.5">
                    {activeWell?.rig ?? 'OIL RIG-14 (BHEL BH-350)'}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    Oil India Limited · Duliajan, Upper Assam
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRigDrawer(false);
                  setActiveRigSelected(false);
                }}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-navy-700 transition-colors flex-shrink-0 cursor-pointer"
                title="Close Drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Quick 1-Click Map Controls */}
              <div className="bg-navy-800/80 border border-navy-700/80 rounded-xl p-3">
                <h3 className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Crosshair size={13} className="text-teal-400" />
                  Map Actions for Active Rig
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={resetToActiveRig}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      focalWell.isActiveRig
                        ? 'bg-teal-500/25 border-teal-500 text-teal-300'
                        : 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/40 text-teal-300'
                    }`}
                  >
                    <Target size={13} />
                    {focalWell.isActiveRig ? '✓ Is Radius Center' : '🎯 Center Radius Here'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFocusTarget([ACTIVE_WELL_LAT, ACTIVE_WELL_LNG]);
                      setFocusZoom(13);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-navy-700/80 hover:bg-navy-700 border border-navy-600 text-gray-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Navigation size={13} className="text-blue-400" />
                    Zoom & Focus Rig
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSonar(!showSonar)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      showSonar
                        ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                        : 'bg-navy-700/50 border-navy-600/60 text-gray-400'
                    }`}
                  >
                    <Radio size={13} />
                    {showSonar ? 'Sonar Waves: ON' : 'Sonar Waves: OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCoords}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-navy-700/80 hover:bg-navy-700 border border-navy-600 text-gray-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    {copiedCoords ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-gray-400" />}
                    {copiedCoords ? 'Copied!' : 'Copy Coords'}
                  </button>
                </div>
              </div>

              {/* Correlation Radius Presets around Rig */}
              <div className="bg-navy-800/80 border border-navy-700/80 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass size={13} className="text-teal-400" />
                    Rig Correlation Radius
                  </h3>
                  <span className="text-teal-400 font-extrabold text-xs bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
                    {radius} km
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {[25, 60, 150, 350, 600].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRadiusPreset(preset)}
                      className={`py-1 text-xs font-semibold rounded transition-all cursor-pointer ${
                        radius === preset
                          ? 'bg-teal-500 text-navy-900 shadow font-bold'
                          : 'bg-navy-700/80 text-gray-300 hover:bg-navy-600 border border-navy-600/60'
                      }`}
                    >
                      {preset >= 600 ? 'All NER' : `${preset}k`}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 flex items-center justify-between">
                  <span>Wells within {radius} km of Rig:</span>
                  <span className="font-bold text-teal-300">{vectorWells.length} offset wells</span>
                </p>
              </div>

              {/* Direct System Module Navigation Options (5 Major System Features) */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" />
                  Available Options & System Modules
                </h3>

                {/* Option 1: Live Drilling Dashboard */}
                <Link
                  to="/"
                  className="group flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-navy-800 to-navy-800/90 hover:from-teal-950/40 hover:to-navy-800 border border-navy-700/80 hover:border-teal-500/50 transition-all shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Gauge size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-100 group-hover:text-teal-300 transition-colors">
                        Real-Time Drilling Dashboard
                      </p>
                      <ArrowRight size={13} className="text-gray-400 group-hover:text-teal-300 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                      Live drilling gauges, ROP trends, WOB, RPM, standpipe pressure & gas monitoring.
                    </p>
                  </div>
                </Link>

                {/* Option 2: DDR & Well Log */}
                <Link
                  to="/wells/DLJ-NEW-01"
                  className="group flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-navy-800 to-navy-800/90 hover:from-blue-950/40 hover:to-navy-800 border border-navy-700/80 hover:border-blue-500/50 transition-all shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-100 group-hover:text-blue-300 transition-colors">
                        Daily Drilling Report (DDR) & Well Logs
                      </p>
                      <ArrowRight size={13} className="text-gray-400 group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                      Shift logs, bit hydraulics, 9⅝" casing record, lithology and Mud logging data.
                    </p>
                  </div>
                </Link>

                {/* Option 3: Correlation Engine */}
                <Link
                  to="/correlation"
                  className="group flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-navy-800 to-navy-800/90 hover:from-purple-950/40 hover:to-navy-800 border border-navy-700/80 hover:border-purple-500/50 transition-all shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <GitMerge size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-100 group-hover:text-purple-300 transition-colors">
                        Multi-Well Stratigraphic Correlation
                      </p>
                      <ArrowRight size={13} className="text-gray-400 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                      Correlate active well formation tops against offset wells across all 7 NER states.
                    </p>
                  </div>
                </Link>

                {/* Option 4: Geohazard & Risk Alerts */}
                <Link
                  to="/alerts"
                  className="group flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-navy-800 to-navy-800/90 hover:from-amber-950/40 hover:to-navy-800 border border-navy-700/80 hover:border-amber-500/50 transition-all shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <ShieldAlert size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-100 group-hover:text-amber-300 transition-colors">
                        Geohazard Proximity & Risk Alerts
                      </p>
                      <ArrowRight size={13} className="text-gray-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                      Imminent gas kick alerts, lost circulation risk zones, and Barail overpressure warnings.
                    </p>
                  </div>
                </Link>

                {/* Option 5: Offset Wells Directory */}
                <Link
                  to="/wells"
                  className="group flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-navy-800 to-navy-800/90 hover:from-emerald-950/40 hover:to-navy-800 border border-navy-700/80 hover:border-emerald-500/50 transition-all shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <MapPin size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-100 group-hover:text-emerald-300 transition-colors">
                        All 33 NER Offset Wells Directory
                      </p>
                      <ArrowRight size={13} className="text-gray-400 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                      Filter by all 7 states (Assam, Arunachal, Nagaland, Tripura, Mizoram, Manipur, Meghalaya).
                    </p>
                  </div>
                </Link>
              </div>

              {/* Drilling Telemetry & Depth Progress Card */}
              <div className="bg-navy-800/80 border border-navy-700/80 rounded-xl p-3 space-y-2.5">
                <h3 className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={13} className="text-teal-400" />
                  Live Telemetry & Trajectory
                </h3>
                
                {/* Depth progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Current Depth:</span>
                    <span className="font-extrabold text-amber-400">
                      {formatDepth(activeWell?.currentDepth ?? 2100)} / {formatDepth(activeWell?.plannedTD ?? 4200)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-navy-950 border border-navy-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (((activeWell?.currentDepth ?? 2100) / (activeWell?.plannedTD ?? 4200)) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                    <span>50.0% Drilled</span>
                    <span>Target: Barail Main Sand</span>
                  </div>
                </div>

                {/* 6-box Telemetry parameter grid */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-2 rounded-lg bg-navy-900/80 border border-navy-700">
                    <span className="text-[9px] text-gray-400 block uppercase">ROP</span>
                    <span className="text-xs font-bold text-emerald-400">{activeWell?.rop ?? 8.4} m/h</span>
                  </div>
                  <div className="p-2 rounded-lg bg-navy-900/80 border border-navy-700">
                    <span className="text-[9px] text-gray-400 block uppercase">WOB</span>
                    <span className="text-xs font-bold text-teal-400">{activeWell?.wob ?? 18.5} klbs</span>
                  </div>
                  <div className="p-2 rounded-lg bg-navy-900/80 border border-navy-700">
                    <span className="text-[9px] text-gray-400 block uppercase">RPM</span>
                    <span className="text-xs font-bold text-blue-400">{activeWell?.rpm ?? 120}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-navy-900/80 border border-navy-700">
                    <span className="text-[9px] text-gray-400 block uppercase">Torque</span>
                    <span className="text-xs font-bold text-purple-400">{activeWell?.torque ?? 12.3} kft-lb</span>
                  </div>
                  <div className="p-2 rounded-lg bg-navy-900/80 border border-navy-700">
                    <span className="text-[9px] text-gray-400 block uppercase">Standpipe</span>
                    <span className="text-xs font-bold text-amber-400">{activeWell?.sppa ?? 2850} psi</span>
                  </div>
                  <div className="p-2 rounded-lg bg-navy-900/80 border border-navy-700">
                    <span className="text-[9px] text-gray-400 block uppercase">Mud Wt</span>
                    <span className="text-xs font-bold text-sky-400">{activeWell?.mudWeight ?? 1.38} SG</span>
                  </div>
                </div>
              </div>

              {/* Closest Offset Wells around Active Rig */}
              <div className="bg-navy-800/80 border border-navy-700/80 rounded-xl p-3">
                <h3 className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-teal-400" />
                    Top Offsets around DLJ-NEW-01
                  </span>
                  <span className="text-[10px] text-gray-400">within {radius} km</span>
                </h3>
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {vectorWells.slice(0, 5).map((w) => (
                    <div
                      key={w.id}
                      className="p-2 rounded-lg bg-navy-900/70 border border-navy-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-gray-200">{w.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {w.distanceKm} km · {w.state || 'Assam'} · {EVENT_TYPE_ICONS[w.worstEvent]} {w.worstEvent}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/wells/${w.id}`}
                          className="px-2 py-1 rounded bg-navy-800 hover:bg-navy-700 text-gray-300 text-[10px] font-semibold border border-navy-600"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => selectFocalWell(w)}
                          className="px-2 py-1 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-[10px] font-semibold border border-teal-500/40 cursor-pointer"
                          title="Center radius on this well"
                        >
                          Center
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
