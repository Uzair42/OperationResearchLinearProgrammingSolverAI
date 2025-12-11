
import React, { useState } from 'react';
import { AssignmentInput, AssignmentResult, OptimizationType } from '../types';
import { AssignmentEngine } from '../services/assignmentEngine';
import { Plus, Trash2, Play, Users, ClipboardList } from 'lucide-react';

interface AssignmentBuilderProps {
    onSolve: (input: AssignmentInput, result: AssignmentResult) => void;
}

const AssignmentBuilder: React.FC<AssignmentBuilderProps> = ({ onSolve }) => {
    const [size, setSize] = useState(4);
    const [type, setType] = useState<OptimizationType>(OptimizationType.MINIMIZE);
    
    const [rows, setRows] = useState<{name: string}[]>([
        { name: 'Worker 1' }, { name: 'Worker 2' }, { name: 'Worker 3' }, { name: 'Worker 4' }
    ]);
    const [cols, setCols] = useState<{name: string}[]>([
        { name: 'Job A' }, { name: 'Job B' }, { name: 'Job C' }, { name: 'Job D' }
    ]);
    const [matrix, setMatrix] = useState<number[][]>([
        [10, 12, 19, 11],
        [5, 10, 7, 8],
        [12, 14, 13, 11],
        [8, 15, 11, 9]
    ]);

    // Update Dimensions
    const updateDimension = (n: number) => {
        const newN = Math.max(2, Math.min(8, n));
        setSize(newN);

        const newRows = [...rows];
        while(newRows.length < newN) newRows.push({ name: `Worker ${newRows.length+1}` });
        while(newRows.length > newN) newRows.pop();
        setRows(newRows);

        const newCols = [...cols];
        while(newCols.length < newN) newCols.push({ name: `Job ${String.fromCharCode(65+newCols.length)}` });
        while(newCols.length > newN) newCols.pop();
        setCols(newCols);

        const newMatrix = [...matrix];
        while(newMatrix.length < newN) newMatrix.push(new Array(newN).fill(0));
        while(newMatrix.length > newN) newMatrix.pop();
        
        newMatrix.forEach((row, i) => {
            const newRow = [...row];
            while(newRow.length < newN) newRow.push(0);
            while(newRow.length > newN) newRow.pop();
            newMatrix[i] = newRow;
        });
        setMatrix(newMatrix);
    };

    const handleSolve = () => {
        const input: AssignmentInput = {
            rows: rows.map((r, i) => ({ id: `r${i}`, name: r.name })),
            cols: cols.map((c, i) => ({ id: `c${i}`, name: c.name })),
            matrix,
            type
        };

        const result = AssignmentEngine.solveHungarian(input);
        onSolve(input, result);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-primary-500" /> Assignment Model
                </h3>
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                    <button 
                        onClick={() => setType(OptimizationType.MINIMIZE)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${type === OptimizationType.MINIMIZE ? 'bg-white dark:bg-slate-700 shadow text-primary-600' : 'text-slate-500'}`}
                    >
                        Minimize (Cost/Time)
                    </button>
                    <button 
                        onClick={() => setType(OptimizationType.MAXIMIZE)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${type === OptimizationType.MAXIMIZE ? 'bg-white dark:bg-slate-700 shadow text-primary-600' : 'text-slate-500'}`}
                    >
                        Maximize (Profit)
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <label className="text-sm font-bold text-slate-500 uppercase">Matrix Size (NxN):</label>
                <div className="flex items-center gap-2">
                    <button onClick={() => updateDimension(size - 1)} className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:opacity-80"><Trash2 className="w-4 h-4" /></button>
                    <span className="w-8 text-center font-bold text-lg dark:text-white">{size}</span>
                    <button onClick={() => updateDimension(size + 1)} className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:opacity-80"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="text-xs text-slate-400 ml-4">
                    Note: Unbalanced problems will handle dummy rows/cols automatically.
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-center">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold">
                        <tr>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-700">Resources \ Tasks</th>
                            {cols.map((c, j) => (
                                <th key={j} className="p-2 min-w-[80px]">
                                    <input value={c.name} onChange={e => { const nc = [...cols]; nc[j].name = e.target.value; setCols(nc); }} className="w-full bg-transparent text-center font-bold focus:ring-1 focus:ring-primary-500 rounded" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {rows.map((r, i) => (
                            <tr key={i} className="bg-white dark:bg-slate-800">
                                <td className="p-2 font-bold text-left border-r border-slate-200 dark:border-slate-700 w-32">
                                    <input value={r.name} onChange={e => { const nr = [...rows]; nr[i].name = e.target.value; setRows(nr); }} className="w-full bg-transparent font-bold focus:ring-1 focus:ring-primary-500 rounded px-2" />
                                </td>
                                {cols.map((_, j) => (
                                    <td key={j} className="p-1">
                                        <input 
                                            type="number" 
                                            value={matrix[i][j]} 
                                            onChange={e => {
                                                const nm = [...matrix];
                                                nm[i][j] = parseFloat(e.target.value) || 0;
                                                setMatrix(nm);
                                            }}
                                            className="w-full p-2 text-center border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800"
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end mt-6">
                <button 
                    onClick={handleSolve}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary-600/20 flex items-center gap-2 transition-transform active:scale-95"
                >
                    <Play className="w-5 h-5" /> Solve Assignment
                </button>
            </div>
        </div>
    );
};

export default AssignmentBuilder;
