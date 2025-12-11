
import React from 'react';
import { GameTheoryInput, GameTheoryResult } from '../types';
import { Trophy, Swords, Shield, Target, TrendingUp, AlertTriangle } from 'lucide-react';

interface GameTheoryResultsProps {
    input: GameTheoryInput;
    result: GameTheoryResult;
}

const GameTheoryResults: React.FC<GameTheoryResultsProps> = ({ input, result }) => {
    
    // Determine max probability for highlighting
    const maxProbA = Math.max(...result.optimalStrategiesA);
    const maxProbB = Math.max(...result.optimalStrategiesB);

    return (
        <div className="space-y-8 animate-fade-in">
            
            {/* Top Cards: Value & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                        <Trophy className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">Value of the Game (V)</div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                            {result.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                            {result.hasSaddlePoint ? "Pure Strategy (Saddle Point)" : "Mixed Strategy (Probabilistic)"}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-500" /> Strategic Insight
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {result.hasSaddlePoint ? (
                            <span>
                                This is a <strong>Stable Game</strong>. Both players have a definitive best move. 
                                Player A should always choose <strong>{input.playerAStrategies[result.saddlePoint!.row]}</strong> and 
                                Player B should always choose <strong>{input.playerBStrategies[result.saddlePoint!.col]}</strong>.
                            </span>
                        ) : (
                            <span>
                                This is an <strong>Unstable Game</strong>. To prevent exploitation, players must randomize their choices.
                                Optimal mix is shown below.
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Optimal Strategies Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Player A Strategies */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                            <Swords className="w-5 h-5 text-red-500" /> Player A (Maximizer)
                        </h4>
                    </div>
                    <div className="space-y-4">
                        {result.optimalStrategiesA.map((prob, i) => (
                            prob > 0.001 && (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{input.playerAStrategies[i]}</span>
                                        <span className="font-mono text-slate-500">{(prob * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3">
                                        <div 
                                            className={`h-3 rounded-full transition-all duration-1000 ${prob === maxProbA ? 'bg-red-500' : 'bg-red-300'}`} 
                                            style={{ width: `${prob * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>

                {/* Player B Strategies */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-500" /> Player B (Minimizer)
                        </h4>
                    </div>
                    <div className="space-y-4">
                        {result.optimalStrategiesB.map((prob, i) => (
                            prob > 0.001 && (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{input.playerBStrategies[i]}</span>
                                        <span className="font-mono text-slate-500">{(prob * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3">
                                        <div 
                                            className={`h-3 rounded-full transition-all duration-1000 ${prob === maxProbB ? 'bg-blue-500' : 'bg-blue-300'}`} 
                                            style={{ width: `${prob * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </div>

            {/* Matrix Visualization (Optional: Highlight Saddle Point) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
                <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Payoff Matrix Analysis</h4>
                <table className="w-full text-center border-collapse">
                    <thead>
                        <tr>
                            <th className="p-3"></th>
                            {input.playerBStrategies.map((bs, j) => (
                                <th key={j} className="p-3 font-bold text-slate-600 dark:text-slate-300 border-b-2 border-slate-200 dark:border-slate-600">
                                    {bs}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {input.playerAStrategies.map((as, i) => (
                            <tr key={i}>
                                <td className="p-3 font-bold text-left text-slate-600 dark:text-slate-300 border-r-2 border-slate-200 dark:border-slate-600">
                                    {as}
                                </td>
                                {input.matrix[i].map((val, j) => {
                                    const isSaddle = result.hasSaddlePoint && result.saddlePoint?.row === i && result.saddlePoint?.col === j;
                                    return (
                                        <td key={j} className={`p-4 border border-slate-200 dark:border-slate-700 relative transition-colors ${isSaddle ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
                                            <span className={`font-mono text-lg ${isSaddle ? 'font-bold text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {val}
                                            </span>
                                            {isSaddle && (
                                                <div className="absolute top-1 right-1">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
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

            {/* Logs */}
            {result.reductionSteps.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <h5 className="font-bold text-sm text-slate-500 uppercase mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Solution Steps
                    </h5>
                    <ul className="space-y-2">
                        {result.reductionSteps.map((step, i) => (
                            <li key={i} className="text-sm font-mono text-slate-600 dark:text-slate-400 flex gap-3">
                                <span className="text-slate-400 select-none">{(i+1).toString().padStart(2, '0')}</span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Warning for Complex Games */}
            {result.methodUsed === 'LP' && (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg border border-yellow-200 dark:border-yellow-800 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>
                        This matrix could not be fully reduced. Analytical methods (Saddle Point, Dominance, 2x2 Mixed) were insufficient. 
                        A Linear Programming solver is required for exact probabilities in MxN mixed strategy games.
                    </span>
                </div>
            )}
        </div>
    );
};

export default GameTheoryResults;
