
import React, { useState } from 'react';
import { QueuingInput, QueuingResult } from '../types';
import { QueuingEngine } from '../services/queuingEngine';
import { Play, Users, Clock, Timer, Activity } from 'lucide-react';

interface QueuingBuilderProps {
    onSolve: (input: QueuingInput, result: QueuingResult) => void;
}

const QueuingBuilder: React.FC<QueuingBuilderProps> = ({ onSolve }) => {
    const [arrivalRate, setArrivalRate] = useState(10); // lambda
    const [serviceRate, setServiceRate] = useState(15); // mu
    const [timeUnit, setTimeUnit] = useState('Hour');

    const handleSolve = () => {
        const input: QueuingInput = {
            arrivalRate,
            serviceRate,
            timeUnit
        };
        const result = QueuingEngine.solveMM1(input);
        onSolve(input, result);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Queuing Model (M/M/1)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Single Channel, Infinite Population, Poisson Arrival</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Arrival Rate */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" /> Arrival Rate (λ)
                    </label>
                    <div className="flex items-center">
                        <input 
                            type="number" 
                            min="0"
                            step="0.1"
                            value={arrivalRate} 
                            onChange={(e) => setArrivalRate(parseFloat(e.target.value))}
                            className="w-full p-3 rounded-l-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-lg font-mono focus:ring-2 focus:ring-primary-500 outline-none" 
                        />
                        <span className="bg-slate-100 dark:bg-slate-700 border border-l-0 border-slate-300 dark:border-slate-600 p-3 rounded-r-lg text-sm text-slate-500">
                            cust / {timeUnit.toLowerCase()}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400">Average number of customers arriving per unit time.</p>
                </div>

                {/* Service Rate */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" /> Service Rate (μ)
                    </label>
                    <div className="flex items-center">
                        <input 
                            type="number" 
                            min="0"
                            step="0.1"
                            value={serviceRate} 
                            onChange={(e) => setServiceRate(parseFloat(e.target.value))}
                            className="w-full p-3 rounded-l-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-lg font-mono focus:ring-2 focus:ring-primary-500 outline-none" 
                        />
                        <span className="bg-slate-100 dark:bg-slate-700 border border-l-0 border-slate-300 dark:border-slate-600 p-3 rounded-r-lg text-sm text-slate-500">
                            cust / {timeUnit.toLowerCase()}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400">Average number of customers served per unit time.</p>
                </div>

                {/* Time Unit */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" /> Time Unit
                    </label>
                    <select 
                        value={timeUnit}
                        onChange={(e) => setTimeUnit(e.target.value)}
                        className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="Hour">Hour</option>
                        <option value="Minute">Minute</option>
                        <option value="Day">Day</option>
                    </select>
                    <p className="text-xs text-slate-400">Base unit for calculations (e.g., waiting time in hours).</p>
                </div>
            </div>

            {arrivalRate >= serviceRate && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                    <div className="p-1 bg-red-100 dark:bg-red-900/50 rounded text-red-600">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-red-800 dark:text-red-300 text-sm">Unstable System Warning</h4>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Arrival Rate (λ) is greater than or equal to Service Rate (μ). 
                            The queue will grow infinitely. A steady state solution does not exist.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <button 
                    onClick={handleSolve}
                    disabled={arrivalRate <= 0 || serviceRate <= 0}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary-600/20 flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Play className="w-5 h-5" /> Calculate Performance
                </button>
            </div>
        </div>
    );
};

export default QueuingBuilder;
