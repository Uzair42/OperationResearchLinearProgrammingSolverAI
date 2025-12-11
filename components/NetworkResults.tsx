
import React, { useState } from 'react';
import { NetworkResult, NetworkTask } from '../types';
import { NetworkEngine } from '../services/networkEngine';
import { Clock, AlertOctagon, TrendingUp, Calculator } from 'lucide-react';

interface NetworkResultsProps {
    result: NetworkResult;
    tasks: NetworkTask[];
}

const NetworkResults: React.FC<NetworkResultsProps> = ({ result, tasks }) => {
    const [targetDate, setTargetDate] = useState<number>(Math.ceil(result.projectDuration));
    const [probability, setProbability] = useState<number | null>(null);

    const calcProb = () => {
        const p = NetworkEngine.calculateProbability(targetDate, result);
        setProbability(p);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">Project Duration</div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                            {result.projectDuration.toFixed(2)} <span className="text-sm font-normal text-slate-400">days</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                        <AlertOctagon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">Critical Path</div>
                        <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex flex-wrap gap-1">
                            {result.criticalPath.map((id, i) => (
                                <span key={id} className="flex items-center">
                                    {i > 0 && <span className="text-slate-300 mx-1">&rarr;</span>}
                                    <span className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-1.5 rounded border border-red-200 dark:border-red-800">
                                        {id}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">Risk (Std Dev)</div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                            &sigma; = {result.standardDeviation.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Probability Calculator (Business Mode) */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-green-400" />
                        Probability Calculator
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Calculate the likelihood of completing the project by a specific date.</p>
                </div>
                <div className="flex items-center gap-4 bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                    <label className="text-xs font-bold uppercase text-slate-300">Target Day:</label>
                    <input 
                        type="number" 
                        value={targetDate} 
                        onChange={(e) => setTargetDate(parseFloat(e.target.value))}
                        className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-center font-bold text-white focus:ring-2 focus:ring-green-500 outline-none"
                    />
                    <button 
                        onClick={calcProb}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded font-bold transition"
                    >
                        Calculate
                    </button>
                </div>
                {probability !== null && (
                    <div className="text-center animate-in zoom-in">
                        <div className="text-xs text-slate-400 font-bold uppercase">Probability</div>
                        <div className={`text-3xl font-extrabold ${probability > 80 ? 'text-green-400' : probability > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {probability.toFixed(1)}%
                        </div>
                    </div>
                )}
            </div>

            {/* Detailed Table (Academic Mode) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Detailed Schedule Calculation</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Activity</th>
                                <th className="px-4 py-3">Duration (t<sub>e</sub>)</th>
                                <th className="px-4 py-3">ES</th>
                                <th className="px-4 py-3">EF</th>
                                <th className="px-4 py-3">LS</th>
                                <th className="px-4 py-3">LF</th>
                                <th className="px-4 py-3">Slack</th>
                                <th className="px-4 py-3">Variance (&sigma;<sup>2</sup>)</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {result.tasks.map((t, idx) => (
                                <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${t.isCritical ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white flex flex-col">
                                        <span>{t.id}</span>
                                        <span className="text-[10px] text-slate-400 font-normal">{tasks.find(tk => tk.id === t.id)?.name}</span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{t.expectedTime.toFixed(2)}</td>
                                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{t.es.toFixed(2)}</td>
                                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{t.ef.toFixed(2)}</td>
                                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{t.ls.toFixed(2)}</td>
                                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{t.lf.toFixed(2)}</td>
                                    <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-300">{t.slack.toFixed(2)}</td>
                                    <td className="px-4 py-3 font-mono text-slate-400">{t.variance.toFixed(2)}</td>
                                    <td className="px-4 py-3">
                                        {t.isCritical ? (
                                            <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded text-xs font-bold uppercase">Critical</span>
                                        ) : (
                                            <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded text-xs font-bold uppercase">Normal</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default NetworkResults;
