
import React, { useState } from 'react';
import { MinimaxEngine } from '../services/minimaxEngine';
import { MinimaxResult } from '../types';
import { Play, Shuffle, GitBranch, Layers, Briefcase, GraduationCap } from 'lucide-react';

interface MinimaxBuilderProps {
    onSolve: (result: MinimaxResult) => void;
}

const MinimaxBuilder: React.FC<MinimaxBuilderProps> = ({ onSolve }) => {
    const [depth, setDepth] = useState(3);
    const [branching, setBranching] = useState(2);
    const [algorithm, setAlgorithm] = useState<'MINIMAX' | 'ALPHA_BETA'>('ALPHA_BETA');
    const [mode, setMode] = useState<'LEARNER' | 'BUSINESS'>('LEARNER');

    const handleSolve = () => {
        const tree = MinimaxEngine.generateTree(depth, branching);
        
        // If business mode, add flavor text to nodes (Simulated)
        if (mode === 'BUSINESS') {
            const queue = [tree];
            const maxActions = ['Launch Product', 'High Price', 'Expand Market'];
            const minActions = ['Competitor Price Cut', 'New Entrant', 'Regulatory Fine'];
            
            while(queue.length > 0) {
                const node = queue.shift()!;
                if(node.children.length > 0) {
                    node.name = node.isMaximizing ? 'Our Strategy' : 'Competitor Response';
                    queue.push(...node.children);
                } else {
                    node.name = `Net Profit: $${node.value}M`;
                }
            }
        }

        const result = MinimaxEngine.solve(tree, algorithm);
        onSolve(result);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                    <GitBranch className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Adversarial Search</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Minimax & Alpha-Beta Pruning</p>
                </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex justify-center mb-8">
                <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-lg flex gap-1">
                    <button 
                        onClick={() => setMode('LEARNER')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${mode === 'LEARNER' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <GraduationCap className="w-4 h-4" /> Learner Mode
                    </button>
                    <button 
                        onClick={() => setMode('BUSINESS')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${mode === 'BUSINESS' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Briefcase className="w-4 h-4" /> Business Strategy
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Configuration */}
                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Tree Depth
                        </label>
                        <input 
                            type="range" 
                            min="2" 
                            max="5" 
                            step="1"
                            value={depth}
                            onChange={(e) => setDepth(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>2 (Simple)</span>
                            <span className="font-bold text-indigo-600">{depth} Levels</span>
                            <span>5 (Complex)</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <Shuffle className="w-4 h-4" /> Branching Factor
                        </label>
                        <input 
                            type="range" 
                            min="2" 
                            max="3" 
                            step="1"
                            value={branching}
                            onChange={(e) => setBranching(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>2 Choices</span>
                            <span className="font-bold text-indigo-600">{branching} Branches</span>
                            <span>3 Choices</span>
                        </div>
                    </div>
                </div>

                {/* Algorithm Choice */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Algorithm</label>
                    
                    <div 
                        onClick={() => setAlgorithm('MINIMAX')}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${algorithm === 'MINIMAX' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                    >
                        <div className="font-bold text-slate-900 dark:text-white">Standard Minimax</div>
                        <div className="text-xs text-slate-500 mt-1">Explores every node. Good for understanding the basics of exhaustive search.</div>
                    </div>

                    <div 
                        onClick={() => setAlgorithm('ALPHA_BETA')}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${algorithm === 'ALPHA_BETA' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                    >
                        <div className="font-bold text-slate-900 dark:text-white flex justify-between">
                            Alpha-Beta Pruning
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">Efficient</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Prunes irrelevant branches. Visualizes cut-offs where &alpha; &ge; &beta;.</div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleSolve}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-transform active:scale-95"
                >
                    <Play className="w-5 h-5" /> Generate & Visualize
                </button>
            </div>
        </div>
    );
};

export default MinimaxBuilder;
