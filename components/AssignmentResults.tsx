
import React from 'react';
import { AssignmentInput, AssignmentResult, OptimizationType } from '../types';
import { CheckCircle, AlertTriangle, Users } from 'lucide-react';

interface AssignmentResultsProps {
    input: AssignmentInput;
    result: AssignmentResult;
}

const AssignmentResults: React.FC<AssignmentResultsProps> = ({ input, result }) => {
    
    const isAssigned = (r: number, c: number) => {
        return result.assignments.some(a => a.rowIdx === r && a.colIdx === c);
    };

    // Need to handle dummy labels if matrixSize > input.rows
    const displayRows = [...input.rows];
    while(displayRows.length < result.matrixSize) displayRows.push({ id: 'd', name: 'Dummy' });
    
    const displayCols = [...input.cols];
    while(displayCols.length < result.matrixSize) displayCols.push({ id: 'd', name: 'Dummy' });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Summary */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">
                            Total {input.type === OptimizationType.MAXIMIZE ? 'Profit' : 'Cost'}
                        </div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                            {result.totalValue.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Optimal Assignment (Hungarian Method)</div>
                    </div>
                </div>
                {!result.isBalanced && (
                    <div className="flex-1 bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-700 shadow-sm flex items-center gap-4">
                        <AlertTriangle className="w-8 h-8 text-yellow-600" />
                        <div>
                            <div className="font-bold text-yellow-800 dark:text-yellow-200">Unbalanced Problem</div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                Dummy rows/columns were added to perform the calculation (Value: 0).
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Result Matrix */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Optimal Assignment Matrix</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr>
                                <th className="p-2"></th>
                                {displayCols.map((c, j) => (
                                    <th key={j} className="p-3 font-bold text-slate-600 dark:text-slate-300 border-b-2 border-slate-300 dark:border-slate-600">
                                        {c.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {displayRows.map((r, i) => (
                                <tr key={i}>
                                    <td className="p-3 font-bold text-left text-slate-600 dark:text-slate-300 border-r-2 border-slate-300 dark:border-slate-600">
                                        {r.name}
                                    </td>
                                    {displayCols.map((c, j) => {
                                        const assigned = isAssigned(i, j);
                                        // Display original cost if valid, else 0 for dummy cells
                                        const cost = (i < input.matrix.length && j < input.matrix[0].length) ? input.matrix[i][j] : 0;
                                        
                                        return (
                                            <td key={j} className={`p-2 border border-slate-200 dark:border-slate-700 relative h-16 w-24 transition-colors ${assigned ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                                                <div className="flex items-center justify-center h-full">
                                                    {assigned ? (
                                                        <div className="flex flex-col items-center animate-in zoom-in">
                                                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shadow-md">
                                                                {cost}
                                                            </div>
                                                            <div className="text-[10px] text-green-600 font-bold mt-1 uppercase">Assigned</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 dark:text-slate-600 font-mono">{cost}</span>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assignments List */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4">Assignment Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.assignments.map((a, idx) => {
                        const rName = displayRows[a.rowIdx]?.name || 'Dummy';
                        const cName = displayCols[a.colIdx]?.name || 'Dummy';
                        // Skip printing dummy to dummy assignments if preferred, but usually we show everything
                        return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 dark:text-white">{rName}</span>
                                    <span className="text-xs text-slate-400">assigned to</span>
                                    <span className="font-bold text-primary-600 dark:text-primary-400">{cName}</span>
                                </div>
                                <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                                    {a.value}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Log Steps */}
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h5 className="font-bold text-sm text-slate-500 uppercase mb-3">Algorithm Steps</h5>
                    <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                        {result.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AssignmentResults;
