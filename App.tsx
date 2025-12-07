import React, { useState, useRef, useEffect } from 'react';
import { extractLPFromImage, extractLPFromText } from './services/geminiService';
import { LPProblem, SolverMethod, SolverStep, HistoryItem } from './types';
import { LPEngine } from './services/lpEngine';
import TableauStep from './components/TableauStep';
import Graph2D from './components/Graph2D';
import ManualBuilder from './components/ManualBuilder';
import { Camera, FileText, Play, CheckCircle, RotateCcw, Moon, Sun, Edit3, Keyboard, RefreshCw, Eye, ArrowDown, BarChart2, Layers, History, Save, Download, Printer, Trash2, Palette, Cpu, FileJson, FileType, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

type InputMode = 'image' | 'text' | 'manual';
type ColorTheme = 'violet' | 'blue' | 'emerald' | 'rose';

const App: React.FC = () => {
  // Theme State
  const [darkMode, setDarkMode] = useState(false);
  const [colorTheme, setColorTheme] = useState<ColorTheme>('violet');
  const [showHistory, setShowHistory] = useState(false);

  // App State
  const [inputMode, setInputMode] = useState<InputMode>('image');
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problem, setProblem] = useState<LPProblem | null>(null);
  const [steps, setSteps] = useState<SolverStep[]>([]);
  const [visibleStepCount, setVisibleStepCount] = useState(0); 
  const [selectedMethod, setSelectedMethod] = useState<SolverMethod>(SolverMethod.SIMPLEX);
  const [textInput, setTextInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // --- Theme Management ---
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (colorTheme === 'violet') {
      root.style.setProperty('--primary-50', '#f5f3ff');
      root.style.setProperty('--primary-100', '#ede9fe');
      root.style.setProperty('--primary-500', '#8b5cf6');
      root.style.setProperty('--primary-600', '#7c3aed');
      root.style.setProperty('--primary-700', '#6d28d9');
      root.style.setProperty('--primary-900', '#4c1d95');
    } else if (colorTheme === 'blue') {
      root.style.setProperty('--primary-50', '#eff6ff');
      root.style.setProperty('--primary-100', '#dbeafe');
      root.style.setProperty('--primary-500', '#3b82f6');
      root.style.setProperty('--primary-600', '#2563eb');
      root.style.setProperty('--primary-700', '#1d4ed8');
      root.style.setProperty('--primary-900', '#1e3a8a');
    } else if (colorTheme === 'emerald') {
      root.style.setProperty('--primary-50', '#ecfdf5');
      root.style.setProperty('--primary-100', '#d1fae5');
      root.style.setProperty('--primary-500', '#10b981');
      root.style.setProperty('--primary-600', '#059669');
      root.style.setProperty('--primary-700', '#047857');
      root.style.setProperty('--primary-900', '#064e3b');
    } else if (colorTheme === 'rose') {
      root.style.setProperty('--primary-50', '#fff1f2');
      root.style.setProperty('--primary-100', '#ffe4e6');
      root.style.setProperty('--primary-500', '#f43f5e');
      root.style.setProperty('--primary-600', '#e11d48');
      root.style.setProperty('--primary-700', '#be123c');
      root.style.setProperty('--primary-900', '#881337');
    }
  }, [colorTheme]);

  // --- Persistence ---
  useEffect(() => {
      const stored = localStorage.getItem('solver_history');
      if (stored) {
          try {
              setHistory(JSON.parse(stored));
          } catch (e) { console.error("History load error", e); }
      }
  }, []);

  const saveToHistory = (prob: LPProblem, method: SolverMethod) => {
      const newItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          problem: prob,
          method
      };
      const updated = [newItem, ...history].slice(0, 50); // Keep last 50
      setHistory(updated);
      localStorage.setItem('solver_history', JSON.stringify(updated));
  };

  const loadFromHistory = (item: HistoryItem) => {
      setProblem(item.problem);
      setSelectedMethod(item.method);
      setSteps([]);
      setVisibleStepCount(0);
      setShowHistory(false);
      setError(null);
  };

  const clearHistory = () => {
      if(confirm("Clear all history?")) {
          setHistory([]);
          localStorage.removeItem('solver_history');
      }
  };

  const exportHistory = () => {
      const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solver_history_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
  };
  
  const handlePrintPDF = () => {
      // Expand all steps for printing
      setVisibleStepCount(steps.length);
      setTimeout(() => {
          window.print();
      }, 500);
  };

  const handleDownloadPDF = async () => {
    setIsPdfLoading(true);
    // Expand steps
    setVisibleStepCount(steps.length);
    
    // Show report header temporarily for the capture
    const header = document.getElementById('report-header-internal');
    const controls = document.getElementById('report-controls');
    
    if (header) header.classList.remove('hidden');
    if (controls) controls.classList.add('hidden');

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 800));

    const input = document.getElementById('report-container');
    if (input) {
        try {
            const canvas = await html2canvas(input, {
                scale: 1.5, // Balance between quality and size
                useCORS: true,
                logging: false,
                backgroundColor: darkMode ? '#0f172a' : '#ffffff' // Capture current theme bg
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            // Create PDF with custom dimensions matching the content
            // This creates a continuous "digital paper" feel
            const pdf = new jsPDF({
                orientation: imgWidth > imgHeight ? 'l' : 'p',
                unit: 'px',
                format: [imgWidth, imgHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`solver_report_${selectedMethod}_${Date.now()}.pdf`);
        } catch (e) {
            console.error("PDF Gen Error", e);
            alert("Failed to generate PDF. Try using the 'Print' button instead.");
        }
    }
    
    // Restore UI
    if (header) header.classList.add('hidden');
    if (controls) controls.classList.remove('hidden');
    
    setIsPdfLoading(false);
  };

  const handleExportProblemJSON = () => {
      if (!problem) return;
      const data = {
          problem,
          method: selectedMethod,
          steps,
          timestamp: new Date().toISOString(),
          copyright: "MU42 - Muhammad Uzair"
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lp_solution_${selectedMethod}_${Date.now()}.json`;
      a.click();
  };

  // --- Handlers ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setProblem(null);
    setSteps([]);
    setVisibleStepCount(0);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        try {
           const extractedProblem = await extractLPFromImage(base64Data, file.type);
           setProblem(extractedProblem);
        } catch (err: any) {
            setError(err.message || "Failed to analyze image.");
        } finally {
            setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Error reading file");
      setIsLoading(false);
    }
  };

  const handleTextSubmit = async () => {
      if (!textInput.trim()) return;
      setIsLoading(true);
      setError(null);
      try {
          const extractedProblem = await extractLPFromText(textInput);
          setProblem(extractedProblem);
      } catch (err: any) {
          setError(err.message || "Failed to analyze text.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleManualSolve = (p: LPProblem) => setProblem(p);

  const handleSolve = () => {
    if (!problem) return;
    setError(null);
    try {
        const solutionSteps = LPEngine.solve(problem, selectedMethod);
        setSteps(solutionSteps);
        setVisibleStepCount(1);
        saveToHistory(problem, selectedMethod); // Auto-save
        setTimeout(() => {
            document.getElementById('solution-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } catch (e: any) {
        setError(e.message);
    }
  };

  const handleShowNextStep = () => {
      if (visibleStepCount < steps.length) {
          setVisibleStepCount(prev => prev + 1);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
      }
  };

  const reset = () => {
    setProblem(null);
    setSteps([]);
    setVisibleStepCount(0);
    setError(null);
    setTextInput("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 bg-slate-50 dark:bg-slate-950 font-sans relative">
      
      {/* LOADING OVERLAY FOR PDF */}
      {isPdfLoading && (
          <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl text-center border border-slate-200 dark:border-slate-700 max-w-sm mx-4">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                      <div className="absolute inset-0 border-4 border-primary-500 rounded-full animate-ping opacity-20"></div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Generating PDF Report</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Please wait while we capture the solution and prepare your document...</p>
              </div>
          </div>
      )}

      {/* HIDDEN PRINT HEADER (Visible only in Browser Print) */}
      <div id="print-header" className="hidden">
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                  <h1 className="text-3xl font-bold text-slate-900">Optimization Report</h1>
                  <p className="text-slate-500 font-mono mt-1">Generated by SolverAI</p>
              </div>
              <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">Method: {selectedMethod}</div>
                  <div className="text-sm text-slate-500">{new Date().toLocaleString()}</div>
                  <div className="text-xs text-primary-600 font-bold mt-1">© MU42 - Muhammad Uzair</div>
              </div>
          </div>
      </div>

      {/* PROFESSIONAL HEADER (UI) */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 no-print backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-primary-600 p-2 rounded-lg text-white shadow-lg shadow-primary-500/30">
                    <Cpu className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                        Solver<span className="text-primary-600">AI</span>
                    </h1>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold">
                        by MU42 &bull; Muhammad Uzair
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                 {/* Theme Toggle */}
                 <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700">
                    {(['violet', 'blue', 'emerald', 'rose'] as ColorTheme[]).map(c => (
                        <button
                            key={c}
                            onClick={() => setColorTheme(c)}
                            className={`w-6 h-6 rounded-full transition-all duration-300 ${colorTheme === c ? 'scale-110 shadow-md ring-2 ring-white dark:ring-slate-700' : 'opacity-50 hover:opacity-100 scale-90'}`}
                            style={{ backgroundColor: c === 'violet' ? '#8b5cf6' : c === 'blue' ? '#3b82f6' : c === 'emerald' ? '#10b981' : '#f43f5e' }}
                            title={`${c} theme`}
                        />
                    ))}
                 </div>

                 <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                 <button 
                    onClick={() => setShowHistory(true)} 
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition relative"
                    title="History"
                 >
                    <History className="w-5 h-5"/>
                    {history.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full"></span>}
                 </button>

                 <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition">
                    {darkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
                 </button>

                {problem && (
                    <button onClick={reset} className="ml-2 hidden md:flex items-center gap-2 text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 px-4 py-2 rounded-lg transition font-semibold shadow-md">
                        <RotateCcw className="w-4 h-4"/> New
                    </button>
                )}
            </div>
        </div>
      </header>

      {/* HISTORY SIDEBAR */}
      {showHistory && (
          <div className="fixed inset-0 z-50 flex justify-end no-print">
              <div className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
              <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <History className="w-5 h-5"/> Solution History
                      </h2>
                      <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                       <button onClick={exportHistory} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 transition">
                           <Save className="w-3 h-3"/> Save to Disk
                       </button>
                       <button onClick={clearHistory} className="px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 dark:text-red-400 rounded transition">
                           <Trash2 className="w-4 h-4"/>
                       </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                      {history.length === 0 ? (
                          <div className="text-center text-slate-400 py-10 italic">No history yet. Solve a problem to see it here.</div>
                      ) : (
                          history.map(item => (
                              <div key={item.id} onClick={() => loadFromHistory(item)} className="group cursor-pointer bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:shadow-md">
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="text-[10px] font-mono text-slate-400 uppercase">{new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString()}</span>
                                      <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded font-bold">{item.method}</span>
                                  </div>
                                  <div className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 mb-1">
                                      {item.problem.type} Z
                                  </div>
                                  <div className="text-xs text-slate-500 truncate">
                                      {item.problem.variables.length} vars, {item.problem.constraints.length} constraints
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8" id="report-container">
        
        {/* INTERNAL REPORT HEADER (Initially Hidden, for PDF Gen) */}
        <div id="report-header-internal" className="hidden mb-8 border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between items-end">
              <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Optimization Report</h1>
                  <p className="text-slate-500 font-mono mt-1">Generated by SolverAI</p>
              </div>
              <div className="text-right">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Method: {selectedMethod}</div>
                  <div className="text-sm text-slate-500">{new Date().toLocaleString()}</div>
                  <div className="text-xs text-primary-600 font-bold mt-1">© MU42 - Muhammad Uzair</div>
              </div>
            </div>
        </div>

        {/* INPUT SECTION */}
        {!problem && (
          <div className="flex flex-col items-center pt-10 animate-in fade-in duration-500">
            <div className="flex space-x-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
                {['image', 'text', 'manual'].map(m => (
                    <button 
                        key={m}
                        onClick={() => setInputMode(m as InputMode)}
                        className={`capitalize flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${inputMode === m ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        {m === 'image' && <Camera className="w-4 h-4"/>}
                        {m === 'text' && <Edit3 className="w-4 h-4"/>}
                        {m === 'manual' && <Keyboard className="w-4 h-4"/>}
                        {m} Input
                    </button>
                ))}
            </div>

            <div className="w-full max-w-2xl">
                {inputMode === 'image' && (
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 text-center transition-all hover:shadow-2xl">
                        <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-6 transform transition-transform hover:scale-110 duration-300">
                            <Camera className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Scan Problem</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">Upload a clear image of your Linear Programming problem. AI will extract equations automatically.</p>
                        
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary-600/20 mt-2 disabled:opacity-50 transition-all active:scale-[0.98]">
                            {isLoading ? 'Analyzing...' : 'Select Image'}
                        </button>
                    </div>
                )}

                {inputMode === 'text' && (
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Problem Description</label>
                        <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="e.g. Maximize Z = 3x + 5y subject to 2x + y <= 10..." className="w-full h-48 p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 mb-6 font-mono text-sm resize-none" />
                        <button onClick={handleTextSubmit} disabled={isLoading || !textInput.trim()} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg disabled:opacity-50 transition-all">
                             {isLoading ? 'Processing...' : 'Analyze Text'}
                        </button>
                    </div>
                )}

                {inputMode === 'manual' && <ManualBuilder onSolve={handleManualSolve} />}

                {error && <div className="mt-6 text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-900 font-medium animate-pulse">{error}</div>}
            </div>
          </div>
        )}

        {/* WORKSPACE (If Problem Exists) */}
        {problem && (
            <div className="grid lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-500 mb-20">
                {/* Left Col: Source & Preview */}
                <div className="space-y-6">
                    {/* Problem Statement Box */}
                    <div className="problem-statement-box bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 break-inside-avoid">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500"/> Problem Model
                            </h2>
                            {/* Download Buttons for this specific method result */}
                            <div className="flex gap-2 no-print" id="report-controls">
                                <button onClick={handleExportProblemJSON} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600" title="Export JSON Data">
                                    <FileJson className="w-3.5 h-3.5" /> Data
                                </button>
                                <button onClick={handlePrintPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md transition dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500" title="Print View">
                                    <Printer className="w-3.5 h-3.5" /> Print
                                </button>
                                <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-md transition dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white" title="Download PDF Report">
                                    {isPdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Download className="w-3.5 h-3.5" />} PDF
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-sm shadow-inner">
                            <div className="font-bold text-primary-700 dark:text-primary-400 mb-3 text-base border-b border-slate-200 dark:border-slate-700 pb-2">
                                {problem.type} Z = {problem.objectiveCoefficients.map((c, i) => `${c}${problem.variables[i]}`).join(' + ')}
                            </div>
                            <div className="text-slate-500 dark:text-slate-500 mb-2 font-semibold text-xs uppercase tracking-wider">Subject to constraints:</div>
                            {problem.constraints.map((c, i) => (
                                <div key={i} className="ml-4 text-slate-800 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                                    <span className="text-slate-400 text-xs w-6">{`C${i+1}:`}</span>
                                    <span>{c.coefficients.map((coef, idx) => `${coef}${problem.variables[idx]}`).join(' + ')} {c.sign} {c.rhs}</span>
                                </div>
                            ))}
                            <div className="ml-4 mt-2 text-slate-400 italic text-xs">
                                {problem.nonNegative !== false ? "All variables ≥ 0" : "Unrestricted variables allowed"}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="mt-6 no-print">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Solver Method</label>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {Object.values(SolverMethod).map(method => (
                                    <button 
                                        key={method}
                                        onClick={() => setSelectedMethod(method)}
                                        className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all ${selectedMethod === method ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 ring-1 ring-primary-500' : 'bg-white border-slate-300 text-slate-600 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                            {error && <p className="text-sm text-red-500 mb-3 bg-red-50 p-2 rounded border border-red-100">{error}</p>}
                            <button onClick={handleSolve} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]">
                                {steps.length > 0 ? <RefreshCw className="w-5 h-5"/> : <Play className="w-5 h-5" />} 
                                {steps.length > 0 ? 'Re-Solve Problem' : 'Solve Now'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Col: Graph */}
                <div className="space-y-6 break-inside-avoid">
                    {problem.variables.length === 2 ? (
                         <div className="graph-container bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 h-fit shadow-sm">
                            <Graph2D problem={problem} />
                         </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center justify-center text-slate-500 h-64">
                            <BarChart2 className="w-12 h-12 mb-4 text-slate-300"/>
                            <p>2D Graph visualization is only available for 2-variable problems.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* STEPS TIMELINE */}
        {steps.length > 0 && (
            <div id="solution-start" className="max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800 pt-12 pb-32">
                <div className="flex items-center justify-between mb-8 no-print">
                     <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Step-by-Step Solution</h2>
                     <span className="text-sm font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{steps.length} Iterations</span>
                </div>
                
                <div className="space-y-12">
                    {/* Always show all steps in print, but allow stepped reveal in UI */}
                    {steps.slice(0, visibleStepCount).map((step, idx) => (
                        <div key={idx} className="step-container animate-in slide-in-from-bottom-8 fade-in duration-700 relative">
                             {/* Connector Line (Hidden in print) */}
                             {idx < visibleStepCount - 1 && (
                                 <div className="absolute left-8 top-full h-12 w-0.5 bg-gradient-to-b from-slate-300 to-transparent dark:from-slate-600 z-0 no-print"></div>
                             )}
                             <div className="relative z-10">
                                <TableauStep step={step} />
                             </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
                {visibleStepCount < steps.length && (
                    <div className="flex justify-center pt-12 no-print">
                        <button onClick={handleShowNextStep} className="group flex flex-col items-center gap-3 text-slate-500 hover:text-primary-600 transition">
                            <span className="font-bold text-sm tracking-widest uppercase group-hover:underline decoration-2 underline-offset-4">Reveal Next Step</span>
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 group-hover:border-primary-500 group-hover:scale-110 transition-all">
                                <ArrowDown className="w-6 h-6 animate-bounce text-primary-500" />
                            </div>
                        </button>
                    </div>
                )}
            </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 mt-auto no-print">
          <div className="max-w-6xl mx-auto px-4 text-center">
              <p className="text-slate-500 text-sm font-medium">
                  &copy; {new Date().getFullYear()} OperationResearch Solver AI. Developed by <span className="text-primary-600 font-bold">MU42 (Muhammad Uzair)</span>.
              </p>
              <p className="text-slate-400 text-xs mt-2">State of the art Linear Programming Visualization Tool.</p>
          </div>
      </footer>
    </div>
  );
};

export default App;