import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Sparkles, ExternalLink, BookOpen, X } from 'lucide-react';
import { fetchSnippets, fetchSnippetsMeta } from '../api';
import type { KnowledgeSnippet } from '../types';
import { EVENT_TYPE_ICONS, EVENT_TYPE_COLORS, FORMATION_COLORS, getSeverityClass } from '../utils/constants';

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-teal-500/30 text-teal-300 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function KnowledgeSearch() {
  const [query, setQuery] = useState('');
  const [formation, setFormation] = useState('all');
  const [eventType, setEventType] = useState('all');
  const [wellId, setWellId] = useState('all');
  const [minDepth, setMinDepth] = useState('');
  const [maxDepth, setMaxDepth] = useState('');
  const [results, setResults] = useState<KnowledgeSnippet[]>([]);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<{ formations: string[]; eventTypes: string[]; wellIds: string[] }>({
    formations: [],
    eventTypes: [],
    wellIds: [],
  });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchSnippetsMeta().then(setMeta);
    doSearch('', 'all', 'all', 'all', '', '');
  }, []);

  const doSearch = useCallback(
    async (q: string, form: string, et: string, wid: string, mn: string, mx: string) => {
      setLoading(true);
      try {
        const data = await fetchSnippets({
          q: q || undefined,
          formation: form !== 'all' ? form : undefined,
          eventType: et !== 'all' ? et : undefined,
          wellId: wid !== 'all' ? wid : undefined,
          minDepth: mn ? Number(mn) : undefined,
          maxDepth: mx ? Number(mx) : undefined,
        });
        setResults(data.results);
        setTotal(data.total);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSearch = () => doSearch(query, formation, eventType, wellId, minDepth, maxDepth);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearFilters = () => {
    setQuery('');
    setFormation('all');
    setEventType('all');
    setWellId('all');
    setMinDepth('');
    setMaxDepth('');
    doSearch('', 'all', 'all', 'all', '', '');
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Filter sidebar */}
      <div className="w-64 flex-shrink-0 bg-navy-800 border-r border-navy-600/50 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-navy-600/50">
          <h2 className="section-title">
            <Filter size={16} className="text-teal-400" />
            Filters
          </h2>
          <button
            onClick={clearFilters}
            className="mt-2 text-xs text-gray-500 hover:text-teal-400 flex items-center gap-1 transition-colors"
          >
            <X size={11} /> Clear all
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Formation */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Formation</label>
            <select
              className="select-dark w-full"
              value={formation}
              onChange={(e) => setFormation(e.target.value)}
            >
              <option value="all">All Formations</option>
              {meta.formations.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Event Type</label>
            <select
              className="select-dark w-full"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="all">All Events</option>
              {meta.eventTypes.map((et) => (
                <option key={et} value={et}>
                  {EVENT_TYPE_ICONS[et]} {et}
                </option>
              ))}
            </select>
          </div>

          {/* Well */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Well</label>
            <select
              className="select-dark w-full"
              value={wellId}
              onChange={(e) => setWellId(e.target.value)}
            >
              <option value="all">All Wells</option>
              {meta.wellIds.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Depth Range */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Depth Range (m)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minDepth}
                onChange={(e) => setMinDepth(e.target.value)}
                className="input-dark w-full"
              />
              <span className="text-gray-500 text-xs">–</span>
              <input
                type="number"
                placeholder="Max"
                value={maxDepth}
                onChange={(e) => setMaxDepth(e.target.value)}
                className="input-dark w-full"
              />
            </div>
          </div>

          <button onClick={handleSearch} className="btn-primary w-full justify-center">
            <Search size={14} /> Apply Filters
          </button>
        </div>

        {/* Quick filters */}
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Quick Filters</p>
          {['Kick', 'Mud Loss', 'Stuck Pipe'].map((et) => (
            <button
              key={et}
              onClick={() => {
                setEventType(et);
                doSearch(query, formation, et, wellId, minDepth, maxDepth);
              }}
              className="w-full text-left px-2 py-1.5 rounded text-xs text-gray-400 hover:bg-navy-700 transition-colors flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EVENT_TYPE_COLORS[et] }} />
              {EVENT_TYPE_ICONS[et]} {et}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar header */}
        <div className="p-4 bg-navy-800/50 border-b border-navy-600/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 bg-navy-700 border border-navy-500 rounded-xl px-4 py-2.5 focus-within:border-teal-500 transition-colors">
              <Search size={16} className="text-gray-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search extracted drilling reports… (e.g., 'mud loss Tipam', 'stuck pipe Barail', 'kick mitigation')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 text-sm outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-gray-500 hover:text-gray-300">
                  <X size={14} />
                </button>
              )}
            </div>
            <button onClick={handleSearch} className="btn-primary">
              Search
            </button>
          </div>

          {/* Quick Click Search Chips for quick demo */}
          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
            <span className="text-[11px] text-gray-500 font-medium">Try:</span>
            {[
              { label: '💥 Gas kick Barail', query: 'kick Barail' },
              { label: '🌊 Mud loss Tipam', query: 'mud loss' },
              { label: '⚙️ Stuck pipe Kopili', query: 'stuck pipe' },
              { label: '🏗️ Poor cement bond', query: 'cement' },
              { label: '🌀 Torque spike', query: 'torque' },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setQuery(chip.query);
                  doSearch(chip.query, formation, eventType, wellId, minDepth, maxDepth);
                }}
                className="px-2 py-0.5 rounded-full text-[11px] bg-navy-700/80 border border-navy-600 text-gray-300 hover:text-teal-300 hover:border-teal-500/40 transition-all cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* AI badge */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <Sparkles size={12} className="text-purple-400" />
              <span className="text-xs text-purple-400 font-medium">AI-Powered Search</span>
            </div>
            <span className="text-xs text-gray-500">
              Semantic search across {meta.wellIds.length} wells · 35 extracted report snippets
            </span>
            {total > 0 && (
              <span className="text-xs text-teal-400 font-medium ml-auto">
                {total} result{total !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <BookOpen size={36} className="mb-3 opacity-50" />
              <p className="text-sm">No results found for your query</p>
              <p className="text-xs mt-1">Try broader search terms or fewer filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((snippet) => (
                <div
                  key={snippet.id}
                  className="glass-card p-4 hover:border-teal-500/30 transition-all cursor-pointer animate-slide-up"
                  onClick={() => setExpanded(expanded === snippet.id ? null : snippet.id)}
                >
                  {/* Card header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                      style={{ backgroundColor: EVENT_TYPE_COLORS[snippet.eventType] + '20' }}
                    >
                      {EVENT_TYPE_ICONS[snippet.eventType]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-200">{snippet.eventType}</span>
                        <span className={getSeverityClass(snippet.severity)}>{snippet.severity}</span>
                        <span className="text-xs text-gray-500">@{snippet.depth} m</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            color: FORMATION_COLORS[snippet.formation] || '#6b7280',
                            backgroundColor: (FORMATION_COLORS[snippet.formation] || '#6b7280') + '20',
                          }}
                        >
                          {snippet.formation}
                        </span>
                        <Link
                          to={`/wells/${snippet.wellId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                        >
                          {snippet.wellId} <ExternalLink size={10} />
                        </Link>
                        <span className="text-xs text-gray-500">{snippet.date}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{snippet.source}</div>
                  </div>

                  {/* Snippet text (collapsed/expanded) */}
                  <div
                    className={`text-sm text-gray-300 leading-relaxed ${
                      expanded === snippet.id ? '' : 'line-clamp-3'
                    }`}
                  >
                    <HighlightText text={snippet.text} query={query} />
                  </div>
                  {expanded !== snippet.id && (
                    <button className="mt-1 text-xs text-teal-400 hover:text-teal-300">
                      Read more…
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
