import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ExternalLink, Search, SortAsc } from 'lucide-react';
import { fetchAllWells } from '../api';
import type { Well } from '../types';
import { RISK_MARKER_COLORS, formatDepth, formatDate, getSeverityClass, EVENT_TYPE_ICONS } from '../utils/constants';

export default function WellList() {
  const [wells, setWells] = useState<Well[]>([]);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'riskLevel' | 'totalDepth'>('name');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllWells().then((data) => {
      setWells(data);
      setLoading(false);
    });
  }, []);

  const filtered = wells
    .filter((w) => {
      const wellState = w.state || 'Assam';
      if (stateFilter !== 'all' && wellState !== stateFilter) return false;

      const matchSearch =
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.id.toLowerCase().includes(search.toLowerCase()) ||
        wellState.toLowerCase().includes(search.toLowerCase()) ||
        (w.district && w.district.toLowerCase().includes(search.toLowerCase())) ||
        w.wellType.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (filterType === 'high-risk') return w.riskLevel === 'high' || w.riskLevel === 'critical';
      if (filterType === 'exploratory') return w.wellType.toLowerCase() === 'exploratory';
      if (filterType === 'development') return w.wellType.toLowerCase() === 'development';
      if (filterType === 'appraisal') return w.wellType.toLowerCase() === 'appraisal';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'riskLevel') {
        const order = { critical: 4, high: 3, medium: 2, low: 1 };
        return (order[b.riskLevel] || 0) - (order[a.riskLevel] || 0);
      }
      if (sortBy === 'totalDepth') return b.totalDepth - a.totalDepth;
      return a.name.localeCompare(b.name);
    });

  const stateCounts: Record<string, number> = {
    Assam: wells.filter((w) => (w.state || 'Assam') === 'Assam').length,
    'Arunachal Pradesh': wells.filter((w) => w.state === 'Arunachal Pradesh').length,
    Nagaland: wells.filter((w) => w.state === 'Nagaland').length,
    Tripura: wells.filter((w) => w.state === 'Tripura').length,
    Mizoram: wells.filter((w) => w.state === 'Mizoram').length,
    Manipur: wells.filter((w) => w.state === 'Manipur').length,
    Meghalaya: wells.filter((w) => w.state === 'Meghalaya').length,
  };

  return (
    <div className="p-6 animate-fade-in space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
            <Activity size={22} className="text-teal-400" />
            Offset Well Profiles
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {wells.length} offset wells recorded across 7 North Eastern Region (NER) Basins
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-navy-700 border border-navy-500 rounded-lg px-3 py-2">
            <Search size={14} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search wells, states, districts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none w-48"
            />
          </div>
          <div className="flex items-center gap-2 bg-navy-700 border border-navy-500 rounded-lg px-3 py-2">
            <SortAsc size={14} className="text-gray-500" />
            <select
              className="bg-transparent text-sm text-gray-300 outline-none cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="name">Name</option>
              <option value="riskLevel">Risk Level</option>
              <option value="totalDepth">Total Depth</option>
            </select>
          </div>
        </div>
      </div>

      {/* State Corridor Filter Tabs for All 7 NER States */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide mr-1">NER State Corridor:</span>
        {[
          { id: 'all', label: `All NER (${wells.length})`, icon: '🌐' },
          { id: 'Assam', label: `Assam (${stateCounts.Assam})`, icon: '🏛️' },
          { id: 'Arunachal Pradesh', label: `Arunachal (${stateCounts['Arunachal Pradesh']})`, icon: '🏔️' },
          { id: 'Nagaland', label: `Nagaland (${stateCounts.Nagaland})`, icon: '🌿' },
          { id: 'Tripura', label: `Tripura (${stateCounts.Tripura})`, icon: '🛢️' },
          { id: 'Mizoram', label: `Mizoram (${stateCounts.Mizoram})`, icon: '🌄' },
          { id: 'Manipur', label: `Manipur (${stateCounts.Manipur})`, icon: '🎋' },
          { id: 'Meghalaya', label: `Meghalaya (${stateCounts.Meghalaya})`, icon: '☁️' },
        ].map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => setStateFilter(st.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              stateFilter === st.id
                ? 'bg-[#758BFD] text-[#0f0933] shadow-md shadow-[#758BFD]/30 font-bold'
                : 'bg-navy-800 text-gray-300 hover:text-white hover:bg-navy-700 border border-navy-700'
            }`}
          >
            <span>{st.icon}</span> {st.label}
          </button>
        ))}
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-navy-700/60">
        {[
          { id: 'all', label: `All Wells (${wells.length})` },
          { id: 'high-risk', label: `⚠️ High Risk (${wells.filter((w) => w.riskLevel === 'high' || w.riskLevel === 'critical').length})` },
          { id: 'exploratory', label: `🎯 Exploratory (${wells.filter((w) => w.wellType.toLowerCase() === 'exploratory').length})` },
          { id: 'development', label: `🏗️ Development (${wells.filter((w) => w.wellType.toLowerCase() === 'development').length})` },
          { id: 'appraisal', label: `📊 Appraisal (${wells.filter((w) => w.wellType.toLowerCase() === 'appraisal').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filterType === tab.id
                ? 'bg-[#758BFD]/20 text-[#AEB8FE] border border-[#758BFD]/50 font-bold shadow'
                : 'bg-navy-800 text-gray-400 hover:text-gray-200 hover:bg-navy-700 border border-navy-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="text-xs text-gray-500 ml-auto">
          Showing {filtered.length} of {wells.length} wells
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((well) => {
            const wellState = well.state || 'Assam';
            const stateStyle =
              wellState === 'Arunachal Pradesh'
                ? 'bg-[#AEB8FE]/15 border-[#AEB8FE]/40 text-[#AEB8FE]'
                : wellState === 'Nagaland'
                ? 'bg-[#FF8600]/15 border-[#FF8600]/40 text-[#FF8600]'
                : 'bg-[#758BFD]/15 border-[#758BFD]/40 text-[#758BFD]';

            return (
              <Link
                key={well.id}
                to={`/wells/${well.id}`}
                className="glass-card p-4 hover:border-teal-500/40 hover:scale-[1.01] transition-all duration-200 group block"
              >
                <div className="flex items-start gap-3 mb-2.5">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: RISK_MARKER_COLORS[well.riskLevel] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-100 group-hover:text-teal-400 transition-colors truncate">
                      {well.name}
                    </p>
                    <p className="text-xs text-gray-500">{well.id}</p>
                  </div>
                  <span className={getSeverityClass(well.riskLevel)}>{well.riskLevel}</span>
                </div>

                {/* State & District Tag */}
                <div className="mb-2.5 flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stateStyle}`}>
                    {wellState}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {well.district ?? 'Upper Assam'} District
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
                  <div>
                    <span className="text-gray-500">Type: </span>
                    <span className="text-gray-300">{well.wellType}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">TD: </span>
                    <span className="text-gray-300">{formatDepth(well.totalDepth)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Spud: </span>
                    <span className="text-gray-300">{formatDate(well.spudDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status: </span>
                    <span className="text-green-400">{well.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-navy-600/50">
                  <span className="text-xs text-gray-500">Worst event:</span>
                  <span className="text-xs text-gray-300">
                    {EVENT_TYPE_ICONS[well.worstEvent]} {well.worstEvent}
                  </span>
                  <ExternalLink size={12} className="text-gray-600 group-hover:text-teal-400 ml-auto transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
