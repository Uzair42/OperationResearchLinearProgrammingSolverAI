
import React, { useState } from 'react';
import { NeuralModelConfig } from '../types';
import { Copy, Check, FileCode, FileText } from 'lucide-react';

interface ModelExporterProps {
    config: NeuralModelConfig;
}

const ModelExporter: React.FC<ModelExporterProps> = ({ config }) => {
    const [tab, setTab] = useState<'PYTORCH' | 'TENSORFLOW' | 'README'>('TENSORFLOW');
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // --- CODE GENERATION LOGIC ---
    
    const generateTensorFlow = () => {
        let code = `import tensorflow as tf\nfrom tensorflow.keras import layers, models\n\n`;
        code += `def build_model(input_shape=(${config.inputFeatures},)):\n`;
        code += `    model = models.Sequential([\n`;
        code += `        # Input Layer\n`;
        code += `        layers.InputLayer(input_shape=input_shape),\n`;
        
        config.layers.forEach((l, i) => {
            if (l.type === 'DENSE') {
                code += `        layers.Dense(${l.neurons}, activation='${l.activation}')${i < config.layers.length-1 ? ',' : ''}\n`;
            } else if (l.type === 'DROPOUT') {
                code += `        layers.Dropout(${l.rate}),\n`;
            } else if (l.type === 'OUTPUT') {
                code += `        layers.Dense(${l.neurons}, activation='${l.activation}') # Output Layer\n`;
            } else if (l.type === 'CONV2D') {
                code += `        layers.Conv2D(${l.neurons}, (3,3), activation='${l.activation}'),\n`;
            }
        });
        
        code += `    ])\n\n`;
        code += `    model.compile(\n`;
        code += `        optimizer=tf.keras.optimizers.${config.optimizer.charAt(0).toUpperCase() + config.optimizer.slice(1)}(learning_rate=${config.learningRate}),\n`;
        code += `        loss='${config.loss}',\n`;
        code += `        metrics=['accuracy']\n`;
        code += `    )\n`;
        code += `    return model\n\n`;
        code += `# Usage\nmodel = build_model()\nmodel.summary()\n`;
        return code;
    };

    const generatePyTorch = () => {
        let code = `import torch\nimport torch.nn as nn\nimport torch.optim as optim\n\n`;
        code += `class ${config.name.replace(/\s+/g, '')}(nn.Module):\n`;
        code += `    def __init__(self):\n`;
        code += `        super().__init__()\n`;
        code += `        self.layers = nn.Sequential(\n`;
        
        // Input features for first layer
        let inFeatures = config.inputFeatures;
        
        config.layers.forEach(l => {
            if (l.type === 'DENSE' || l.type === 'OUTPUT') {
                code += `            nn.Linear(${inFeatures}, ${l.neurons}),\n`;
                if (l.activation === 'relu') code += `            nn.ReLU(),\n`;
                else if (l.activation === 'sigmoid') code += `            nn.Sigmoid(),\n`;
                else if (l.activation === 'softmax') code += `            nn.Softmax(dim=1),\n`;
                inFeatures = l.neurons;
            } else if (l.type === 'DROPOUT') {
                code += `            nn.Dropout(${l.rate}),\n`;
            } else if (l.type === 'CONV2D') {
                code += `            nn.Conv2d(in_channels=1, out_channels=${l.neurons}, kernel_size=3),\n`; // Simplified assumption
            }
        });
        
        code += `        )\n\n`;
        code += `    def forward(self, x):\n`;
        code += `        return self.layers(x)\n\n`;
        code += `# Initialization\n`;
        code += `model = ${config.name.replace(/\s+/g, '')}()\n`;
        code += `criterion = nn.${config.loss === 'mean_squared_error' ? 'MSELoss' : 'CrossEntropyLoss'}()\n`;
        code += `optimizer = optim.${config.optimizer === 'sgd' ? 'SGD' : 'Adam'}(model.parameters(), lr=${config.learningRate})\n`;
        return code;
    };

    const generateReadme = () => {
        return `# ${config.name}

## Description
${config.description}

## Architecture Overview
- **Problem Type:** ${config.problemType}
- **Input Shape:** ${config.inputFeatures} features
- **Optimizer:** ${config.optimizer} (LR: ${config.learningRate})

## Layer Structure
${config.layers.map((l, i) => `${i+1}. **${l.type}**: ${l.neurons > 0 ? l.neurons + ' Neurons' : 'Rate ' + l.rate} (${l.activation || 'No Activation'})`).join('\n')}

## How to use
1. Copy the generated Python code for your preferred framework.
2. Install dependencies (\`pip install tensorflow\` or \`pip install torch\`).
3. Load your data and call \`model.fit()\` (TF) or write a training loop (PyTorch).
`;
    };

    const activeCode = tab === 'TENSORFLOW' ? generateTensorFlow() : tab === 'PYTORCH' ? generatePyTorch() : generateReadme();

    return (
        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
                <div className="flex gap-2">
                    <button onClick={() => setTab('TENSORFLOW')} className={`px-3 py-1.5 rounded text-xs font-bold transition ${tab === 'TENSORFLOW' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        TensorFlow / Keras
                    </button>
                    <button onClick={() => setTab('PYTORCH')} className={`px-3 py-1.5 rounded text-xs font-bold transition ${tab === 'PYTORCH' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        PyTorch
                    </button>
                    <button onClick={() => setTab('README')} className={`px-3 py-1.5 rounded text-xs font-bold transition ${tab === 'README' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        README.md
                    </button>
                </div>
                <button onClick={() => handleCopy(activeCode)} className="text-slate-400 hover:text-white transition">
                    {copied ? <Check className="w-5 h-5 text-green-500"/> : <Copy className="w-5 h-5"/>}
                </button>
            </div>
            <div className="p-0 relative">
                <pre className="p-4 text-sm font-mono text-slate-300 bg-slate-900 overflow-x-auto custom-scrollbar leading-relaxed">
                    {activeCode}
                </pre>
            </div>
        </div>
    );
};

export default ModelExporter;
