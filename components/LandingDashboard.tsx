
import React from 'react';
import { ArrowRight, Cpu, Layers, TrendingUp, Camera, FileText, LayoutGrid, CheckCircle2, Zap, GraduationCap, Briefcase, BarChart, Truck, Split, ClipboardList, Users, Swords } from 'lucide-react';

interface LandingDashboardProps {
    onStart: () => void;
}

const LandingDashboard: React.FC<LandingDashboardProps> = ({ onStart }) => {
    return (
        <div className="w-full overflow-hidden">
            {/* HERO SECTION */}
            <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950">
                {/* Abstract Background Shapes */}
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary-200/40 dark:bg-primary-900/20 rounded-full blur-[100px] animate-float" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-[120px] animate-float-delayed" />
                
                <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
                    
                    {/* Left: Text Content */}
                    <div className="text-center lg:text-left space-y-8 opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 backdrop-blur-sm shadow-sm">
                            <Swords className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">New: Game Theory</span>
                        </div>
                        
                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                            Optimize Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400">
                                Operations
                            </span> With AI.
                        </h1>
                        
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                            A complete suite for Operations Research. Solve Linear Programming, Transportation, Assignment, Queuing Models, Game Theory, and explore Duality Theory instantly.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                            <button 
                                onClick={onStart}
                                className="group relative px-8 py-4 bg-primary-600 text-white font-bold text-lg rounded-xl shadow-xl shadow-primary-600/30 hover:bg-primary-700 hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                            >
                                <span className="relative z-10">Launch Workspace</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </button>
                            
                            <button className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-lg rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                View Documentation
                            </button>
                        </div>

                        <div className="flex items-center gap-6 justify-center lg:justify-start text-sm font-semibold text-slate-500 dark:text-slate-500 pt-4">
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Free for Education</span>
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Powered by Gemini</span>
                        </div>
                    </div>

                    {/* Right: Visual */}
                    <div className="relative hidden lg:block opacity-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <div className="relative z-10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 p-6 rounded-3xl shadow-2xl transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                            <div className="absolute top-4 right-4 flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="mt-8 space-y-4">
                                <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-32 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-300">
                                        <Swords className="w-12 h-12" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
                                        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                        <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                        <div className="h-10 w-full bg-slate-900 dark:bg-slate-600 rounded mt-4"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Floating Cards */}
                        <div className="absolute -bottom-10 -left-10 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 animate-float" style={{ animationDelay: '1s' }}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-bold uppercase">Queues</div>
                                    <div className="text-xl font-bold text-slate-900 dark:text-white">Analysis</div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -top-5 -right-5 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 animate-float" style={{ animationDelay: '2s' }}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                                    <Swords className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-bold uppercase">Game Theory</div>
                                    <div className="text-xl font-bold text-slate-900 dark:text-white">Solved</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SERVICES / FEATURES SECTION */}
            <div className="py-24 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-3">Our Services & Features</h2>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Comprehensive OR Toolkit</h3>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((f, i) => (
                            <div key={i} className="group p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors duration-300 ${f.bg} group-hover:bg-primary-600`}>
                                    <f.icon className={`w-7 h-7 ${f.color} group-hover:text-white transition-colors duration-300`} />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{f.title}</h4>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary-600 rounded-lg text-white">
                             <Cpu className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-lg text-slate-900 dark:text-white">SolverAI</span>
                    </div>
                    <div className="text-slate-500 text-sm">
                        &copy; {new Date().getFullYear()} OperationResearch Solver AI. All rights reserved.
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="text-slate-500 hover:text-primary-600 transition-colors">Privacy</a>
                        <a href="#" className="text-slate-500 hover:text-primary-600 transition-colors">Terms</a>
                        <a href="#" className="text-slate-500 hover:text-primary-600 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Helper Data for Features
const features = [
    {
        title: "Game Theory",
        desc: "Analyze competitive strategies. Find Saddle Points, apply Dominance rules, and solve Mixed Strategies.",
        icon: Swords,
        color: "text-purple-600",
        bg: "bg-purple-100 dark:bg-purple-900/30"
    },
    {
        title: "Queuing Theory",
        desc: "Analyze waiting lines using M/M/1 model. Calculate queue length, waiting times, and utilization.",
        icon: Users,
        color: "text-pink-600",
        bg: "bg-pink-100 dark:bg-pink-900/30"
    },
    {
        title: "Assignment",
        desc: "Solve Assignment problems using the Hungarian Algorithm. Supports Maximization and Unbalanced matrices.",
        icon: ClipboardList,
        color: "text-blue-600",
        bg: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
        title: "Transportation",
        desc: "Solve transportation problems using NWCR, LCM, and VAM. Visualize supply chain allocations.",
        icon: Truck,
        color: "text-green-600",
        bg: "bg-green-100 dark:bg-green-900/30"
    }
];

export default LandingDashboard;
