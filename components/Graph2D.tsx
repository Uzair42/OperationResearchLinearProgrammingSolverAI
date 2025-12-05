import React, { useMemo } from 'react';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Scatter, ComposedChart, Line, Tooltip, ReferenceArea } from 'recharts';
import { Constraint, ConstraintSign, LPProblem } from '../types';

interface Graph2DProps {
  problem: LPProblem;
}

// Generate intersection points for the feasible region
// Note: This is a simplified visualizer. For complex shading, SVG paths are better, 
// but Recharts allows us to plot lines quickly. We'll use SVG lines manually inside a container for better control over regions.

const Graph2D: React.FC<Graph2DProps> = ({ problem }) => {
  const width = 500;
  const height = 400;
  const margin = 40;

  // Determine scale
  const constraints = problem.constraints;
  const maxVal = useMemo(() => {
    let m = 10;
    constraints.forEach(c => {
      // Find intercepts
      if (c.coefficients[0] !== 0) m = Math.max(m, c.rhs / c.coefficients[0]);
      if (c.coefficients[1] !== 0) m = Math.max(m, c.rhs / c.coefficients[1]);
    });
    return Math.ceil(m * 1.2);
  }, [constraints]);

  const scaleX = (x: number) => margin + (x / maxVal) * (width - 2 * margin);
  const scaleY = (y: number) => height - margin - (y / maxVal) * (height - 2 * margin);

  // Generate lines
  const lines = constraints.map((c, i) => {
    // ax + by = rhs -> y = (rhs - ax) / b
    const x1 = 0;
    const y1 = c.coefficients[1] !== 0 ? c.rhs / c.coefficients[1] : 0; // y-intercept
    
    const x2 = c.coefficients[0] !== 0 ? c.rhs / c.coefficients[0] : 0; // x-intercept
    const y2 = 0;

    // Handle horizontal/vertical lines separately for better drawing
    let points = [];
    if (c.coefficients[1] === 0) { // Vertical x = k
        points = [
            { x: c.rhs / c.coefficients[0], y: 0 },
            { x: c.rhs / c.coefficients[0], y: maxVal }
        ];
    } else if (c.coefficients[0] === 0) { // Horizontal y = k
         points = [
            { x: 0, y: c.rhs / c.coefficients[1] },
            { x: maxVal, y: c.rhs / c.coefficients[1] }
        ];
    } else {
        points = [
            { x: 0, y: y1 },
            { x: x2, y: 0 } 
        ];
        // Extend line to edges if needed
        if (points[0].y > maxVal) {
             // Calculate x at y=maxVal
             // y = (rhs - ax)/b -> by = rhs - ax -> ax = rhs - by -> x = (rhs - by)/a
             const newX = (c.rhs - c.coefficients[1] * maxVal) / c.coefficients[0];
             points[0] = { x: newX, y: maxVal };
        }
         if (points[1].x > maxVal) {
             const newY = (c.rhs - c.coefficients[0] * maxVal) / c.coefficients[1];
             points[1] = { x: maxVal, y: newY };
        }
    }
    
    return {
       id: c.id,
       points: points,
       color: `hsl(${i * 60}, 70%, 50%)`,
       sign: c.sign
    };
  });

  return (
    <div className="w-full flex flex-col items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold mb-4">Graphical Representation</h3>
      <svg width={width} height={height} className="border border-slate-100 bg-slate-50">
        {/* Grid Lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5" opacity="0.2"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Axes */}
        <line x1={margin} y1={height - margin} x2={width - margin} y2={height - margin} stroke="black" strokeWidth="2" />
        <line x1={margin} y1={height - margin} x2={margin} y2={margin} stroke="black" strokeWidth="2" />
        
        {/* Labels */}
        <text x={width - margin + 10} y={height - margin + 5} className="text-xs">x1</text>
        <text x={margin - 10} y={margin - 10} className="text-xs">x2</text>
        <text x={margin} y={height - margin + 20} className="text-xs">0</text>
        <text x={width - margin} y={height - margin + 20} className="text-xs">{maxVal}</text>
        <text x={margin - 30} y={margin} className="text-xs">{maxVal}</text>

        {/* Constraint Lines */}
        {lines.map((line, idx) => (
            <g key={line.id}>
                <line 
                    x1={scaleX(line.points[0].x)} 
                    y1={scaleY(line.points[0].y)} 
                    x2={scaleX(line.points[1].x)} 
                    y2={scaleY(line.points[1].y)} 
                    stroke={line.color} 
                    strokeWidth="2"
                />
                 {/* Simple label near the midpoint */}
                 <text 
                    x={(scaleX(line.points[0].x) + scaleX(line.points[1].x))/2} 
                    y={(scaleY(line.points[0].y) + scaleY(line.points[1].y))/2}
                    fill={line.color}
                    className="text-xs font-bold"
                 >
                    C{idx+1}
                 </text>
            </g>
        ))}
      </svg>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
         {lines.map((l, i) => (
             <div key={i} className="flex items-center gap-2">
                 <div className="w-4 h-4 rounded" style={{backgroundColor: l.color}}></div>
                 <span>Constraint {i+1} ({l.sign})</span>
             </div>
         ))}
      </div>
    </div>
  );
};

export default Graph2D;
