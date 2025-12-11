
import React, { useState, useRef, useEffect } from 'react';
import { extractProblemUniversal } from './services/geminiService';
import { 
  LPProblem, SolverMethod, SolverStep, HistoryItem, BusinessModel, 
  NetworkTask, NetworkResult, TransportationInput, TransportationResult, 
  AssignmentInput, AssignmentResult, QueuingInput, QueuingResult, 
  UniversalProblemResult, GameTheoryInput, GameTheoryResult, ShortestPathInput, ShortestPathResult, MinimaxResult,
  UserPersona, UserProfile, Notification, NeuralModelConfig
} from './types';
import { LPEngine } from './services/lpEngine';
import { NetworkEngine } from './services/networkEngine';
import { TransportationEngine } from './services/transportationEngine';
import { AssignmentEngine } from './services/assignmentEngine';
import { QueuingEngine } from './services/queuingEngine';
import { GameTheoryEngine } from './services/gameTheoryEngine';

// Components
import SettingsPage from './components/SettingsPage';
import PricingModal from './components/PricingModal';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardHome from './components/DashboardHome';
import TableauStep from './components/TableauStep';
import Graph2D from './components/Graph2D';
import ManualBuilder from './components/ManualBuilder';
import ManagerBuilder from './components/ManagerBuilder';
import BusinessInsights from './components/BusinessInsights';
import NetworkBuilder from './components/NetworkBuilder';
import NetworkGraph from './components/NetworkGraph';
import NetworkResults from './components/NetworkResults';
import TransportationBuilder from './components/TransportationBuilder';
import TransportationResults from './components/TransportationResults';
import AssignmentBuilder from './components/AssignmentBuilder';
import AssignmentResults from './components/AssignmentResults';
import QueuingBuilder from './components/QueuingBuilder';
import QueuingResults from './components/QueuingResults';
import GameTheoryBuilder from './components/GameTheoryBuilder';
import GameTheoryResults from './components/GameTheoryResults';
import ShortestPathBuilder from './components/ShortestPathBuilder';
import ShortestPathResults from './components/ShortestPathResults';
import MinimaxBuilder from './components/MinimaxBuilder';
import MinimaxResults from './components/MinimaxResults';
import NeuralBuilder from './components/NeuralBuilder';
import ModelExporter from './components/ModelExporter';
import AILearningHub from './components/AILearningHub';

// Icons & Utils
import { 
  History, Save, Trash2, RotateCcw, 
  Download, Printer, FileJson, Loader2, Camera, 
  Play, BookOpen, AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

type ColorTheme = 'violet' | 'blue' | 'emerald' | 'rose';

const App: React.FC = () => {
  // --- Auth & User State (Default user initialized) ---
  const [user, setUser] = useState<UserProfile | null>({
      id: 'default-user',
      name: 'Muhammad Uzair',
      email: 'mu.uzair@example.com',
      role: 'learner', // Default role
      avatarInitials: 'MU',
      isPremium: false,
      companyName: 'Tech Startup'
  });
  const [showPricing, setShowPricing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
      { id: '1', title: 'Welcome!', message: 'Get started with the new Business features.', time: 'Just now', read: false, type: 'info' },
      { id: '2', title: 'System Update', message: 'Solver engine upgraded to v2.0.', time: '2 hrs ago', read: false, type: 'success' }
  ]);

  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'settings', or specific tool
  const [persona, setPersona] = useState<UserPersona>('student');
  const [showHistory, setShowHistory] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [colorTheme, setColorTheme] = useState<ColorTheme>('violet');

  // --- Solver Data State ---
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Solvers
  const [problem, setProblem] = useState<LPProblem | null>(null);
  const [businessModel, setBusinessModel] = useState<BusinessModel | null>(null);
  const [steps, setSteps] = useState<SolverStep[]>([]);
  const [visibleStepCount, setVisibleStepCount] = useState(0); 
  const [selectedMethod, setSelectedMethod] = useState<SolverMethod>(SolverMethod.SIMPLEX);
  
  const [networkData, setNetworkData] = useState<{tasks: NetworkTask[], result: NetworkResult} | null>(null);
  const [transportationData, setTransportationData] = useState<{input: TransportationInput, result: TransportationResult} | null>(null);
  const [assignmentData, setAssignmentData] = useState<{input: AssignmentInput, result: AssignmentResult} | null>(null);
  const [queuingData, setQueuingData] = useState<{input: QueuingInput, result: QueuingResult} | null>(null);
  const [gameTheoryData, setGameTheoryData] = useState<{input: GameTheoryInput, result: GameTheoryResult} | null>(null);
  const [shortestPathData, setShortestPathData] = useState<{input: ShortestPathInput, result: ShortestPathResult} | null>(null);
  const [minimaxData, setMinimaxData] = useState<{result: MinimaxResult} | null>(null);
  const [neuralModelData, setNeuralModelData] = useState<NeuralModelConfig | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // --- Theme Effect ---
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // --- Auth Handling (Mock) ---
  const handleLogout = () => {
      // Since actual login is removed, logout just resets user to default or shows a message
      alert("Logged out (Mock functionality)");
      // setUser(null); // Uncomment to show empty state if desired, but request was to remove login page
  };

  const handleUpgrade = () => {
      if(user) {
          setUser({ ...user, isPremium: true });
          setShowPricing(false);
          setNotifications(prev => [{
              id: Date.now().toString(),
              title: 'Premium Activated',
              message: 'Thank you for upgrading! All features unlocked.',
              time: 'Just now',
              read: false,
              type: 'success'
          }, ...prev]);
      }
  };

  // --- Search Logic ---
  const handleSearch = (query: string) => {
      const q = query.toLowerCase();
      let found = false;
      
      if (q.includes('linear') || q.includes('simplex') || q.includes('optimization')) {
          setActiveTab('manual');
          found = true;
      } else if (q.includes('net') || q.includes('pert') || q.includes('cpm') || q.includes('project')) {
          setActiveTab('network');
          found = true;
      } else if (q.includes('transport') || q.includes('logistics') || q.includes('supply')) {
          setActiveTab('transportation');
          found = true;
      } else if (q.includes('assign') || q.includes('job') || q.includes('worker')) {
          setActiveTab('assignment');
          found = true;
      } else if (q.includes('queue') || q.includes('waiting') || q.includes('mm1')) {
          setActiveTab('queuing');
          found = true;
      } else if (q.includes('game') || q.includes('strategy') || q.includes('nash')) {
          setActiveTab('game_theory');
          found = true;
      } else if (q.includes('path') || q.includes('route') || q.includes('dijkstra')) {
          setActiveTab('shortest_path');
          found = true;
      } else if (q.includes('minimax') || q.includes('alpha') || q.includes('tree')) {
          setActiveTab('minimax');
          found = true;
      } else if (q.includes('neural') || q.includes('deep learning') || q.includes('ai')) {
          setActiveTab('neural_network');
          found = true;
      }

      if (!found) {
          setNotifications(prev => [{
              id: Date.now().toString(),
              title: 'Search Result',
              message: `No specific tool found for "${query}". Try keywords like "Simplex", "Transport", or "Game".`,
              time: 'Just now',
              read: false,
              type: 'warning'
          }, ...prev]);
      }
  };

  // --- Persistence ---
  useEffect(() => {
      const stored = localStorage.getItem('solver_history');
      if (stored) {
          try { setHistory(JSON.parse(stored)); } catch (e) { console.error(e); }
      }
  }, []);

  const saveToHistory = (item: Partial<HistoryItem>) => {
      const newItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          method: 'Simplex',
          ...item
      } as HistoryItem;
      const updated = [newItem, ...history].slice(0, 50);
      setHistory(updated);
      localStorage.setItem('solver_history', JSON.stringify(updated));
  };

  // --- Universal Solve Handler (Resetting logic) ---
  const resetAllSolvers = () => {
    setProblem(null);
    setBusinessModel(null);
    setSteps([]);
    setNetworkData(null);
    setTransportationData(null);
    setAssignmentData(null);
    setQueuingData(null);
    setGameTheoryData(null);
    setShortestPathData(null);
    setMinimaxData(null);
    setNeuralModelData(null);
    setError(null);
  };

  // --- Input Handlers ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    resetAllSolvers();
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        try {
           const result = await extractProblemUniversal({ image: base64Data, mime: file.type });
           dispatchUniversalResult(result);
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

  const dispatchUniversalResult = (res: UniversalProblemResult) => {
      if (res.category === 'LINEAR_PROGRAMMING' && res.lp) {
          setActiveTab('manual');
          setProblem(res.lp);
          setTimeout(() => handleLPSolve(res.lp, SolverMethod.SIMPLEX), 100);
      } else if (res.category === 'NETWORK' && res.network) {
          setActiveTab('network');
          const result = NetworkEngine.calculatePERT(res.network);
          setNetworkData({ tasks: res.network, result });
      } else if (res.category === 'TRANSPORTATION' && res.transportation) {
          setActiveTab('transportation');
          const result = TransportationEngine.solveVAM(res.transportation);
          setTransportationData({ input: res.transportation, result });
      } else if (res.category === 'ASSIGNMENT' && res.assignment) {
          setActiveTab('assignment');
          const result = AssignmentEngine.solveHungarian(res.assignment);
          setAssignmentData({ input: res.assignment, result });
      } else if (res.category === 'QUEUING' && res.queuing) {
          setActiveTab('queuing');
          const result = QueuingEngine.solveMM1(res.queuing);
          setQueuingData({ input: res.queuing, result });
      } else if (res.category === 'GAME_THEORY' && res.gameTheory) {
          setActiveTab('game_theory');
          const result = GameTheoryEngine.solve(res.gameTheory);
          setGameTheoryData({ input: res.gameTheory, result });
      }
  };

  // --- Specific Solvers ---
  const handleLPSolve = (prob: LPProblem, method: SolverMethod, model?: BusinessModel) => {
      resetAllSolvers();
      setProblem(prob);
      setSelectedMethod(method);
      if(model) setBusinessModel(model);
      try {
          const solutionSteps = LPEngine.solve(prob, method);
          setSteps(solutionSteps);
          setVisibleStepCount(1);
          if(!model) saveToHistory({ problem: prob, method: method });
      } catch (e: any) { setError(e.message); }
  };

  // --- Render Helpers ---
  const renderActiveTool = () => {
    switch(activeTab) {
      case 'dashboard':
        return <DashboardHome persona={persona} onNavigate={setActiveTab} />;
      
      case 'settings':
        return (
            <SettingsPage 
                user={user!} 
                onUpdateUser={(upd) => setUser(prev => ({...prev!, ...upd}))}
                onLogout={handleLogout}
                onOpenPricing={() => setShowPricing(true)}
            />
        );

      case 'manual':
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-2">
            <ContextHeader 
              persona={persona} 
              title="Linear Programming Solver" 
              descStudent="Use the Simplex, Big M, or Two-Phase methods to solve LP problems with full tableau iterations."
              descBusiness="Optimize resource allocation to maximize profit or minimize costs under specific operational limits."
            />
            {persona === 'business' ? (
                <ManagerBuilder onSolve={(p, m) => handleLPSolve(p, SolverMethod.SIMPLEX, m)} />
            ) : (
                <ManualBuilder onSolve={(p, m) => handleLPSolve(p, m)} />
            )}
            
            {/* LP RESULTS */}
            {problem && (
                <div className="space-y-8 mt-8 pb-20">
                    {/* Business Insights (Business Mode) */}
                    {persona === 'business' && businessModel && steps.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <BusinessInsights model={businessModel} finalStep={steps[steps.length - 1]} />
                        </div>
                    )}

                    {/* Step-by-Step (Student Mode mainly, but available) */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                             {/* Problem Statement Card */}
                             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h3 className="font-bold mb-4">Mathematical Model</h3>
                                <div className="font-mono text-sm bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                                    <div className="font-bold text-primary-600 mb-2">
                                        {problem.type} Z = {problem.objectiveCoefficients.map((c, i) => `${c}${problem.variables[i]}`).join(' + ')}
                                    </div>
                                    <div className="text-slate-500 mb-1">Subject to:</div>
                                    {problem.constraints.map((c, i) => (
                                        <div key={i}>{c.coefficients.map((coef, idx) => `${coef}${problem.variables[idx]}`).join(' + ')} {c.sign} {c.rhs}</div>
                                    ))}
                                </div>
                             </div>
                        </div>
                        {/* Graph */}
                        {problem.variables.length === 2 && (
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <Graph2D problem={problem} />
                            </div>
                        )}
                    </div>

                    {/* Tableaux Steps */}
                    {steps.length > 0 && (
                        <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold">Simplex Iterations</h3>
                                    <p className="text-sm text-slate-500">Method: {selectedMethod}</p>
                                </div>
                                {visibleStepCount < steps.length && (
                                    <button onClick={() => setVisibleStepCount(p => p+1)} className="text-sm font-bold text-primary-600 bg-primary-50 px-4 py-2 rounded-lg hover:bg-primary-100">
                                        Next Step &darr;
                                    </button>
                                )}
                            </div>
                            <div className="space-y-8">
                                {steps.slice(0, visibleStepCount).map((step, i) => (
                                    <TableauStep key={i} step={step} />
                                ))}
                                <div ref={bottomRef}/>
                            </div>
                        </div>
                    )}
                </div>
            )}
          </div>
        );

      case 'network':
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-2">
            <ContextHeader 
              persona={persona} title="PERT / CPM Analysis"
              descStudent="Calculate Early/Late start times, slack, and identify the Critical Path in a project network."
              descBusiness="Manage project timelines, identify bottlenecks, and calculate completion probability."
            />
            <NetworkBuilder onSolve={(t, r) => { resetAllSolvers(); setNetworkData({tasks: t, result: r}); }} />
            {networkData && (
                <div className="mt-8 space-y-8 pb-20">
                    <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-[500px]">
                        <NetworkGraph tasks={networkData.tasks} result={networkData.result} />
                    </div>
                    <NetworkResults result={networkData.result} tasks={networkData.tasks} />
                </div>
            )}
          </div>
        );

      case 'shortest_path':
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-2">
                <ContextHeader persona={persona} title="Shortest Path Optimization"
                    descStudent="Visualize Dijkstra's Algorithm step-by-step to find the shortest path in a graph."
                    descBusiness="Optimize delivery routes and network data flow to minimize distance or cost."
                />
                <ShortestPathBuilder onSolve={(i, r) => { resetAllSolvers(); setShortestPathData({input: i, result: r}); }} />
                {shortestPathData && <ShortestPathResults input={shortestPathData.input} result={shortestPathData.result} />}
            </div>
        );

      case 'transportation':
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-2">
                <ContextHeader persona={persona} title="Transportation Model" 
                    descStudent="Balance supply and demand using NWCR, LCM, or Vogel's Approximation Method."
                    descBusiness="Minimize shipping costs across your supply chain network efficiently."
                />
                <TransportationBuilder onSolve={(i, r) => { resetAllSolvers(); setTransportationData({input: i, result: r}); }} />
                {transportationData && <TransportationResults input={transportationData.input} result={transportationData.result} />}
            </div>
        );

      case 'assignment':
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-2">
                <ContextHeader persona={persona} title="Assignment Problem"
                    descStudent="Apply the Hungarian Method to solve one-to-one assignment matrices."
                    descBusiness="Optimally assign tasks to employees or jobs to machines to maximize efficiency."
                />
                <AssignmentBuilder onSolve={(i, r) => { resetAllSolvers(); setAssignmentData({input: i, result: r}); }} />
                {assignmentData && <AssignmentResults input={assignmentData.input} result={assignmentData.result} />}
            </div>
        );

      case 'queuing':
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-2">
                <ContextHeader persona={persona} title="Queuing Theory (M/M/1)"
                    descStudent="Study arrival and service rates to calculate Queue Length (Lq) and Waiting Time (Wq)."
                    descBusiness="Optimize service levels and reduce customer wait times."
                />
                <QueuingBuilder onSolve={(i, r) => { resetAllSolvers(); setQueuingData({input: i, result: r}); }} />
                {queuingData && <QueuingResults input={queuingData.input} result={queuingData.result} />}
            </div>
        );

      case 'game_theory':
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-2">
                <ContextHeader persona={persona} title="Game Theory Strategy"
                    descStudent="Analyze Payoff Matrices, Saddle Points, and Dominance Principles."
                    descBusiness="Formulate competitive strategies for market entry or advertising."
                />
                <GameTheoryBuilder onSolve={(i, r) => { resetAllSolvers(); setGameTheoryData({input: i, result: r}); }} />
                {gameTheoryData && <GameTheoryResults input={gameTheoryData.input} result={gameTheoryData.result} />}
            </div>
        );

      case 'minimax':
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-2">
                <ContextHeader persona={persona} title="Decision Trees & Adversarial Search"
                    descStudent="Explore Minimax and Alpha-Beta pruning algorithms in game trees."
                    descBusiness="Model competitive scenarios and predict competitor moves to maximize payoffs."
                />
                <MinimaxBuilder onSolve={(result) => { resetAllSolvers(); setMinimaxData({result}); }} />
                {minimaxData && <MinimaxResults result={minimaxData.result} />}
            </div>
        );

      case 'neural_network':
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-2">
                <ContextHeader persona={persona} title="Neural Network Architect"
                    descStudent="Design Deep Learning architectures layer-by-layer. Visualize tensor flow and activation functions."
                    descBusiness="Prototype AI solutions for Churn Prediction, Regression, or Classification and export production code."
                />
                <NeuralBuilder 
                    persona={persona} 
                    isPremium={user?.isPremium || false}
                    onExport={(config) => { 
                        resetAllSolvers(); 
                        setNeuralModelData(config); 
                        // Scroll to exporter
                        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
                    }} 
                />
                {neuralModelData && (
                    <div className="mt-8">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Deployment Ready Code</h3>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold uppercase">Generated</span>
                        </div>
                        <ModelExporter config={neuralModelData} />
                    </div>
                )}
            </div>
        );

      case 'ai_learning':
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-2">
                <AILearningHub isPremium={user?.isPremium || false} />
            </div>
        );

      default: return null;
    }
  };

  // If user wasn't initialized by default, this would handle login view.
  // But we default to a user now to skip login.
  if (!user) return null; // Should not happen with current logic

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 overflow-hidden">
        
        {/* PDF Loading Overlay */}
        {isPdfLoading && (
            <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl text-center">
                    <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-4" />
                    <h3 className="font-bold text-lg">Generating Report...</h3>
                </div>
            </div>
        )}

        <PricingModal 
            isOpen={showPricing} 
            onClose={() => setShowPricing(false)} 
            onUpgrade={handleUpgrade} 
        />

        {/* Sidebar */}
        <Sidebar 
            isOpen={isSidebarOpen} 
            activeTab={activeTab} 
            setActiveTab={(t) => { setActiveTab(t); resetAllSolvers(); }}
            persona={persona}
            onToggleHistory={() => setShowHistory(!showHistory)}
            onOpenSettings={() => setActiveTab('settings')}
        />

        {/* Main Area */}
        <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
            <Header 
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
                darkMode={darkMode} 
                setDarkMode={setDarkMode}
                persona={persona}
                setPersona={setPersona}
                activeTitle={activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'settings' ? 'Settings' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ')}
                user={user}
                onLogout={handleLogout}
                onOpenSettings={() => setActiveTab('settings')}
                notifications={notifications}
                onClearNotifications={() => setNotifications([])}
                onSearch={handleSearch}
            />

            <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative" id="report-container">
                {/* AI Scanner FAB (Floating Action Button) - Only for manual tools, not dashboards or settings */}
                {activeTab !== 'dashboard' && activeTab !== 'settings' && activeTab !== 'minimax' && activeTab !== 'neural_network' && activeTab !== 'ai_learning' && (
                    <div className="fixed bottom-8 right-8 z-30 flex flex-col items-end gap-2 no-print">
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg shadow-primary-600/30 transition hover:scale-110 flex items-center justify-center"
                            title="AI Camera Scan"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin"/> : <Camera className="w-6 h-6"/>}
                        </button>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 mx-auto max-w-4xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5"/>
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto font-bold hover:underline">Dismiss</button>
                    </div>
                )}

                {/* Dynamic Content */}
                <div className="max-w-7xl mx-auto min-h-[calc(100vh-10rem)]">
                    {renderActiveTool()}
                </div>
            </main>
        </div>

        {/* History Slide-over */}
        {showHistory && (
            <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 transform transition-transform animate-in slide-in-from-right duration-300 p-4 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold flex items-center gap-2"><History className="w-5 h-5"/> History</h3>
                    <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3">
                    {history.length === 0 && <p className="text-slate-400 text-sm text-center mt-10">No history yet.</p>}
                    {history.map(item => (
                        <div 
                            key={item.id} 
                            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary-500 transition"
                            onClick={() => {
                                // Load Logic (Simplified for this snippet)
                                if(item.network) { setActiveTab('network'); setNetworkData(item.network); }
                                else if(item.transportation) { setActiveTab('transportation'); setTransportationData(item.transportation); }
                                // ... add others
                                else if(item.problem) { setActiveTab('manual'); handleLPSolve(item.problem, item.method as SolverMethod || SolverMethod.SIMPLEX); }
                                setShowHistory(false);
                            }}
                        >
                            <div className="text-xs font-mono text-slate-400 mb-1">{new Date(item.timestamp).toLocaleDateString()}</div>
                            <div className="font-bold text-sm text-slate-700 dark:text-slate-200">{item.method}</div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                    <button onClick={() => { localStorage.removeItem('solver_history'); setHistory([]); }} className="flex-1 py-2 text-xs font-bold bg-red-50 text-red-600 rounded hover:bg-red-100 transition">Clear</button>
                </div>
            </div>
        )}
    </div>
  );
};

// Helper for Contextual Headers inside tools
const ContextHeader: React.FC<{persona: UserPersona, title: string, descStudent: string, descBusiness: string}> = ({ persona, title, descStudent, descBusiness }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4">
        <div className={`p-3 rounded-lg ${persona === 'student' ? 'bg-primary-100 text-primary-600' : 'bg-blue-100 text-blue-600'}`}>
            {persona === 'student' ? <BookOpen className="w-6 h-6"/> : <Play className="w-6 h-6"/>}
        </div>
        <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {persona === 'student' ? descStudent : descBusiness}
            </p>
        </div>
    </div>
);

export default App;
