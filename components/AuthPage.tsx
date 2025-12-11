
import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { Briefcase, GraduationCap, ArrowRight, CheckCircle2, Cpu } from 'lucide-react';

interface AuthPageProps {
    onLogin: (user: UserProfile) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState<UserRole>('learner');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        companyName: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock Authentication Logic
        const newUser: UserProfile = {
            id: Date.now().toString(),
            name: formData.name || (isLogin ? 'Demo User' : 'New User'),
            email: formData.email,
            role: role,
            companyName: role === 'business' ? (formData.companyName || 'My Startup Inc.') : undefined,
            isPremium: role === 'business', // Mock: Business signups get trial premium
            avatarInitials: (formData.name || 'DU').substring(0, 2).toUpperCase()
        };
        onLogin(newUser);
    };

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/30 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px]"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-primary-600 p-2 rounded-lg">
                            <Cpu className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold">Solver<span className="text-primary-400">AI</span></h1>
                    </div>
                    <h2 className="text-5xl font-extrabold leading-tight mb-6">
                        Optimization Solved.<br /> Decisions Made.
                    </h2>
                    <p className="text-lg text-slate-300 max-w-md leading-relaxed">
                        Whether you are mastering Operations Research concepts or optimizing enterprise logistics, we provide the intelligent solvers you need.
                    </p>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-6 mt-12">
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                        <GraduationCap className="w-8 h-8 text-primary-400 mb-4" />
                        <h3 className="font-bold text-lg mb-2">For Learners</h3>
                        <p className="text-sm text-slate-300">Step-by-step Simplex, Graphical methods, and detailed theory explanations.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                        <Briefcase className="w-8 h-8 text-blue-400 mb-4" />
                        <h3 className="font-bold text-lg mb-2">For Business</h3>
                        <p className="text-sm text-slate-300">Executive summaries, sensitivity analysis, and bulk data processing.</p>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-slate-500 mt-auto">
                    &copy; 2024 SolverAI. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md space-y-8 animate-in slide-in-from-right duration-500">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {isLogin ? 'Welcome back' : 'Create your account'}
                        </h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            {isLogin ? 'Enter your details to access your workspace.' : 'Start your optimization journey today.'}
                        </p>
                    </div>

                    {/* Role Toggle */}
                    {!isLogin && (
                        <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setRole('learner')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${role === 'learner' ? 'bg-white dark:bg-slate-700 shadow-md text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <GraduationCap className="w-4 h-4" /> Learner
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('business')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${role === 'business' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <Briefcase className="w-4 h-4" /> Business
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                        )}

                        {!isLogin && role === 'business' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition"
                                    placeholder="Acme Corp"
                                    value={formData.companyName}
                                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-600/20 transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
                        >
                            {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-500">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="ml-2 font-bold text-primary-600 hover:underline"
                            >
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
