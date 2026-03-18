import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Sparkles, 
  Loader2, 
  Download, 
  Share2, 
  CheckCircle2,
  AlertCircle,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateImage, startVideoGeneration, pollVideoOperation, fetchVideoData } from '../services/gemini';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';

interface Promotion {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  createdAt: string;
}

export default function Promotions() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState<'image' | 'video'>('image');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [videoStatus, setVideoStatus] = useState<string>('');

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'promotions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const promoData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Promotion[];
      setPromotions(promoData);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    if (generationType === 'video' && !hasApiKey) {
      setError("Please select a Gemini API key to generate videos.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setVideoStatus('');

    try {
      if (generationType === 'image') {
        const imageUrl = await generateImage(prompt);
        if (imageUrl) {
          await addDoc(collection(db, 'promotions'), {
            type: 'image',
            url: imageUrl,
            prompt,
            createdAt: new Date().toISOString(),
            uid: auth.currentUser?.uid
          });
        } else {
          throw new Error("Failed to generate image");
        }
      } else {
        setVideoStatus('Starting generation...');
        let operation = await startVideoGeneration(prompt);
        
        while (!operation.done) {
          setVideoStatus('Generating video... this may take a few minutes.');
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await pollVideoOperation(operation);
        }

        if (operation.response?.generatedVideos?.[0]?.video?.uri) {
          setVideoStatus('Fetching video data...');
          const videoUrl = await fetchVideoData(operation.response.generatedVideos[0].video.uri);
          if (videoUrl) {
            await addDoc(collection(db, 'promotions'), {
              type: 'video',
              url: videoUrl,
              prompt,
              createdAt: new Date().toISOString(),
              uid: auth.currentUser?.uid
            });
          }
        } else {
          throw new Error("Failed to generate video");
        }
      }
      setPrompt('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during generation.");
    } finally {
      setIsGenerating(false);
      setVideoStatus('');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-display text-stone-900 dark:text-white">Promotions Studio</h1>
        <p className="text-stone-500 dark:text-stone-400">Create stunning visuals for your daily deals and new menu items.</p>
      </div>

      {/* Generation Controls */}
      <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 shadow-sm border border-stone-100 dark:border-stone-700 space-y-6">
        <div className="flex gap-4">
          <button
            onClick={() => setGenerationType('image')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all ${
              generationType === 'image' 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-stone-50 dark:bg-stone-900 text-stone-500 hover:bg-stone-100'
            }`}
          >
            <ImageIcon size={20} />
            <span>Image</span>
          </button>
          <button
            onClick={() => setGenerationType('video')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all ${
              generationType === 'video' 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-stone-50 dark:bg-stone-900 text-stone-500 hover:bg-stone-100'
            }`}
          >
            <VideoIcon size={20} />
            <span>Video (Veo)</span>
          </button>
        </div>

        {generationType === 'video' && !hasApiKey && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
              <Key size={20} />
              <span className="text-sm font-medium">API Key required for video generation</span>
            </div>
            <button 
              onClick={handleOpenKeySelector}
              className="text-xs font-bold uppercase tracking-wider bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700 transition-all"
            >
              Select Key
            </button>
          </div>
        )}

        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={generationType === 'image' 
              ? "Describe the promotional image (e.g., 'A delicious plate of Jollof rice with grilled chicken, vibrant colors, professional food photography')" 
              : "Describe the promotional video (e.g., 'Cinematic slow motion of a steaming bowl of Ekpang Nkukwo, close up, warm lighting')"
            }
            className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 text-stone-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all min-h-[100px]"
          />

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || (generationType === 'video' && !hasApiKey)}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>{videoStatus || 'Generating...'}</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Generate Promotion</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Promotions Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {promotions.map((promo) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-stone-800 rounded-3xl overflow-hidden shadow-sm border border-stone-100 dark:border-stone-700 group"
            >
              <div className="aspect-video bg-stone-100 dark:bg-stone-900 relative">
                {promo.type === 'image' ? (
                  <img 
                    src={promo.url} 
                    alt={promo.prompt} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <video 
                    src={promo.url} 
                    controls 
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-white/90 dark:bg-stone-800/90 rounded-xl text-stone-600 dark:text-stone-300 hover:text-primary shadow-sm">
                    <Download size={18} />
                  </button>
                  <button className="p-2 bg-white/90 dark:bg-stone-800/90 rounded-xl text-stone-600 dark:text-stone-300 hover:text-primary shadow-sm">
                    <Share2 size={18} />
                  </button>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {promo.type}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-sm text-stone-800 dark:text-stone-200 line-clamp-2">{promo.prompt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-stone-500 font-medium">
                    {new Date(promo.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1 text-emerald-500">
                    <CheckCircle2 size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Published</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
