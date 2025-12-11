
import React from 'react';
import { UserPersona } from '../types';
import { 
  ArrowRight, BookOpen, Target, TrendingUp, 
  BrainCircuit, Users, Truck, Clock, 
  PlayCircle, FileText, CheckCircle2 
} from 'lucide-react';

interface DashboardHomeProps {
  persona: UserPersona;
  onNavigate: (tab: string) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ persona, onNavigate }) => {
  
  const studentWidgets = [
    { title: 'Linear Programming', desc: 'Master Simplex & Graphical methods.', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100', id: 'manual' },
    { title: 'Critical Path Method', desc: 'Understand project scheduling logic.', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', id: 'network' },
    { title: 'Game Theory', desc: 'Explore competitive strategies.', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100', id: 'game_theory' },
  ];

  const businessWidgets = [
    { title: 'Optimize Logistics', desc: 'Reduce transportation & assignment costs.', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-100', id: 'transportation' },
    { title: 'Resource Allocation', desc: 'Maximize profit with LP models.', icon: Target, color: 'text-green-600', bg: 'bg-green-100', id: 'manual' },
    { title: 'Risk Analysis', desc: 'Evaluate project timelines (PERT).', icon: BrainCircuit, color: 'text-red-600', bg: 'bg-red-100', id: 'network' },
  ];

  const widgets = persona === 'student' ? studentWidgets : businessWidgets;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 md:p-12 text-white mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {persona === 'student' ? 'Ready to Master Operations Research?' : 'Optimize Your Business Operations'}
          </h2>
          <p className="text-slate-300 max-w-2xl text-lg mb-8">
            {persona === 'student' 
              ? 'Visualize algorithms step-by-step, generate standard forms, and understand the math behind optimization.' 
              : 'Deploy advanced solvers to minimize costs, maximize efficiency, and make data-driven decisions instantly.'}
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => onNavigate('manual')} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition shadow-lg shadow-primary-900/20">
              <PlayCircle className="w-5 h-5" /> Start Solving
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition backdrop-blur-sm">
              <BookOpen className="w-5 h-5" /> {persona === 'student' ? 'View Tutorials' : 'Documentation'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Suggested Tools</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {widgets.map((w, idx) => (
          <div 
            key={idx} 
            onClick={() => onNavigate(w.id)}
            className="group bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className={`w-12 h-12 rounded-lg ${w.bg} ${w.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <w.icon className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{w.title}</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{w.desc}</p>
            <div className="flex items-center text-primary-600 font-bold text-sm">
              Launch Tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Persona Specific Content */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
            {persona === 'student' ? 'Learning Roadmap' : 'Recent Optimization Reports'}
          </h4>
          <ul className="space-y-3">
            {[1,2,3].map(i => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                {persona === 'student' ? <CheckCircle2 className="w-4 h-4 text-green-500"/> : <FileText className="w-4 h-4 text-blue-500"/>}
                <span>
                  {persona === 'student' 
                    ? `Completed Module ${i}: ${['Simplex Basics', 'Duality', 'Sensitivity'][i-1]}` 
                    : `Supply Chain Analysis Q${i} - ${['North Region', 'Warehouse B', 'Fleet C'][i-1]}`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-indigo-900 p-6 rounded-xl text-white relative overflow-hidden flex flex-col justify-center">
           <div className="relative z-10">
             <h4 className="font-bold text-lg mb-2">AI Assistance</h4>
             <p className="text-indigo-200 text-sm mb-4">
               {persona === 'student' 
                 ? 'Stuck on a problem? Upload a photo of your homework and get a step-by-step breakdown.'
                 : 'Need to digitize handwritten inventory logs? Use our OCR to convert images directly into optimization models.'}
             </p>
             <button className="bg-white text-indigo-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition">
               Try AI Scanner
             </button>
           </div>
           <BrainCircuit className="absolute -bottom-4 -right-4 w-32 h-32 text-indigo-800/50" />
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
