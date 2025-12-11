
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MinimaxResult, GameTreeNode } from '../types';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Scissors, Eye, MousePointerClick, ZoomIn, ZoomOut, Move, Maximize2, Minimize2 } from 'lucide-react';

interface MinimaxResultsProps {
    result: MinimaxResult;
}

const MinimaxResults: React.FC<MinimaxResultsProps> = ({ result }) => {
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1000);

    // Zoom & Pan State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const currentStep = result.steps[currentStepIdx] || result.steps[0];

    // Auto Play
    useEffect(() => {
        let interval: any;
        if (isPlaying && currentStepIdx < result.steps.length - 1) {
            interval = setInterval(() => {
                setCurrentStepIdx(prev => prev + 1);
            }, speed);
        } else {
            setIsPlaying(false);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentStepIdx, result.steps.length, speed]);

    // Tree Layout Calculation
    const treeLayout = useMemo(() => {
        const nodes: { id: string, x: number, y: number, data: GameTreeNode }[] = [];
        const edges: { from: string, to: string }[] = [];
        
        // BFS for levels, DFS for X position based on leaf order
        const depthHeight = 120;
        const leafWidth = 100;

        // 1. Assign leaf positions
        let leafCounter = 0;
        const traverseForLeaves = (node: GameTreeNode) => {
            if (node.children.length === 0) {
                node['__temp_x'] = leafCounter * leafWidth;
                leafCounter++;
            } else {
                node.children.forEach(traverseForLeaves);
            }
        };
        traverseForLeaves(result.root);

        // 2. Assign parent positions (avg of children)
        const traverseForPos = (node: GameTreeNode, depth: number) => {
            let x = 0;
            if (node.children.length === 0) {
                x = node['__temp_x'];
            } else {
                node.children.forEach(c => traverseForPos(c, depth + 1));
                const firstChildX = node.children[0]['__temp_x'];
                const lastChildX = node.children[node.children.length - 1]['__temp_x'];
                x = (firstChildX + lastChildX) / 2;
                node['__temp_x'] = x;
            }

            nodes.push({
                id: node.id,
                x: x + 50, // Padding
                y: depth * depthHeight + 50,
                data: node
            });

            node.children.forEach(c => {
                edges.push({ from: node.id, to: c.id });
            });
        };
        
        traverseForPos(result.root, 0);

        const width = leafCounter * leafWidth + 100;
        const height = (nodes.reduce((max, n) => Math.max(max, n.y), 0)) + 100;

        return { nodes, edges, width, height };
    }, [result.root]);

    // Auto-center on load
    useEffect(() => {
        if (containerRef.current) {
            const cw = containerRef.current.clientWidth;
            const ch = containerRef.current.clientHeight;
            const contentW = treeLayout.width;
            
            // Fit to width mostly, but ensure min zoom
            const scale = Math.min(cw / (contentW + 100), 1);
            const initialZoom = Math.max(scale, 0.4); 
            
            const initialPanX = (cw - contentW * initialZoom) / 2;
            const initialPanY = 50; // Start with some top padding

            setZoom(initialZoom);
            setPan({ x: initialPanX, y: initialPanY });
        }
    }, [treeLayout]);

    // Mouse Interactions
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(z => Math.max(0.1, Math.min(5, z * delta)));
    };

    // Derived State for Visualization based on currentStep
    const visitedNodes = new Set<string>();
    const prunedNodes = new Set<string>();
    const evaluatedValues: Record<string, number> = {};
    const currentNodeId = currentStep?.nodeId;

    for(let i=0; i<=currentStepIdx; i++) {
        const s = result.steps[i];
        if (s.action === 'VISIT') visitedNodes.add(s.nodeId);
        if (s.action === 'PRUNE' && s.prunedNodeId) prunedNodes.add(s.prunedNodeId);
        if (s.currentValue !== null) evaluatedValues[s.nodeId] = s.currentValue;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Control Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentStepIdx(0)} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><RotateCcw className="w-5 h-5"/></button>
                    <button onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><SkipBack className="w-5 h-5"/></button>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-transform active:scale-95">
                        {isPlaying ? <Pause className="w-6 h-6"/> : <Play className="w-6 h-6 ml-1"/>}
                    </button>
                    <button onClick={() => setCurrentStepIdx(Math.min(result.steps.length - 1, currentStepIdx + 1))} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><SkipForward className="w-5 h-5"/></button>
                </div>

                <div className="flex-1 text-center px-4">
                    <div className="text-sm font-mono text-slate-500">Step {currentStep?.stepIndex} / {result.steps.length}</div>
                    <div className="font-bold text-slate-800 dark:text-white text-sm md:text-base transition-all">{currentStep?.description}</div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-900 p-2 rounded">
                        <span>&alpha;: {currentStep?.alpha === -Infinity ? '-Inf' : currentStep?.alpha}</span>
                        <span>&beta;: {currentStep?.beta === Infinity ? '+Inf' : currentStep?.beta}</span>
                    </div>
                    <select 
                        value={speed} 
                        onChange={(e) => setSpeed(parseInt(e.target.value))} 
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs p-1"
                    >
                        <option value={1500}>Slow</option>
                        <option value={800}>Normal</option>
                        <option value={200}>Fast</option>
                    </select>
                </div>
            </div>

            {/* Tree Visualization */}
            <div 
                ref={containerRef}
                className="relative overflow-hidden bg-slate-950 rounded-xl border border-slate-800 shadow-inner h-[600px]"
            >
                {/* Graph Controls */}
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="p-2 bg-slate-800 rounded shadow hover:bg-slate-700 text-slate-300"><ZoomIn className="w-4 h-4" /></button>
                    <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-2 bg-slate-800 rounded shadow hover:bg-slate-700 text-slate-300"><ZoomOut className="w-4 h-4" /></button>
                    <button onClick={() => setPan({x: 0, y: 0})} className="p-2 bg-slate-800 rounded shadow hover:bg-slate-700 text-slate-300"><Move className="w-4 h-4" /></button>
                </div>

                <svg 
                    className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                >
                    <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
                        </marker>
                    </defs>

                    <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                        {/* Edges */}
                        {treeLayout.edges.map((edge, i) => {
                            const fromNode = treeLayout.nodes.find(n => n.id === edge.from)!;
                            const toNode = treeLayout.nodes.find(n => n.id === edge.to)!;
                            const isPruned = prunedNodes.has(edge.to);
                            const isActive = currentNodeId === edge.to;

                            return (
                                <g key={i}>
                                    <line 
                                        x1={fromNode.x} y1={fromNode.y} 
                                        x2={toNode.x} y2={toNode.y} 
                                        stroke={isPruned ? '#ef4444' : isActive ? '#6366f1' : '#cbd5e1'} 
                                        strokeWidth={isActive ? 3 : 2}
                                        strokeDasharray={isPruned ? "5,5" : "0"}
                                        opacity={isPruned ? 0.4 : 1}
                                    />
                                    {isPruned && (
                                        <g transform={`translate(${(fromNode.x+toNode.x)/2}, ${(fromNode.y+toNode.y)/2})`}>
                                            <Scissors className="w-6 h-6 text-red-500" />
                                        </g>
                                    )}
                                </g>
                            );
                        })}

                        {/* Nodes */}
                        {treeLayout.nodes.map((node) => {
                            const isVisited = visitedNodes.has(node.id);
                            const isCurrent = currentNodeId === node.id;
                            const isPruned = prunedNodes.has(node.id);
                            const val = evaluatedValues[node.id];
                            const displayVal = val !== undefined ? val : node.data.children.length === 0 ? node.data.value : '?';

                            return (
                                <g 
                                    key={node.id} 
                                    transform={`translate(${node.x}, ${node.y})`} 
                                    className="transition-all duration-300"
                                    opacity={isPruned ? 0.3 : 1}
                                >
                                    {/* Shape: Square for Max, Circle for Min */}
                                    {node.data.isMaximizing ? (
                                        <rect 
                                            x="-20" y="-20" width="40" height="40" rx="4"
                                            fill={isCurrent ? '#818cf8' : isVisited ? '#e0e7ff' : '#f1f5f9'}
                                            stroke={isCurrent ? '#4f46e5' : isVisited ? '#6366f1' : '#cbd5e1'}
                                            strokeWidth={isCurrent ? 3 : 2}
                                            className="dark:fill-slate-800"
                                        />
                                    ) : (
                                        <circle 
                                            r="22"
                                            fill={isCurrent ? '#fca5a5' : isVisited ? '#fee2e2' : '#f1f5f9'}
                                            stroke={isCurrent ? '#ef4444' : isVisited ? '#f87171' : '#cbd5e1'}
                                            strokeWidth={isCurrent ? 3 : 2}
                                            className="dark:fill-slate-800"
                                        />
                                    )}

                                    <text y="5" textAnchor="middle" fontWeight="bold" className={`pointer-events-none ${isCurrent || isVisited ? 'fill-slate-900 dark:fill-white' : 'fill-slate-400'}`}>
                                        {displayVal}
                                    </text>

                                    {/* Label (Business Context) */}
                                    {node.data.name && (
                                        <text y="-30" textAnchor="middle" fontSize="10" className="fill-slate-500 font-medium">
                                            {node.data.name}
                                        </text>
                                    )}

                                    {/* Alpha/Beta Tooltip (Simple visual indicator) */}
                                    {isCurrent && (
                                        <g transform="translate(30, -10)">
                                            <rect width="60" height="35" rx="4" fill="#1e293b" opacity="0.9"/>
                                            <text x="5" y="12" fill="white" fontSize="9">Max: {node.data.isMaximizing ? 'YES' : 'NO'}</text>
                                            <text x="5" y="25" fill="#a5b4fc" fontSize="9">ID: {node.id}</text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </div>

            {/* Legend */}
            <div className="flex gap-6 justify-center text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-indigo-500 rounded bg-white"></div> Maximizer</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-red-400 rounded-full bg-white"></div> Minimizer</div>
                <div className="flex items-center gap-2"><div className="w-6 h-px border-t-2 border-red-500 border-dashed"></div> Pruned</div>
            </div>
        </div>
    );
};

export default MinimaxResults;
