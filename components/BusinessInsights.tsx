
import React from 'react';
import { BusinessModel, SolverStep } from '../types';
import { TrendingUp, AlertTriangle, CheckCircle, DollarSign, PieChart, Info, Package } from 'lucide-react';

interface BusinessInsightsProps {
    model: BusinessModel;
    finalStep: SolverStep;
}

const BusinessInsights: React.FC<BusinessInsightsProps> = ({ model, finalStep }) => {
    if (finalStep.status !== 'OPTIMAL' || !finalStep.solution) {
        return null;
    }

    // Map mathematical vars back to products
    const productionPlan = model.products.map((p, idx) => {
        // Assuming vars are in order x1, x2... corresponding to products array
        // In the solver, variables are usually named using the original passed names
        const varName = p.name; // In ManagerBuilder we set var name to Product Name
        const quantity = finalStep.solution?.[varName] || 0;
        return {
            ...p,
            quantity,
            totalRevenue: quantity * p.profit
        };
    });

    // Calculate Resource Usage & Shadow Prices
    const resourceAnalysis = model.resources.map((r, idx) => {
        // Calculate used amount
        let used = 0;
        productionPlan.forEach(p => {
             // Find consumption 
             const consumedPerUnit = model.consumption[r.id]?.[p.id] || 0;
             used += consumedPerUnit * p.quantity;
        });
        
        // Slack variable logic: 
        // In Simplex, slack variables (s1, s2...) correspond to constraints 1, 2...
        // If s1 is in the solution basis, it means there is slack (unused resource).
        const slackVarName = `s${idx + 1}`;
        const unused = finalStep.solution?.[slackVarName] || 0;
        
        // Shadow Price logic:
        // In the final tableau, the Cj-Zj value (net evaluation) for the slack variable 
        // represents the shadow price (marginal value) of that resource.
        // Or it might be in the Zj row depending on tableau orientation. 
        // LPEngine logic stores netEvaluationRow. 
        // For Maximization, Shadow Price = - (Cj - Zj) of slack var? 
        // Let's use the helper passed from engine if available, or infer it.
        // In standard Simplex maximization:
        // Shadow Price is typically the value in the Zj row (or negative Cj-Zj) under the Slack variable column.
        
        const slackColIdx = finalStep.headers.indexOf(slackVarName);
        let shadowPrice = 0;
        if (slackColIdx !== -1) {
            // In optimal table, for slack var s_i:
            // C_s = 0. So Cj - Zj = -Zj. 
            // Shadow price is usually Zj (Opportunity Cost).
            // Since we store NetEval = Cj - Zj, and Cj=0, then NetEval = -Zj.
            // So Shadow Price = -NetEval.
            shadowPrice = -1 * (finalStep.netEvaluationRow[slackColIdx] || 0);
            // Floating point cleanup
            if (Math.abs(shadowPrice) < 1e-6) shadowPrice = 0;
        }

        return {
            ...r,
            used,
            unused,
            utilization: (used / r.available) * 100,
            shadowPrice
        };
    });

    const totalProfit = finalStep.zValue || 0;

    return (
        <div className="space-y-6 no-print">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary-600" />
                Executive Summary & Decision Analysis
            </h2>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="text-slate-500 text-sm font-bold uppercase mb-2">Projected Profit</div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 flex items-center">
                        <DollarSign className="w-6 h-6" /> {totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">Optimal outcome based on constraints</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="text-slate-500 text-sm font-bold uppercase mb-2">Production Volume</div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
                        <Package className="w-6 h-6 mr-2" /> 
                        {productionPlan.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()} <span className="text-lg text-slate-400 ml-1">units</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                     <div className="text-slate-500 text-sm font-bold uppercase mb-2">Constraint Status</div>
                     <div className="flex flex-col gap-1">
                         {resourceAnalysis.map(r => (
                             <div key={r.id} className="flex justify-between text-sm">
                                 <span className="text-slate-600 dark:text-slate-300">{r.name}:</span>
                                 <span className={`font-bold ${r.unused < 1e-4 ? 'text-red-500' : 'text-green-500'}`}>
                                     {r.unused < 1e-4 ? 'Bottleneck' : `${r.unused.toFixed(1)} slack`}
                                 </span>
                             </div>
                         ))}
                     </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* PRODUCTION PLAN */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary-500" /> Recommended Production
                    </h3>
                    <div className="space-y-4">
                        {productionPlan.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white text-lg">{p.name}</div>
                                    <div className="text-xs text-slate-500">Margin: ${p.profit}/unit</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary-700 dark:text-primary-400">{p.quantity.toFixed(2)}</div>
                                    <div className="text-xs font-mono text-slate-500">Units to produce</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {productionPlan.every(p => p.quantity === 0) && (
                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded mt-4 text-sm">
                            Production is zero. Check if profits are positive or constraints are too tight.
                        </div>
                    )}
                </div>

                {/* SENSITIVITY / RESOURCE ANALYSIS */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" /> Resource Sensitivity Analysis
                    </h3>
                    <div className="space-y-3">
                        {resourceAnalysis.map(r => (
                            <div key={r.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0 pb-3 last:pb-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{r.name}</span>
                                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                        {r.used.toFixed(1)} / {r.available} Used
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                                    <div 
                                        className={`h-2 rounded-full ${r.utilization >= 99 ? 'bg-red-500' : 'bg-green-500'}`} 
                                        style={{ width: `${Math.min(r.utilization, 100)}%` }}
                                    ></div>
                                </div>
                                {r.shadowPrice > 0.01 ? (
                                    <div className="text-xs flex items-start gap-1.5 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>
                                            <strong>Opportunity:</strong> This resource is a bottleneck. 
                                            Acquiring 1 additional unit would increase total profit by 
                                            <strong className="ml-1">${r.shadowPrice.toFixed(2)}</strong>.
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-400 italic pl-1">
                                        Surplus available ({r.unused.toFixed(1)} units). Increasing this resource adds no value.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessInsights;
