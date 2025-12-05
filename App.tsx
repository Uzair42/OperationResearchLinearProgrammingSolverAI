import React, { useState, useRef } from 'react';
import { extractLPFromImage } from './services/geminiService';
import { LPProblem, SolverMethod, SolverStep } from './types';
import { LPEngine } from './services/lpEngine';
import TableauStep from './components/TableauStep';
import Graph2D from './components/Graph2D';
import { Camera, FileText, Play, ChevronRight, ChevronLeft, CheckCircle, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problem, setProblem] = useState<LPProblem | null>(null);
  const [steps, setSteps] = useState<SolverStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<SolverMethod>(SolverMethod.SIMPLEX);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Strip prefix (e.g. "data:image/jpeg;base64,")
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
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                <h1 className="text-xl font-bold tracking-tight">OptiSolve AI</h1>
            </div>
            {problem && (
                <button onClick={reset} className="text-sm bg-indigo-500 hover:bg-indigo-400 px-3 py-1 rounded transition flex items-center gap-1">
                    <RotateCcw className="w-3 h-3"/> New Problem
                </button>
            )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        
        {/* Step 1: Upload */}
        {!problem && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-100 text-center max-w-md w-full">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Scan Your Math Problem</h2>
                <p className="text-slate-500 mb-6">Upload an image of a linear programming problem. We'll extract it and solve it step-by-step.</p>
                
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
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Analyzing...' : 'Upload Image'}
                </button>
                {error && <p className="mt-4 text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Review & Solve */}
        {problem && steps.length === 0 && (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500"/> 
                        Problem Extracted
                    </h2>
                    
                    <div className="bg-slate-50 p-4 rounded border border-slate-200 font-mono text-sm">
                        <div className="font-bold text-indigo-700 mb-2">{problem.type} Z = {problem.objectiveCoefficients.map((c, i) => `${c}${problem.variables[i]}`).join(' + ')}</div>
                        <div className="text-slate-600 mb-1">Subject to:</div>
                        {problem.constraints.map((c, i) => (
                            <div key={i} className="ml-4">
                                {c.coefficients.map((coef, idx) => `${coef}${problem.variables[idx]}`).join(' + ')} {c.sign} {c.rhs}
                            </div>
                        ))}
                         <div className="ml-4 text-slate-400 mt-1">{problem.variables.join(', ')} &ge; 0</div>
                    </div>

                    {/* Method Selector */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Solution Method</label>
                        <div className="flex gap-3">
                            {Object.values(SolverMethod).map(method => (
                                <button 
                                    key={method}
                                    onClick={() => setSelectedMethod(method)}
                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                                        selectedMethod === method 
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleSolve}
                        className="mt-6 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition flex items-center justify-center gap-2"
                    >
                        <Play className="w-4 h-4" /> Solve Problem
                    </button>
                </div>

                {/* Show Graph Preview for 2 vars */}
                {problem.variables.length === 2 && (
                    <Graph2D problem={problem} />
                )}
            </div>
        )}

        {/* Step 3: Visualization */}
        {steps.length > 0 && (
            <div className="space-y-6 pb-20 animate-fade-in">
                {/* Controls */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between sticky top-20 z-40">
                    <div>
                        <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Step</span>
                        <div className="text-2xl font-bold text-slate-900">{currentStepIndex + 1} <span className="text-slate-300">/</span> {steps.length}</div>
                    </div>
                    <div className="flex gap-2">
                         <button 
                            disabled={currentStepIndex === 0}
                            onClick={() => setCurrentStepIndex(p => Math.max(0, p - 1))}
                            className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition border border-slate-200"
                         >
                            <ChevronLeft className="w-6 h-6 text-slate-700" />
                        </button>
                        <button 
                            disabled={currentStepIndex === steps.length - 1}
                            onClick={() => setCurrentStepIndex(p => Math.min(steps.length - 1, p + 1))}
                            className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-110 active:scale-95"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tableau Display */}
                <TableauStep step={steps[currentStepIndex]} />

                {/* Contextual Info */}
                <div className="grid md:grid-cols-2 gap-4">
                     <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                        <h5 className="font-bold mb-1">What's happening?</h5>
                        {steps[currentStepIndex].description}
                        {steps[currentStepIndex].enteringVar && (
                            <ul className="list-disc ml-4 mt-2 space-y-1">
                                <li>Entering Variable (New Basis): <strong>{steps[currentStepIndex].enteringVar}</strong> (Highest impact on Z)</li>
                                <li>Leaving Variable: <strong>{steps[currentStepIndex].leavingVar}</strong> (Limiting Constraint)</li>
                            </ul>
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
