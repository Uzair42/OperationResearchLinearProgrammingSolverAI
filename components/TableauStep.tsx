import React from 'react';
import { SolverStep } from '../types';
import { AlertTriangle, CheckCircle, XCircle, Info, ArrowDown, ArrowRight, ArrowLeft } from 'lucide-react';

interface TableauStepProps {
  step: SolverStep;
}

const TableauStep: React.FC<TableauStepProps> = ({ step }) => {
  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 transition-all duration-500 hover:shadow-xl">
      
      {/* Step Header */}
      <div className="mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-xl text-primary-700 dark:text-primary-300">
                {step.stepIndex === 1 ? "Step 1: Standard Form & Setup" : `Iteration ${step.stepIndex - 1}`}
            </h4>
            <span className={`px-3 py-1 text-xs font-mono rounded-full ${
                step.status === 'OPTIMAL' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 
                step.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}>
                {step.status === 'IN_PROGRESS' ? 'Pivot In Progress' : step.status}
            </span>
        </div>
        <p className="text-slate-600 dark:text-slate-400">{step.description}</p>
        
        {/* Pivot Summary */}
        {step.enteringVar && step.leavingVar && (
             <div className="mt-3 flex items-center gap-4 text-sm font-medium bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg inline-block border border-slate-200 dark:border-slate-700">
                 <div className="flex items-center text-green-600 dark:text-green-400">
                    <span className="mr-1">Enter:</span> <span className="font-bold font-mono bg-green-100 dark:bg-green-900 px-2 rounded">{step.enteringVar}</span>
                    <ArrowDown className="w-4 h-4 ml-1 animate-bounce" />
                 </div>
                 <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                 <div className="flex items-center text-red-500 dark:text-red-400">
                    <span className="mr-1">Leave:</span> <span className="font-bold font-mono bg-red-100 dark:bg-red-900 px-2 rounded">{step.leavingVar}</span>
                    <ArrowLeft className="w-4 h-4 ml-1 animate-pulse" />
                 </div>
             </div>
        )}
      </div>

      {/* Standard Form Equations Display (Only for Step 1) */}
      {step.standardFormEquations && step.standardFormEquations.length > 0 && (
        <div className="mb-8 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-lg border border-slate-200 dark:border-slate-700">
            <h5 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Standard Form Constraints</h5>
            <div className="space-y-2">
                {step.standardFormEquations.map((eq, i) => (
                    <div key={i} className="font-mono text-slate-800 dark:text-slate-200 text-base">
                        {eq}
                    </div>
                ))}
            </div>
            <div className="mt-4 flex justify-center">
                <ArrowDown className="w-5 h-5 text-slate-400 animate-bounce" />
            </div>
        </div>
      )}

      {/* Tableau Table */}
      <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="min-w-full text-center text-sm border-collapse">
            <thead>
            <tr className="bg-slate-100 dark:bg-slate-700/50">
                <th className="p-3 border-b border-r border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">Basis</th>
                {step.headers.map((h, i) => (
                <th key={h} className={`p-3 border-b border-r border-slate-200 dark:border-slate-600 font-semibold min-w-[60px] relative
                    ${i === step.pivotColIdx ? 'bg-green-100/50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800 border-b-2' : 'text-slate-700 dark:text-slate-200'}
                `}>
                    {h}
                    {i === step.pivotColIdx && <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-pulse"></div>}
                </th>
                ))}
                <th className="p-3 border-b border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold bg-slate-50 dark:bg-slate-750">RHS</th>
                <th className="p-3 border-b text-slate-500 dark:text-slate-400">Ratio</th>
            </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800">
            {step.tableau.map((row, rIdx) => {
                const isLeaving = rIdx === step.pivotRowIdx;
                return (
                <tr key={rIdx} className={`border-b border-slate-100 dark:border-slate-700/50 transition-colors ${isLeaving ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                    <td className={`p-3 border-r border-slate-200 dark:border-slate-600 font-bold sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] 
                        ${isLeaving ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-800'}
                    `}>
                        {row.basicVar}
                    </td>
                    {row.coefficients.map((val, cIdx) => {
                    const isPivot = rIdx === step.pivotRowIdx && cIdx === step.pivotColIdx;
                    const isEntering = cIdx === step.pivotColIdx;
                    return (
                        <td 
                            key={cIdx} 
                            className={`p-3 border-r border-slate-100 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300 relative transition-all duration-300
                                ${isPivot ? 'bg-yellow-200 dark:bg-yellow-600 text-yellow-900 dark:text-white font-extrabold ring-4 ring-inset ring-yellow-400/50 scale-105 z-20' : ''} 
                                ${isEntering && !isPivot ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
                        >
                            {isPivot && <span className="absolute inset-0 bg-yellow-400/30 animate-ping rounded-sm"></span>}
                            <span className="relative z-10">
                                {Math.abs(val) < 1e-10 ? 0 : (Number.isInteger(val) ? val : val.toFixed(2))}
                            </span>
                        </td>
                    );
                    })}
                    <td className={`p-3 border-r border-slate-200 dark:border-slate-600 font-mono font-medium bg-slate-50/50 dark:bg-slate-800 ${isLeaving ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-white'}`}>
                        {row.rhs.toFixed(2)}
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-xs">
                    {row.ratio !== null && row.ratio !== undefined ? (isFinite(row.ratio) ? row.ratio.toFixed(2) : 'Inf') : '-'}
                    </td>
                </tr>
                );
            })}
            {/* Z Row */}
            <tr className="bg-slate-50 dark:bg-slate-900/30 font-semibold border-t-2 border-slate-200 dark:border-slate-600">
                <td className="p-3 border-r border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">Cj - Zj</td>
                {step.zRow.map((val, idx) => {
                    const isEntering = idx === step.pivotColIdx;
                    return (
                        <td key={idx} className={`p-3 border-r border-slate-200 dark:border-slate-600 font-mono text-blue-600 dark:text-blue-400 ${isEntering ? 'bg-green-50 dark:bg-green-900/10 font-bold' : ''}`}>
                            {Math.abs(val as number) < 1e-10 ? 0 : (val as number).toFixed(2)}
                        </td>
                    )
                })}
                <td className="p-3 border-r border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-slate-800">
                    {step.zValue !== undefined ? (step.zValue as number).toFixed(2) : ''}
                </td>
                <td className="p-3"></td>
            </tr>
            </tbody>
        </table>
      </div>

      {/* STATUS ALERTS */}
      <div className="mt-6">
        {step.status === 'OPTIMAL' && (
            <div className="flex items-center gap-4 p-5 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-xl border border-green-200 dark:border-green-800 animate-in fade-in zoom-in duration-300">
                <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full">
                    <CheckCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <strong className="block text-lg">Optimal Solution Found</strong>
                    <div className="mt-1 text-3xl font-bold">Z = {(step.zValue as number)?.toFixed(4)}</div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                     {step.solution && Object.entries(step.solution).map(([k, v]) => {
                         if (Math.abs(v as number) < 1e-6) return null;
                         return (
                            <div key={k} className="bg-white dark:bg-slate-800 px-3 py-1 rounded shadow-sm border border-green-100 dark:border-green-900 text-sm font-mono">
                                {k} = {(v as number).toFixed(4)}
                            </div>
                         );
                     })}
                </div>
            </div>
        )}

        {step.status === 'ALTERNATIVE_SOLUTION' && (
            <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 rounded-md border border-indigo-200 dark:border-indigo-800">
                <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                    <strong className="block text-lg">Alternative Solution</strong>
                    <p className="mt-1 opacity-90 text-sm">Infinite solutions exist along the line segment.</p>
                </div>
            </div>
        )}

        {step.status === 'UNBOUNDED' && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                    <strong className="block text-lg">Unbounded Solution</strong>
                    <p className="mt-1 text-sm">Objective increases indefinitely.</p>
                </div>
            </div>
        )}

        {step.status === 'INFEASIBLE' && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 rounded-md border border-orange-200 dark:border-orange-800">
                <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                    <strong className="block text-lg">Infeasible Solution</strong>
                    <p className="mt-1 text-sm">Constraints cannot be satisfied simultaneously.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TableauStep;