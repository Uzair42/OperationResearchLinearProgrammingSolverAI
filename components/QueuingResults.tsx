
import React from 'react';
import { QueuingInput, QueuingResult } from '../types';
import { Clock, Users, Activity, PauseCircle, Gauge } from 'lucide-react';

interface QueuingResultsProps {
    input: QueuingInput;
    result: QueuingResult;
}

const QueuingResults: React.FC<QueuingResultsProps> = ({ input, result }) => {
    
    if (!result.isStable) {
        return (
            <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-xl border border-red-200 dark:border-red-800 text-center animate-fade-in">
                <h3 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">System Unstable</h3>
                <p className="text-red-600 dark:text-red-300">
                    The Arrival Rate ({input.arrivalRate}) exceeds the Service Rate ({input.serviceRate}). 
                    The queue will grow indefinitely.
                </p>
            </div>
        );
    }

    const utilPercent = Math.min(Math.round(result.rho * 100), 100);
    const idlePercent = 100 - utilPercent;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Top Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Lq */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-16 h-16 text-blue-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Queue Length (L<sub>q</sub>)</div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{result.Lq.toFixed(2)}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">customers waiting</div>
                    </div>
                </div>

                {/* Ls */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-16 h-16 text-indigo-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">System Length (L<sub>s</sub>)</div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{result.Ls.toFixed(2)}</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">cust. in system</div>
                    </div>
                </div>

                {/* Wq */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock className="w-16 h-16 text-orange-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Wait in Queue (W<sub>q</sub>)</div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{result.Wq.toFixed(2)}</div>
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">{input.timeUnit.toLowerCase()}s</div>
                    </div>
                </div>

                {/* Ws */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Timer className="w-16 h-16 text-green-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Time in System (W<sub>s</sub>)</div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{result.Ws.toFixed(2)}</div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">{input.timeUnit.toLowerCase()}s</div>
                    </div>
                </div>
            </div>

            {/* Utilization & Visuals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Traffic Intensity Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-primary-500" /> System Utilization (Traffic Intensity)
                    </h4>
                    
                    <div className="relative pt-4 pb-8">
                        {/* Progress Bar Background */}
                        <div className="h-6 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                            <div 
                                className={`h-full transition-all duration-1000 ease-out ${utilPercent > 85 ? 'bg-red-500' : utilPercent > 70 ? 'bg-orange-500' : 'bg-green-500'}`}
                                style={{ width: `${utilPercent}%` }}
                            ></div>
                        </div>
                        
                        {/* Labels */}
                        <div className="flex justify-between mt-3 text-sm font-medium">
                            <div className="text-slate-600 dark:text-slate-300">
                                Busy: <span className="font-bold">{utilPercent}%</span>
                            </div>
                            <div className="text-slate-600 dark:text-slate-300">
                                Idle (P<sub>0</sub>): <span className="font-bold">{idlePercent}%</span>
                            </div>
                        </div>

                        {/* Interpretation */}
                        <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            <strong className="block mb-1 text-slate-800 dark:text-slate-200">Analysis:</strong>
                            The server is busy {utilPercent}% of the time. 
                            {utilPercent > 85 
                                ? " High utilization suggests potential bottlenecks. Consider adding another server to reduce waiting times." 
                                : utilPercent < 30 
                                    ? " Low utilization indicates the server is often idle. Resources might be underutilized." 
                                    : " System is operating at a balanced load."}
                        </div>
                    </div>
                </div>

                {/* Probabilities */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-500" /> Probabilities (P<sub>n</sub>)
                    </h4>
                    <div className="space-y-3">
                        {result.Pn?.map((prob, n) => (
                            <div key={n} className="flex items-center gap-4">
                                <div className="w-8 text-xs font-bold text-slate-500 uppercase">n={n}</div>
                                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-purple-500 rounded-full" 
                                        style={{ width: `${prob * 100}%` }}
                                    ></div>
                                </div>
                                <div className="w-16 text-right text-sm font-mono text-slate-700 dark:text-slate-300">
                                    {(prob * 100).toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-4 text-center">Probability of exactly <i>n</i> customers in the system.</p>
                </div>
            </div>
        </div>
    );
};

// Helper Icon
function Timer(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="10" x2="14" y1="2" y2="2" />
        <line x1="12" x2="15" y1="14" y2="11" />
        <circle cx="12" cy="14" r="8" />
      </svg>
    )
}

export default QueuingResults;
