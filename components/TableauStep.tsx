'use client';

import React from 'react';
import { SolverStep } from '@/lib/types';
import { CheckCircle, AlertTriangle, XCircle, ArrowDown, ArrowRight, ArrowLeft, Info, Sigma, Calculator } from 'lucide-react';

interface TableauStepProps {
  step: SolverStep;
}

const TableauStep: React.FC<TableauStepProps> = ({ step }) => {
  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 md:p-6 transition-all duration-500 hover:shadow-xl">
      
      {/* Header Info */}
      <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-3">
                <h4 className="font-bold text-xl text-primary-700 dark:text-primary-300">
                    {step.stepIndex === 1 ? "Initialization" : `Iteration ${step.stepIndex - 1}`}
                </h4>
                {step.phase && (
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase rounded">
                        Phase {step.phase}
                    </span>
                )}
            </div>
            <span className={`self-start md:self-auto px-3 py-1 text-xs font-mono rounded-full font-bold ${
                step.status === 'OPTIMAL' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 
                step.status === 'INFEASIBLE' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                step.status === 'UNBOUNDED' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
            }`}>
                {step.status === 'IN_PROGRESS' ? 'Step In Progress' : step.status}
            </span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">{step.description}</p>
        
        {/* Pivot Indicator */}
        {step.enteringVar && step.leavingVar && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium">
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded border border-green-100 dark:border-green-800 text-green-700 dark:text-green-300">
                    <span>Entering:</span>
                    <span className="font-mono font-bold bg-white dark:bg-slate-800 px-1.5 rounded shadow-sm">{step.enteringVar}</span>
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                </div>
                <div className="hidden md:block w-4 h-px bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded border border-red-100 dark:border-red-800 text-red-700 dark:text-red-300">
                    <span>Leaving:</span>
                    <span className="font-mono font-bold bg-white dark:bg-slate-800 px-1.5 rounded shadow-sm">{step.leavingVar}</span>
                    <ArrowLeft className="w-4 h-4 animate-pulse" />
                </div>
            </div>
        )}
      </div>

      {/* Standard Form Equations (Initial Step Only) */}
      {step.standardFormEquations && (
          <div className="mb-6 bg-slate-50 dark:bg-slate-900/40 p-4 rounded border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-700 dark:text-slate-300 overflow-x-auto">
              <h5 className="font-sans font-bold text-xs uppercase text-slate-500 mb-2">Model Conversion</h5>
              {step.standardFormEquations.map((eq, i) => (
                  <div key={i} className="whitespace-nowrap pb-1">{eq}</div>
              ))}
          </div>
      )}

      {/* Academic Tableau Table */}
      <div className="w-full overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-600 shadow-inner bg-slate-100 dark:bg-slate-900">
        <table className="min-w-full text-center border-collapse">
            <thead>
                {/* Row 1: Cj Values Header */}
                <tr className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs md:text-sm">
                    <th className="p-2 border-r border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-800 sticky left-0 z-20 min-w-[60px]">C<sub>j</sub></th>
                    <th className="p-2 border-r border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-800 sticky left-[60px] z-20 min-w-[80px]"></th>
                    {step.cjRow.map((val, i) => (
                        <th key={i} className="p-2 border-r border-b border-slate-300 dark:border-slate-600 min-w-[70px] font-mono">
                            {Math.abs(val) > 1000 ? (val > 0 ? 'M' : '-M') : Number.isInteger(val) ? val : val.toFixed(2)}
                        </th>
                    ))}
                    <th className="p-2 border-b border-slate-300 dark:border-slate-600 min-w-[80px]"></th>
                    <th className="p-2 border-b border-slate-300 dark:border-slate-600 min-w-[60px]"></th>
                </tr>
                {/* Row 2: Variable Names Header */}
                <tr className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs md:text-sm font-bold shadow-sm">
                    <th className="p-2 border-r border-b border-slate-300 dark:border-slate-600 sticky left-0 z-20 bg-slate-100 dark:bg-slate-700">C<sub>B</sub></th>
                    <th className="p-2 border-r border-b border-slate-300 dark:border-slate-600 sticky left-[60px] z-20 bg-slate-100 dark:bg-slate-700">Basis</th>
                    {step.headers.map((h, i) => (
                        <th key={h} className={`p-2 border-r border-b border-slate-300 dark:border-slate-600 relative ${i === step.pivotColIdx ? 'bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : ''}`}>
                            {h}
                            {i === step.pivotColIdx && <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500"></div>}
                        </th>
                    ))}
                    <th className="p-2 border-r border-b border-slate-300 dark:border-slate-600 bg-yellow-50 dark:bg-yellow-900/10">RHS</th>
                    <th className="p-2 border-b border-slate-300 dark:border-slate-600 text-slate-500">Ratio</th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 font-mono text-sm">
                {step.tableau.map((row, rIdx) => {
                    const isLeaving = rIdx === step.pivotRowIdx;
                    return (
                        <tr key={rIdx} className={`hover:bg-slate-50 dark:hover:bg-slate-750 ${isLeaving ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                            {/* Cb Column */}
                            <td className={`p-2 border-r border-b border-slate-200 dark:border-slate-700 sticky left-0 z-10 font-bold text-slate-500 dark:text-slate-400 ${isLeaving ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-slate-800'}`}>
                                {Math.abs(row.basicVarCost) > 1000 ? (row.basicVarCost > 0 ? 'M' : '-M') : Number.isInteger(row.basicVarCost) ? row.basicVarCost : row.basicVarCost.toFixed(2)}
                            </td>
                            {/* Basis Column */}
                            <td className={`p-2 border-r border-b border-slate-200 dark:border-slate-700 sticky left-[60px] z-10 font-bold text-primary-600 dark:text-primary-400 ${isLeaving ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-slate-800'}`}>
                                {row.basicVar}
                            </td>
                            {/* Matrix Coefficients */}
                            {row.coefficients.map((val, cIdx) => {
                                const isPivot = rIdx === step.pivotRowIdx && cIdx === step.pivotColIdx;
                                const isEntering = cIdx === step.pivotColIdx;
                                return (
                                    <td key={cIdx} className={`p-2 border-r border-b border-slate-200 dark:border-slate-700 relative
                                        ${isPivot ? 'bg-yellow-200 dark:bg-yellow-600 text-black dark:text-white font-bold ring-inset ring-2 ring-yellow-400' : ''}
                                        ${isEntering && !isPivot ? 'bg-green-50 dark:bg-green-900/10' : ''}
                                    `}>
                                        {Number.isInteger(val) ? val : Math.abs(val) < 1e-10 ? 0 : val.toFixed(2)}
                                    </td>
                                );
                            })}
                            {/* RHS */}
                            <td className="p-2 border-r border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 bg-yellow-50/50 dark:bg-yellow-900/5">
                                {row.rhs.toFixed(2)}
                            </td>
                            {/* Ratio */}
                            <td className="p-2 border-b border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                                {row.ratio !== null && row.ratio !== undefined ? (isFinite(row.ratio) ? row.ratio.toFixed(2) : 'Inf') : '-'}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
            {/* Footer Rows */}
            <tfoot className="bg-slate-50 dark:bg-slate-900 font-mono text-sm border-t-2 border-slate-300 dark:border-slate-600">
                {/* Zj Row */}
                <tr>
                    <td className="p-2 border-r border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 sticky left-0 z-10 font-bold text-slate-500" colSpan={2}>
                        Z<sub>j</sub>
                    </td>
                    {step.zjRow.map((val, i) => (
                        <td key={i} className="p-2 border-r border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                             {Math.abs(val) > 1000 ? (val > 0 ? 'M' : '-M') : Math.abs(val) < 1e-10 ? 0 : Number.isInteger(val) ? val : val.toFixed(2)}
                        </td>
                    ))}
                    <td className="p-2 border-r border-b border-slate-200 dark:border-slate-700 font-bold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20">
                        {step.zValue !== undefined ? step.zValue.toFixed(4) : ''}
                    </td>
                    <td></td>
                </tr>
                {/* Cj - Zj Row */}
                <tr className="bg-slate-200 dark:bg-slate-800 font-bold">
                    <td className="p-2 border-r border-slate-300 dark:border-slate-600 sticky left-0 z-10 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200" colSpan={2}>
                        C<sub>j</sub> - Z<sub>j</sub>
                    </td>
                    {step.netEvaluationRow.map((val, i) => {
                        const isEntering = i === step.pivotColIdx;
                        return (
                            <td key={i} className={`p-2 border-r border-slate-300 dark:border-slate-600 
                                ${isEntering ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900' : 'text-slate-700 dark:text-slate-300'}
                            `}>
                                 {Math.abs(val) > 1000 ? (val > 0 ? 'M' : '-M') : Math.abs(val) < 1e-10 ? 0 : Number.isInteger(val) ? val : val.toFixed(2)}
                            </td>
                        )
                    })}
                    <td className="border-r border-slate-300 dark:border-slate-600"></td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
      </div>

      {/* Matrix Operations Explanation */}
      {step.operations && step.operations.length > 0 && (
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
             <h5 className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300 mb-2">
                 <Calculator className="w-4 h-4" /> Row Operations
             </h5>
             <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm font-mono text-slate-500 dark:text-slate-400 list-disc list-inside">
                 {step.operations.map((op, i) => (
                     <li key={i}>{op}</li>
                 ))}
             </ul>
          </div>
      )}

      {/* Final Status Alerts */}
      <div className="mt-6">
        {step.status === 'OPTIMAL' && (
             <div className="flex items-center gap-4 p-5 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-xl border border-green-200 dark:border-green-800 animate-in fade-in zoom-in duration-300">
                <CheckCircle className="w-8 h-8 flex-shrink-0" />
                <div>
                    <h3 className="text-lg font-bold">Optimal Solution Found</h3>
                    <p className="text-sm opacity-90">Max Z = <span className="font-mono text-lg font-bold">{(step.zValue as number).toFixed(4)}</span></p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {step.solution && Object.entries(step.solution).map(([k,v]) => (
                            Math.abs(v as number) > 1e-6 && (
                                <span key={k} className="px-2 py-1 bg-white dark:bg-slate-800 rounded border border-green-200 dark:border-green-700 text-xs font-mono font-bold">
                                    {k} = {(v as number).toFixed(2)}
                                </span>
                            )
                        ))}
                    </div>
                </div>
            </div>
        )}
        {step.status === 'INFEASIBLE' && (
             <div className="flex items-center gap-4 p-5 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-xl border border-red-200 dark:border-red-800">
                <XCircle className="w-8 h-8 flex-shrink-0" />
                <div>
                    <h3 className="text-lg font-bold">Infeasible Solution</h3>
                    <p className="text-sm">Artificial variables remain in the basis with positive values.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TableauStep;