
import React, { useState, useRef, useEffect } from 'react';
import { NeuralLayer, NeuralModelConfig, UserPersona } from '../types';
import { Plus, Trash2, Layers, Play, Settings, Download, Lock, BrainCircuit, Activity, Info } from 'lucide-react';

interface NeuralBuilderProps {
    onExport: (config: NeuralModelConfig) => void;
    persona: UserPersona;
    isPremium: boolean;
}

const NeuralBuilder: React.FC<NeuralBuilderProps> = ({ onExport, persona, isPremium }) => {
    
    // --- Preset Configurations ---
    const presets: Record<string, Partial<NeuralModelConfig>> = {
        'CUSTOM': { name: 'Custom Model', description: 'Build your own architecture from scratch.', problemType: 'REGRESSION' },
        'HOUSE_PRICE': { 
            name: 'House Price Predictor', 
            description: 'Regression model to estimate property value based on 12 features (sqft, rooms, location...).',
            problemType: 'REGRESSION',
            inputFeatures: 12,
            layers: [
                { id: 'l1', type: 'DENSE', neurons: 64, activation: 'relu' },
                { id: 'l2', type: 'DENSE', neurons: 32, activation: 'relu' },
                { id: 'out', type: 'OUTPUT', neurons: 1, activation: 'linear' }
            ]
        },
        'CHURN': {
            name: 'Customer Churn Classifier',
            description: 'Binary classification to predict if a customer will leave.',
            problemType: 'CLASSIFICATION',
            inputFeatures: 8,
            layers: [
                { id: 'l1', type: 'DENSE', neurons: 16, activation: 'relu' },
                { id: 'l2', type: 'DROPOUT', neurons: 0, rate: 0.2 },
                { id: 'l3', type: 'DENSE', neurons: 8, activation: 'relu' },
                { id: 'out', type: 'OUTPUT', neurons: 1, activation: 'sigmoid' }
            ]
        },
        'IMAGE_MNIST': {
            name: 'Digit Recognition (CNN)',
            description: 'Simple Convolutional Network for MNIST (Premium).',
            problemType: 'CLASSIFICATION',
            inputFeatures: 784,
            layers: [
                { id: 'l1', type: 'CONV2D', neurons: 32, activation: 'relu', isPremium: true },
                { id: 'l2', type: 'DENSE', neurons: 128, activation: 'relu' },
                { id: 'out', type: 'OUTPUT', neurons: 10, activation: 'softmax' }
            ]
        }
    };

    const [activePreset, setActivePreset] = useState('CUSTOM');
    const [config, setConfig] = useState<NeuralModelConfig>({
        name: 'My Custom Model',
        description: 'A deep learning model.',
        problemType: 'REGRESSION',
        inputFeatures: 10,
        layers: [
            { id: 'l1', type: 'DENSE', neurons: 32, activation: 'relu' },
            { id: 'out', type: 'OUTPUT', neurons: 1, activation: 'linear' }
        ],
        optimizer: 'adam',
        learningRate: 0.001,
        loss: 'mean_squared_error'
    });

    const loadPreset = (key: string) => {
        setActivePreset(key);
        const p = presets[key];
        setConfig(prev => ({
            ...prev,
            ...p,
            layers: p.layers ? JSON.parse(JSON.stringify(p.layers)) : prev.layers // Deep copy
        }));
    };

    const addLayer = (type: NeuralLayer['type']) => {
        // Insert before output layer
        const newLayer: NeuralLayer = {
            id: `l${Date.now()}`,
            type,
            neurons: type === 'DROPOUT' ? 0 : 16,
            activation: 'relu',
            rate: 0.2,
            isPremium: type === 'CONV2D' || type === 'LSTM'
        };

        const newLayers = [...config.layers];
        newLayers.splice(newLayers.length - 1, 0, newLayer);
        setConfig({ ...config, layers: newLayers });
    };

    const removeLayer = (idx: number) => {
        const newLayers = config.layers.filter((_, i) => i !== idx);
        setConfig({ ...config, layers: newLayers });
    };

    const updateLayer = (idx: number, field: keyof NeuralLayer, val: any) => {
        const newLayers = [...config.layers];
        newLayers[idx] = { ...newLayers[idx], [field]: val };
        setConfig({ ...config, layers: newLayers });
    };

    // --- ANIMATED VISUALIZER (SVG) ---
    // Calculates node positions based on layer neurons
    const renderVisualizer = () => {
        // Limit visualized neurons per layer to keep SVG clean
        const MAX_VISUAL_NEURONS = 8;
        
        // Prepare layers for viz (Input + Hidden + Output)
        const vizLayers = [
            { type: 'INPUT', neurons: config.inputFeatures },
            ...config.layers.filter(l => l.type !== 'DROPOUT') // Skip dropout in topology view usually
        ];

        const layerGap = 200;
        const neuronGap = 40;
        const canvasHeight = 400;

        return (
            <svg className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="gradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                {vizLayers.map((layer, lIdx) => {
                    const neuronCount = Math.min(layer.neurons, MAX_VISUAL_NEURONS);
                    const isInput = lIdx === 0;
                    
                    return Array.from({ length: neuronCount }).map((_, nIdx) => {
                        const x = 50 + lIdx * layerGap;
                        // Center vertically
                        const totalHeight = (neuronCount - 1) * neuronGap;
                        const y = (canvasHeight / 2) - (totalHeight / 2) + nIdx * neuronGap;

                        // Draw Connections to Next Layer
                        const nextLayer = vizLayers[lIdx + 1];
                        let connections = null;
                        if (nextLayer) {
                            const nextCount = Math.min(nextLayer.neurons, MAX_VISUAL_NEURONS);
                            const nextTotalHeight = (nextCount - 1) * neuronGap;
                            connections = Array.from({ length: nextCount }).map((__, nextNIdx) => {
                                const nextX = 50 + (lIdx + 1) * layerGap;
                                const nextY = (canvasHeight / 2) - (nextTotalHeight / 2) + nextNIdx * neuronGap;
                                return (
                                    <line 
                                        key={`conn-${lIdx}-${nIdx}-${nextNIdx}`}
                                        x1={x} y1={y} x2={nextX} y2={nextY}
                                        stroke="url(#gradientLine)"
                                        strokeWidth="1"
                                        className="animate-pulse"
                                        style={{ animationDuration: `${Math.random() * 2 + 2}s` }}
                                    />
                                );
                            });
                        }

                        return (
                            <g key={`node-${lIdx}-${nIdx}`}>
                                {connections}
                                <circle 
                                    cx={x} cy={y} r={isInput ? 6 : 8} 
                                    className={`${isInput ? 'fill-slate-400' : 'fill-primary-500'} stroke-white dark:stroke-slate-900`}
                                    strokeWidth="2"
                                    filter={!isInput ? "url(#glow)" : ""}
                                />
                            </g>
                        );
                    });
                })}
                
                {/* Labels */}
                {vizLayers.map((l, i) => (
                    <text 
                        key={`label-${i}`} 
                        x={50 + i * layerGap} 
                        y={380} 
                        textAnchor="middle" 
                        className="fill-slate-500 text-xs font-mono uppercase"
                    >
                        {i === 0 ? 'Input' : l.type === 'OUTPUT' ? 'Output' : 'Hidden'}
                    </text>
                ))}
            </svg>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header / Use Case Selection */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row gap-6 justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <BrainCircuit className="w-8 h-8 text-primary-500" />
                        Neural Network Architect
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
                        Design, visualize, and generate production-ready code for deep learning models. 
                        {persona === 'business' 
                            ? " Focus on solving specific business problems like churn or sales forecasting." 
                            : " Experiment with layer types and activation functions to understand Deep Learning."}
                    </p>
                </div>
                <div className="w-full lg:w-64">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Load Business Template</label>
                    <select 
                        value={activePreset} 
                        onChange={(e) => loadPreset(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        {Object.entries(presets).map(([key, val]) => (
                            <option key={key} value={key}>{val.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: Layer Configuration */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Layers className="w-5 h-5 text-blue-500" /> Stack Architecture
                            </h3>
                            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">Input: {config.inputFeatures} Features</span>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {config.layers.map((layer, idx) => (
                                <div key={layer.id} className={`p-3 rounded-lg border relative group transition-all ${layer.isPremium && !isPremium ? 'opacity-70 bg-slate-50 dark:bg-slate-900 border-slate-200' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-primary-400'}`}>
                                    
                                    {/* Layer Header */}
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${layer.type === 'OUTPUT' ? 'bg-green-500' : layer.type === 'DROPOUT' ? 'bg-orange-400' : 'bg-primary-500'}`}>
                                                {layer.type}
                                            </span>
                                            {layer.isPremium && <Lock className="w-3 h-3 text-amber-500" />}
                                        </div>
                                        {layer.type !== 'OUTPUT' && (
                                            <button onClick={() => removeLayer(idx)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Layer Settings */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {layer.type === 'DROPOUT' ? (
                                            <div className="col-span-2">
                                                <label className="text-[10px] text-slate-500 uppercase font-bold block">Rate (0-1)</label>
                                                <input 
                                                    type="number" step="0.1" max="1" min="0" 
                                                    value={layer.rate} 
                                                    onChange={(e) => updateLayer(idx, 'rate', parseFloat(e.target.value))}
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs" 
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold block">Neurons</label>
                                                    <input 
                                                        type="number" 
                                                        value={layer.neurons} 
                                                        onChange={(e) => updateLayer(idx, 'neurons', parseInt(e.target.value))}
                                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold block">Activation</label>
                                                    <select 
                                                        value={layer.activation} 
                                                        onChange={(e) => updateLayer(idx, 'activation', e.target.value)}
                                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs"
                                                    >
                                                        <option value="relu">ReLU</option>
                                                        <option value="sigmoid">Sigmoid</option>
                                                        <option value="tanh">Tanh</option>
                                                        <option value="softmax">Softmax</option>
                                                        <option value="linear">Linear</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {layer.isPremium && !isPremium && (
                                        <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-900/80 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
                                            <span className="text-xs font-bold text-amber-600 flex items-center gap-1"><Lock className="w-3 h-3"/> Premium Layer</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                            <button onClick={() => addLayer('DENSE')} className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition">
                                <Plus className="w-3 h-3" /> Dense
                            </button>
                            <button onClick={() => addLayer('DROPOUT')} className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition">
                                <Plus className="w-3 h-3" /> Dropout
                            </button>
                            {/* Premium Layer Buttons */}
                            <button disabled={!isPremium} onClick={() => addLayer('CONV2D')} className={`flex-1 border text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition ${isPremium ? 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'}`}>
                                <Plus className="w-3 h-3" /> CNN { !isPremium && <Lock className="w-3 h-3 ml-1"/> }
                            </button>
                        </div>
                    </div>

                    {/* Hyperparameters */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                            <Settings className="w-5 h-5 text-slate-500" /> Training Config
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Optimizer</label>
                                <select 
                                    value={config.optimizer}
                                    onChange={(e) => setConfig({...config, optimizer: e.target.value as any})}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm"
                                >
                                    <option value="adam">Adam</option>
                                    <option value="sgd">SGD</option>
                                    <option value="rmsprop">RMSprop</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Learning Rate</label>
                                <input 
                                    type="number" step="0.0001"
                                    value={config.learningRate}
                                    onChange={(e) => setConfig({...config, learningRate: parseFloat(e.target.value)})}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Visualizer & Actions */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Visualizer Canvas */}
                    <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 shadow-inner relative overflow-hidden min-h-[400px]">
                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                            <div className="bg-black/30 backdrop-blur px-3 py-1 rounded text-xs text-white font-mono flex items-center gap-2">
                                <Activity className="w-3 h-3 text-green-400" /> Live Architecture Preview
                            </div>
                        </div>
                        {renderVisualizer()}
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="text-sm text-slate-500">
                            <strong>Ready to deploy?</strong> Generate code to use this model externally.
                        </div>
                        <button 
                            onClick={() => onExport(config)}
                            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary-600/20 flex items-center gap-2 transition-transform active:scale-95"
                        >
                            <Download className="w-5 h-5" /> Export Model & Code
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NeuralBuilder;
