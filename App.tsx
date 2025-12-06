import React, { useState, useRef, useEffect } from 'react';
import { extractLPFromImage, extractLPFromText } from './services/geminiService';
import { LPProblem, SolverMethod, SolverStep } from './types';
import { LPEngine } from './services/lpEngine';
import TableauStep from './components/TableauStep';
import Graph2D from './components/Graph2D';
import ManualBuilder from './components/ManualBuilder';
import { Camera, FileText, Play, CheckCircle, RotateCcw, Moon, Sun, Edit3, Keyboard, RefreshCw, Eye, ArrowDown, BarChart2, Layers } from 'lucide-react';

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
  const [visibleStepCount, setVisibleStepCount] = useState(0); 
  const [selectedMethod, setSelectedMethod] = useState<SolverMethod>(SolverMethod.SIMPLEX);
  const [textInput, setTextInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

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
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      <header className="bg-primary-600 dark:bg-primary-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                <h1 className="text-xl font-bold tracking-tight">OperationResearch Solver AI</h1>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-white/10 transition">
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
        
        {/* INPUT SECTION */}
        {!problem && (
          <div className="flex flex-col items-center pt-10 animate-in fade-in duration-500">
            <div className="flex space-x-2 bg-white dark:bg-slate-800 p-1 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
                {['image', 'text', 'manual'].map(m => (
                    <button 
                        key={m}
                        onClick={() => setInputMode(m as InputMode)}
                        className={`capitalize flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition ${inputMode === m ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
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
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-center">
                        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Camera className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Scan Your Problem</h2>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg shadow mt-6 disabled:opacity-50">
                            {isLoading ? 'Analyzing...' : 'Upload Image'}
                        </button>
                    </div>
                )}

                {inputMode === 'text' && (
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                        <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Maximize Z = 3x + 5y..." className="w-full h-40 p-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 mb-4" />
                        <button onClick={handleTextSubmit} disabled={isLoading || !textInput.trim()} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg shadow disabled:opacity-50">
                             {isLoading ? 'Processing...' : 'Analyze Text'}
                        </button>
                    </div>
                )}

                {inputMode === 'manual' && <ManualBuilder onSolve={handleManualSolve} />}

                {error && <p className="mt-6 text-red-500 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900">{error}</p>}
            </div>
          </div>
        )}

        {/* WORKSPACE (If Problem Exists) */}
        {problem && (
            <div className="grid lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-500 mb-20">
                {/* Left Col: Source & Preview */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                         <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-primary-500" /> Source
                         </h3>
                         <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 min-h-[100px] flex items-center justify-center">
                            {inputMode === 'image' && imagePreview ? <img src={imagePreview} className="max-h-48 object-contain"/> : <p className="text-sm italic text-slate-500">{inputMode === 'manual' ? 'Manual Entry' : textInput}</p>}
                         </div>
                    </div>
                    
                    {/* Math Model */}
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500"/> Mathematical Model
                        </h2>
                        <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-sm">
                            <div className="font-bold text-primary-700 dark:text-primary-400 mb-2">
                                {problem.type} Z = {problem.objectiveCoefficients.map((c, i) => `${c}${problem.variables[i]}`).join(' + ')}
                            </div>
                            <div className="text-slate-600 dark:text-slate-400 mb-2 font-semibold">Subject to:</div>
                            {problem.constraints.map((c, i) => (
                                <div key={i} className="ml-4 text-slate-800 dark:text-slate-300 mb-1">
                                    {c.coefficients.map((coef, idx) => `${coef}${problem.variables[idx]}`).join(' + ')} {c.sign} {c.rhs}
                                </div>
                            ))}
                        </div>

                        {/* Controls */}
                        <div className="mt-6">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Method</label>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {Object.values(SolverMethod).map(method => (
                                    <button 
                                        key={method}
                                        onClick={() => setSelectedMethod(method)}
                                        className={`px-3 py-1.5 rounded-md border text-sm font-medium transition ${selectedMethod === method ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-white border-slate-300 text-slate-600 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'}`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
                            <button onClick={handleSolve} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center justify-center gap-2">
                                {steps.length > 0 ? <RefreshCw className="w-5 h-5"/> : <Play className="w-5 h-5" />} Solve
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Col: Graph */}
                <div className="space-y-6">
                    {problem.variables.length === 2 ? (
                         <div className="bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 h-fit">
                            <div className="flex items-center gap-2 px-3 py-2 mb-2 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                                <BarChart2 className="w-4 h-4" /> Graphical Visualization
                            </div>
                            <Graph2D problem={problem} />
                         </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500">
                            Graphing available for 2-variable problems.
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* STEPS TIMELINE */}
        {steps.length > 0 && (
            <div id="solution-start" className="max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-700 pt-12 pb-32">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">Solution Steps</h2>
                <div className="space-y-10">
                    {steps.slice(0, visibleStepCount).map((step, idx) => (
                        <div key={idx} className="animate-in slide-in-from-bottom-8 fade-in duration-700 relative">
                             {idx < visibleStepCount - 1 && <div className="absolute left-6 md:left-8 top-full h-10 w-0.5 bg-slate-300 dark:bg-slate-600 z-0"></div>}
                            <TableauStep step={step} />
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
                {visibleStepCount < steps.length && (
                    <div className="flex justify-center pt-8">
                        <button onClick={handleShowNextStep} className="flex flex-col items-center gap-2 text-slate-500 hover:text-primary-600 transition">
                            <span className="font-bold">Next Step</span>
                            <ArrowDown className="w-6 h-6 animate-bounce" />
                        </button>
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};

export default App;