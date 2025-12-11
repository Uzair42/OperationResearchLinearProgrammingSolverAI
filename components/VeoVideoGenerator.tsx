
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Video, Loader2, PlayCircle, Download } from 'lucide-react';

interface VeoVideoGeneratorProps {
    prompt: string;
    topicTitle: string;
    isPremium: boolean;
}

const VeoVideoGenerator: React.FC<VeoVideoGeneratorProps> = ({ prompt, topicTitle, isPremium }) => {
    const [status, setStatus] = useState<'IDLE' | 'GENERATING' | 'READY' | 'ERROR'>('IDLE');
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const generateVideo = async () => {
        // Removed premium check to allow all users to generate video
        // if (!isPremium) { ... } 

        setStatus('GENERATING');
        setProgress(5);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Enhance prompt for educational clarity
            const enhancedPrompt = `Educational animation explaining: ${prompt}. Clean, minimalist vector style, high contrast, clear motion.`;

            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: enhancedPrompt,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: '16:9'
                }
            });

            // Polling loop
            const pollInterval = setInterval(async () => {
                setProgress(prev => Math.min(prev + 5, 90)); // Fake progress to keep user engaged
                
                operation = await ai.operations.getVideosOperation({operation: operation});
                
                if (operation.done) {
                    clearInterval(pollInterval);
                    if (operation.error) {
                        console.error(operation.error);
                        setStatus('ERROR');
                    } else {
                        // Success
                        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
                        if (uri) {
                            setVideoUri(`${uri}&key=${process.env.API_KEY}`);
                            setStatus('READY');
                            setProgress(100);
                        } else {
                            setStatus('ERROR');
                        }
                    }
                }
            }, 3000); // Check every 3 seconds

        } catch (e) {
            console.error(e);
            setStatus('ERROR');
        }
    };

    return (
        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-xl relative">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h4 className="font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-400" /> AI Video Explainer
                </h4>
                {status === 'READY' && (
                    <a href={videoUri!} download={`SolverAI-${topicTitle}.mp4`} className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-white/10 px-2 py-1 rounded">
                        <Download className="w-3 h-3"/> Save Video
                    </a>
                )}
            </div>

            <div className="aspect-video bg-black flex items-center justify-center relative">
                {status === 'IDLE' && (
                    <div className="text-center p-6">
                        <p className="text-slate-400 text-sm mb-4">Generate a 720p animation explaining <br/><span className="text-white font-bold">"{topicTitle}"</span></p>
                        <button 
                            onClick={generateVideo}
                            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 mx-auto transition-transform active:scale-95 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30`}
                        >
                            <PlayCircle className="w-5 h-5" /> 
                            Generate Video
                        </button>
                    </div>
                )}

                {status === 'GENERATING' && (
                    <div className="text-center">
                        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
                        <p className="text-white font-bold">Dreaming up visuals...</p>
                        <div className="w-48 h-2 bg-slate-800 rounded-full mt-4 mx-auto overflow-hidden">
                            <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {status === 'READY' && videoUri && (
                    <video 
                        src={videoUri} 
                        controls 
                        autoPlay 
                        className="w-full h-full object-contain"
                    />
                )}

                {status === 'ERROR' && (
                    <div className="text-center text-red-400 p-6">
                        <p>Video generation failed.</p>
                        <button onClick={() => setStatus('IDLE')} className="mt-2 text-white underline text-sm">Try Again</button>
                    </div>
                )}
            </div>
            <div className="p-2 bg-slate-950 text-[10px] text-slate-500 text-center">
                Powered by Gemini Veo
            </div>
        </div>
    );
};

export default VeoVideoGenerator;
