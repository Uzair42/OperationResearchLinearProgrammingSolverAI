import React, { useState, useRef, useEffect } from 'react';
import { extractLPFromImage, extractLPFromText } from './services/geminiService';
import { LPProblem, SolverMethod, SolverStep } from './types';
import { LPEngine } from './services/lpEngine';
import TableauStep from './components/TableauStep';
import Graph2D from './components/Graph2D';
import ManualBuilder from './components/ManualBuilder';
import { Camera, FileText, Play, CheckCircle, RotateCcw, Moon, Sun, Edit3, Keyboard, RefreshCw, Eye, ArrowDown, BarChart2 } from 'lucide-react';

type InputMode = 'image' | 'text' | 'manual';

const App: React.FC = () => {
  // Theme State
  const [darkMode, setDarkMode] = useState(false);

  // App State
  const [inputMode, setInputMode] = useState<InputMode>('image');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problem, setProblem] = useState<LPProblem | null>(null);
  const [steps, setSteps] = useState<SolverStep[]>([]);
  const [visibleStepCount, setVisibleStepCount] = useState(0); // For vertical reveal
  const [selectedMethod, setSelectedMethod] = useState<SolverMethod>(SolverMethod.SIMPLEX);
  const [textInput, setTextInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setProblem(null);
    setSteps([]);
    setVisibleStepCount(0);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        try {
           const extractedProblem = await extractLPFromImage(base64Data, mimeType);
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

  const handleManualSolve = (p: LPProblem) => {
      setProblem(p);
  };

  const handleSolve = () => {
    if (!problem) return;
    try {
        const solutionSteps = LPEngine.solve(problem, selectedMethod);
        setSteps(solutionSteps);
        setVisibleStepCount(1); // Start with just the first step (setup)
        
        // Scroll to start of solution
        setTimeout(() => {
            const el = document.getElementById('solution-start');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } catch (e: any) {
        setError("Solver error: " + e.message);
    }
  };

  const handleShowNextStep = () => {
      if (visibleStepCount < steps.length) {
          setVisibleStepCount(prev => prev + 1);
          // Scroll to the new step
          setTimeout(() => {
              bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }, 100);
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
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="bg-primary-600 dark:bg-primary-900 text-white p-4 shadow-md sticky top-0 z-50 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                <h1 className="text-xl font-bold tracking-tight">OperationResearch Solver AI</h1>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-full hover:bg-white/10 transition"
                    title="Toggle Theme"
                >
                    {darkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
                </button>
                {problem && (
                    <button onClick={reset} className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded transition flex items-center gap-1 font-medium">
                        <RotateCcw className="w-3 h-3"/> New Problem
                    </button>
                )}
            </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        
        {/* INPUT SECTION - Only show if no problem extracted yet */}
        {!problem && (
          <div className="flex flex-col items-center justify-start pt-10 animate-in fade-in duration-500 min-h-[60vh]">
            
            {/* Tabs */}
            <div className="flex space-x-2 bg-white dark:bg-slate-800 p-1 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
                <button 
                    onClick={() => setInputMode('image')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition ${inputMode === 'image' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    <Camera className="w-4 h-4"/> Scan Image
                </button>
                <button 
                    onClick={() => setInputMode('text')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition ${inputMode === 'text' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    <Edit3 className="w-4 h-4"/> Text Problem
                </button>
                <button 
                    onClick={() => setInputMode('manual')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition ${inputMode === 'manual' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    <Keyboard className="w-4 h-4"/> Manual Entry
                </button>
            </div>

            <div className="w-full max-w-2xl">
                {/* IMAGE MODE */}
                {inputMode === 'image' && (
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Camera className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Scan Your Problem</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">Upload an image of a linear programming problem (handwritten or printed).</p>
                        
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Analyzing...' : 'Upload Image'}
                        </button>
                    </div>
                )}

                {/* TEXT MODE */}
                {inputMode === 'text' && (
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-300">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Describe the Problem</h2>
                        <textarea 
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Example: Maximize Z = 3x + 5y subject to x + y <= 4 and 2x + 3y <= 12..."
                            className="w-full h-40 p-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-4"
                        />
                        <button 
                            onClick={handleTextSubmit}
                            disabled={isLoading || !textInput.trim()}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-all disabled:opacity-50"
                        >
                             {isLoading ? 'Processing...' : 'Analyze Text'}
                        </button>
                    </div>
                )}

                {/* MANUAL MODE */}
                {inputMode === 'manual' && (
                    <ManualBuilder onSolve={handleManualSolve} />
                )}

                {error && <p className="mt-6 text-red-500 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900">{error}</p>}
            </div>
          </div>
        )}

        {/* REVIEW & SOLVE SECTION - ALWAYS VISIBLE if Problem Exists */}
        {problem && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500 max-w-6xl mx-auto mb-10">
                <div className="grid md:grid-cols-2 gap-6 items-start">
                    
                    {/* LEFT COLUMN: Problem Source */}
                    <div className="space-y-6">
                        {/* Source Preview */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                             <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-primary-500" />
                                Original Question
                             </h3>
                             <div className="bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center min-h-[150px]">
                                {inputMode === 'image' && imagePreview && (
                                    <img src={imagePreview} alt="Problem Source" className="w-full h-auto max-h-64 object-contain" />
                                )}
                                {inputMode === 'text' && textInput && (
                                    <div className="p-4 text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap w-full">
                                        {textInput}
                                    </div>
                                )}
                                {inputMode === 'manual' && (
                                    <div className="p-4 text-slate-500 dark:text-slate-400 text-sm italic">
                                        Problem entered manually via form builder.
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Math Model, Controls, and Graph */}
                    <div className="space-y-6">
                        {/* Math Model & Controls */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500"/> 
                                Mathematical Model
                            </h2>
                            
                            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-sm mb-6">
                                <div className="font-bold text-primary-700 dark:text-primary-400 mb-2 text-lg">
                                    {problem.type} Z = {problem.objectiveCoefficients.map((c, i) => `${c < 0 ? `(${c})` : c}${problem.variables[i]}`).join(' + ')}
                                </div>
                                <div className="text-slate-600 dark:text-slate-400 mb-2 font-semibold">Subject to:</div>
                                {problem.constraints.map((c, i) => (
                                    <div key={i} className="ml-4 text-slate-800 dark:text-slate-300 mb-1">
                                        {c.coefficients.map((coef, idx) => `${coef}${problem.variables[idx]}`).join(' + ')} {c.sign} {c.rhs}
                                    </div>
                                ))}
                                <div className="ml-4 text-slate-400 mt-2 italic">{problem.variables.join(', ')} &ge; 0</div>
                            </div>

                            {/* Method Selector */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Select Solution Method</label>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {Object.values(SolverMethod).map(method => (
                                        <button 
                                            key={method}
                                            onClick={() => setSelectedMethod(method)}
                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                                                selectedMethod === method 
                                                ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300 shadow-sm ring-1 ring-primary-500' 
                                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'
                                            }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>

                                <button 
                                    onClick={handleSolve}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition transform hover:scale-[1.01] flex items-center justify-center gap-2"
                                >
                                    {steps.length > 0 ? <RefreshCw className="w-5 h-5"/> : <Play className="w-5 h-5" />}
                                    {steps.length > 0 ? 'Resolve with Selected Method' : 'Solve Step-by-Step'}
                                </button>
                            </div>
                        </div>

                        {/* Graph Preview (Only for 2 vars) - Placed AFTER Math Model and controls */}
                        {problem.variables.length === 2 && (
                             <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                <div className="flex items-center gap-2 px-2 py-1 mb-2 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                                    <BarChart2 className="w-4 h-4" /> Graphical Visualization
                                </div>
                                <Graph2D problem={problem} />
                             </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* SOLUTION STEPS SECTION */}
        {steps.length > 0 && (
            <div id="solution-start" className="space-y-8 pb-32 animate-in fade-in duration-700 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-700 pt-10 mt-10">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Solution Steps</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg mt-2">
                        Optimization using <span className="font-bold text-primary-600 dark:text-primary-400">{selectedMethod}</span> method.
                    </p>
                </div>

                {/* Step List (Vertical Timeline) */}
                <div className="space-y-12">
                    {steps.slice(0, visibleStepCount).map((step, idx) => (
                        <div key={idx} className="animate-in slide-in-from-bottom-8 fade-in duration-700 relative">
                             {/* Connector Line (except for last visible step if complete) */}
                             {idx < visibleStepCount - 1 && (
                                <div className="absolute left-8 top-full h-12 w-0.5 bg-slate-300 dark:bg-slate-600 -ml-px z-0"></div>
                             )}
                            <TableauStep step={step} />
                        </div>
                    ))}
                    
                    {/* Dummy div for scrolling to bottom */}
                    <div ref={bottomRef} />
                </div>

                {/* Next Step Action */}
                {visibleStepCount < steps.length && (
                    <div className="flex justify-center pt-8">
                        <button 
                            onClick={handleShowNextStep}
                            className="group flex flex-col items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 px-8 py-4 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
                        >
                            <span className="font-bold text-lg">Show Next Iteration</span>
                            <ArrowDown className="w-6 h-6 animate-bounce text-primary-500" />
                        </button>
                    </div>
                )}
                
                {visibleStepCount >= steps.length && (
                     <div className="flex justify-center pt-10 text-slate-400 text-sm font-medium uppercase tracking-widest">
                        End of Solution
                     </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};

export default App;