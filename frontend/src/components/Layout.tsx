import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Activity,
  Search,
  GitMerge,
  AlertTriangle,
  Upload,
  Wifi,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  X,
  ShieldAlert,
  Database,
  Crosshair,
  Compass,
  ArrowRight,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/map', icon: Map, label: 'Geospatial Map' },
  { to: '/wells', icon: Activity, label: 'Well Profiles' },
  { to: '/search', icon: Search, label: 'Knowledge Search' },
  { to: '/correlation', icon: GitMerge, label: 'Correlation' },
  { to: '/alerts', icon: AlertTriangle, label: 'Predictive Alerts', badge: 'Active' },
  { to: '/ingest', icon: Upload, label: 'Doc Ingest' },
];

const DEMO_STEPS = [
  { path: '/', title: '1. Dashboard', desc: 'Live rig telemetry & depth simulation controller' },
  { path: '/map', title: '2. Geospatial Map', desc: '18 offset wells & proximity correlation vectors' },
  { path: '/alerts', title: '3. Predictive Alerts', desc: 'Rule-based hazard prediction & mitigation engine' },
  { path: '/search', title: '4. Knowledge Search', desc: 'NLP semantic search over DDR & WCR logs' },
  { path: '/correlation', title: '5. Correlation', desc: 'Cross-well depth parameter overlay charts' },
  { path: '/ingest', title: '6. Doc Ingestion', desc: 'Automated entity extraction pipeline demo' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState<'architecture' | 'tour' | 'glossary'>('architecture');
  const [showTourBar, setShowTourBar] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Find current step index
  const currentStepIdx = DEMO_STEPS.findIndex((s) => s.path === location.pathname);
  const nextStep = currentStepIdx >= 0 && currentStepIdx < DEMO_STEPS.length - 1
    ? DEMO_STEPS[currentStepIdx + 1]
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900 text-gray-100">
      {/* Sidebar */}
      <aside
        className={`flex flex-col flex-shrink-0 bg-navy-800 border-r border-navy-600/50 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-navy-600/50 min-h-[64px]">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF8600] via-[#758BFD] to-[#27187E] flex items-center justify-center shadow-lg shadow-orange-500/25">
            <span className="text-white font-black text-xs tracking-wider">OIL</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-[#758BFD] font-extrabold text-sm leading-tight flex items-center gap-1.5">
                eRTMAC-NWIS
              </p>
              <p className="text-gray-400 text-[11px] truncate">Offset Well Intelligence</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label, exact, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-navy-700'
                }`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{label}</span>
                  {badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      {badge}
                    </span>
                  )}
                </div>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-navy-700 text-gray-100 text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-navy-500 shadow-xl">
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Status indicator */}
        <div className="px-3 py-3 border-t border-navy-600/50">
          <div
            className={`flex items-center gap-2 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="relative flex-shrink-0">
              <Wifi size={14} className="text-teal-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-teal-400 rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-teal-400 rounded-full" />
            </div>
            {!collapsed && (
              <div>
                <p className="text-xs text-teal-400 font-semibold tracking-wide">LIVE TELEMETRY</p>
                <p className="text-[11px] text-gray-400">DLJ-NEW-01 @ 2,100 m</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-2.5 border-t border-navy-600/50 text-gray-400 hover:text-teal-400 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-2 bg-navy-800/90 border-b border-navy-600/50 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Active Rig: OIL RIG-14
            </span>
            <span className="text-xs text-gray-300 hidden md:inline">
              Well <strong className="text-teal-400">DLJ-NEW-01</strong> · Formation: <span className="text-emerald-400 font-medium">Barail Group</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-gray-400">
            {/* Active Theme Palette Swatch Indicator (5-Color Template) */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-900/90 border border-navy-700/80 shadow-inner"
              title="Active Theme Palette: #27187E (Indigo Ink) · #758BFD (Cornflower Blue) · #AEB8FE (Periwinkle) · #F1F2F6 (Platinum) · #FF8600 (Princeton Orange)"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#27187E] ring-1 ring-white/30 shadow-sm" title="#27187E (Indigo Ink)" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#758BFD] ring-1 ring-white/30 shadow-sm" title="#758BFD (Cornflower Blue)" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#AEB8FE] ring-1 ring-white/30 shadow-sm" title="#AEB8FE (Periwinkle)" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#F1F2F6] ring-1 ring-black/20 shadow-sm" title="#F1F2F6 (Platinum)" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF8600] ring-1 ring-white/30 shadow-sm" title="#FF8600 (Princeton Orange)" />
              <span className="text-[10px] text-gray-300 font-mono font-semibold ml-1 hidden md:inline">Theme Palette</span>
            </div>

            {/* Toggle Walkthrough Button */}
            <button
              onClick={() => setShowTourBar(!showTourBar)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                showTourBar
                  ? 'bg-navy-700 text-[#758BFD] border-[#758BFD]/40'
                  : 'bg-navy-800 text-gray-400 hover:text-gray-200 border-navy-600'
              }`}
            >
              <Sparkles size={13} className="text-[#FF8600]" />
              <span>{showTourBar ? 'Hide Demo Guide' : 'Show Demo Guide'}</span>
            </button>

            {/* Guide Button for evaluators / users */}
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-[#758BFD]/20 to-[#AEB8FE]/20 text-[#758BFD] hover:from-[#758BFD]/30 hover:to-[#AEB8FE]/30 border border-[#758BFD]/40 font-semibold transition-all shadow-sm cursor-pointer"
            >
              <HelpCircle size={14} />
              <span>Overview (PS 26121)</span>
            </button>

            <div className="h-4 w-px bg-navy-600 hidden sm:block" />
            <span className="hidden sm:flex items-center gap-1.5 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-[#FF8600]" />
              Oil India Ltd.
            </span>
          </div>
        </header>

        {/* Demo Tour Helper Bar */}
        {showTourBar && (
          <div className="bg-gradient-to-r from-teal-950/40 via-navy-800 to-navy-800 border-b border-teal-500/20 px-5 py-2 flex items-center justify-between gap-4 text-xs z-10 flex-shrink-0 animate-fade-in">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              <span className="text-teal-400 font-bold flex items-center gap-1 uppercase tracking-wide text-[10px] bg-teal-500/20 px-2 py-0.5 rounded border border-teal-500/40 flex-shrink-0">
                ⚡ Interactive Flow:
              </span>
              {DEMO_STEPS.map((s, idx) => {
                const isActive = location.pathname === s.path;
                return (
                  <button
                    key={s.path}
                    type="button"
                    onClick={() => navigate(s.path)}
                    className={`px-2 py-1 rounded-md text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                      isActive
                        ? 'bg-teal-500 text-navy-950 font-bold shadow-sm'
                        : 'text-gray-400 hover:text-gray-100 hover:bg-navy-700/60'
                    }`}
                  >
                    <span>{s.title}</span>
                  </button>
                );
              })}
            </div>

            {nextStep && (
              <button
                type="button"
                onClick={() => navigate(nextStep.path)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30 whitespace-nowrap transition-colors flex-shrink-0"
              >
                <span>Next: {nextStep.title}</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-navy-900">
          <Outlet />
        </main>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-800 border border-navy-600/80 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative animate-slide-up flex flex-col max-h-[90vh]">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-navy-700 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                <Compass size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">eRTMAC-NWIS Evaluation Guide</h2>
                <p className="text-xs text-teal-400 font-medium">
                  SIH Problem Statement 26121 — Oil India Limited (Upper Assam Basin)
                </p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-navy-700 pb-2 mb-4">
              {[
                { id: 'architecture', label: '1. Architecture & PS 26121' },
                { id: 'tour', label: '2. 2-Min Demo Walkthrough' },
                { id: 'glossary', label: '3. Petroleum Terms Glossary' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setGuideTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    guideTab === t.id
                      ? 'bg-teal-500 text-navy-950 shadow-md shadow-teal-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-navy-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Tab Content */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {guideTab === 'architecture' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    eRTMAC-NWIS is an intelligent decision-support system designed for drilling operations. It continuously correlates the active drilling well with historical offset well records in the Upper Assam basin to predict subsurface hazards before they happen.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-navy-900/60 border border-navy-700">
                      <div className="p-2 rounded-lg bg-red-500/10 text-red-400 flex-shrink-0">
                        <ShieldAlert size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">1. Predictive Hazard Alerts</h4>
                        <p className="text-xs text-gray-400 mt-0.5 leading-normal">
                          Matches the current bit depth against nearby historical incidents (Kicks, Stuck Pipe, Mud Losses) within a ±150 m depth window to provide immediate mitigation advice.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-navy-900/60 border border-navy-700">
                      <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 flex-shrink-0">
                        <Crosshair size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">2. Geospatial Proximity Intelligence</h4>
                        <p className="text-xs text-gray-400 mt-0.5 leading-normal">
                          Interactive map plotting 18 offset wells with customizable radius filtering (5 km to 60 km), clean Esri basemaps, and direct correlation vector rays.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-navy-900/60 border border-navy-700">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 flex-shrink-0">
                        <Database size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">3. NLP Knowledge Search & Ingestion</h4>
                        <p className="text-xs text-gray-400 mt-0.5 leading-normal">
                          Instant semantic retrieval across Daily Drilling Reports (DDR) and Well Completion Reports (WCR), with automated entity extraction.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {guideTab === 'tour' && (
                <div className="space-y-3 text-xs text-gray-300">
                  <p className="text-teal-300 font-semibold mb-2">
                    Follow these 6 steps to demonstrate the complete capability to any evaluator:
                  </p>
                  {[
                    { step: 'Step 1', title: 'Dashboard Telemetry & Depth Simulator', action: 'Go to Dashboard. Click "2100m Barail Kick" or "3120m Kopili Stuck". Notice how live telemetry, hazards, and mud weights dynamically react.' },
                    { step: 'Step 2', title: 'Geospatial Map & Correlation Rays', action: 'Go to Map. Toggle between Satellite, Dark, and Topo basemaps. Notice the dashed correlation vectors linking DLJ-NEW-01 to historical offset wells.' },
                    { step: 'Step 3', title: 'Predictive Hazard Mitigation', action: 'Go to Predictive Alerts. Check the recommended mitigation. Click "Acknowledge" to log supervisor sign-off, or "Copy Rig Handover Briefing".' },
                    { step: 'Step 4', title: 'Knowledge Base Semantic Search', action: 'Go to Knowledge Search. Click suggested chips like "Barail Mud Loss" or "Differential Sticking" to view instant excerpt matches.' },
                    { step: 'Step 5', title: 'Cross-Well Stratigraphic Correlation', action: 'Go to Correlation. Compare DLJ-NEW-01 with NHK-01 to overlay ROP and mud weight curves across formations.' },
                    { step: 'Step 6', title: 'Automated DDR / WCR Ingestion', action: 'Go to Doc Ingest. Click any of the 3 preloaded sample reports and run AI Extraction to see the OCR & NLP pipeline.' },
                  ].map((s) => (
                    <div key={s.step} className="p-3 rounded-xl bg-navy-900/60 border border-navy-700 flex gap-3">
                      <span className="text-teal-400 font-bold font-mono whitespace-nowrap">{s.step}:</span>
                      <div>
                        <strong className="text-white block mb-0.5">{s.title}</strong>
                        <span className="text-gray-400 leading-relaxed">{s.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {guideTab === 'glossary' && (
                <div className="space-y-2.5 text-xs">
                  <p className="text-teal-300 font-semibold mb-2">
                    Key Petroleum & Drilling Terms Explained:
                  </p>
                  {[
                    { term: 'ROP (Rate of Penetration)', def: 'Speed at which the drill bit cuts through formation (meters/hour). Sudden spike indicates a drilling break or high-porosity kick zone.' },
                    { term: 'WOB (Weight on Bit)', def: 'Downward mechanical load applied to the drill bit (kilonewtons). Controlled to prevent bit deviation or drillstring buckling.' },
                    { term: 'Mud Weight (SG)', def: 'Specific gravity of the drilling fluid. Balances formation pore pressure to keep oil/gas from kicking into the wellbore.' },
                    { term: 'Kick / Gas Influx', def: 'Uncontrolled flow of reservoir gas/oil into the wellbore when hydrostatic mud pressure falls below formation pressure.' },
                    { term: 'Differential Sticking', def: 'Condition where the drillstring is pinned against a permeable mud cake due to overbalanced hydrostatic pressure.' },
                    { term: 'LCM (Lost Circulation Material)', def: 'Granular additives (mica, graphite, calcium carbonate) pumped into the well to bridge and seal fractured thief zones.' },
                    { term: 'NPT (Non-Productive Time)', def: 'Unplanned rig stoppage hours caused by equipment failure, stuck pipe, kicks, or mud losses.' },
                  ].map((g) => (
                    <div key={g.term} className="p-2.5 rounded-lg bg-navy-900/50 border border-navy-700">
                      <p className="text-amber-400 font-bold mb-0.5">{g.term}</p>
                      <p className="text-gray-300 leading-normal">{g.def}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center gap-3 pt-3 mt-3 border-t border-navy-700">
              <span className="text-xs text-gray-500">
                Oil India Limited · eRTMAC-NWIS Hackathon Prototype
              </span>
              <button
                onClick={() => setShowGuide(false)}
                className="px-5 py-2 rounded-lg bg-teal-500 text-navy-900 font-semibold text-xs hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20"
              >
                Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
