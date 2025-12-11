
import React, { useState } from 'react';
import { LPProblem, OptimizationType, ConstraintSign, SolverMethod } from '../types';
import { LPEngine } from '../services/lpEngine';
import { Plus, Trash2, ArrowRight, Play, Settings, Split, Eye, Calculator } from 'lucide-react';

interface ManualBuilderProps {
    onSolve: (problem: LPProblem, method: SolverMethod) => void;
}

const ManualBuilder: React.FC<ManualBuilderProps> = ({ onSolve }) => {
    const [numVars, setNumVars] = useState(2);
    const [type, setType] = useState<OptimizationType>(OptimizationType.MAXIMIZE);
    const [method, setMethod] = useState<SolverMethod>(SolverMethod.SIMPLEX);
    const [objCoeffs, setObjCoeffs] = useState<number[]>([0, 0]);
    const [constraints, setConstraints] = useState<{coeffs: number[], sign: ConstraintSign, rhs: number}[]>([
        { coeffs: [0, 0], sign: ConstraintSign.LESS_EQ, rhs: 0 }
    ]);
    const [nonNegative, setNonNegative] = useState(true);
    const [showDual, setShowDual] = useState(false);
    const [dualProblem, setDualProblem] = useState<LPProblem | null>(null);

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

    const constructProblem = (): LPProblem => {
        const variables = Array.from({ length: numVars }, (_, i) => `x${i + 1}`);
        return {
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
    };

    const handleSubmit = () => {
        onSolve(constructProblem(), method);
    };

    const handleToggleDual = () => {
        if (!showDual) {
            const primal = constructProblem();
            const dual = LPEngine.getDualProblem(primal);
            setDualProblem(dual);
        }
        setShowDual(!showDual);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 animate-fade-in text-slate-900 dark:text-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Manual Problem Entry</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={handleToggleDual}
                        className="text-xs flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-full font-bold hover:bg-indigo-100 transition"
                    >
                        {showDual ? <Eye className="w-3 h-3"/> : <Split className="w-3 h-3"/>}
                        {showDual ? 'Hide Dual' : 'View Dual'}
                    </button>
                </div>
            </div>
            
            {/* Dual View Modal/Section */}
            {showDual && dualProblem && (
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-900 animate-in slide-in-from-top-2">
                    <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-2 uppercase tracking-wide">Dual Formulation</h4>
                    <div className="font-mono text-sm space-y-1">
                        <div className="font-bold">
                            {dualProblem.type} W = {dualProblem.objectiveCoefficients.map((c, i) => `${c}y${i+1}`).join(' + ')}
                        </div>
                        <div className="text-slate-500 text-xs mt-2 mb-1">Subject to:</div>
                        {dualProblem.constraints.map((c, i) => (
                            <div key={i} className="text-slate-700 dark:text-slate-300">
                                {c.coefficients.map((coef, j) => `${coef}y${j+1}`).join(' + ')} {c.sign} {c.rhs}
                            </div>
                        ))}
                        <div className="text-slate-500 text-xs mt-1">y &ge; 0</div>
                    </div>
                </div>
            )}

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Objective</label>
                    <select 
                        value={type} 
                        onChange={(e) => setType(e.target.value as OptimizationType)}
                        className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
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
                        className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Solving Method</label>
                    <select 
                        value={method} 
                        onChange={(e) => setMethod(e.target.value as SolverMethod)}
                        className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                    >
                        <option value={SolverMethod.SIMPLEX}>Standard Simplex (Slack Variables)</option>
                        <option value={SolverMethod.BIG_M}>Big M Method (Artificial Variables)</option>
                        <option value={SolverMethod.TWO_PHASE}>Two-Phase Method (Artificial Variables)</option>
                    </select>
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
                <div className="flex justify-between items-center mt-3">
                    <button 
                        onClick={addConstraint}
                        className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" /> Add Constraint
                    </button>
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="nonNegative"
                            checked={nonNegative}
                            onChange={(e) => setNonNegative(e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-slate-300"
                        />
                        <label htmlFor="nonNegative" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            x, y &ge; 0
                        </label>
                    </div>
                </div>
            </div>

            <button 
                onClick={handleSubmit}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-[1.01] flex items-center justify-center gap-2"
            >
                <Calculator className="w-4 h-4" /> Solve Problem
            </button>
        </div>
    );
};

export default ManualBuilder;
