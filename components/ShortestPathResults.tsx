
import React, { useMemo, useState } from 'react';
import { ShortestPathInput, ShortestPathResult } from '../types';
import { MapPin, Route, Milestone, Info } from 'lucide-react';

interface ShortestPathResultsProps {
    input: ShortestPathInput;
    result: ShortestPathResult;
}

const ShortestPathResults: React.FC<ShortestPathResultsProps> = ({ input, result }) => {
    const [stepIndex, setStepIndex] = useState(result.steps.length - 1); // Default to final step

    // --- Simple Force-Directed Graph Layout Simulation ---
    // Since graph topology is arbitrary, we use a simple circular layout or basic force simulation
    const layout = useMemo(() => {
        const nodes = input.nodes;
        const width = 600;
        const height = 400;
        const radius = Math.min(width, height) / 2 - 50;
        const centerX = width / 2;
        const centerY = height / 2;

        // Circular Layout
        const positions: Record<string, {x: number, y: number}> = {};
        nodes.forEach((n, i) => {
            const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
            positions[n] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });

        return { positions, width, height };
    }, [input.nodes]);

    const currentStep = result.steps[Math.min(stepIndex, result.steps.length - 1)];
    const visitedSet = new Set<string>();
    // Reconstruct visited set up to this step
    for(let i=0; i<=stepIndex; i++) {
        if(result.steps[i]) visitedSet.add(result.steps[i].visitedNode);
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                        <Route className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">Total Distance</div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                            {result.totalDistance === Infinity ? 'Unreachable' : result.totalDistance}
                        </div>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 md:col-span-2">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                        <MapPin className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">Optimal Path</div>
                        <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex flex-wrap items-center gap-2">
                            {result.path.length === 0 ? <span className="text-slate-400">No path found</span> : (
                                result.path.map((node, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <span className="text-slate-300 text-sm">&rarr;</span>}
                                        <span className={`px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 ${i === 0 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : i === result.path.length - 1 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : ''}`}>
                                            {node}
                                        </span>
                                    </React.Fragment>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Visualizer */}
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Graph */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-inner overflow-hidden">
                    <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="w-full h-auto max-h-[500px]">
                        {/* Edges */}
                        {input.edges.map((edge, i) => {
                            const p1 = layout.positions[edge.from];
                            const p2 = layout.positions[edge.to];
                            
                            // Check if edge is part of final path
                            let isPathEdge = false;
                            if (result.path.length > 1) {
                                for(let k=0; k<result.path.length-1; k++) {
                                    if ((result.path[k] === edge.from && result.path[k+1] === edge.to) || 
                                        (result.path[k] === edge.to && result.path[k+1] === edge.from)) {
                                        isPathEdge = true;
                                        break;
                                    }
                                }
                            }

                            return (
                                <g key={i}>
                                    <line 
                                        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                                        stroke={isPathEdge ? '#10b981' : '#cbd5e1'} 
                                        strokeWidth={isPathEdge ? 4 : 2}
                                        className="transition-all duration-500"
                                    />
                                    {/* Weight Label */}
                                    <g transform={`translate(${(p1.x+p2.x)/2}, ${(p1.y+p2.y)/2})`}>
                                        <rect x="-10" y="-8" width="20" height="16" rx="4" fill="white" className="dark:fill-slate-800" stroke="#e2e8f0" />
                                        <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="bold" className="fill-slate-500 dark:fill-slate-400">
                                            {edge.weight}
                                        </text>
                                    </g>
                                </g>
                            );
                        })}

                        {/* Nodes */}
                        {input.nodes.map((n) => {
                            const pos = layout.positions[n];
                            const isVisited = visitedSet.has(n);
                            const isCurrent = currentStep?.visitedNode === n;
                            const isStart = n === input.startNode;
                            const isEnd = n === input.endNode;
                            const dist = currentStep?.distances[n];

                            return (
                                <g key={n} transform={`translate(${pos.x}, ${pos.y})`} className="transition-all duration-500">
                                    <circle 
                                        r={isCurrent ? 25 : 20} 
                                        fill={isStart ? '#dcfce7' : isEnd ? '#fee2e2' : isVisited ? '#e0e7ff' : '#f8fafc'} 
                                        stroke={isCurrent ? '#4f46e5' : isVisited ? '#6366f1' : '#94a3b8'}
                                        strokeWidth={isCurrent ? 3 : 2}
                                        className="dark:fill-slate-900"
                                    />
                                    <text y="5" textAnchor="middle" fontWeight="bold" className="fill-slate-700 dark:fill-slate-200 pointer-events-none">
                                        {n}
                                    </text>
                                    {/* Distance Label Badge */}
                                    <g transform="translate(0, -30)">
                                        <rect x="-15" y="-10" width="30" height="16" rx="4" fill="#0f172a" opacity="0.8" />
                                        <text y="2" textAnchor="middle" fontSize="10" fill="white">
                                            {dist === Infinity ? '∞' : dist}
                                        </text>
                                    </g>
                                </g>
                            )
                        })}
                    </svg>
                </div>

                {/* Log & Controls */}
                <div className="lg:w-80 flex flex-col bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Milestone className="w-5 h-5 text-blue-500"/> Exploration Log
                    </h4>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar max-h-96">
                        {result.steps.map((step, i) => (
                            <div 
                                key={i}
                                onClick={() => setStepIndex(i)}
                                className={`p-3 rounded-lg text-sm border cursor-pointer transition-all ${
                                    i === stepIndex 
                                        ? 'bg-white dark:bg-slate-800 border-primary-500 shadow-md ring-1 ring-primary-500' 
                                        : 'bg-transparent border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">Step {step.stepIndex}</span>
                                    <span className="text-xs text-slate-400">Node {step.visitedNode}</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>Start: {input.startNode}</span>
                            <span>Target: {input.endNode}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShortestPathResults;
