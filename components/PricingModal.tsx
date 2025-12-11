
import React from 'react';
import { Check, X, CreditCard, ShieldCheck, Zap } from 'lucide-react';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onUpgrade }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
                
                {/* Left: Value Prop */}
                <div className="md:w-2/5 bg-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-600/20 to-transparent"></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                            Business Premium
                        </div>
                        <h2 className="text-3xl font-extrabold mb-4">Scale Your Optimization</h2>
                        <p className="text-slate-300 leading-relaxed mb-8">
                            Unlock advanced solvers, unlimited project history, and team collaboration features designed for enterprise needs.
                        </p>
                        <div className="space-y-4">
                            {[
                                'Unlimited Model Constraints',
                                'Priority Support',
                                'Export to Excel & API Access',
                                'Team Management'
                            ].map((feat, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="p-1 bg-green-500/20 rounded-full text-green-400">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">{feat}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative z-10 mt-8 text-xs text-slate-500">
                        Trusted by 500+ startups and enterprises.
                    </div>
                </div>

                {/* Right: Plans */}
                <div className="md:w-3/5 p-8 bg-slate-50 dark:bg-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Choose Your Plan</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Monthly */}
                        <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-blue-500 cursor-pointer transition relative bg-white dark:bg-slate-900">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300">Monthly</h4>
                            <div className="mt-2 mb-4">
                                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">$29</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <button className="w-full py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                Select Monthly
                            </button>
                        </div>

                        {/* Annual */}
                        <div className="border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-5 relative cursor-pointer shadow-sm">
                            <div className="absolute -top-3 right-4 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                SAVE 20%
                            </div>
                            <h4 className="font-bold text-blue-700 dark:text-blue-300">Annual</h4>
                            <div className="mt-2 mb-4">
                                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">$279</span>
                                <span className="text-slate-500">/yr</span>
                            </div>
                            <button 
                                onClick={onUpgrade}
                                className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-center gap-4 text-slate-400 text-sm">
                            <span className="flex items-center gap-1"><CreditCard className="w-4 h-4"/> Secure Payment</span>
                            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> Cancel Anytime</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
