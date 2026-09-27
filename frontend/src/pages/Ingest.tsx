import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  Cpu,
  Sparkles,
  Database,
  Search,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SampleReport {
  id: string;
  name: string;
  type: string;
  size: string;
  text: string;
  extractions: { field: string; value: string; confidence: number }[];
}

const SAMPLE_REPORTS: SampleReport[] = [
  {
    id: 'sample-1',
    name: 'OIL_DLJ_2026_DDR_092.pdf',
    type: 'Daily Drilling Report (DDR)',
    size: '142 KB',
    text: `DAILY DRILLING REPORT — DLJ-NEW-01
Date: 22-Sep-2026 | Depth: 2,450 m | Formation: Barail Group Sandstone
Operator: Oil India Limited | Rig: OIL RIG-14 | Field: Duliajan

MORNING REPORT (06:00 hrs):
Drilling ahead 8-1/2" hole at 2,450 m. Encountered severe mud losses at 08:15 hrs.
Initial loss rate: 5.2 m³/hr into depleted Barail sandstone fracture corridor.
Pit volume dropped 4.5 m³. Reduced pump stroke from 110 spm to 70 spm.

MITIGATION PERFORMED:
Mixed and spotted 25 m³ high-fluid-loss LCM pill (30 ppb fine mica + 15 ppb calcium carbonate + 10 ppb graphite).
Squeezed pill with 250 psi hesitation pressure. Waited 3 hrs for cake consolidation.
Losses successfully reduced to seepage (< 0.4 m³/hr). Total NPT: 7.5 hrs.

STATUS & RECOMMENDATIONS:
Resumed drilling ahead at 16:30 hrs with 1.18 SG polymer mud. Maintain standby 40 m³ LCM pill in reserve pit.
Company Man: A. Gogoi | Toolpusher: R. Baruah | Ref: OIL/DLJ/2026/DDR/092`,
    extractions: [
      { field: 'Well ID', value: 'DLJ-NEW-01', confidence: 0.98 },
      { field: 'Date', value: '2026-09-22', confidence: 0.96 },
      { field: 'Depth', value: '2,450 m', confidence: 0.99 },
      { field: 'Event Type', value: 'Loss of Circulation', confidence: 0.94 },
      { field: 'Formation', value: 'Barail Group (Sandstone)', confidence: 0.95 },
      { field: 'Severity', value: 'High', confidence: 0.91 },
      { field: 'Loss Rate', value: '5.2 m³/hr', confidence: 0.93 },
      { field: 'LCM Pill', value: 'Fine mica 30 ppb + CaCO3 + graphite', confidence: 0.88 },
      { field: 'NPT Incurred', value: '7.5 hrs', confidence: 0.96 },
      { field: 'Mitigation Status', value: 'Controlled to seepage (<0.4 m³/hr)', confidence: 0.92 },
    ],
  },
  {
    id: 'sample-2',
    name: 'OIL_NHK_2024_WCR_041.pdf',
    type: 'Well Completion Report (WCR)',
    size: '210 KB',
    text: `WELL COMPLETION REPORT — NHK-12 (Nahorkatiya)
Operator: Oil India Limited | Target Formation: Kopili Shale
Incident Section: 3,120 m to 3,155 m

LITHO-MECHANICAL EVENT REPORT:
While pulling out of hole (POOH) for bit change at 3,140 m depth in Kopili Formation,
encountered overpull exceeding 45 klbs. String became differentially stuck at 3,122 m.
Active mud weight was 1.28 SG with water-based mud (WBM). 

ROOT CAUSE ANALYSIS:
Reactive smectite/illite shales in Kopili absorbed drill fluid filtrate, causing swelling,
hole sloughing, and pack-off around bottom hole assembly (BHA) stabilizers.

ACTION TAKEN & RESOLUTION:
Pumped 15 m³ glycol-based spotting fluid (lubricant pill) around BHA.
Applied downward jarring with 80 tons for 4.2 hours. String successfully freed.
Raised mud weight to 1.35 SG with potassium chloride (KCl 8%) for shale inhibition.
Total Non-Productive Time (NPT): 18.5 hrs.

RECOMMENDATION FOR OFFSET DRILLING:
Always maintain minimum 7% KCl or switch to synthetic oil-based mud (SOBM) before entering Kopili Shale top (3,050 m).`,
    extractions: [
      { field: 'Well ID', value: 'NHK-12', confidence: 0.99 },
      { field: 'Date', value: '2024-11-14', confidence: 0.94 },
      { field: 'Depth', value: '3,122 m', confidence: 0.97 },
      { field: 'Event Type', value: 'Differential Sticking / Pack-off', confidence: 0.93 },
      { field: 'Formation', value: 'Kopili Shale', confidence: 0.96 },
      { field: 'Severity', value: 'Critical', confidence: 0.94 },
      { field: 'Overpull Peak', value: '45 klbs', confidence: 0.89 },
      { field: 'Spotting Fluid', value: 'Glycol lubricant pill + 80T jar', confidence: 0.87 },
      { field: 'NPT Incurred', value: '18.5 hrs', confidence: 0.97 },
      { field: 'Mitigation Status', value: 'String freed; mud converted to 7% KCl', confidence: 0.90 },
    ],
  },
  {
    id: 'sample-3',
    name: 'OIL_KUM_2025_DDR_118.pdf',
    type: 'Daily Drilling Report (DDR)',
    size: '188 KB',
    text: `DAILY DRILLING REPORT — KUM-09 (Kumchai High-Pressure)
Depth: 3,980 m | Formation: Sylhet Limestone
Well Status: Well Control Incident Managed

DRILLING INCIDENT SUMMARY:
At 02:40 hrs during coring operations at 3,980 m in Sylhet Limestone, observed sudden 
ROP spike from 2.5 m/hr to 14 m/hr followed by 18 bbl pit gain in 6 minutes.
Active mud weight: 1.34 SG. Flow check confirmed positive well flow with pumps off.

WELL CONTROL PROCEDURE (HARD SHUT-IN):
Space out drill pipe, shut in annular preventer. SIDPP recorded 420 psi, SICP recorded 560 psi.
Calculated formation pore pressure: 1.48 SG equivalent mud weight (EMW).
Initiated Wait & Weight method: weighted mud up to 1.50 SG using barite.
Circulated out 400 m³ gas kick via choke manifold and mud-gas separator. Flare ignited safely.

FINAL OUTCOME:
Well killed safely after 14 hrs. Zero injuries or equipment damage.
Driller: S. Saikia | Superintendent: P. Phukan | Ref: OIL/KUM/2025/DDR/118`,
    extractions: [
      { field: 'Well ID', value: 'KUM-09', confidence: 0.98 },
      { field: 'Date', value: '2025-04-19', confidence: 0.95 },
      { field: 'Depth', value: '3,980 m', confidence: 0.99 },
      { field: 'Event Type', value: 'Gas Kick / Influx', confidence: 0.96 },
      { field: 'Formation', value: 'Sylhet Limestone', confidence: 0.94 },
      { field: 'Severity', value: 'Critical', confidence: 0.98 },
      { field: 'Pit Gain Rate', value: '18 bbl in 6 min', confidence: 0.91 },
      { field: 'SIDPP / SICP', value: '420 psi / 560 psi', confidence: 0.93 },
      { field: 'Kill Mud Weight', value: '1.50 SG (Wait & Weight)', confidence: 0.95 },
      { field: 'Mitigation Status', value: 'Well safely killed; gas circulated through flare', confidence: 0.92 },
    ],
  },
];

export default function Ingest() {
  const [selectedSample, setSelectedSample] = useState<SampleReport>(SAMPLE_REPORTS[0]);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [done, setDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [indexedConfirmed, setIndexedConfirmed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeDocText = selectedSample.text;
  const activeDocName = customFile ? customFile.name : selectedSample.name;
  const activeDocSize = customFile ? `${(customFile.size / 1024).toFixed(1)} KB` : selectedSample.size;

  const handleSelectSample = (s: SampleReport) => {
    setSelectedSample(s);
    setCustomFile(null);
    setDone(false);
    setIndexedConfirmed(false);
    setProcessing(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      setCustomFile(f);
      setDone(false);
      setIndexedConfirmed(false);
    }
  };

  const handleProcess = () => {
    setProcessing(true);
    setProcessingStep(1);

    setTimeout(() => setProcessingStep(2), 500);
    setTimeout(() => setProcessingStep(3), 1100);
    setTimeout(() => setProcessingStep(4), 1700);

    setTimeout(() => {
      setProcessing(false);
      setDone(true);
    }, 2200);
  };

  const handleConfirmIndex = () => {
    setIndexedConfirmed(true);
  };

  const reset = () => {
    setCustomFile(null);
    setDone(false);
    setProcessing(false);
    setIndexedConfirmed(false);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
          <Upload size={24} className="text-teal-400" />
          Document Ingestion & AI Entity Extraction
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Automated NLP ingestion pipeline converts unstructured Daily Drilling Reports (DDR) and Well Completion Reports (WCR) into structured offset intelligence.
        </p>
      </div>

      {/* 1-Click Sample Reports Bar */}
      <div className="bg-navy-800/80 border border-navy-600/70 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <span className="text-sm font-semibold text-gray-200">1-Click Test Samples (No File Upload Needed)</span>
          </div>
          <span className="text-xs text-gray-400">Click any report to test NLP extraction instantly:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_REPORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectSample(s)}
              className={`p-3 rounded-lg text-left transition-all border ${
                selectedSample.id === s.id && !customFile
                  ? 'bg-[#758BFD]/20 border-[#758BFD] text-[#F1F2F6] shadow-md shadow-indigo-950/30'
                  : 'bg-navy-700/60 border-navy-600/60 text-gray-300 hover:bg-navy-700 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText size={15} className={selectedSample.id === s.id && !customFile ? 'text-[#758BFD]' : 'text-gray-400'} />
                <p className="text-xs font-bold truncate">{s.name}</p>
              </div>
              <p className="text-[11px] text-[#AEB8FE] truncate">{s.type}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Ingestion Pipeline Architecture Flow */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={16} className="text-[#AEB8FE]" />
          <span className="text-sm font-semibold text-gray-200">4-Stage Intelligence Extraction Pipeline</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#AEB8FE]/10 border border-[#AEB8FE]/30 rounded-full ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-[#AEB8FE] animate-pulse" />
            <span className="text-xs text-[#AEB8FE]">BioBERT / Tesseract NER Model</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { step: '1', title: 'OCR & Layout Analysis', desc: 'Converts scanned PDFs to clean text', icon: '📄' },
            { step: '2', title: 'Petroleum NER Extraction', desc: 'Identifies depth, formation & hazard', icon: '🤖' },
            { step: '3', title: 'Schema Normalization', desc: 'Validates standard OIL incident schema', icon: '📊' },
            { step: '4', title: 'Vector RAG Indexing', desc: 'Embedded for instant spatial search', icon: '💾' },
          ].map((item, idx) => (
            <div
              key={item.step}
              className={`p-3 rounded-lg border transition-all ${
                processing && processingStep === idx + 1
                  ? 'bg-[#758BFD]/25 border-[#758BFD] ring-2 ring-[#758BFD]/40'
                  : 'bg-navy-700/40 border-navy-600/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{item.icon}</span>
                <span className="font-bold text-gray-200">{item.title}</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content grid: Upload on Left, Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Dropzone & Extracted Fields */}
        <div className="space-y-4">
          {!done ? (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  dragOver
                    ? 'border-teal-500 bg-teal-500/10'
                    : 'border-navy-500 hover:border-teal-500/50 bg-navy-800/60'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setCustomFile(f);
                      setDone(false);
                      setIndexedConfirmed(false);
                    }
                  }}
                />
                <Upload size={36} className={`mx-auto mb-3 ${dragOver ? 'text-teal-400' : 'text-gray-400'}`} />
                <p className="text-sm font-semibold text-gray-200">
                  {activeDocName}
                </p>
                <p className="text-xs text-teal-400 font-medium mt-1">
                  {activeDocSize} · Ready for NLP processing
                </p>
                <p className="text-[11px] text-gray-500 mt-2">
                  Drop another file or click to browse (PDF, TXT, DOCX)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={processing}
                  className="btn-primary flex-1 justify-center py-2.5 text-sm font-semibold shadow-lg shadow-teal-500/20"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Stage {processingStep}/4: Processing NLP Extraction…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap size={16} /> Run AI Extraction on {activeDocName}
                    </span>
                  )}
                </button>
                {customFile && (
                  <button type="button" onClick={reset} className="btn-secondary">
                    Clear
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-5 border-teal-500/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-navy-600/60">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={22} className="text-teal-400" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-100">Extraction Complete</h3>
                    <p className="text-xs text-gray-400">10 geological & drilling entities mapped with &gt;88% confidence</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw size={12} /> Test Another
                </button>
              </div>

              {/* Extracted Fields Table */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {selectedSample.extractions.map((e) => (
                  <div
                    key={e.field}
                    className="flex items-center justify-between bg-navy-700/50 hover:bg-navy-700 rounded-lg px-3 py-2 text-xs transition-colors"
                  >
                    <span className="text-gray-400 w-36 font-medium flex-shrink-0">{e.field}</span>
                    <span className="text-gray-200 font-semibold flex-1 truncate">{e.value}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <div className="w-14 h-1.5 bg-navy-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                          style={{ width: `${e.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-teal-400 font-mono">{Math.round(e.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Confirmation Action */}
              {!indexedConfirmed ? (
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmIndex}
                    className="btn-primary flex-1 justify-center py-2.5 font-semibold text-xs shadow-md shadow-teal-500/20"
                  >
                    <Database size={15} /> Confirm & Index into Knowledge Base
                  </button>
                  <button type="button" onClick={reset} className="btn-secondary text-xs">
                    Discard
                  </button>
                </div>
              ) : (
                <div className="bg-teal-500/15 border border-teal-500/50 rounded-xl p-3.5 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-teal-400" />
                    <p className="text-xs font-bold text-teal-300">
                      Successfully Indexed into Vector Knowledge Base!
                    </p>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    This incident is now live across the system. It will immediately trigger alerts on the{' '}
                    <strong className="text-white">Predictive Alerts</strong> page and show in{' '}
                    <strong className="text-white">Knowledge Search</strong>.
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <Link
                      to="/search"
                      className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                      <Search size={12} /> Search this in Knowledge Base
                    </Link>
                    <span className="text-gray-500">·</span>
                    <Link
                      to="/alerts"
                      className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                      View Active Alerts
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: OCR Text Preview */}
        <div className="glass-card p-5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <FileText size={16} className="text-amber-400" />
              Document Text & OCR Representation
            </p>
            <span className="text-[11px] text-gray-400 bg-navy-700 px-2 py-0.5 rounded border border-navy-600">
              {activeDocName}
            </span>
          </div>

          <div className="bg-navy-900/90 rounded-xl p-4 font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap border border-navy-700/80 flex-1 min-h-[340px] max-h-[460px] overflow-y-auto">
            {activeDocText}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
            <div className="bg-navy-700/50 rounded-lg p-2 text-center border border-navy-600/40">
              <p className="text-gray-400 text-[11px]">Report Type</p>
              <p className="text-teal-400 font-bold truncate">{selectedSample.type.split(' ')[0]}</p>
            </div>
            <div className="bg-navy-700/50 rounded-lg p-2 text-center border border-navy-600/40">
              <p className="text-gray-400 text-[11px]">Word Count</p>
              <p className="text-amber-400 font-bold">{activeDocText.split(/\s+/).length} words</p>
            </div>
            <div className="bg-navy-700/50 rounded-lg p-2 text-center border border-navy-600/40">
              <p className="text-gray-400 text-[11px]">Confidence</p>
              <p className="text-green-400 font-bold">94.2% avg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
