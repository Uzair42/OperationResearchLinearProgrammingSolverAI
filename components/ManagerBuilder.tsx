
import React, { useState } from 'react';
import { BusinessModel, BusinessProduct, BusinessResource, LPProblem, OptimizationType, ConstraintSign } from '../types';
import { Plus, Trash2, ArrowRight, Play, Package, Warehouse, Briefcase, Factory } from 'lucide-react';

interface ManagerBuilderProps {
    onSolve: (problem: LPProblem, modelContext: BusinessModel) => void;
}

const ManagerBuilder: React.FC<ManagerBuilderProps> = ({ onSolve }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    
    // State for Business Entities
    const [products, setProducts] = useState<BusinessProduct[]>([
        { id: 'p1', name: 'Product A', profit: 0 },
        { id: 'p2', name: 'Product B', profit: 0 }
    ]);
    const [resources, setResources] = useState<BusinessResource[]>([
        { id: 'r1', name: 'Labor Hours', available: 0 },
        { id: 'r2', name: 'Raw Material', available: 0 }
    ]);
    // consumption[resourceId][productId]
    const [consumption, setConsumption] = useState<Record<string, Record<string, number>>>({
        'r1': { 'p1': 0, 'p2': 0 },
        'r2': { 'p1': 0, 'p2': 0 }
    });

    const addProduct = () => {
        const id = `p${Date.now()}`;
        setProducts([...products, { id, name: `New Product`, profit: 0 }]);
        // Init consumption for new product
        setConsumption(prev => {
            const next = { ...prev };
            resources.forEach(r => {
                if (!next[r.id]) next[r.id] = {};
                next[r.id][id] = 0;
            });
            return next;
        });
    };

    const removeProduct = (id: string) => {
        setProducts(products.filter(p => p.id !== id));
    };

    const addResource = () => {
        const id = `r${Date.now()}`;
        setResources([...resources, { id, name: `New Resource`, available: 0 }]);
        setConsumption(prev => ({
            ...prev,
            [id]: products.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
        }));
    };

    const removeResource = (id: string) => {
        setResources(resources.filter(r => r.id !== id));
    };

    const handleConsumptionChange = (rId: string, pId: string, val: number) => {
        setConsumption(prev => ({
            ...prev,
            [rId]: {
                ...prev[rId],
                [pId]: val
            }
        }));
    };

    const generateProblem = () => {
        // 1. Convert Products to Variables
        const variables = products.map(p => p.name);
        
        // 2. Objective Function (Maximize Profit)
        const objectiveCoefficients = products.map(p => p.profit);
        
        // 3. Convert Resources to Constraints
        const constraints = resources.map((r, idx) => {
            const coeffs = products.map(p => consumption[r.id]?.[p.id] || 0);
            return {
                id: `c-${idx}`,
                coefficients: coeffs,
                sign: ConstraintSign.LESS_EQ, // Resources are usually capped
                rhs: r.available
            };
        });

        const problem: LPProblem = {
            type: OptimizationType.MAXIMIZE,
            variables,
            objectiveCoefficients,
            constraints,
            nonNegative: true // Real items can't be negative
        };

        const context: BusinessModel = {
            products,
            resources,
            consumption
        };

        onSolve(problem, context);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-slate-700 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-primary-600" />
                        Manager Planning Mode
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Define your business inventory and goals to optimize production.</p>
                </div>
                
                {/* Stepper */}
                <div className="flex items-center gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${step === i ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                            <span className="w-4 h-4 flex items-center justify-center bg-white/20 rounded-full">{i}</span>
                            {i === 1 ? 'Products' : i === 2 ? 'Resources' : 'Recipe'}
                        </div>
                    ))}
                </div>
            </div>

            {/* STEP 1: PRODUCTS */}
            {step === 1 && (
                <div className="animate-in slide-in-from-right fade-in duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-500"/> What do you produce?
                        </h3>
                        <button onClick={addProduct} className="text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition">
                            <Plus className="w-3 h-3" /> Add Product
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {products.map((p, idx) => (
                            <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 relative group">
                                <button onClick={() => removeProduct(p.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Product Name</label>
                                        <input 
                                            type="text" 
                                            value={p.name}
                                            onChange={(e) => {
                                                const updated = [...products];
                                                updated[idx].name = e.target.value;
                                                setProducts(updated);
                                            }}
                                            placeholder="e.g. Deluxe Chair"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm font-bold focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Profit per Unit ($)</label>
                                        <input 
                                            type="number" 
                                            value={p.profit}
                                            onChange={(e) => {
                                                const updated = [...products];
                                                updated[idx].profit = parseFloat(e.target.value) || 0;
                                                setProducts(updated);
                                            }}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm font-mono focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                        <button 
                            onClick={() => setStep(2)} 
                            disabled={products.length === 0}
                            className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-700 transition disabled:opacity-50"
                        >
                            Next: Define Resources <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: RESOURCES */}
            {step === 2 && (
                <div className="animate-in slide-in-from-right fade-in duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Warehouse className="w-5 h-5 text-orange-500"/> What limits your production?
                        </h3>
                        <button onClick={addResource} className="text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition">
                            <Plus className="w-3 h-3" /> Add Resource
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                        {resources.map((r, idx) => (
                            <div key={r.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 group">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Resource Name</label>
                                    <input 
                                        type="text" 
                                        value={r.name}
                                        onChange={(e) => {
                                            const updated = [...resources];
                                            updated[idx].name = e.target.value;
                                            setResources(updated);
                                        }}
                                        placeholder="e.g. Labor Hours"
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm font-bold focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Available Qty</label>
                                    <input 
                                        type="number" 
                                        value={r.available}
                                        onChange={(e) => {
                                            const updated = [...resources];
                                            updated[idx].available = parseFloat(e.target.value) || 0;
                                            setResources(updated);
                                        }}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button onClick={() => removeResource(r.id)} className="text-slate-300 hover:text-red-500 p-2 mt-4 opacity-0 group-hover:opacity-100 transition">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-between">
                         <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-700 font-bold px-4">Back</button>
                        <button 
                            onClick={() => setStep(3)} 
                            disabled={resources.length === 0}
                            className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-700 transition disabled:opacity-50"
                        >
                            Next: Production Recipe <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: CONSUMPTION MATRIX */}
            {step === 3 && (
                <div className="animate-in slide-in-from-right fade-in duration-300">
                     <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                        <Factory className="w-5 h-5 text-purple-500"/> Production Requirements
                        <span className="text-sm font-normal text-slate-500 ml-2">(How much resource per 1 unit of product)</span>
                    </h3>

                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Resource Limit</th>
                                    {products.map(p => (
                                        <th key={p.id} className="px-4 py-3 text-center text-primary-600 dark:text-primary-400">{p.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {resources.map(r => (
                                    <tr key={r.id} className="bg-white dark:bg-slate-800">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">
                                            {r.name}
                                            <div className="text-xs text-slate-400 font-normal">Max: {r.available}</div>
                                        </td>
                                        {products.map(p => (
                                            <td key={p.id} className="px-2 py-2">
                                                <input 
                                                    type="number"
                                                    value={consumption[r.id]?.[p.id] || 0}
                                                    onChange={(e) => handleConsumptionChange(r.id, p.id, parseFloat(e.target.value) || 0)}
                                                    className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:ring-2 focus:ring-primary-500 font-mono"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 flex justify-between items-center">
                        <button onClick={() => setStep(2)} className="text-slate-500 hover:text-slate-700 font-bold px-4">Back</button>
                        <button 
                            onClick={generateProblem} 
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                        >
                            <Play className="w-5 h-5" /> Generate Optimization Plan
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerBuilder;
