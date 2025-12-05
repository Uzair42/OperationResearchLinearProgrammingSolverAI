import React, { useMemo, useState, useRef } from 'react';
import { Constraint, ConstraintSign, LPProblem, OptimizationType } from '../types';

interface Graph2DProps {
  problem: LPProblem;
}

interface Point {
  x: number;
  y: number;
}

const Graph2D: React.FC<Graph2DProps> = ({ problem }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ p: Point, z: number, label?: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 600;
  const height = 450;
  const margin = 50;

  // 1. Calculate Max Scale based on intercepts
  const maxVal = useMemo(() => {
    let m = 0;
    problem.constraints.forEach(c => {
      const a = c.coefficients[0];
      const b = c.coefficients[1];
      const rhs = c.rhs;
      
      // Calculate intercepts
      if (Math.abs(a) > 1e-5) m = Math.max(m, rhs / a);
      if (Math.abs(b) > 1e-5) m = Math.max(m, rhs / b);
    });
    // Default fallback if problem is weird or unbounded in positive direction
    if (m === 0 || !isFinite(m) || isNaN(m)) m = 10;
    return Math.ceil(m * 1.2); 
  }, [problem.constraints]);

  // Coordinate transforms
  // SVG origin is top-left. Math origin is bottom-left.
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
    const tol = 1e-4; // Tolerance
    if (c.sign === ConstraintSign.LESS_EQ) return val <= c.rhs + tol;
    if (c.sign === ConstraintSign.GREATER_EQ) return val >= c.rhs - tol;
    if (c.sign === ConstraintSign.EQ) return Math.abs(val - c.rhs) < tol;
    return false;
  };

  // 3. Find Feasible Region Corners
  const feasibleCorners = useMemo(() => {
    // Define all boundary lines: constraints + axes (x>=0, y>=0)
    // Format ax + by = c
    const lines = problem.constraints.map(c => ({ 
      a: c.coefficients[0], 
      b: c.coefficients[1], 
      c: c.rhs 
    }));
    // Add x=0 axis
    lines.push({ a: 1, b: 0, c: 0 });
    // Add y=0 axis
    lines.push({ a: 0, b: 1, c: 0 });

    const points: Point[] = [];

    // Intersect every unique pair of lines
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const pt = getIntersection(lines[i], lines[j]);
        if (pt) {
            // Standard non-negativity constraints usually apply in LP unless specified otherwise
            // Check basic non-negativity with tolerance
            if (pt.x >= -1e-5 && pt.y >= -1e-5) {
                // Check all problem constraints
                const isFeasible = problem.constraints.every(c => satisfiesConstraint(pt, c));
                if (isFeasible) {
                   points.push(pt);
                }
            }
        }
      }
    }

    // Remove duplicates
    const uniquePoints: Point[] = [];
    points.forEach(p => {
        if (!uniquePoints.some(up => Math.abs(up.x - p.x) < 1e-4 && Math.abs(up.y - p.y) < 1e-4)) {
            uniquePoints.push(p);
        }
    });

    // Sort Angularly to draw polygon (around centroid)
    if (uniquePoints.length > 2) {
        const cx = uniquePoints.reduce((sum, p) => sum + p.x, 0) / uniquePoints.length;
        const cy = uniquePoints.reduce((sum, p) => sum + p.y, 0) / uniquePoints.length;
        uniquePoints.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    }

    return uniquePoints;
  }, [problem]);

  // Generate SVG path for polygon
  const feasiblePath = useMemo(() => {
    if (feasibleCorners.length < 3) return "";
    return "M " + feasibleCorners.map(p => `${scaleX(p.x)} ${scaleY(p.y)}`).join(" L ") + " Z";
  }, [feasibleCorners, maxVal]); // Re-calc if maxVal changes scale

  // 4. Generate Display Lines (Constraint boundaries)
  // We want to draw them across the visible area (0 to maxVal)
  const displayLines = problem.constraints.map((c, i) => {
    const a = c.coefficients[0];
    const b = c.coefficients[1];
    const rhs = c.rhs;

    let p1: Point, p2: Point;

    if (Math.abs(b) < 1e-10) { 
        // Vertical line x = rhs/a
        const x = rhs / a;
        p1 = { x, y: 0 };
        p2 = { x, y: maxVal };
    } else if (Math.abs(a) < 1e-10) {
        // Horizontal line y = rhs/b
        const y = rhs / b;
        p1 = { x: 0, y };
        p2 = { x: maxVal, y };
    } else {
        // Intercepts
        // y = (rhs - ax)/b
        // at x=0, y=rhs/b
        // at x=maxVal, y=(rhs - a*maxVal)/b
        p1 = { x: 0, y: rhs / b };
        p2 = { x: maxVal, y: (rhs - a * maxVal) / b };
    }
    
    return { id: c.id, p1, p2, color: `hsl(${i * 60 + 200}, 70%, 45%)`, sign: c.sign };
  });

  const calculateZ = (p: Point) => {
    return problem.objectiveCoefficients[0] * p.x + problem.objectiveCoefficients[1] * p.y;
  };

  return (
    <div className="w-full flex flex-col items-center bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100 self-start">Graphical Solution</h3>
      
      <div className="relative">
        <svg 
            ref={svgRef}
            width={width} 
            height={height} 
            className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded select-none cursor-crosshair shadow-inner"
            onMouseMove={(e) => {
                // Optional: Show coordinate tracking if not hovering a specific point
                // For now, simpler interaction model is sufficient
            }}
            onMouseLeave={() => setHoveredPoint(null)}
        >
            {/* Grid */}
            <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1"/>
            </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Axes */}
            <line x1={margin} y1={height - margin} x2={width - margin} y2={height - margin} stroke="currentColor" className="text-slate-800 dark:text-slate-400" strokeWidth="2" />
            <line x1={margin} y1={height - margin} x2={margin} y2={margin} stroke="currentColor" className="text-slate-800 dark:text-slate-400" strokeWidth="2" />
            
            {/* Axis Labels */}
            <text x={width - margin + 10} y={height - margin + 5} className="text-xs fill-slate-600 dark:fill-slate-400 font-bold">x1</text>
            <text x={margin - 10} y={margin - 10} className="text-xs fill-slate-600 dark:fill-slate-400 font-bold">x2</text>
            <text x={margin - 20} y={height - margin + 5} className="text-xs fill-slate-500">0</text>
            <text x={width - margin} y={height - margin + 20} className="text-xs fill-slate-500 text-anchor-middle">{maxVal}</text>
            <text x={margin - 10} y={margin} className="text-xs fill-slate-500 text-anchor-end">{maxVal}</text>

            {/* Feasible Region Polygon */}
            {feasiblePath && (
                <path 
                    d={feasiblePath} 
                    className="fill-green-500/30 stroke-green-600 stroke-2 dark:fill-green-400/20 dark:stroke-green-400"
                />
            )}

            {/* Constraint Lines */}
            {displayLines.map((line, idx) => (
                <g key={line.id}>
                    <line 
                        x1={scaleX(line.p1.x)} 
                        y1={scaleY(line.p1.y)} 
                        x2={scaleX(line.p2.x)} 
                        y2={scaleY(line.p2.y)} 
                        stroke={line.color} 
                        strokeWidth="2"
                        strokeDasharray={line.sign === ConstraintSign.EQ ? "0" : "5,3"} // Dashed for inequalities usually, but solid is clearer. Let's use slight dash for aesthetic.
                        opacity="0.7"
                    />
                    {/* Label at start */}
                    <text 
                        x={scaleX(line.p1.x) + 5} 
                        y={scaleY(line.p1.y) - 5}
                        fill={line.color}
                        className="text-xs font-bold"
                    >
                        C{idx+1}
                    </text>
                </g>
            ))}

            {/* Corner Points (Vertices) */}
            {feasibleCorners.map((p, i) => {
                const z = calculateZ(p);
                // Highlight optimal points? We don't know optimal here easily without iterating, but we can just show them all.
                return (
                    <circle
                        key={i}
                        cx={scaleX(p.x)}
                        cy={scaleY(p.y)}
                        r={6}
                        className="fill-white stroke-indigo-600 dark:fill-slate-800 dark:stroke-indigo-400 stroke-[3px] hover:r-8 transition-all cursor-pointer"
                        onMouseEnter={() => setHoveredPoint({ p, z, label: `Point ${String.fromCharCode(65+i)}` })}
                    />
                );
            })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
            <div 
                className="absolute bg-slate-900/90 text-white text-xs p-2 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
                style={{ 
                    left: scaleX(hoveredPoint.p.x), 
                    top: scaleY(hoveredPoint.p.y) - 15 
                }}
            >
                <div className="font-bold mb-1">{hoveredPoint.label}</div>
                <div>({hoveredPoint.p.x.toFixed(2)}, {hoveredPoint.p.y.toFixed(2)})</div>
                <div className={`font-mono mt-1 ${problem.type === OptimizationType.MAXIMIZE ? 'text-green-300' : 'text-blue-300'}`}>
                    Z = {hoveredPoint.z.toFixed(2)}
                </div>
            </div>
        )}
      </div>

      {/* Legend & Info */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm w-full justify-center">
         {displayLines.map((l, i) => (
             <div key={i} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                 <div className="w-3 h-3 rounded-full" style={{backgroundColor: l.color}}></div>
                 <span className="text-slate-700 dark:text-slate-200 font-medium">Constraint {i+1} ({l.sign})</span>
             </div>
         ))}
         <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
             <div className="w-3 h-3 bg-green-500/50 border border-green-600 rounded-sm"></div>
             <span className="text-green-800 dark:text-green-300 font-medium">Feasible Region</span>
         </div>
      </div>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center max-w-lg">
          The feasible region (highlighted) contains all points satisfying the constraints. 
          The optimal solution lies at one of the corner points (circles). 
          Hover over points to see their coordinates and Objective Function (Z) value.
      </p>
    </div>
  );
};

export default Graph2D;
