
import React, { useState } from 'react';
import { NetworkTask, NetworkResult } from '../types';
import { NetworkEngine } from '../services/networkEngine';
import { Plus, Trash2, ArrowRight, Play, Wand2, HelpCircle } from 'lucide-react';
import { extractNetworkFromText } from '../services/geminiService';

interface NetworkBuilderProps {
    onSolve: (tasks: NetworkTask[], result: NetworkResult) => void;
}

const NetworkBuilder: React.FC<NetworkBuilderProps> = ({ onSolve }) => {
    const [mode, setMode] = useState<'CPM' | 'PERT'>('CPM');
    const [tasks, setTasks] = useState<NetworkTask[]>([
        { id: 'A', name: 'Start', duration: 3, optimistic: 2, mostLikely: 3, pessimistic: 4, predecessors: [] },
        { id: 'B', name: 'Task B', duration: 4, optimistic: 3, mostLikely: 4, pessimistic: 5, predecessors: ['A'] }
    ]);
    const [aiInput, setAiInput] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const addTask = () => {
        const nextChar = String.fromCharCode(65 + tasks.length); // A, B, C...
        setTasks([...tasks, {
            id: nextChar,
            name: `Task ${nextChar}`,
            duration: 1,
            optimistic: 1, mostLikely: 1, pessimistic: 1,
            predecessors: tasks.length > 0 ? [tasks[tasks.length-1].id] : []
        }]);
    };

    const removeTask = (idx: number) => {
        setTasks(tasks.filter((_, i) => i !== idx));
    };

    const updateTask = (idx: number, field: keyof NetworkTask, value: any) => {
        const updated = [...tasks];
        updated[idx] = { ...updated[idx], [field]: value };
        
        // CPM vs PERT Synchronization
        if (field === 'duration' && mode === 'CPM') {
             // Keep PERT values synced for mode switching
             updated[idx].mostLikely = value;
             updated[idx].optimistic = value;
             updated[idx].pessimistic = value;
        } else if ((field === 'optimistic' || field === 'mostLikely' || field === 'pessimistic') && mode === 'PERT') {
             // Approximate CPM duration if switching back
             updated[idx].duration = updated[idx].mostLikely || 0;
        }

        setTasks(updated);
    };

    const handlePredecessorChange = (idx: number, val: string) => {
        const preds = val.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
        updateTask(idx, 'predecessors', preds);
    };

    const handleSolve = () => {
        const result = NetworkEngine.calculatePERT(tasks);
        onSolve(tasks, result);
    };

    const handleAiParse = async () => {
        if (!aiInput.trim()) return;
        setIsAiLoading(true);
        try {
            const parsedTasks = await extractNetworkFromText(aiInput);
            setTasks(parsedTasks);
        } catch (e) {
            alert("Failed to parse project text.");
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Mode Switcher */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                    <button 
                        onClick={() => setMode('CPM')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === 'CPM' ? 'bg-white dark:bg-slate-700 shadow text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        CPM (Deterministic)
                    </button>
                    <button 
                        onClick={() => setMode('PERT')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === 'PERT' ? 'bg-white dark:bg-slate-700 shadow text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        PERT (Probabilistic)
                    </button>
                </div>
                <div className="text-xs text-slate-500 max-w-md text-center md:text-right">
                    {mode === 'CPM' ? "Use single time estimates. Best for known, repeatable tasks." : "Use 3-point estimates (Optimistic, Most Likely, Pessimistic) to calculate risk."}
                </div>
            </div>

            {/* AI Quick Input */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/50 p-4 rounded-xl border border-indigo-100 dark:border-slate-700">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="Describe project: 'Task A takes 5 days. Task B follows A and takes 3 days...'"
                        className="flex-1 bg-white dark:bg-slate-900 border-0 rounded-lg shadow-sm px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    />
                    <button 
                        onClick={handleAiParse}
                        disabled={isAiLoading}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary-700 transition flex items-center gap-2"
                    >
                        {isAiLoading ? <Wand2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        AI Build
                    </button>
                </div>
            </div>

            {/* Tasks Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 w-16 text-center">ID</th>
                            <th className="px-4 py-3">Activity Name</th>
                            <th className="px-4 py-3">Predecessors (IDs)</th>
                            {mode === 'CPM' ? (
                                <th className="px-4 py-3 w-32 text-center">Duration</th>
                            ) : (
                                <>
                                    <th className="px-2 py-3 w-24 text-center text-green-600">Optimistic (a)</th>
                                    <th className="px-2 py-3 w-24 text-center text-blue-600">Most Likely (m)</th>
                                    <th className="px-2 py-3 w-24 text-center text-red-600">Pessimistic (b)</th>
                                </>
                            )}
                            <th className="px-2 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {tasks.map((task, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                <td className="px-4 py-2">
                                    <input 
                                        value={task.id}
                                        onChange={(e) => updateTask(idx, 'id', e.target.value.toUpperCase())}
                                        className="w-full text-center font-bold bg-transparent border-b border-transparent focus:border-primary-500 outline-none" 
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input 
                                        value={task.name}
                                        onChange={(e) => updateTask(idx, 'name', e.target.value)}
                                        className="w-full bg-transparent border-b border-transparent focus:border-primary-500 outline-none" 
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input 
                                        value={task.predecessors.join(', ')}
                                        onChange={(e) => handlePredecessorChange(idx, e.target.value)}
                                        placeholder="e.g. A, C"
                                        className="w-full bg-slate-50 dark:bg-slate-900 rounded px-2 py-1 border-none focus:ring-1 focus:ring-primary-500" 
                                    />
                                </td>
                                {mode === 'CPM' ? (
                                    <td className="px-4 py-2 text-center">
                                        <input 
                                            type="number"
                                            value={task.duration}
                                            onChange={(e) => updateTask(idx, 'duration', parseFloat(e.target.value))}
                                            className="w-20 text-center bg-slate-50 dark:bg-slate-900 rounded px-2 py-1 font-mono font-bold" 
                                        />
                                    </td>
                                ) : (
                                    <>
                                        <td className="px-2 py-2 text-center">
                                            <input type="number" value={task.optimistic} onChange={(e) => updateTask(idx, 'optimistic', parseFloat(e.target.value))} className="w-16 text-center bg-green-50 dark:bg-green-900/20 rounded px-1 py-1 font-mono text-green-700" />
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <input type="number" value={task.mostLikely} onChange={(e) => updateTask(idx, 'mostLikely', parseFloat(e.target.value))} className="w-16 text-center bg-blue-50 dark:bg-blue-900/20 rounded px-1 py-1 font-mono text-blue-700" />
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <input type="number" value={task.pessimistic} onChange={(e) => updateTask(idx, 'pessimistic', parseFloat(e.target.value))} className="w-16 text-center bg-red-50 dark:bg-red-900/20 rounded px-1 py-1 font-mono text-red-700" />
                                        </td>
                                    </>
                                )}
                                <td className="px-2 py-2 text-center">
                                    <button onClick={() => removeTask(idx)} className="text-slate-300 hover:text-red-500 transition">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={addTask} className="text-sm font-bold text-primary-600 flex items-center gap-1 hover:text-primary-700">
                        <Plus className="w-4 h-4" /> Add Activity
                    </button>
                </div>
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleSolve}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary-600/20 flex items-center gap-2 transition-transform active:scale-95"
                >
                    <Play className="w-5 h-5" /> Calculate Network
                </button>
            </div>
        </div>
    );
};

export default NetworkBuilder;
