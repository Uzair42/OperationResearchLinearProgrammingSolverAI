
import React, { useState } from 'react';
import { GameTheoryInput, GameTheoryResult } from '../types';
import { GameTheoryEngine } from '../services/gameTheoryEngine';
import { Play, Plus, Trash2, Shield, Swords } from 'lucide-react';

interface GameTheoryBuilderProps {
    onSolve: (input: GameTheoryInput, result: GameTheoryResult) => void;
}

const GameTheoryBuilder: React.FC<GameTheoryBuilderProps> = ({ onSolve }) => {
    const [rows, setRows] = useState<string[]>(['Strategy A1', 'Strategy A2']);
    const [cols, setCols] = useState<string[]>(['Strategy B1', 'Strategy B2']);
    const [matrix, setMatrix] = useState<number[][]>([
        [10, 5],
        [2, 8]
    ]);

    const updateMatrixSize = (newRowCount: number, newColCount: number) => {
        // Adjust Rows
        const currentRows = [...rows];
        const newMatrix = matrix.map(row => [...row]);

        if (newRowCount > rows.length) {
            while (currentRows.length < newRowCount) {
                currentRows.push(`Strategy A${currentRows.length + 1}`);
                newMatrix.push(new Array(cols.length).fill(0));
            }
        } else {
            currentRows.splice(newRowCount);
            newMatrix.splice(newRowCount);
        }

        // Adjust Cols
        const currentCols = [...cols];
        if (newColCount > cols.length) {
            while (currentCols.length < newColCount) {
                currentCols.push(`Strategy B${currentCols.length + 1}`);
                newMatrix.forEach(row => row.push(0));
            }
        } else {
            currentCols.splice(newColCount);
            newMatrix.forEach(row => row.splice(newColCount));
        }

        setRows(currentRows);
        setCols(currentCols);
        setMatrix(newMatrix);
    };

    const handleSolve = () => {
        const input: GameTheoryInput = {
            playerAStrategies: rows,
            playerBStrategies: cols,
            matrix: matrix
        };
        const result = GameTheoryEngine.solve(input);
        onSolve(input, result);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                    <Swords className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Game Theory</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Two-Person Zero-Sum Games (Payoff Matrix)</p>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Player A Strategies (Row)</label>
                    <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => updateMatrixSize(rows.length - 1, cols.length)} disabled={rows.length <= 1} className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:opacity-80 disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                        <span className="w-8 text-center font-bold text-lg dark:text-white">{rows.length}</span>
                        <button onClick={() => updateMatrixSize(rows.length + 1, cols.length)} disabled={rows.length >= 6} className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:opacity-80 disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Player B Strategies (Col)</label>
                    <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => updateMatrixSize(rows.length, cols.length - 1)} disabled={cols.length <= 1} className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:opacity-80 disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                        <span className="w-8 text-center font-bold text-lg dark:text-white">{cols.length}</span>
                        <button onClick={() => updateMatrixSize(rows.length, cols.length + 1)} disabled={cols.length >= 6} className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:opacity-80 disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
                <table className="w-full text-sm text-center">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold">
                        <tr>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-700 w-32 bg-slate-200 dark:bg-slate-800">
                                <span className="text-xs text-slate-500 block">Player A \ B</span>
                            </th>
                            {cols.map((_, j) => (
                                <th key={j} className="p-2 min-w-[100px]">
                                    <input 
                                        value={cols[j]} 
                                        onChange={e => { const nc = [...cols]; nc[j] = e.target.value; setCols(nc); }} 
                                        className="w-full bg-transparent text-center font-bold focus:ring-1 focus:ring-primary-500 rounded placeholder-slate-400"
                                        placeholder={`B${j+1}`}
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {rows.map((_, i) => (
                            <tr key={i} className="bg-white dark:bg-slate-800">
                                <td className="p-2 font-bold text-left border-r border-slate-200 dark:border-slate-700 w-32 bg-slate-50 dark:bg-slate-900/50">
                                    <input 
                                        value={rows[i]} 
                                        onChange={e => { const nr = [...rows]; nr[i] = e.target.value; setRows(nr); }} 
                                        className="w-full bg-transparent font-bold focus:ring-1 focus:ring-primary-500 rounded px-2 placeholder-slate-400"
                                        placeholder={`A${i+1}`}
                                    />
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
                                            className="w-full p-3 text-center border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 font-mono text-lg"
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleSolve}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary-600/20 flex items-center gap-2 transition-transform active:scale-95"
                >
                    <Play className="w-5 h-5" /> Solve Game
                </button>
            </div>
        </div>
    );
};

export default GameTheoryBuilder;
