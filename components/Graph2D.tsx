import React, { useMemo, useState, useRef } from 'react';
import { Constraint, ConstraintSign, LPProblem, OptimizationType } from '../types';
import { ZoomIn, ZoomOut, Move, RotateCcw, Layers } from 'lucide-react';

interface Graph2DProps {
  problem: LPProblem;
}

interface Point {
  x: number;
  y: number;
}

const Graph2D: React.FC<Graph2DProps> = ({ problem }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ p: Point, z: number, label?: string } | null>(null);
  const [activeConstraintId, setActiveConstraintId] = useState<string | null>(null);
  const [showInequalities, setShowInequalities] = useState(true); // Toggle for shading
  
  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 600;
  const height = 450;
  const margin = 50;

  // 1. Calculate Max Scale
  const maxVal = useMemo(() => {
    let m = 0;
    problem.constraints.forEach(c => {
      // Use absolute values to handle negative intercepts simply for scaling logic
      // Note: Actual lines will use signed math
      const a = c.coefficients[0];
      const b = c.coefficients[1];
      const rhs = c.rhs; // Assuming normalized RHS >= 0 usually, but handling any
      
      if (Math.abs(a) > 1e-5) m = Math.max(m, Math.abs(rhs / a));
      if (Math.abs(b) > 1e-5) m = Math.max(m, Math.abs(rhs / b));
    });
    if (m === 0 || !isFinite(m) || isNaN(m)) m = 10;
    return Math.ceil(m * 1.5); 
  }, [problem.constraints]);

  // Coordinate transforms
  const scaleX = (x: number) => margin + (x / maxVal) * (width - 2 * margin);
  const scaleY = (y: number) => height - margin - (y / maxVal) * (height - 2 * margin);

  // 2. Geometry Helpers
  const getIntersection = (
    line1: { a: number, b: number, c: number }, 
    line2: { a: number, b: number, c: number }
  ): Point | null => {
    const det = line1.a * line2.b - line2.a * line1.b;
    if (Math.abs(det) < 1e-10) return null; // Parallel
    const x = (line1.c * line2.b - line2.c * line1.b) / det;
    const y = (line1.a * line2.c - line2.a * line1.c) / det;
    return { x, y };
  };

  const satisfiesConstraint = (p: Point, c: Constraint): boolean => {
    const val = c.coefficients[0] * p.x + c.coefficients[1] * p.y;
    const tol = 1e-4;
    if (c.sign === ConstraintSign.LESS_EQ) return val <= c.rhs + tol;
    if (c.sign === ConstraintSign.GREATER_EQ) return val >= c.rhs - tol;
    if (c.sign === ConstraintSign.EQ) return Math.abs(val - c.rhs) < tol;
    return false;
  };

  // 3. Find Feasible Region
  const feasibleCorners = useMemo(() => {
    const lines = problem.constraints.map(c => ({ 
      a: c.coefficients[0], 
      b: c.coefficients[1], 
      c: c.rhs 
    }));
    lines.push({ a: 1, b: 0, c: 0 }); // x=0
    lines.push({ a: 0, b: 1, c: 0 }); // y=0

    const points: Point[] = [];
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const pt = getIntersection(lines[i], lines[j]);
        if (pt) {
            // Check non-negativity
            if (pt.x >= -1e-5 && pt.y >= -1e-5) {
                const isFeasible = problem.constraints.every(c => satisfiesConstraint(pt, c));
                if (isFeasible) points.push(pt);
            }
        }
      }
    }
    // Remove duplicates & sort
    const uniquePoints: Point[] = [];
    points.forEach(p => {
        if (!uniquePoints.some(up => Math.abs(up.x - p.x) < 1e-4 && Math.abs(up.y - p.y) < 1e-4)) {
            uniquePoints.push(p);
        }
    });

    if (uniquePoints.length > 2) {
        const cx = uniquePoints.reduce((sum, p) => sum + p.x, 0) / uniquePoints.length;
        const cy = uniquePoints.reduce((sum, p) => sum + p.y, 0) / uniquePoints.length;
        uniquePoints.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    }
    return uniquePoints;
  }, [problem]);

  const feasiblePath = useMemo(() => {
    if (feasibleCorners.length < 3) return "";
    return "M " + feasibleCorners.map(p => `${scaleX(p.x)} ${scaleY(p.y)}`).join(" L ") + " Z";
  }, [feasibleCorners, maxVal]);

  // 4. Generate Lines and Shaded Areas
  const displayLines = problem.constraints.map((c, i) => {
    const a = c.coefficients[0];
    const b = c.coefficients[1];
    const rhs = c.rhs;

    // Calculate intercepts for line drawing (clipped to viewport)
    // Box for line segments: slightly larger than view to look like infinite lines
    const boxMax = maxVal;
    
    // Find intersection with box edges: x=0, x=boxMax, y=0, y=boxMax
    // Line: ax + by = rhs
    const intersections: Point[] = [];
    
    if (Math.abs(b) > 1e-10) {
        intersections.push({ x: 0, y: rhs/b }); // x=0
        intersections.push({ x: boxMax, y: (rhs - a*boxMax)/b }); // x=max
    } else {
        // Vertical line x = rhs/a
        intersections.push({ x: rhs/a, y: 0 });
        intersections.push({ x: rhs/a, y: boxMax });
    }
    
    if (Math.abs(a) > 1e-10) {
        intersections.push({ x: rhs/a, y: 0 }); // y=0
        intersections.push({ x: (rhs - b*boxMax)/a, y: boxMax }); // y=max
    } else {
        // Horizontal line y = rhs/b
        intersections.push({ x: 0, y: rhs/b });
        intersections.push({ x: boxMax, y: rhs/b });
    }

    // Filter points inside [0, boxMax]
    const validPoints = intersections.filter(p => 
        p.x >= -1e-5 && p.x <= boxMax + 1e-5 && 
        p.y >= -1e-5 && p.y <= boxMax + 1e-5
    );
    
    // Dedup
    const unique: Point[] = [];
    validPoints.forEach(p => {
        if(!unique.some(u => Math.abs(u.x - p.x) < 1e-4 && Math.abs(u.y - p.y) < 1e-4)) unique.push(p);
    });

    let p1 = unique[0] || {x:0, y:0};
    let p2 = unique[1] || p1;

    // --- AREA SHADING LOGIC ---
    // Create a polygon using the line segment and the corners of the box that satisfy the inequality
    const boxCorners = [{x:0,y:0}, {x:boxMax,y:0}, {x:boxMax,y:boxMax}, {x:0,y:boxMax}];
    const polyPoints = [...unique];
    boxCorners.forEach(corner => {
        if (satisfiesConstraint(corner, c)) polyPoints.push(corner);
    });
    
    // Sort polygon points
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

  const calculateZ = (p: Point) => {
    return problem.objectiveCoefficients[0] * p.x + problem.objectiveCoefficients[1] * p.y;
  };

  // --- Zoom & Pan ---
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const scaleFactor = 1.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newZoom = direction > 0 ? zoom * scaleFactor : zoom / scaleFactor;
    const clampedZoom = Math.min(Math.max(newZoom, 0.5), 20);

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

  return (
    <div className="w-full flex flex-col items-center bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="w-full flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Graphical Solution</h3>
        
        <div className="flex items-center gap-2">
            <button
                onClick={() => setShowInequalities(!showInequalities)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition ${showInequalities ? 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-300' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700'}`}
                title="Toggle Inequality Shading"
            >
                <Layers className="w-3 h-3" /> Areas
            </button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
            <button onClick={handleReset} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition" title="Reset View">
                <RotateCcw className="w-4 h-4" />
            </button>
            <div className="text-xs font-mono text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded">
                {(zoom * 100).toFixed(0)}%
            </div>
        </div>
      </div>
      
      <div className="relative w-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded">
        <svg 
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className={`w-full h-auto max-h-[500px] select-none touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
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
            {/* Diagonal Hatch Pattern */}
            <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1" />
            </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                
                {/* Axes */}
                <line x1={margin} y1={height - margin} x2={width - margin} y2={height - margin} stroke="currentColor" className="text-slate-800 dark:text-slate-400" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <line x1={margin} y1={height - margin} x2={margin} y2={margin} stroke="currentColor" className="text-slate-800 dark:text-slate-400" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                
                {/* Inequality Shaded Areas */}
                {showInequalities && displayLines.map((line, idx) => {
                     const isHovered = activeConstraintId === line.id;
                     const isOtherHovered = activeConstraintId && activeConstraintId !== line.id;
                     
                     // If something else is hovered, hide this. If nothing hovered, show faintly. If this hovered, show strong.
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
                {feasibleCorners.map((p, i) => {
                    const z = calculateZ(p);
                    return (
                        <circle
                            key={i}
                            cx={scaleX(p.x)}
                            cy={scaleY(p.y)}
                            r={6 / zoom}
                            className="fill-white stroke-indigo-600 dark:fill-slate-800 dark:stroke-indigo-400 transition-all cursor-pointer z-50 hover:fill-indigo-100"
                            strokeWidth={3 / zoom}
                            onMouseEnter={() => setHoveredPoint({ p, z, label: `Point ${String.fromCharCode(65+i)}` })}
                        />
                    );
                })}
                
                {/* Labels */}
                <g style={{ fontSize: `${12 / zoom}px` }} className="pointer-events-none">
                    <text x={width - margin + 10/zoom} y={height - margin + 5/zoom} className="fill-slate-600 dark:fill-slate-400 font-bold">x1</text>
                    <text x={margin - 10/zoom} y={margin - 10/zoom} className="fill-slate-600 dark:fill-slate-400 font-bold">x2</text>
                    <text x={margin - 20/zoom} y={height - margin + 15/zoom} className="fill-slate-500">0</text>
                    <text x={width - margin} y={height - margin + 20/zoom} className="fill-slate-500 text-anchor-middle">{maxVal}</text>
                    <text x={margin - 10/zoom} y={margin} className="fill-slate-500 text-anchor-end">{maxVal}</text>
                </g>
            </g>
        </svg>

        {hoveredPoint && (
            <div 
                className="absolute bg-slate-900/90 text-white text-xs p-2 rounded shadow-lg pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full"
                style={{ 
                    left: scaleX(hoveredPoint.p.x) * zoom + pan.x, 
                    top: scaleY(hoveredPoint.p.y) * zoom + pan.y - 10 
                }}
            >
                <div className="font-bold mb-1">{hoveredPoint.label}</div>
                <div>({hoveredPoint.p.x.toFixed(2)}, {hoveredPoint.p.y.toFixed(2)})</div>
                <div className={`font-mono mt-1 ${problem.type === OptimizationType.MAXIMIZE ? 'text-green-300' : 'text-blue-300'}`}>
                    Z = {hoveredPoint.z.toFixed(2)}
                </div>
            </div>
        )}
        
        <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded pointer-events-none">
            Scroll to Zoom • Drag to Pan
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm w-full justify-center">
         {displayLines.map((l, i) => (
             <div 
                key={i} 
                className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-all ${activeConstraintId === l.id ? 'bg-slate-200 dark:bg-slate-600 ring-2 ring-blue-400' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                onMouseEnter={() => setActiveConstraintId(l.id)}
                onMouseLeave={() => setActiveConstraintId(null)}
             >
                 <div className="w-3 h-3 rounded-full" style={{backgroundColor: l.color}}></div>
                 <span className="text-slate-700 dark:text-slate-200 font-medium">C{i+1} ({l.sign})</span>
             </div>
         ))}
         <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
             <div className="w-3 h-3 bg-green-500/50 border border-green-600 rounded-sm"></div>
             <span className="text-green-800 dark:text-green-300 font-medium">Feasible Region</span>
         </div>
      </div>
    </div>
  );
};

export default Graph2D;