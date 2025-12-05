import React from 'react';
import { SolverStep } from '../types';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface TableauStepProps {
  step: SolverStep;
}

const TableauStep: React.FC<TableauStepProps> = ({ step }) => {
  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-4 transition-colors">
      <div className="mb-4">
        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">
            {step.stepIndex === 0 ? "Initial Setup" : `Iteration ${step.stepIndex}`}
        </h4>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{step.description}</p>
      </div>

      <table className="min-w-full text-center text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-700 border-b border-slate-300 dark:border-slate-600">
            <th className="p-2 border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">Basis</th>
            {step.headers.map(h => (
              <th key={h} className="p-2 border-r border-slate-200 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-300">{h}</th>
            ))}
            <th className="p-2 border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">RHS</th>
            <th className="p-2 text-slate-500 dark:text-slate-400">Ratio</th>
          </tr>
        </thead>
        <tbody>
          {step.tableau.map((row, rIdx) => {
            const isLeaving = rIdx === step.pivotRowIdx;
            return (
              <tr key={rIdx} className={`${isLeaving ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'} border-b border-slate-100 dark:border-slate-800`}>
                <td className="p-2 border-r border-slate-200 dark:border-slate-600 font-medium text-slate-700 dark:text-slate-300">{row.basicVar}</td>
                {row.coefficients.map((val, cIdx) => {
                  const isPivot = rIdx === step.pivotRowIdx && cIdx === step.pivotColIdx;
                  const isEntering = cIdx === step.pivotColIdx;
                  return (
                    <td 
                        key={cIdx} 
                        className={`p-2 border-r border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-mono 
                            ${isPivot ? 'bg-yellow-200 dark:bg-yellow-600/50 font-bold border-2 border-yellow-500 dark:border-yellow-400' : ''} 
                            ${isEntering && !isPivot ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                    >
                      {Math.abs(val) < 1e-10 ? 0 : (Number.isInteger(val) ? val : val.toFixed(2))}
                    </td>
                  );
                })}
                <td className="p-2 border-r border-slate-200 dark:border-slate-600 font-mono text-slate-800 dark:text-slate-200">
                    {row.rhs.toFixed(2)}
                </td>
                <td className="p-2 text-slate-400 font-mono text-xs">
                  {row.ratio !== null && row.ratio !== undefined ? (isFinite(row.ratio) ? row.ratio.toFixed(2) : 'Inf') : '-'}
                </td>
              </tr>
            );
          })}
          {/* Z Row */}
          <tr className="bg-slate-50 dark:bg-slate-900/50 border-t-2 border-slate-300 dark:border-slate-600 font-semibold">
            <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">Cj - Zj</td>
            {step.zRow.map((val, idx) => {
                const isEntering = idx === step.pivotColIdx;
                return (
                    <td key={idx} className={`p-2 border-r border-slate-200 dark:border-slate-600 text-blue-700 dark:text-blue-400 ${isEntering ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                        {Math.abs(val as number) < 1e-10 ? 0 : (val as number).toFixed(2)}
                    </td>
                )
            })}
            <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold">
                {step.zValue !== undefined ? (step.zValue as number).toFixed(2) : ''}
            </td>
            <td className="p-2"></td>
          </tr>
        </tbody>
      </table>

      {/* STATUS ALERTS */}
      <div className="mt-4 space-y-3">
        {step.status === 'OPTIMAL' && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md border border-green-200 dark:border-green-800">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                    <strong className="block text-lg">Optimal Solution Found!</strong>
                    <div className="mt-2 text-2xl font-bold">Z = {(step.zValue as number)?.toFixed(4)}</div>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {step.solution && Object.entries(step.solution).map(([k, v]) => (
                            <div key={k} className="bg-white dark:bg-slate-800 px-3 py-1 rounded shadow-sm border border-green-100 dark:border-green-900 text-sm font-mono">
                                {k} = {(v as number).toFixed(4)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {step.status === 'ALTERNATIVE_SOLUTION' && (
            <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 rounded-md border border-indigo-200 dark:border-indigo-800">
                <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                    <strong className="block text-lg">Alternative Optimal Solution Detected</strong>
                    <p className="mt-1 opacity-90">
                        An optimal solution has been found, but a non-basic variable has a reduced cost of 0. 
                        This implies that pivoting on that column would lead to another corner point with the same Z value. 
                        The problem has infinite solutions along the line segment connecting these points.
                    </p>
                    <div className="mt-2 text-xl font-bold">Z = {(step.zValue as number)?.toFixed(4)}</div>
                     <div className="flex flex-wrap gap-2 mt-3">
                        {step.solution && Object.entries(step.solution).map(([k, v]) => (
                            <div key={k} className="bg-white dark:bg-slate-800 px-3 py-1 rounded shadow-sm border border-indigo-100 dark:border-indigo-900 text-sm font-mono">
                                {k} = {(v as number).toFixed(4)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {step.status === 'UNBOUNDED' && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                    <strong className="block text-lg">Unbounded Solution</strong>
                    <p className="mt-1">
                        The objective function can increase indefinitely without violating any constraints. 
                        This happens because the entering variable <strong>{step.enteringVar}</strong> has no positive coefficients in its column (no limiting ratio).
                    </p>
                </div>
            </div>
        )}

        {step.status === 'INFEASIBLE' && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 rounded-md border border-orange-200 dark:border-orange-800">
                <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                    <strong className="block text-lg">Infeasible Solution</strong>
                    <p className="mt-1">
                        No solution exists that satisfies all constraints simultaneously. 
                        The Simplex method finished, but an <strong>Artificial Variable</strong> remains in the basis with a non-zero value.
                    </p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TableauStep;