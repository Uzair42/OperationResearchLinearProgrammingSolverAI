
import React, { useMemo, useState } from 'react';
import { NetworkResult, NetworkTask } from '../types';
import { NetworkCalculation } from '../types';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface NetworkGraphProps {
    tasks: NetworkTask[];
    result: NetworkResult;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ tasks, result }) => {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isMaximized, setIsMaximized] = useState(false);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // --- Layout Algorithm (Layered DAG) ---
    const layout = useMemo(() => {
        // 1. Assign Ranks (Levels)
        const levels: Map<string, number> = new Map();
        
        // Find tasks with no preds
        const queue = tasks.filter(t => t.predecessors.length === 0).map(t => t.id);
        queue.forEach(id => levels.set(id, 0));
        
        // Propagate levels
        let safety = 0;
        while(queue.length > 0 && safety < 1000) {
            safety++;
            const currentId = queue.shift()!;
            const currentLevel = levels.get(currentId)!;
            
            // Find successors
            const successors = tasks.filter(t => t.predecessors.includes(currentId));
            successors.forEach(succ => {
                const existingLevel = levels.get(succ.id) || 0;
                // Level is max(predecessor levels) + 1
                if (currentLevel + 1 > existingLevel) {
                    levels.set(succ.id, currentLevel + 1);
                    queue.push(succ.id);
                }
            });
        }

        // 2. Assign Positions based on Rank
        const nodes: { id: string, x: number, y: number, data: NetworkCalculation & { name: string } }[] = [];
        const levelGroups: Record<number, string[]> = {};
        
        levels.forEach((lvl, id) => {
            if(!levelGroups[lvl]) levelGroups[lvl] = [];
            levelGroups[lvl].push(id);
        });

        const LEVEL_WIDTH = 180;
        const NODE_HEIGHT_SPACING = 120;

        Object.entries(levelGroups).forEach(([lvlStr, ids]) => {
            const lvl = parseInt(lvlStr);
            const x = 50 + lvl * LEVEL_WIDTH;
            ids.forEach((id, idx) => {
                const y = 50 + idx * NODE_HEIGHT_SPACING + (lvl % 2 === 1 ? 40 : 0); // Stagger odd levels slightly
                const calc = result.tasks.find(t => t.id === id)!;
                const base = tasks.find(t => t.id === id)!;
                nodes.push({
                    id, x, y,
                    data: { ...calc, name: base.name }
                });
            });
        });

        // 3. Generate Edges
        const edges: { from: {x:number, y:number}, to: {x:number, y:number}, isCritical: boolean }[] = [];
        
        tasks.forEach(t => {
            const targetNode = nodes.find(n => n.id === t.id);
            if (!targetNode) return;
            
            t.predecessors.forEach(predId => {
                const sourceNode = nodes.find(n => n.id === predId);
                if (sourceNode) {
                    // Check if edge is on critical path (both nodes critical AND time matches)
                    // Strict Critical Path Logic: source is critical, target is critical, AND source.EF == target.ES
                    const isEdgeCritical = sourceNode.data.isCritical && targetNode.data.isCritical && Math.abs(sourceNode.data.ef - targetNode.data.es) < 0.001;
                    
                    edges.push({
                        from: { x: sourceNode.x + 100, y: sourceNode.y + 30 }, // Right side of source
                        to: { x: targetNode.x, y: targetNode.y + 30 }, // Left side of target
                        isCritical: isEdgeCritical
                    });
                }
            });
        });

        const maxX = Math.max(...nodes.map(n => n.x)) + 200;
        const maxY = Math.max(...nodes.map(n => n.y)) + 150;

        return { nodes, edges, width: maxX, height: maxY };

    }, [tasks, result]);

    // Mouse Interactions
    const handleMouseDown = (e: React.MouseEvent) => {
        if(e.button !== 0) return;
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

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(z => Math.max(0.2, Math.min(3, z * delta)));
    };

    return (
        <div className={`relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-inner ${isMaximized ? 'fixed inset-4 z-50 shadow-2xl' : 'h-[500px]'}`}>
            
            {/* Controls */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-2 bg-white dark:bg-slate-800 rounded shadow hover:bg-slate-100 dark:hover:bg-slate-700"><ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-300" /></button>
                <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 bg-white dark:bg-slate-800 rounded shadow hover:bg-slate-100 dark:hover:bg-slate-700"><ZoomOut className="w-4 h-4 text-slate-600 dark:text-slate-300" /></button>
                <button onClick={() => setPan({x:0, y:0})} className="p-2 bg-white dark:bg-slate-800 rounded shadow hover:bg-slate-100 dark:hover:bg-slate-700"><Move className="w-4 h-4 text-slate-600 dark:text-slate-300" /></button>
                <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 bg-white dark:bg-slate-800 rounded shadow hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600">
                    {isMaximized ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
                </button>
            </div>

            <div className="absolute bottom-4 left-4 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-3 py-2 rounded shadow text-xs text-slate-500 font-mono border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Critical Path</div>
                <div className="flex items-center gap-2 mt-1"><div className="w-3 h-3 bg-blue-100 dark:bg-blue-900 border border-blue-500 rounded-sm"></div> Task Node</div>
            </div>

            {/* SVG Canvas */}
            <svg 
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onWheel={handleWheel}
            >
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform={`scale(${zoom})`}>
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.5"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    
                    {/* Edges */}
                    {layout.edges.map((edge, i) => (
                        <g key={i}>
                            <path 
                                d={`M ${edge.from.x} ${edge.from.y} C ${edge.from.x + 40} ${edge.from.y}, ${edge.to.x - 40} ${edge.to.y}, ${edge.to.x} ${edge.to.y}`}
                                fill="none"
                                stroke={edge.isCritical ? '#ef4444' : '#94a3b8'}
                                strokeWidth={edge.isCritical ? 3 : 2}
                                className={edge.isCritical ? 'animate-pulse' : ''}
                                markerEnd={edge.isCritical ? 'url(#arrowhead-critical)' : 'url(#arrowhead)'}
                            />
                        </g>
                    ))}

                    {/* Nodes (AON Boxes) */}
                    {layout.nodes.map(node => (
                        <g 
                            key={node.id} 
                            transform={`translate(${node.x}, ${node.y})`}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            className="transition-transform hover:scale-105"
                        >
                            {/* Shadow */}
                            <rect width="100" height="60" rx="6" fill="black" opacity="0.1" x="4" y="4" />
                            
                            {/* Main Box */}
                            <rect 
                                width="100" height="60" rx="6" 
                                fill={node.data.isCritical ? '#fef2f2' : '#eff6ff'} 
                                stroke={node.data.isCritical ? '#ef4444' : '#3b82f6'}
                                strokeWidth={node.data.isCritical ? 2 : 1}
                                className="dark:fill-slate-800"
                            />
                            
                            {/* Header Section */}
                            <rect width="100" height="24" rx="6" className={`${node.data.isCritical ? 'fill-red-500' : 'fill-blue-500'}`} clipPath="inset(0 0 60% 0)" />
                            <text x="50" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" pointerEvents="none">
                                {node.data.name.length > 10 ? node.data.name.substring(0,8)+'..' : node.data.name}
                            </text>

                            {/* Data Grid */}
                            <line x1="0" y1="24" x2="100" y2="24" stroke={node.data.isCritical ? '#fca5a5' : '#bfdbfe'} />
                            <line x1="50" y1="24" x2="50" y2="60" stroke={node.data.isCritical ? '#fca5a5' : '#bfdbfe'} />
                            
                            {/* ES | EF */}
                            <text x="25" y="40" textAnchor="middle" fontSize="10" className="fill-slate-700 dark:fill-slate-300 font-mono">
                                ES:{node.data.es.toFixed(0)}
                            </text>
                            <text x="75" y="40" textAnchor="middle" fontSize="10" className="fill-slate-700 dark:fill-slate-300 font-mono">
                                EF:{node.data.ef.toFixed(0)}
                            </text>
                            
                            {/* LS | LF */}
                            <text x="25" y="54" textAnchor="middle" fontSize="10" className="fill-slate-500 dark:fill-slate-400 font-mono">
                                LS:{node.data.ls.toFixed(0)}
                            </text>
                            <text x="75" y="54" textAnchor="middle" fontSize="10" className="fill-slate-500 dark:fill-slate-400 font-mono">
                                LF:{node.data.lf.toFixed(0)}
                            </text>

                            {/* Hover Tooltip - Rendered as SVG overlay to scale with zoom */}
                            {hoveredNode === node.id && (
                                <g transform="translate(0, -50)">
                                    <rect x="-20" y="0" width="140" height="40" rx="4" fill="#0f172a" opacity="0.9" />
                                    <text x="50" y="15" textAnchor="middle" fill="white" fontSize="10">Dur: {node.data.expectedTime.toFixed(1)} | Slack: {node.data.slack.toFixed(1)}</text>
                                    <text x="50" y="30" textAnchor="middle" fill="#94a3b8" fontSize="9">Var: {node.data.variance.toFixed(2)}</text>
                                </g>
                            )}
                        </g>
                    ))}

                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                        </marker>
                        <marker id="arrowhead-critical" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                        </marker>
                    </defs>
                </g>
            </svg>
        </div>
    );
};

export default NetworkGraph;
