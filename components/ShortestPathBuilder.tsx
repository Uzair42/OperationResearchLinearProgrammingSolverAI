
import React, { useState } from 'react';
import { ShortestPathInput, ShortestPathResult } from '../types';
import { ShortestPathEngine } from '../services/shortestPathEngine';
import { Play, Plus, Trash2, MapPin, Share2 } from 'lucide-react';

interface ShortestPathBuilderProps {
    onSolve: (input: ShortestPathInput, result: ShortestPathResult) => void;
}

const ShortestPathBuilder: React.FC<ShortestPathBuilderProps> = ({ onSolve }) => {
    const [nodes, setNodes] = useState<string[]>(['A', 'B', 'C', 'D', 'E']);
    const [edges, setEdges] = useState<{from: string, to: string, weight: number}[]>([
        { from: 'A', to: 'B', weight: 4 },
        { from: 'A', to: 'C', weight: 2 },
        { from: 'B', to: 'C', weight: 5 },
        { from: 'B', to: 'D', weight: 10 },
        { from: 'C', to: 'E', weight: 3 },
        { from: 'E', to: 'D', weight: 4 },
    ]);
    const [startNode, setStartNode] = useState('A');
    const [endNode, setEndNode] = useState('D');

    const addNode = () => {
        const nextChar = String.fromCharCode(65 + nodes.length); // Simple char generator
        setNodes([...nodes, nextChar]);
    };

    const addEdge = () => {
        if (nodes.length < 2) return;
        setEdges([...edges, { from: nodes[0], to: nodes[1], weight: 1 }]);
    };

    const removeEdge = (idx: number) => {
        setEdges(edges.filter((_, i) => i !== idx));
    };

    const handleSolve = () => {
        const input: ShortestPathInput = {
            nodes,
            edges,
            startNode,
            endNode
        };
        const result = ShortestPathEngine.solveDijkstra(input);
        onSolve(input, result);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                    <Share2 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Shortest Path (Dijkstra)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Route Optimization & Network Routing</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                {/* Node & Config */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Nodes (Locations)</label>
                        <button onClick={addNode} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                            + Add Node
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        {nodes.map(n => (
                            <span key={n} className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full text-sm font-bold shadow-sm">
                                {n}
                            </span>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Node</label>
                            <select 
                                value={startNode} 
                                onChange={(e) => setStartNode(e.target.value)}
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold"
                            >
                                {nodes.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Node</label>
                            <select 
                                value={endNode} 
                                onChange={(e) => setEndNode(e.target.value)}
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold"
                            >
                                {nodes.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Edges */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Connections (Edges)</label>
                        <button onClick={addEdge} className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add Connection
                        </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                        {edges.map((edge, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                                <select 
                                    value={edge.from}
                                    onChange={(e) => {
                                        const newEdges = [...edges];
                                        newEdges[idx].from = e.target.value;
                                        setEdges(newEdges);
                                    }}
                                    className="bg-transparent font-bold text-center w-16"
                                >
                                    {nodes.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="text-slate-400">&rarr;</span>
                                <select 
                                    value={edge.to}
                                    onChange={(e) => {
                                        const newEdges = [...edges];
                                        newEdges[idx].to = e.target.value;
                                        setEdges(newEdges);
                                    }}
                                    className="bg-transparent font-bold text-center w-16"
                                >
                                    {nodes.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <div className="flex-1 text-right">
                                    <input 
                                        type="number" 
                                        value={edge.weight}
                                        onChange={(e) => {
                                            const newEdges = [...edges];
                                            newEdges[idx].weight = parseFloat(e.target.value);
                                            setEdges(newEdges);
                                        }}
                                        className="w-16 text-center bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-600 p-1 text-sm font-mono"
                                        placeholder="Cost"
                                    />
                                </div>
                                <button onClick={() => removeEdge(idx)} className="text-slate-300 hover:text-red-500 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleSolve}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary-600/20 flex items-center gap-2 transition-transform active:scale-95"
                >
                    <Play className="w-5 h-5" /> Calculate Path
                </button>
            </div>
        </div>
    );
};

export default ShortestPathBuilder;
