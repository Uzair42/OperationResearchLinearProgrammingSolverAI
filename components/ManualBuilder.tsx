'use client';

import React, { useState } from 'react';
import { LPProblem, OptimizationType, ConstraintSign } from '@/lib/types';
import { Plus, Trash2, ArrowRight, Play, Settings } from 'lucide-react';

interface ManualBuilderProps {
    onSolve: (problem: LPProblem) => void;
}

const ManualBuilder: React.FC<ManualBuilderProps> = ({ onSolve }) => {
    const [numVars, setNumVars] = useState(2);
    const [type, setType] = useState<OptimizationType>(OptimizationType.MAXIMIZE);
    const [objCoeffs, setObjCoeffs] = useState<number[]>([0, 0]);
    const [constraints, setConstraints] = useState<{coeffs: number[], sign: ConstraintSign, rhs: number}[]>([
        { coeffs: [0, 0], sign: ConstraintSign.LESS_EQ, rhs: 0 }
    ]);
    const [nonNegative, setNonNegative] = useState(true);

    // Handle variable count change
    const updateNumVars = (n: number) => {
        const newN = Math.max(1, Math.min(10, n));
        setNumVars(newN);
        
        // Adjust objective coeffs
        const newObj = [...objCoeffs];
        while(newObj.length < newN) newObj.push(0);
        while(newObj.length > newN) newObj.pop();
        setObjCoeffs(newObj);

        // Adjust constraints
        setConstraints(prev => prev.map(c => {
            const newCoeffs = [...c.coeffs];
            while(newCoeffs.length < newN) newCoeffs.push(0);
            while(newCoeffs.length > newN) newCoeffs.pop();
            return { ...c, coeffs: newCoeffs };
        }));
    };

    const addConstraint = () => {
        setConstraints([...constraints, { coeffs: Array(numVars).fill(0), sign: ConstraintSign.LESS_EQ, rhs: 0 }]);
    };

    const removeConstraint = (idx: number) => {
        setConstraints(constraints.filter((_, i) => i !== idx));
    };

    const handleSubmit = () => {
        const variables = Array.from({ length: numVars }, (_, i) => `x${i + 1}`);
        const problem: LPProblem = {
            type,
            variables,
            objectiveCoefficients: objCoeffs,
            constraints: constraints.map((c, i) => ({
                id: `mc-${i}`,
                coefficients: c.coeffs,
                sign: c.sign,
                rhs: c.rhs
            })),
            nonNegative
        };
        onSolve(problem);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 animate-fade-in text-slate-900 dark:text-slate-100">
            <h3 className="text-lg font-bold mb-4">Manual Problem Entry</h3>
            
            {/* Settings */}
            <div className="flex flex-wrap gap-6 mb-6 items-end border-b border-slate-100 dark:border-slate-700 pb-6">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Optimization</label>
                    <select 
                        value={type} 
                        onChange={(e) => setType(e.target.value as OptimizationType)}
                        className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                    >
                        <option value={OptimizationType.MAXIMIZE}>Maximize</option>
                        <option value={OptimizationType.MINIMIZE}>Minimize</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Variables</label>
                    <input 
                        type="number" 
                        value={numVars} 
                        onChange={(e) => updateNumVars(parseInt(e.target.value) || 2)}
                        className="w-20 p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="flex items-center gap-2 pb-2">
                    <input 
                        type="checkbox" 
                        id="nonNegative"
                        checked={nonNegative}
                        onChange={(e) => setNonNegative(e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-slate-300"
                    />
                    <label htmlFor="nonNegative" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Non-negative Constraints (x, y &ge; 0)
                    </label>
                </div>
            </div>

            {/* Objective Function */}
            <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800">
                <label className="block text-sm font-bold text-primary-800 dark:text-primary-300 mb-2">Objective Function (Z)</label>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{type === OptimizationType.MAXIMIZE ? 'Max' : 'Min'} Z = </span>
                    {objCoeffs.map((val, i) => (
                        <div key={i} className="flex items-center">
                            {i > 0 && <span className="mx-1 text-slate-400">+</span>}
                            <input 
                                type="number"
                                value={val}
                                onChange={(e) => {
                                    const newC = [...objCoeffs];
                                    newC[i] = parseFloat(e.target.value) || 0;
                                    setObjCoeffs(newC);
                                }}
                                className="w-16 p-1 text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-primary-500"
                            />
                            <span className="ml-1 font-mono text-slate-600 dark:text-slate-300">x{i+1}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Constraints */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Constraints</label>
                <div className="space-y-3">
                    {constraints.map((c, cIdx) => (
                        <div key={cIdx} className="flex flex-wrap items-center gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-750 transition border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                            <span className="text-xs text-slate-400 w-4">{cIdx + 1}.</span>
                            {c.coeffs.map((val, vIdx) => (
                                <div key={vIdx} className="flex items-center">
                                    {vIdx > 0 && <span className="mx-1 text-slate-400">+</span>}
                                    <input 
                                        type="number"
                                        value={val}
                                        onChange={(e) => {
                                            const newConstraints = [...constraints];
                                            newConstraints[cIdx].coeffs[vIdx] = parseFloat(e.target.value) || 0;
                                            setConstraints(newConstraints);
                                        }}
                                        className="w-16 p-1 text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-primary-500"
                                    />
                                    <span className="ml-1 font-mono text-xs text-slate-500 dark:text-slate-400">x{vIdx+1}</span>
                                </div>
                            ))}
                            
                            <select 
                                value={c.sign}
                                onChange={(e) => {
                                    const newConstraints = [...constraints];
                                    newConstraints[cIdx].sign = e.target.value as ConstraintSign;
                                    setConstraints(newConstraints);
                                }}
                                className="mx-2 p-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-primary-500"
                            >
                                <option value="<=">&le;</option>
                                <option value=">=">&ge;</option>
                                <option value="=">=</option>
                            </select>

                            <input 
                                type="number"
                                value={c.rhs}
                                onChange={(e) => {
                                    const newConstraints = [...constraints];
                                    newConstraints[cIdx].rhs = parseFloat(e.target.value) || 0;
                                    setConstraints(newConstraints);
                                }}
                                className="w-20 p-1 text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-primary-500"
                            />

                            <button 
                                onClick={() => removeConstraint(cIdx)}
                                className="ml-auto text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <button 
                    onClick={addConstraint}
                    className="mt-3 flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700"
                >
                    <Plus className="w-4 h-4" /> Add Constraint
                </button>
            </div>

            <button 
                onClick={handleSubmit}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-[1.01] flex items-center justify-center gap-2"
            >
                <Play className="w-4 h-4" /> Solve Problem
            </button>
        </div>
    );
};

export default ManualBuilder;