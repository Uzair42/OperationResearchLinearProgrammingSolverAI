import React from 'react';
import { SolverStep } from '../types';

interface TableauStepProps {
  step: SolverStep;
}

const TableauStep: React.FC<TableauStepProps> = ({ step }) => {
  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow border border-slate-200 p-4">
      <div className="mb-4">
        <h4 className="font-bold text-lg text-slate-800">Iteration {step.stepIndex}</h4>
        <p className="text-slate-600 text-sm">{step.description}</p>
      </div>

      <table className="min-w-full text-center text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-300">
            <th className="p-2 border-r border-slate-200">Basis</th>
            {step.headers.map(h => (
              <th key={h} className="p-2 border-r border-slate-200 font-semibold">{h}</th>
            ))}
            <th className="p-2 border-r border-slate-200">RHS</th>
            <th className="p-2 text-slate-500">Ratio</th>
          </tr>
        </thead>
        <tbody>
          {step.tableau.map((row, rIdx) => {
            const isLeaving = rIdx === step.pivotRowIdx;
            return (
              <tr key={rIdx} className={isLeaving ? 'bg-red-50' : 'hover:bg-slate-50'}>
                <td className="p-2 border-r border-slate-200 font-medium text-slate-700">{row.basicVar}</td>
                {row.coefficients.map((val, cIdx) => {
                  const isPivot = rIdx === step.pivotRowIdx && cIdx === step.pivotColIdx;
                  const isEntering = cIdx === step.pivotColIdx;
                  return (
                    <td 
                        key={cIdx} 
                        className={`p-2 border-r border-slate-200 ${isPivot ? 'bg-yellow-200 font-bold border-2 border-yellow-500' : ''} ${isEntering && !isPivot ? 'bg-green-50' : ''}`}
                    >
                      {Number.isInteger(val) ? val : val.toFixed(2)}
                    </td>
                  );
                })}
                <td className="p-2 border-r border-slate-200 font-mono">{row.rhs.toFixed(2)}</td>
                <td className="p-2 text-slate-400 font-mono text-xs">
                  {row.ratio !== null && row.ratio !== undefined ? row.ratio : '-'}
                </td>
              </tr>
            );
          })}
          {/* Z Row */}
          <tr className="bg-slate-50 border-t-2 border-slate-300 font-semibold">
            <td className="p-2 border-r border-slate-200">Z</td>
            {step.zRow.map((val, idx) => (
                <td key={idx} className="p-2 border-r border-slate-200 text-blue-700">
                    {val.toFixed(2)}
                </td>
            ))}
            <td className="p-2 border-r border-slate-200">{step.zValue !== undefined ? step.zValue.toFixed(2) : ''}</td>
            <td className="p-2"></td>
          </tr>
        </tbody>
      </table>

      {step.isOptimal && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md border border-green-200">
            <strong>Optimal Solution Found!</strong><br/>
            Z = {step.zValue?.toFixed(4)}
            <div className="flex gap-4 mt-2">
                {step.solution && Object.entries(step.solution).map(([k, v]) => (
                    <span key={k} className="bg-white px-2 py-1 rounded shadow-sm text-sm">{k} = {v}</span>
                ))}
            </div>
        </div>
      )}
      {step.status === 'UNBOUNDED' && (
           <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md border border-red-200">
            <strong>Solution is Unbounded.</strong>
        </div>
      )}
    </div>
  );
};

export default TableauStep;
