import React, { useState, useRef, useEffect } from 'react';
import { extractLPFromImage, extractLPFromText } from './services/geminiService';
import { LPProblem, SolverMethod, SolverStep } from './types';
import { LPEngine } from './services/lpEngine';
import TableauStep from './components/TableauStep';
import Graph2D from './components/Graph2D';
import ManualBuilder from './components/ManualBuilder';
import { Camera, FileText, Play, ChevronRight, ChevronLeft, CheckCircle, RotateCcw, Moon, Sun, Edit3, Keyboard } from 'lucide-react';

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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<SolverMethod>(SolverMethod.SIMPLEX);
  const [textInput, setTextInput] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setCurrentStepIndex(0);

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
        setCurrentStepIndex(0);
    } catch (e: any) {
        setError("Solver error: " + e.message);
    }
  };

  const reset = () => {
    setProblem(null);
    setSteps([]);
    setError(null);
    setTextInput("");
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
        
        {/* INPUT SECTION */}
        {!problem && (
          <div className="flex flex-col items-center justify-start pt-10 animate-fade-in min-h-[60vh]">
            
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
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-center">
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
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
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

        {/* REVIEW & SOLVE SECTION */}
        {problem && steps.length === 0 && (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500"/> 
                        Problem Setup
                    </h2>
                    
                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-sm">
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
                    <div className="mt-8">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Select Solution Method</label>
                        <div className="flex flex-wrap gap-3">
                            {Object.values(SolverMethod).map(method => (
                                <button 
                                    key={method}
                                    onClick={() => setSelectedMethod(method)}
                                    className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition ${
                                        selectedMethod === method 
                                        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300 shadow-sm ring-1 ring-primary-500' 
                                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'
                                    }`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleSolve}
                        className="mt-8 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                        <Play className="w-5 h-5" /> Solve Step-by-Step
                    </button>
                </div>

                {/* Show Graph Preview for 2 vars */}
                {problem.variables.length === 2 && (
                    <Graph2D problem={problem} />
                )}
            </div>
        )}

        {/* SOLUTION STEPS SECTION */}
        {steps.length > 0 && (
            <div className="space-y-6 pb-20 animate-fade-in max-w-6xl mx-auto">
                {/* Controls */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-20 z-40">
                    <div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Step</span>
                        <div className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none mt-1">{currentStepIndex + 1} <span className="text-slate-300 dark:text-slate-600 text-lg">/ {steps.length}</span></div>
                    </div>
                    <div className="flex gap-3">
                         <button 
                            disabled={currentStepIndex === 0}
                            onClick={() => setCurrentStepIndex(p => Math.max(0, p - 1))}
                            className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200"
                         >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button 
                            disabled={currentStepIndex === steps.length - 1}
                            onClick={() => setCurrentStepIndex(p => Math.min(steps.length - 1, p + 1))}
                            className="p-3 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-110 active:scale-95"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tableau Display */}
                <TableauStep step={steps[currentStepIndex]} />

                {/* Contextual Info */}
                <div className="grid md:grid-cols-2 gap-4">
                     <div className="bg-primary-50 dark:bg-primary-900/20 p-5 rounded-lg border border-primary-100 dark:border-primary-800 text-sm text-primary-900 dark:text-primary-100">
                        <h5 className="font-bold mb-2 text-primary-800 dark:text-primary-300 text-base">Analysis</h5>
                        <p className="leading-relaxed">{steps[currentStepIndex].description}</p>
                        {steps[currentStepIndex].enteringVar && (
                            <div className="mt-3 bg-white dark:bg-slate-800 p-3 rounded border border-primary-100 dark:border-primary-900/50 shadow-sm">
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span>Entering: <strong>{steps[currentStepIndex].enteringVar}</strong> <span className="text-slate-500 dark:text-slate-400 text-xs">(Improves Z)</span></span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        <span>Leaving: <strong>{steps[currentStepIndex].leavingVar}</strong> <span className="text-slate-500 dark:text-slate-400 text-xs">(Tightest Constraint)</span></span>
                                    </li>
                                </ul>
                            </div>
                        )}
                     </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;
