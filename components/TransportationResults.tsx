
import React from 'react';
import { TransportationInput, TransportationResult } from '../types';
import { CheckCircle, AlertTriangle, Truck } from 'lucide-react';

interface TransportationResultsProps {
    input: TransportationInput;
    result: TransportationResult;
}

const TransportationResults: React.FC<TransportationResultsProps> = ({ input, result }) => {
    
    // Helper to get allocation for a cell
    const getAlloc = (i: number, j: number) => {
        return result.allocations.find(a => a.sourceIndex === i && a.destIndex === j);
    };

    // Include Dummy rows/cols if they were added during calculation
    // The result allocations might refer to indices outside input.sources/destinations
    // We need to reconstruct the "Effective" grid size
    const maxSourceIdx = Math.max(...result.allocations.map(a => a.sourceIndex), input.sources.length - 1);
    const maxDestIdx = Math.max(...result.allocations.map(a => a.destIndex), input.destinations.length - 1);

    const effectiveSources = [...input.sources];
    while(effectiveSources.length <= maxSourceIdx) effectiveSources.push({ id: 'dummy', name: 'Dummy', supply: 0 });
    
    const effectiveDests = [...input.destinations];
    while(effectiveDests.length <= maxDestIdx) effectiveDests.push({ id: 'dummy', name: 'Dummy', demand: 0 });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Summary */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                        <Truck className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">Total Transportation Cost</div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                            ${result.totalCost.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Method: {result.method}</div>
                    </div>
                </div>
                {!result.isBalanced && (
                    <div className="flex-1 bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-700 shadow-sm flex items-center gap-4">
                        <AlertTriangle className="w-8 h-8 text-yellow-600" />
                        <div>
                            <div className="font-bold text-yellow-800 dark:text-yellow-200">Unbalanced Problem</div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                Dummy rows/columns were added automatically to balance supply and demand.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Allocation Tableau */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Allocation Tableau</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr>
                                <th className="p-2"></th>
                                {effectiveDests.map((d, j) => (
                                    <th key={j} className="p-2 font-bold text-slate-600 dark:text-slate-300 border-b-2 border-slate-300 dark:border-slate-600">
                                        {d.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {effectiveSources.map((s, i) => (
                                <tr key={i}>
                                    <td className="p-3 font-bold text-left text-slate-600 dark:text-slate-300 border-r-2 border-slate-300 dark:border-slate-600">
                                        {s.name}
                                    </td>
                                    {effectiveDests.map((d, j) => {
                                        const alloc = getAlloc(i, j);
                                        const cost = (i < input.costs.length && j < input.costs[0].length) ? input.costs[i][j] : 0;
                                        return (
                                            <td key={j} className="p-2 border border-slate-200 dark:border-slate-700 relative h-20 w-24">
                                                {/* Cost in corner */}
                                                <div className="absolute top-1 right-1 text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-900 px-1 rounded">
                                                    {cost}
                                                </div>
                                                {/* Allocation Circle */}
                                                {alloc && (
                                                    <div className="flex flex-col items-center justify-center h-full animate-in zoom-in">
                                                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 border-2 border-green-500 flex items-center justify-center font-bold text-green-700 dark:text-green-300 shadow-sm">
                                                            {alloc.quantity}
                                                        </div>
                                                        <div className="text-[10px] text-green-600 mt-1 font-mono">
                                                            ${alloc.quantity * cost}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Steps Log */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4">Algorithm Steps</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {result.steps.map((step, i) => (
                        <div key={i} className="text-sm font-mono text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 last:border-0 pb-2">
                            <span className="text-slate-400 mr-2">[{i+1}]</span> {step}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TransportationResults;
