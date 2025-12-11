
import React, { useState, useEffect } from 'react';
import { LearningTopic } from '../types';
import VeoVideoGenerator from './VeoVideoGenerator';
import { BookOpen, Sparkles, BrainCircuit, History } from 'lucide-react';

interface TopicViewerProps {
    topic: LearningTopic;
    isPremium: boolean;
    onClose: () => void;
}

const TopicViewer: React.FC<TopicViewerProps> = ({ topic, isPremium, onClose }) => {
    const [animationStep, setAnimationStep] = useState(0);

    // Simple ticker for SVG animations
    useEffect(() => {
        const interval = setInterval(() => {
            setAnimationStep(prev => (prev + 1) % 100);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // --- VISUALIZERS ---
    const renderVisual = () => {
        if (topic.visualType === 'NEURON') {
            const activation = Math.sin(animationStep / 10) * 0.5 + 0.5;
            return (
                <svg viewBox="0 0 200 200" className="w-full h-64">
                    {/* Inputs */}
                    <line x1="20" y1="50" x2="100" y2="100" stroke={activation > 0.3 ? "#60a5fa" : "#334155"} strokeWidth="2" />
                    <line x1="20" y1="100" x2="100" y2="100" stroke={activation > 0.5 ? "#60a5fa" : "#334155"} strokeWidth="2" />
                    <line x1="20" y1="150" x2="100" y2="100" stroke={activation > 0.7 ? "#60a5fa" : "#334155"} strokeWidth="2" />
                    
                    {/* Input Nodes */}
                    <circle cx="20" cy="50" r="10" fill="#1e293b" stroke="#60a5fa" />
                    <circle cx="20" cy="100" r="10" fill="#1e293b" stroke="#60a5fa" />
                    <circle cx="20" cy="150" r="10" fill="#1e293b" stroke="#60a5fa" />

                    {/* Neuron Body */}
                    <circle cx="100" cy="100" r="30" fill={`rgba(96, 165, 250, ${activation})`} stroke="#3b82f6" strokeWidth="3" />
                    <text x="100" y="105" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">∑</text>

                    {/* Output */}
                    <line x1="130" y1="100" x2="180" y2="100" stroke={activation > 0.5 ? "#4ade80" : "#334155"} strokeWidth="4" />
                    <circle cx="180" cy="100" r="5" fill={activation > 0.5 ? "#4ade80" : "#1e293b"} />
                </svg>
            );
        }
        // Fallback or generic network visual
        return (
            <svg viewBox="0 0 400 200" className="w-full h-64">
                {Array.from({length: 5}).map((_, i) => (
                    <g key={i}>
                        <circle cx={50} cy={30 + i * 35} r={8} className="fill-slate-700" />
                        {Array.from({length: 6}).map((__, j) => (
                            <line 
                                key={j} 
                                x1={58} y1={30 + i * 35} 
                                x2={200} y2={20 + j * 30} 
                                stroke="#475569" 
                                strokeOpacity="0.3"
                                strokeWidth={Math.abs(Math.sin((animationStep+i+j)/10)) * 2} 
                            />
                        ))}
                    </g>
                ))}
                {Array.from({length: 6}).map((_, i) => (
                    <circle key={i} cx={200} cy={20 + i * 30} r={10} className="fill-blue-600 animate-pulse" />
                ))}
            </svg>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold text-sm">
                        &larr; Back to Hub
                    </button>
                    <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{topic.title}</h2>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${topic.level === 'BEGINNER' ? 'bg-green-100 text-green-700' : topic.level === 'INTERMEDIATE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {topic.level}
                    </span>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
                    
                    {/* Left: Text Content */}
                    <div className="space-y-8">
                        {/* Concept Explanation */}
                        <div className="prose dark:prose-invert max-w-none">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-primary-500"/> Core Concept
                            </h3>
                            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                                {topic.description}
                            </p>
                        </div>

                        {/* Traditional vs Modern Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-800">
                                <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                                    <History className="w-4 h-4"/> Traditional Era
                                </h4>
                                <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                                    {topic.traditionalView}
                                </p>
                            </div>
                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                <h4 className="font-bold text-indigo-800 dark:text-indigo-200 mb-2 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4"/> Modern Era
                                </h4>
                                <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                                    {topic.modernView}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Multimedia */}
                    <div className="space-y-6">
                        {/* Live Visualizer */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-white font-bold flex items-center gap-2">
                                    <BrainCircuit className="w-5 h-5 text-green-400"/> Live Visualization
                                </h4>
                                <span className="text-xs text-slate-500 uppercase font-bold animate-pulse">Running Simulation</span>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700">
                                {renderVisual()}
                            </div>
                        </div>

                        {/* Veo Video Gen */}
                        <VeoVideoGenerator 
                            prompt={`Explain ${topic.title} in artificial intelligence. Visuals showing ${topic.visualType.toLowerCase()} concept.`} 
                            topicTitle={topic.title}
                            isPremium={isPremium}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopicViewer;
