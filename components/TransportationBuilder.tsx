
import React, { useState } from 'react';
import { TransportationInput, TransportationResult } from '../types';
import { TransportationEngine } from '../services/transportationEngine';
import { Plus, Trash2, Play, Grid, Truck } from 'lucide-react';

interface TransportationBuilderProps {
    onSolve: (input: TransportationInput, result: TransportationResult) => void;
}

const TransportationBuilder: React.FC<TransportationBuilderProps> = ({ onSolve }) => {
    const [numSources, setNumSources] = useState(3);
    const [numDests, setNumDests] = useState(3);
    
    const [sources, setSources] = useState<{name: string, supply: number}[]>([
        { name: 'S1', supply: 10 }, { name: 'S2', supply: 20 }, { name: 'S3', supply: 30 }
    ]);
    const [dests, setDests] = useState<{name: string, demand: number}[]>([
        { name: 'D1', demand: 15 }, { name: 'D2', demand: 25 }, { name: 'D3', demand: 20 }
    ]);
    const [costs, setCosts] = useState<number[][]>([
        [2, 3, 1],
        [5, 4, 8],
        [5, 6, 8]
    ]);
    const [method, setMethod] = useState<'NWCR' | 'LCM' | 'VAM'>('VAM');

    // Update Dimensions
    const updateDimensions = (s: number, d: number) => {
        const ns = Math.max(1, Math.min(8, s));
        const nd = Math.max(1, Math.min(8, d));
        setNumSources(ns);
        setNumDests(nd);

        // Adjust Arrays
        const newSources = [...sources];
        while(newSources.length < ns) newSources.push({ name: `S${newSources.length+1}`, supply: 0 });
        while(newSources.length > ns) newSources.pop();
        setSources(newSources);

        const newDests = [...dests];
        while(newDests.length < nd) newDests.push({ name: `D${newDests.length+1}`, demand: 0 });
        while(newDests.length > nd) newDests.pop();
        setDests(newDests);

        const newCosts = [...costs];
        while(newCosts.length < ns) newCosts.push(new Array(nd).fill(0));
        while(newCosts.length > ns) newCosts.pop();
        
        newCosts.forEach((row, i) => {
            const newRow = [...row];
            while(newRow.length < nd) newRow.push(0);
            while(newRow.length > nd) newRow.pop();
            newCosts[i] = newRow;
        });
        setCosts(newCosts);
    };

    const handleSolve = () => {
        const input: TransportationInput = {
            sources: sources.map((s, i) => ({ id: `s${i}`, name: s.name, supply: s.supply })),
            destinations: dests.map((d, i) => ({ id: `d${i}`, name: d.name, demand: d.demand })),
            costs
        };

        let result: TransportationResult;
        if (method === 'NWCR') result = TransportationEngine.solveNWCR(input);
        else if (method === 'LCM') result = TransportationEngine.solveLCM(input);
        else result = TransportationEngine.solveVAM(input);

        onSolve(input, result);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Truck className="w-6 h-6 text-primary-500" /> Transportation Model
                </h3>
                <div className="flex gap-2">
                    <select 
                        value={method} 
                        onChange={(e) => setMethod(e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-3 py-1.5 text-sm font-bold"
                    >
                        <option value="NWCR">North West Corner Rule</option>
                        <option value="LCM">Least Cost Method</option>
                        <option value="VAM">Vogel's Approximation</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Sources</label>
                    <input type="number" value={numSources} onChange={e => updateDimensions(parseInt(e.target.value), numDests)} className="w-16 p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Destinations</label>
                    <input type="number" value={numDests} onChange={e => updateDimensions(numSources, parseInt(e.target.value))} className="w-16 p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center" />
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-center">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold">
                        <tr>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-700">Cost Matrix</th>
                            {dests.map((d, j) => (
                                <th key={j} className="p-2 min-w-[80px]">
                                    <input value={d.name} onChange={e => { const nd = [...dests]; nd[j].name = e.target.value; setDests(nd); }} className="w-full bg-transparent text-center font-bold focus:ring-1 focus:ring-primary-500 rounded" />
                                </th>
                            ))}
                            <th className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l border-slate-200 dark:border-slate-700">Supply</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {sources.map((s, i) => (
                            <tr key={i} className="bg-white dark:bg-slate-800">
                                <td className="p-2 font-bold text-left border-r border-slate-200 dark:border-slate-700 w-32">
                                    <input value={s.name} onChange={e => { const ns = [...sources]; ns[i].name = e.target.value; setSources(ns); }} className="w-full bg-transparent font-bold focus:ring-1 focus:ring-primary-500 rounded px-2" />
                                </td>
                                {dests.map((_, j) => (
                                    <td key={j} className="p-1">
                                        <input 
                                            type="number" 
                                            value={costs[i][j]} 
                                            onChange={e => {
                                                const nc = [...costs];
                                                nc[i][j] = parseFloat(e.target.value) || 0;
                                                setCosts(nc);
                                            }}
                                            className="w-16 p-2 text-center border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900/50"
                                        />
                                    </td>
                                ))}
                                <td className="p-1 border-l border-slate-200 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/10">
                                    <input 
                                        type="number" 
                                        value={s.supply} 
                                        onChange={e => { const ns = [...sources]; ns[i].supply = parseFloat(e.target.value) || 0; setSources(ns); }}
                                        className="w-16 p-2 text-center font-bold text-blue-600 bg-transparent"
                                    />
                                </td>
                            </tr>
                        ))}
                        {/* Demand Row */}
                        <tr className="bg-green-50/30 dark:bg-green-900/10 border-t-2 border-slate-300 dark:border-slate-600">
                            <td className="p-3 font-bold text-green-700 dark:text-green-300 border-r border-slate-200 dark:border-slate-700">Demand</td>
                            {dests.map((d, j) => (
                                <td key={j} className="p-1">
                                    <input 
                                        type="number" 
                                        value={d.demand} 
                                        onChange={e => { const nd = [...dests]; nd[j].demand = parseFloat(e.target.value) || 0; setDests(nd); }}
                                        className="w-16 p-2 text-center font-bold text-green-600 bg-transparent"
                                    />
                                </td>
                            ))}
                            <td className="bg-slate-200 dark:bg-slate-700"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end mt-6">
                <button 
                    onClick={handleSolve}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary-600/20 flex items-center gap-2 transition-transform active:scale-95"
                >
                    <Play className="w-5 h-5" /> Calculate Allocation
                </button>
            </div>
        </div>
    );
};

export default TransportationBuilder;
