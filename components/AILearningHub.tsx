
import React, { useState } from 'react';
import { LearningLevel, LearningTopic } from '../types';
import TopicViewer from './TopicViewer';
import { BookOpen, Search, GraduationCap, BrainCircuit, Zap, Layers, Play, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface AILearningHubProps {
    isPremium: boolean;
}

const STATIC_TOPICS: LearningTopic[] = [
    // --- BEGINNER ---
    {
        id: 'b1',
        title: 'The Artificial Neuron',
        level: 'BEGINNER',
        shortDesc: 'Understand the building block of all AI: Weights, Biases, and Activation.',
        description: 'An Artificial Neuron is a mathematical function conceived as a model of biological neurons. It receives input, aggregates it (weighted sum), and passes it through an activation function to determine output.',
        visualType: 'NEURON',
        traditionalView: 'In the 1950s, the Perceptron was a linear binary classifier. It could only solve linearly separable problems (like AND/OR gates) and failed at simple XOR tasks, leading to the first "AI Winter".',
        modernView: 'Modern neurons use non-linear activation functions like ReLU, Swish, or GELU. They are stacked in billions to form Deep Neural Networks capable of approximating any continuous function.'
    },
    {
        id: 'b2',
        title: 'Machine Learning vs. Deep Learning',
        level: 'BEGINNER',
        shortDesc: 'The evolution from feature engineering to feature learning.',
        description: 'Machine Learning (ML) is a subset of AI that parses data, learns from it, and then applies what it has learned to make informed decisions. Deep Learning (DL) is a subset of ML that uses multi-layered neural networks.',
        visualType: 'NETWORK',
        traditionalView: 'Traditional ML (SVMs, Random Forests) required experts to manually extract features (e.g., "circularity" of a fruit) before feeding data to the model.',
        modernView: 'Deep Learning algorithms perform "Feature Extraction" automatically. The early layers learn edges, middle layers learn shapes, and final layers learn objects, removing the need for manual feature engineering.'
    },
    {
        id: 'b3',
        title: 'Supervised Learning',
        level: 'BEGINNER',
        shortDesc: 'Learning with a teacher: Input-Output mapping.',
        description: 'The model learns from labeled training data, where each example is a pair consisting of an input object and a desired output value.',
        visualType: 'NETWORK',
        traditionalView: 'Used for simple regression (predicting house prices) or classification (spam detection) using algorithms like Linear Regression or Decision Trees.',
        modernView: 'Now powers massive systems like ImageNet classification, language translation, and autonomous driving by learning from millions of labeled examples.'
    },
    {
        id: 'b4',
        title: 'Unsupervised Learning',
        level: 'BEGINNER',
        shortDesc: 'Finding hidden patterns in unlabeled data.',
        description: 'The model works on its own to discover information. It deals with unlabeled data and looks for patterns or structures.',
        visualType: 'NETWORK',
        traditionalView: 'K-Means Clustering was used to segment customers or PCA for dimensionality reduction.',
        modernView: 'Self-supervised learning (a modern variant) powers LLMs like GPT. The model predicts the next word in a sentence, effectively creating its own labels from raw text.'
    },
    {
        id: 'b5',
        title: 'Activation Functions',
        level: 'BEGINNER',
        shortDesc: 'Adding non-linearity to the network.',
        description: 'Activation functions decide whether a neuron should be activated or not. They introduce non-linearity, allowing networks to learn complex boundaries.',
        visualType: 'NEURON',
        traditionalView: 'Sigmoid and Tanh were standard. They suffered from the "Vanishing Gradient" problem, where learning stalled in deep networks.',
        modernView: 'ReLU (Rectified Linear Unit) and its variants (Leaky ReLU, GELU) solved the vanishing gradient problem, enabling the training of very deep networks.'
    },
    {
        id: 'b6',
        title: 'Bias and Variance',
        level: 'BEGINNER',
        shortDesc: 'The trade-off between overfitting and underfitting.',
        description: 'Bias is the error from erroneous assumptions (underfitting). Variance is the error from sensitivity to small fluctuations in the training set (overfitting).',
        visualType: 'GRADIENT',
        traditionalView: 'Models were kept simple to avoid high variance. Regularization was manual and often resulted in high bias.',
        modernView: 'We now use massive over-parameterized models (High Variance potential) but control them with massive datasets and techniques like Dropout and Batch Normalization to achieve low bias AND low variance.'
    },
    {
        id: 'b7',
        title: 'Loss Functions',
        level: 'BEGINNER',
        shortDesc: 'Measuring how wrong the model is.',
        description: 'A loss function quantifies the difference between the predicted output and the actual target. The goal of training is to minimize this value.',
        visualType: 'GRADIENT',
        traditionalView: 'Mean Squared Error (MSE) was the default for most problems.',
        modernView: 'Specialized losses like Cross-Entropy for classification, Focal Loss for imbalanced data, and Contrastive Loss for embedding learning are now standard.'
    },
    {
        id: 'b8',
        title: 'Training vs. Inference',
        level: 'BEGINNER',
        shortDesc: 'The two stages of an AI model lifecycle.',
        description: 'Training is the process of learning the weights. Inference is using the trained model to make predictions on new data.',
        visualType: 'NETWORK',
        traditionalView: 'Models were light enough to train on CPUs and run inference instantly.',
        modernView: 'Training foundation models takes months on GPU clusters. Inference is optimized using quantization and specialized hardware (TPUs/NPUs) to run in real-time.'
    },
    {
        id: 'b9',
        title: 'Data Preprocessing',
        level: 'BEGINNER',
        shortDesc: 'Garbage in, Garbage out.',
        description: 'Cleaning and transforming raw data into a format suitable for modeling.',
        visualType: 'NETWORK',
        traditionalView: 'Manual handling of missing values, scaling, and one-hot encoding.',
        modernView: 'Embeddings (Vector representations) handle categorical data natively. Data augmentation (flipping images, masking text) artificially expands datasets.'
    },
    {
        id: 'b10',
        title: 'Overfitting',
        level: 'BEGINNER',
        shortDesc: 'Memorizing the data instead of learning patterns.',
        description: 'When a model learns the training data too well, including noise, it fails to generalize to new data.',
        visualType: 'NETWORK',
        traditionalView: 'Prevented by limiting model complexity (fewer parameters).',
        modernView: 'Prevented by "Early Stopping", "Dropout" (randomly disabling neurons), and massive datasets that make memorization impossible.'
    },

    // --- INTERMEDIATE ---
    {
        id: 'i1',
        title: 'Convolutional Neural Networks (CNN)',
        level: 'INTERMEDIATE',
        shortDesc: 'The architecture that gave eyes to AI.',
        description: 'CNNs use convolution operations to filter inputs for patterns. They preserve spatial relationships, making them ideal for image processing.',
        visualType: 'NETWORK',
        traditionalView: 'Computer Vision relied on hand-crafted filters (Sobel, Canny) to detect edges.',
        modernView: 'CNNs learn their own filters. Architectures like ResNet and EfficientNet can classify objects with super-human accuracy.'
    },
    {
        id: 'i2',
        title: 'Recurrent Neural Networks (RNN)',
        level: 'INTERMEDIATE',
        shortDesc: 'Handling sequential data and memory.',
        description: 'RNNs process sequences by maintaining a "hidden state" (memory) of previous inputs. Ideal for time-series and text.',
        visualType: 'NETWORK',
        traditionalView: 'Hidden Markov Models were used for sequence probability.',
        modernView: 'While RNNs and LSTMs were dominant, they are largely being replaced by Transformers for long sequences due to training parallelism issues.'
    },
    {
        id: 'i3',
        title: 'Long Short-Term Memory (LSTM)',
        level: 'INTERMEDIATE',
        shortDesc: 'Solving the memory loss of standard RNNs.',
        description: 'LSTMs introduce "gates" (input, output, forget) to regulate the flow of information, allowing the network to remember long-term dependencies.',
        visualType: 'NETWORK',
        traditionalView: 'RNNs forgot context after ~10 steps (Vanishing Gradient).',
        modernView: 'LSTMs enabled the first wave of effective Machine Translation and Speech Recognition before the Transformer era.'
    },
    {
        id: 'i4',
        title: 'Transformers & Attention',
        level: 'INTERMEDIATE',
        shortDesc: 'Attention is All You Need.',
        description: 'The Transformer architecture uses "Self-Attention" to weigh the importance of different parts of the input data, regardless of their distance in the sequence.',
        visualType: 'ATTENTION',
        traditionalView: 'Seq2Seq models with RNNs processed words one by one, making long-context understanding slow and difficult.',
        modernView: 'Transformers process the entire sequence in parallel. This scalability enabled GPT-4, Gemini, and Claude.'
    },
    {
        id: 'i5',
        title: 'Generative Adversarial Networks (GANs)',
        level: 'INTERMEDIATE',
        shortDesc: 'Two networks fighting to create realism.',
        description: 'A Generator creates fake data, and a Discriminator tries to spot the fake. They improve together in a zero-sum game.',
        visualType: 'NETWORK',
        traditionalView: 'Generative models were based on statistical distributions (Gaussian Mixture Models) and produced blurry results.',
        modernView: 'GANs produce photo-realistic faces (StyleGAN) and are used for super-resolution and art generation.'
    },
    {
        id: 'i6',
        title: 'Transfer Learning',
        level: 'INTERMEDIATE',
        shortDesc: 'Standing on the shoulders of giants.',
        description: 'Taking a pre-trained model (trained on a massive dataset) and fine-tuning it for a specific, smaller task.',
        visualType: 'NETWORK',
        traditionalView: 'Every model was trained from scratch. required huge datasets for every specific problem.',
        modernView: 'You download a pre-trained ResNet or BERT and fine-tune it with just 100 examples to get state-of-the-art results.'
    },
    {
        id: 'i7',
        title: 'Hyperparameter Tuning',
        level: 'INTERMEDIATE',
        shortDesc: 'The art of configuring the brain.',
        description: 'Hyperparameters (Learning Rate, Batch Size, Layers) are settings external to the model that must be set before training.',
        visualType: 'GRADIENT',
        traditionalView: 'Grid Search (trying every combination) was common but computationally expensive.',
        modernView: 'Bayesian Optimization and automated tools (AutoML) now intelligently search for the best configuration.'
    },
    {
        id: 'i8',
        title: 'Regularization',
        level: 'INTERMEDIATE',
        shortDesc: 'Constraints to improve generalization.',
        description: 'Techniques to prevent overfitting by penalizing complex models. Examples: L1/L2 regularization, Dropout.',
        visualType: 'NETWORK',
        traditionalView: 'Feature selection was the primary way to reduce complexity.',
        modernView: 'Dropout (randomly killing neurons during training) forces the network to learn robust, redundant features.'
    },
    {
        id: 'i9',
        title: 'Gradient Descent Optimizers',
        level: 'INTERMEDIATE',
        shortDesc: 'Navigating the loss landscape efficiently.',
        description: 'Algorithms that update weights to minimize loss. They determine how fast and how smoothly the model learns.',
        visualType: 'GRADIENT',
        traditionalView: 'Stochastic Gradient Descent (SGD) was simple but easily got stuck in local minima.',
        modernView: 'Adaptive optimizers like Adam, RMSprop, and AdamW adjust learning rates per-parameter, speeding up convergence significantly.'
    },
    {
        id: 'i10',
        title: 'Batch Normalization',
        level: 'INTERMEDIATE',
        shortDesc: 'Stabilizing learning in deep networks.',
        description: 'Normalizes the inputs of each layer to have mean 0 and variance 1. This stabilizes the learning process.',
        visualType: 'NETWORK',
        traditionalView: 'Training deep networks was notoriously difficult due to "Internal Covariate Shift".',
        modernView: 'Batch Norm allows for higher learning rates and makes initialization less critical. It is a standard component in almost all modern vision models.'
    },

    // --- ADVANCED ---
    {
        id: 'a1',
        title: 'Backpropagation & Gradient Descent',
        level: 'ADVANCED',
        shortDesc: 'The mathematical engine of learning.',
        description: 'The Chain Rule of Calculus applied to Neural Networks. It calculates the gradient of the loss function with respect to each weight.',
        visualType: 'GRADIENT',
        traditionalView: 'Considered computationally impossible for multi-layer perceptrons until the algorithm was popularized in the 1980s.',
        modernView: 'Automatic Differentiation (Autograd) libraries like PyTorch and TensorFlow handle this automatically, enabling complex custom architectures.'
    },
    {
        id: 'a2',
        title: 'Self-Attention Mechanism',
        level: 'ADVANCED',
        shortDesc: 'Understanding context by relating words to each other.',
        description: 'Computes a weighted sum of input values based on their relevance (Keys, Queries, Values). It allows the model to "focus" on relevant parts of the input.',
        visualType: 'ATTENTION',
        traditionalView: 'Context was limited by fixed-window sizes (N-grams) or fading memory (RNNs).',
        modernView: 'Self-Attention allows capturing global dependencies. In "The animal didn\'t cross the street because it was too tired", it links "it" to "animal", not "street".'
    },
    {
        id: 'a3',
        title: 'Diffusion Models',
        level: 'ADVANCED',
        shortDesc: 'Creating data by reversing noise.',
        description: 'Generative models that learn to reverse a gradual noising process. They start with pure noise and denoise it step-by-step to form an image.',
        visualType: 'NETWORK',
        traditionalView: 'GANs were the state-of-the-art but were unstable to train (mode collapse).',
        modernView: 'Diffusion (Stable Diffusion, DALL-E) offers stable training and high-fidelity, diverse outputs, revolutionizing AI Art.'
    },
    {
        id: 'a4',
        title: 'Reinforcement Learning with Human Feedback (RLHF)',
        level: 'ADVANCED',
        shortDesc: 'Aligning AI with human values.',
        description: 'Fine-tuning a language model using a reward model trained on human preferences.',
        visualType: 'NETWORK',
        traditionalView: 'RL was mostly for games (Chess, Go) where the reward function (Winning) was clear.',
        modernView: 'RLHF was the secret sauce behind ChatGPT, making models helpful, harmless, and honest by optimizing for human preference rather than just next-word probability.'
    },
    {
        id: 'a5',
        title: 'Graph Neural Networks (GNN)',
        level: 'ADVANCED',
        shortDesc: 'Deep Learning on non-Euclidean data.',
        description: 'Neural networks designed to process data represented as graphs (nodes and edges), such as social networks or molecules.',
        visualType: 'NETWORK',
        traditionalView: 'Graph algorithms (PageRank) were heuristics based on connectivity.',
        modernView: 'GNNs learn node embeddings based on neighbors. Used by Google Maps for ETA and in Biology for protein folding (AlphaFold).'
    },
    {
        id: 'a6',
        title: 'Federated Learning',
        level: 'ADVANCED',
        shortDesc: 'Training without moving data.',
        description: 'Training an algorithm across multiple decentralized edge devices holding local data samples, without exchanging them.',
        visualType: 'NETWORK',
        traditionalView: 'Data had to be centralized in a massive server for training, raising privacy concerns.',
        modernView: 'Your phone keyboard learns new words locally and sends only the weight updates to the cloud, preserving privacy.'
    },
    {
        id: 'a7',
        title: 'Explainable AI (XAI)',
        level: 'ADVANCED',
        shortDesc: 'Opening the Black Box.',
        description: 'Techniques (SHAP, LIME, Attention Maps) to make the decision-making of AI systems transparent and interpretable to humans.',
        visualType: 'NETWORK',
        traditionalView: 'Decision Trees were interpretable, but Neural Networks were complete black boxes.',
        modernView: 'As AI enters healthcare and finance, XAI is critical for trust and regulatory compliance.'
    },
    {
        id: 'a8',
        title: 'Neural Architecture Search (NAS)',
        level: 'ADVANCED',
        shortDesc: 'AI designing AI.',
        description: 'Using machine learning to automate the design of artificial neural networks.',
        visualType: 'NETWORK',
        traditionalView: 'Architectures (like AlexNet) were painstakingly hand-designed by researchers over years.',
        modernView: 'NAS algorithms explore search spaces to find efficient architectures (like EfficientNet) that outperform human designs.'
    },
    {
        id: 'a9',
        title: 'Meta-Learning',
        level: 'ADVANCED',
        shortDesc: 'Learning to learn.',
        description: 'Designing models that can learn new tasks rapidly with very few examples (Few-Shot Learning).',
        visualType: 'NETWORK',
        traditionalView: 'Models were idiots savants: good at one thing, requiring retraining for anything else.',
        modernView: 'Meta-learning aims for general intelligence adaptability, similar to how humans learn.'
    },
    {
        id: 'a10',
        title: 'Quantum Machine Learning',
        level: 'ADVANCED',
        shortDesc: 'The next frontier.',
        description: 'Using quantum computers to perform machine learning tasks, exploiting superposition and entanglement for speedups.',
        visualType: 'NEURON',
        traditionalView: 'Theoretical physics domain.',
        modernView: 'Hybrid Quantum-Classical networks are being tested for optimization problems where classical computers struggle.'
    }
];

const AILearningHub: React.FC<AILearningHubProps> = ({ isPremium }) => {
    const [selectedLevel, setSelectedLevel] = useState<LearningLevel>('BEGINNER');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTopic, setActiveTopic] = useState<LearningTopic | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // AI Search Handler
    const handleAISearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Create a structured learning topic for: "${searchQuery}". 
            Return JSON matching this schema: 
            {
                "id": "gen-${Date.now()}",
                "title": "Topic Title",
                "level": "INTERMEDIATE",
                "shortDesc": "One sentence summary",
                "description": "2-3 sentences detailed explanation",
                "visualType": "NETWORK",
                "traditionalView": "How it was done traditionally",
                "modernView": "How it is done in modern AI"
            }`;

            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            if (result.text) {
                const newTopic = JSON.parse(result.text);
                setActiveTopic(newTopic);
            }
        } catch (err) {
            console.error(err);
            alert("Could not generate topic. Try again.");
        } finally {
            setIsSearching(false);
        }
    };

    const filteredTopics = STATIC_TOPICS.filter(t => t.level === selectedLevel);

    return (
        <div className="space-y-8 animate-fade-in">
            {activeTopic && (
                <TopicViewer 
                    topic={activeTopic} 
                    isPremium={isPremium} 
                    onClose={() => setActiveTopic(null)} 
                />
            )}

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                        <Sparkles className="w-3 h-3" /> AI Learning Hub
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                        Demystifying the <br/> Neural Brain.
                    </h1>
                    <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                        From basic Perceptrons to Transformers. Interactive visualizations, 
                        AI-generated video explainers, and expert curriculum.
                    </p>
                    
                    {/* Search Bar */}
                    <form onSubmit={handleAISearch} className="relative max-w-md">
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Generate custom lesson... (e.g. 'RAG')"
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-indigo-200 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-white/50 transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-200 w-5 h-5" />
                        <button 
                            type="submit"
                            disabled={isSearching}
                            className="absolute right-2 top-2 bottom-2 px-4 bg-white text-indigo-600 rounded-lg font-bold hover:bg-indigo-50 transition flex items-center gap-2 disabled:opacity-70"
                        >
                            {isSearching ? <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full"/> : <Play className="w-4 h-4 fill-current"/>}
                        </button>
                    </form>
                </div>
                
                {/* Background Decor */}
                <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-20 pointer-events-none">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        <circle cx="150" cy="150" r="80" fill="white" filter="blur(60px)" />
                    </svg>
                </div>
            </div>

            {/* Level Tabs */}
            <div className="flex justify-center">
                <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as LearningLevel[]).map((lvl) => (
                        <button
                            key={lvl}
                            onClick={() => setSelectedLevel(lvl)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                selectedLevel === lvl 
                                    ? 'bg-violet-600 text-white shadow-md' 
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            {lvl.charAt(0) + lvl.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTopics.map((topic) => (
                    <div 
                        key={topic.id}
                        onClick={() => setActiveTopic(topic)}
                        className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 cursor-pointer hover:shadow-xl hover:border-violet-500 dark:hover:border-violet-500 transition-all duration-300 relative overflow-hidden flex flex-col"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
                        
                        <div className="relative z-10 flex-1 flex flex-col">
                            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-violet-600 mb-4 group-hover:scale-110 transition-transform">
                                {topic.visualType === 'NEURON' ? <Zap className="w-6 h-6"/> : topic.visualType === 'NETWORK' ? <BrainCircuit className="w-6 h-6"/> : <Layers className="w-6 h-6"/>}
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{topic.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4 flex-1">
                                {topic.shortDesc}
                            </p>
                            
                            <div className="flex items-center text-violet-600 text-sm font-bold mt-auto">
                                Start Lesson <Play className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Empty State / Prompt */}
                <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 transition-opacity">
                    <div className="p-3 bg-slate-200 dark:bg-slate-800 rounded-full mb-3">
                        <Search className="w-6 h-6 text-slate-400" />
                    </div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-300">Explore More</h4>
                    <p className="text-xs text-slate-500 mt-1">Use the AI Search bar above to generate lessons for any other topic instantly.</p>
                </div>
            </div>
        </div>
    );
};

export default AILearningHub;
