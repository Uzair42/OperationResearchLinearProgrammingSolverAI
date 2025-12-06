import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Constraint, ConstraintSign, LPProblem, OptimizationType } from '../types';
import { RotateCcw, Layers, Trophy, Maximize2, Minimize2 } from 'lucide-react';

interface Graph2DProps {
  problem: LPProblem;
}

interface Point {
  x: number;
  y: number;
}

interface CornerPoint extends Point {
  z: number;
  label: string;
  isOptimal?: boolean;
}

const Graph2D: React.FC<Graph2DProps> = ({ problem }) => {
  const [hoveredPoint, setHoveredPoint] = useState<CornerPoint | null>(null);
  const [activeConstraintId, setActiveConstraintId] = useState<string | null>(null);
  const [showInequalities, setShowInequalities] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  
  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Esc to exit fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsMaximized(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const width = isMaximized ? window.innerWidth * 0.8 : 600;
  const height = isMaximized ? window.innerHeight * 0.8 : 450;
  const margin = 50;

  // --- 1. Coordinate System & Bounds Calculation ---
  
  const nonNegative = problem.nonNegative ?? true; 

  const { minX, maxX, minY, maxY, feasibleCorners } = useMemo(() => {
    const lines = problem.constraints.map(c => ({ 
      a: c.coefficients[0], 
      b: c.coefficients[1], 
      c: c.rhs 
    }));
    
    if (nonNegative) {
        lines.push({ a: 1, b: 0, c: 0 }); // x >= 0
        lines.push({ a: 0, b: 1, c: 0 }); // y >= 0
    }

    const points: Point[] = [];
    const getIntersection = (l1: any, l2: any): Point | null => {
        const det = l1.a * l2.b - l2.a * l1.b;
        if (Math.abs(det) < 1e-9) return null;
        return {
            x: (l1.c * l2.b - l2.c * l1.b) / det,
            y: (l1.a * l2.c - l2.a * l1.c) / det
        };
    };

    for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            const pt = getIntersection(lines[i], lines[j]);
            if (pt) points.push(pt);
        }
    }

    const satisfiesConstraint = (p: Point, c: Constraint): boolean => {
        const val = c.coefficients[0] * p.x + c.coefficients[1] * p.y;
        const tol = 1e-4;
        if (c.sign === ConstraintSign.LESS_EQ) return val <= c.rhs + tol;
        if (c.sign === ConstraintSign.GREATER_EQ) return val >= c.rhs - tol;
        if (c.sign === ConstraintSign.EQ) return Math.abs(val - c.rhs) < tol;
        return false;
    };

    const validPoints = points.filter(p => {
        const passExplicit = problem.constraints.every(c => satisfiesConstraint(p, c));
        const passImplicit = nonNegative ? (p.x >= -1e-5 && p.y >= -1e-5) : true;
        return passExplicit && passImplicit;
    });

    const uniquePoints: CornerPoint[] = [];
    validPoints.forEach(p => {
        if (!uniquePoints.some(up => Math.abs(up.x - p.x) < 1e-4 && Math.abs(up.y - p.y) < 1e-4)) {
            const z = problem.objectiveCoefficients[0] * p.x + problem.objectiveCoefficients[1] * p.y;
            uniquePoints.push({ ...p, z, label: '' });
        }
    });

    let optimalZ = problem.type === OptimizationType.MAXIMIZE ? -Infinity : Infinity;
    uniquePoints.forEach(p => {
        if (problem.type === OptimizationType.MAXIMIZE) {
            if (p.z > optimalZ) optimalZ = p.z;
        } else {
            if (p.z < optimalZ) optimalZ = p.z;
        }
    });
    
    let cx = 0, cy = 0;
    if (uniquePoints.length > 0) {
        cx = uniquePoints.reduce((sum, p) => sum + p.x, 0) / uniquePoints.length;
        cy = uniquePoints.reduce((sum, p) => sum + p.y, 0) / uniquePoints.length;
        uniquePoints.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    }

    uniquePoints.forEach((p, i) => {
        p.label = String.fromCharCode(65 + i);
        p.isOptimal = Math.abs(p.z - optimalZ) < 1e-5;
    });

    let xMin = 0, xMax = 0, yMin = 0, yMax = 0;
    const allPointsOfInterest = [...uniquePoints, {x:0, y:0}];
    
    problem.constraints.forEach(c => {
        const a = c.coefficients[0], b = c.coefficients[1], rhs = c.rhs;
        if (Math.abs(a) > 1e-5) allPointsOfInterest.push({ x: rhs/a, y: 0 });
        if (Math.abs(b) > 1e-5) allPointsOfInterest.push({ x: 0, y: rhs/b });
    });

    allPointsOfInterest.forEach(p => {
        if (p.x < xMin) xMin = p.x;
        if (p.x > xMax) xMax = p.x;
        if (p.y < yMin) yMin = p.y;
        if (p.y > yMax) yMax = p.y;
    });

    const padX = (xMax - xMin) * 0.1 || 1;
    const padY = (yMax - yMin) * 0.1 || 1;

    return {
        minX: xMin - padX,
        maxX: xMax + padX,
        minY: yMin - padY,
        maxY: yMax + padY,
        feasibleCorners: uniquePoints
    };
  }, [problem, nonNegative]);

  const rangeX = maxX - minX || 10;
  const rangeY = maxY - minY || 10;
  
  const scaleX = (x: number) => margin + ((x - minX) / rangeX) * (width - 2 * margin);
  const scaleY = (y: number) => height - margin - ((y - minY) / rangeY) * (height - 2 * margin);

  const feasiblePath = useMemo(() => {
    if (feasibleCorners.length < 3) return "";
    return "M " + feasibleCorners.map(p => `${scaleX(p.x)} ${scaleY(p.y)}`).join(" L ") + " Z";
  }, [feasibleCorners, minX, maxX, minY, maxY, width, height]);

  const displayLines = problem.constraints.map((c, i) => {
    const a = c.coefficients[0];
    const b = c.coefficients[1];
    const rhs = c.rhs;
    
    const intersections: Point[] = [];
    
    if (Math.abs(b) > 1e-10) {
        intersections.push({ x: minX, y: (rhs - a*minX)/b });
        intersections.push({ x: maxX, y: (rhs - a*maxX)/b });
    } else {
        intersections.push({ x: rhs/a, y: minY });
        intersections.push({ x: rhs/a, y: maxY });
    }
    
    if (Math.abs(a) > 1e-10) {
        intersections.push({ x: (rhs - b*minY)/a, y: minY });
        intersections.push({ x: (rhs - b*maxY)/a, y: maxY });
    } else {
        intersections.push({ x: minX, y: rhs/b });
        intersections.push({ x: maxX, y: rhs/b });
    }

    const valid = intersections.filter(p => 
        p.x >= minX - 1e-4 && p.x <= maxX + 1e-4 && 
        p.y >= minY - 1e-4 && p.y <= maxY + 1e-4
    );

    const unique: Point[] = [];
    valid.forEach(p => {
        if(!unique.some(u => Math.abs(u.x - p.x) < 1e-4 && Math.abs(u.y - p.y) < 1e-4)) unique.push(p);
    });

    const p1 = unique[0] || {x:0, y:0};
    const p2 = unique[1] || p1;

    const boxCorners = [{x:minX,y:minY}, {x:maxX,y:minY}, {x:maxX,y:maxY}, {x:minX,y:maxY}];
    
    const satisfies = (p: Point) => {
        const val = a * p.x + b * p.y;
        const tol = 1e-4;
        if (c.sign === ConstraintSign.LESS_EQ) return val <= c.rhs + tol;
        if (c.sign === ConstraintSign.GREATER_EQ) return val >= c.rhs - tol;
        return Math.abs(val - c.rhs) < tol;
    };

    const polyPoints = [...unique];
    boxCorners.forEach(corner => {
        if (satisfies(corner)) polyPoints.push(corner);
    });

    if (polyPoints.length > 2) {
        const cx = polyPoints.reduce((sum, p) => sum + p.x, 0) / polyPoints.length;
        const cy = polyPoints.reduce((sum, p) => sum + p.y, 0) / polyPoints.length;
        polyPoints.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    }
    
    const areaPath = "M " + polyPoints.map(p => `${scaleX(p.x)} ${scaleY(p.y)}`).join(" L ") + " Z";

    return { 
        id: c.id, 
        p1, 
        p2, 
        color: `hsl(${i * 60 + 200}, 70%, 45%)`, 
        sign: c.sign,
        areaPath 
    };
  });

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const scaleFactor = 1.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newZoom = direction > 0 ? zoom * scaleFactor : zoom / scaleFactor;
    const clampedZoom = Math.min(Math.max(newZoom, 0.5), 50);

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wx = (mx - pan.x) / zoom;
    const wy = (my - pan.y) / zoom;
    const newPanX = mx - wx * clampedZoom;
    const newPanY = my - wy * clampedZoom;

    setZoom(clampedZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleReset = () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
  };

  const containerClass = isMaximized 
    ? "fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col xl:flex-row gap-6 p-6 animate-in zoom-in duration-300"
    : "flex flex-col xl:flex-row gap-6 w-full relative";

  return (
    <div className={containerClass}>
      
      {/* Maximized Exit Button */}
      {isMaximized && (
        <button 
            onClick={() => setIsMaximized(false)}
            className="absolute top-4 right-4 z-[60] bg-slate-100 dark:bg-slate-800 p-2 rounded-full shadow-lg hover:bg-slate-200"
        >
            <Minimize2 className="w-6 h-6 text-slate-700 dark:text-slate-200"/>
        </button>
      )}

      {/* GRAPH VISUALIZATION */}
      <div className={`flex-1 flex flex-col items-center bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${isMaximized ? 'h-full justify-center' : ''}`}>
        <div className="w-full flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary-500" />
                Graphical Solution
            </h3>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowInequalities(!showInequalities)}
                    className={`text-xs px-2 py-1 rounded border transition font-medium ${showInequalities ? 'bg-primary-100 border-primary-200 text-primary-700 dark:bg-primary-900/40 dark:border-primary-700 dark:text-primary-300' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700'}`}
                >
                    Shading
                </button>
                <button onClick={handleReset} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition" title="Reset View">
                    <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition" title={isMaximized ? "Minimize" : "Maximize"}>
                    {isMaximized ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4" />}
                </button>
            </div>
        </div>
        
        <div className={`relative w-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded shadow-inner ${isMaximized ? 'h-full' : ''}`}>
            <svg 
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className={`w-full h-auto select-none touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isMaximized ? 'max-h-full' : 'max-h-[500px]'}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { setHoveredPoint(null); handleMouseUp(); }}
            >
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform={`matrix(${zoom} 0 0 ${zoom} ${pan.x} ${pan.y})`}>
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    
                    {/* Axes (Dynamic Position) */}
                    <line x1={minX} y1={scaleY(0)} x2={width} y2={scaleY(0)} stroke="currentColor" className="text-slate-800 dark:text-slate-400" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    <line x1={scaleX(0)} y1={height} x2={scaleX(0)} y2={0} stroke="currentColor" className="text-slate-800 dark:text-slate-400" strokeWidth="2" vectorEffect="non-scaling-stroke" />

                    {/* Inequality Areas */}
                    {showInequalities && displayLines.map((line, idx) => {
                        const isHovered = activeConstraintId === line.id;
                        const isOtherHovered = activeConstraintId && activeConstraintId !== line.id;
                        const opacity = isHovered ? 0.3 : (isOtherHovered ? 0 : 0.05);
                        return (
                            <path 
                                key={`area-${idx}`}
                                d={line.areaPath}
                                fill={line.color}
                                style={{ opacity, transition: 'opacity 0.3s' }}
                                pointerEvents="none" 
                            />
                        );
                    })}

                    {/* Feasible Region */}
                    {feasiblePath && (
                        <path 
                            d={feasiblePath} 
                            className="fill-green-500/40 stroke-green-600 dark:fill-green-400/30 dark:stroke-green-400 transition-all duration-500"
                            strokeWidth="3"
                            vectorEffect="non-scaling-stroke"
                        />
                    )}

                    {/* Constraint Lines */}
                    {displayLines.map((line, idx) => (
                        <g key={line.id} 
                            className="transition-opacity duration-300" 
                            style={{ opacity: activeConstraintId && activeConstraintId !== line.id ? 0.2 : 1 }}
                        >
                            <line 
                                x1={scaleX(line.p1.x)} y1={scaleY(line.p1.y)} 
                                x2={scaleX(line.p2.x)} y2={scaleY(line.p2.y)} 
                                stroke={line.color} 
                                strokeWidth={activeConstraintId === line.id ? 4 : 2}
                                vectorEffect="non-scaling-stroke"
                                strokeDasharray={line.sign === ConstraintSign.EQ ? "0" : "5,5"} 
                            />
                            {/* Label near midpoint */}
                            <text 
                                x={scaleX((line.p1.x + line.p2.x)/2)} 
                                y={scaleY((line.p1.y + line.p2.y)/2) - 10/zoom}
                                fill={line.color}
                                className="font-bold select-none"
                                style={{ fontSize: `${14 / zoom}px` }}
                                textAnchor="middle"
                            >
                                C{idx+1}
                            </text>
                        </g>
                    ))}

                    {/* Corner Points */}
                    {feasibleCorners.map((p, i) => (
                        <g key={i}>
                             {/* Optimal Point Pulse Effect */}
                             {p.isOptimal && (
                                <circle
                                    cx={scaleX(p.x)}
                                    cy={scaleY(p.y)}
                                    r={15 / zoom}
                                    className="fill-green-400/30 animate-ping"
                                />
                             )}
                            <circle
                                cx={scaleX(p.x)}
                                cy={scaleY(p.y)}
                                r={p.isOptimal ? 8/zoom : 6/zoom}
                                className={`transition-all cursor-pointer z-50 ${p.isOptimal ? 'fill-green-500 stroke-white dark:stroke-slate-900' : 'fill-white stroke-indigo-600 dark:fill-slate-800 dark:stroke-indigo-400'}`}
                                strokeWidth={3 / zoom}
                                onMouseEnter={() => setHoveredPoint(p)}
                            />
                            <text
                                x={scaleX(p.x) + 10/zoom}
                                y={scaleY(p.y) - 10/zoom}
                                className="fill-slate-700 dark:fill-slate-300 font-bold pointer-events-none"
                                style={{ fontSize: `${12 / zoom}px` }}
                            >
                                {p.label}
                            </text>
                        </g>
                    ))}
                    
                    {/* Origin Label */}
                    <text x={scaleX(0) - 15/zoom} y={scaleY(0) + 15/zoom} className="fill-slate-500 font-mono" style={{ fontSize: `${12 / zoom}px` }}>0,0</text>
                </g>
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
                <div 
                    className="absolute bg-slate-900/95 text-white text-xs p-3 rounded-lg shadow-xl pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full border border-slate-700 backdrop-blur-sm"
                    style={{ 
                        left: scaleX(hoveredPoint.x) * zoom + pan.x, 
                        top: scaleY(hoveredPoint.y) * zoom + pan.y - 15 
                    }}
                >
                    <div className="flex items-center gap-2 mb-1 border-b border-slate-700 pb-1">
                        <span className="font-bold text-lg text-primary-300">{hoveredPoint.label}</span>
                        {hoveredPoint.isOptimal && <span className="bg-green-500 text-black text-[10px] font-bold px-1 rounded shadow-sm">OPTIMAL</span>}
                    </div>
                    <div className="font-mono text-slate-300">x1: <span className="text-white">{hoveredPoint.x.toFixed(2)}</span></div>
                    <div className="font-mono text-slate-300">x2: <span className="text-white">{hoveredPoint.y.toFixed(2)}</span></div>
                    <div className={`font-mono mt-1 font-bold ${problem.type === OptimizationType.MAXIMIZE ? 'text-green-300' : 'text-blue-300'}`}>
                        Z = {hoveredPoint.z.toFixed(2)}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* CORNER POINTS TABLE */}
      <div className={`w-full flex flex-col bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit overflow-y-auto ${isMaximized ? 'xl:w-96 max-h-full' : 'xl:w-80 max-h-[600px]'}`}>
         <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Corner Points Evaluation
         </h4>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-700 font-semibold tracking-wider">
                    <tr>
                        <th className="px-3 py-2 rounded-tl-md">Point</th>
                        <th className="px-3 py-2">Coords</th>
                        <th className="px-3 py-2 text-right rounded-tr-md">Z Value</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {feasibleCorners.map((p, i) => (
                        <tr 
                            key={i} 
                            className={`transition-colors cursor-pointer ${
                                p.isOptimal 
                                    ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' 
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                            onMouseEnter={() => setHoveredPoint(p)}
                            onMouseLeave={() => setHoveredPoint(null)}
                        >
                            <td className="px-3 py-2 font-bold text-center">
                                <span className={`inline-block w-6 h-6 leading-6 rounded-full text-xs shadow-sm ${p.isOptimal ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>
                                    {p.label}
                                </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-300">
                                ({p.x.toFixed(1)}, {p.y.toFixed(1)})
                            </td>
                            <td className={`px-3 py-2 text-right font-bold font-mono ${p.isOptimal ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}`}>
                                {p.z.toFixed(2)}
                            </td>
                        </tr>
                    ))}
                    {feasibleCorners.length === 0 && (
                        <tr>
                            <td colSpan={3} className="px-3 py-8 text-center text-slate-400 italic">No feasible region found</td>
                        </tr>
                    )}
                </tbody>
            </table>
         </div>
         
         {!nonNegative && (
             <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300 rounded border border-blue-100 dark:border-blue-800">
                 <strong>Note:</strong> Unrestricted variables enabled.
             </div>
         )}
      </div>
    </div>
  );
};

export default Graph2D;