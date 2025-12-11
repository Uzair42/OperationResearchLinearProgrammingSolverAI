
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  Network, 
  Truck, 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Settings,
  History,
  Briefcase,
  GraduationCap,
  Map,
  Share2,
  GitBranch,
  BrainCircuit,
  Lightbulb
} from 'lucide-react';
import { UserPersona } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  persona: UserPersona;
  onToggleHistory: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, persona, onToggleHistory, onOpenSettings }) => {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'logistics': true,
    'operations': true,
    'network': true,
    'ai_ml': true
  });

  const toggleSubMenu = (key: string) => {
    setExpandedMenus(prev => ({...prev, [key]: !prev[key]}));
  };

  const navItemClass = (id: string) => `
    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer mb-1
    ${activeTab === id 
      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-2 border-primary-600 dark:border-primary-400' 
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
  `;

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
      transition-all duration-300 ease-in-out flex flex-col
      ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}
    `}>
      {/* Brand / Logo Area */}
      <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-100 dark:border-slate-800 relative">
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <div className="bg-primary-600 text-white p-1.5 rounded-lg shadow-lg shadow-primary-500/30">
            {persona === 'business' ? <Briefcase className="w-5 h-5"/> : <GraduationCap className="w-5 h-5"/>}
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
            Solver<span className="text-primary-600">AI</span>
          </span>
        </div>
        <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
            Optimal AI Main
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="mb-6">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main</p>
          <div onClick={() => setActiveTab('dashboard')} className={navItemClass('dashboard')}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </div>
          <div onClick={() => setActiveTab('manual')} className={navItemClass('manual')}>
            <Calculator className="w-5 h-5" /> Linear Programming
          </div>
        </div>

        <div className="mb-6">
          <div 
            onClick={() => toggleSubMenu('ai_ml')}
            className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
          >
            <span className="flex items-center gap-2"><BrainCircuit className="w-4 h-4"/> AI & Machine Learning</span>
            {expandedMenus['ai_ml'] ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
          </div>
          
          {expandedMenus['ai_ml'] && (
            <div className="pl-4 mt-1 border-l border-slate-200 dark:border-slate-800 ml-3">
              <div onClick={() => setActiveTab('ai_learning')} className={navItemClass('ai_learning')}>
                <span className="flex items-center gap-2"><Lightbulb className="w-4 h-4"/> AI Learning Hub</span>
              </div>
              <div onClick={() => setActiveTab('neural_network')} className={navItemClass('neural_network')}>
                Neural Network Architect
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div 
            onClick={() => toggleSubMenu('network')}
            className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
          >
            <span className="flex items-center gap-2"><Network className="w-4 h-4"/> Planning & Network</span>
            {expandedMenus['network'] ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
          </div>
          
          {expandedMenus['network'] && (
            <div className="pl-4 mt-1 border-l border-slate-200 dark:border-slate-800 ml-3">
              <div onClick={() => setActiveTab('network')} className={navItemClass('network')}>
                PERT / CPM
              </div>
              <div onClick={() => setActiveTab('shortest_path')} className={navItemClass('shortest_path')}>
                Shortest Path
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div 
            onClick={() => toggleSubMenu('logistics')}
            className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
          >
            <span className="flex items-center gap-2"><Truck className="w-4 h-4"/> Logistics</span>
            {expandedMenus['logistics'] ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
          </div>
          
          {expandedMenus['logistics'] && (
            <div className="pl-4 mt-1 border-l border-slate-200 dark:border-slate-800 ml-3">
              <div onClick={() => setActiveTab('transportation')} className={navItemClass('transportation')}>
                Transportation
              </div>
              <div onClick={() => setActiveTab('assignment')} className={navItemClass('assignment')}>
                Assignment
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div 
            onClick={() => toggleSubMenu('operations')}
            className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
          >
            <span className="flex items-center gap-2"><Users className="w-4 h-4"/> Operations Strategy</span>
            {expandedMenus['operations'] ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
          </div>
          
          {expandedMenus['operations'] && (
            <div className="pl-4 mt-1 border-l border-slate-200 dark:border-slate-800 ml-3">
              <div onClick={() => setActiveTab('queuing')} className={navItemClass('queuing')}>
                Queuing Theory
              </div>
              <div onClick={() => setActiveTab('game_theory')} className={navItemClass('game_theory')}>
                Game Theory
              </div>
              <div onClick={() => setActiveTab('minimax')} className={navItemClass('minimax')}>
                Decision Trees (AI)
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Footer Actions - Settings pinned to bottom */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button onClick={onToggleHistory} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 mb-1">
          <History className="w-5 h-5" /> Recent Solutions
        </button>
        <button 
            onClick={onOpenSettings}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Settings className="w-5 h-5" /> Settings
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
