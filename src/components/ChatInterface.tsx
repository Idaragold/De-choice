import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, User as UserIcon, Bot, Loader2, UtensilsCrossed, Sparkles, 
  ShoppingBag, Info, Mic, MicOff, Volume2, VolumeX,
  Phone, PhoneOff, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { sendMessageStream, generateSpeech } from '../services/gemini';
import { GeminiLiveSession } from '../services/live';
import { Message } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db, auth } from '../firebase';
import { collection, addDoc, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { GenerateContentResponse } from '@google/genai';
import { User } from '../firebase';

const DAILY_LIMIT_SECONDS = 3 * 60 * 60; // 3 hours

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatInterfaceProps {
  user: User;
}

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "Welcome to **De Choice Fast Food, Uyo**! 🍲 I'm your assistant today. How can I help you satisfy your cravings? You can ask about our menu or for recommendations!",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [dailyUsageSeconds, setDailyUsageSeconds] = useState(0);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Live API Refs
  const liveSessionRef = useRef<GeminiLiveSession | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);

  // Fetch and track daily usage
  useEffect(() => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const usageId = `${user.uid}_${today}`;
    const usageRef = doc(db, 'voiceCallUsage', usageId);

    const unsubscribe = onSnapshot(usageRef, (docSnap) => {
      if (docSnap.exists()) {
        setDailyUsageSeconds(docSnap.data().durationSeconds || 0);
      } else {
        setDailyUsageSeconds(0);
      }
    }, (error) => {
      console.error("Error listening to voice usage:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-expand textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setInput(prev => prev + finalTranscript);
        } else if (interimTranscript) {
          setInput(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // --- Live API Audio Logic ---

  const startLiveCall = async () => {
    if (dailyUsageSeconds >= DAILY_LIMIT_SECONDS) {
      alert("You have reached your daily limit of 3 hours for voice calls. Please try again tomorrow.");
      setIsVoiceCallActive(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Initialize Audio Context
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      
      // Initialize Live Session
      liveSessionRef.current = new GeminiLiveSession({
        onAudioData: (base64Audio) => {
          if (!isVoiceCallActive) return;
          const binary = atob(base64Audio);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const pcmData = new Int16Array(bytes.buffer);
          audioQueueRef.current.push(pcmData);
          playNextInQueue();
        },
        onInterrupted: () => {
          audioQueueRef.current = [];
          isPlayingRef.current = false;
          setIsAiSpeaking(false);
          nextStartTimeRef.current = 0;
        },
        onTranscription: (text, isUser) => {
          if (!text || !isVoiceCallActive) return;
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (isUser) {
              if (lastMsg?.role === 'user' && Date.now() - lastMsg.timestamp < 5000) {
                return [...prev.slice(0, -1), { ...lastMsg, text: lastMsg.text + " " + text }];
              }
              return [...prev, { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() }];
            } else {
              if (lastMsg?.role === 'model' && Date.now() - lastMsg.timestamp < 5000) {
                return [...prev.slice(0, -1), { ...lastMsg, text: lastMsg.text + " " + text }];
              }
              return [...prev, { id: Date.now().toString(), role: 'model', text, timestamp: Date.now() }];
            }
          });
        },
        onError: (err) => {
          console.error("Live session error:", err);
          stopLiveCall();
        },
        onClose: () => {
          stopLiveCall();
        }
      });

      await liveSessionRef.current.connect();
      
      // Double check if still active after async connect
      if (!isVoiceCallActive) {
        stopLiveCall();
        return;
      }

      setIsLiveConnected(true);
      setCallStartTime(Date.now());

      // Start Microphone Capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        if (!isVoiceCallActive || !liveSessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setIsUserSpeaking(rms > 0.01);

        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        liveSessionRef.current.sendAudio(base64);
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

    } catch (error) {
      console.error("Failed to start live call:", error);
      alert("Could not start voice call. Please ensure microphone access is granted.");
      stopLiveCall();
    } finally {
      setIsLoading(false);
    }
  };

  const stopLiveCall = async () => {
    if (callStartTime && user) {
      const duration = Math.floor((Date.now() - callStartTime) / 1000);
      await updateUsage(duration);
    }
    setCallStartTime(null);

    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch (e) {
        console.error("Error closing audio context:", e);
      }
      audioContextRef.current = null;
    }

    setIsLiveConnected(false);
    setIsVoiceCallActive(false);
    setIsAiSpeaking(false);
    setIsUserSpeaking(false);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    nextStartTimeRef.current = 0;
  };

  const updateUsage = async (additionalSeconds: number) => {
    if (!user || additionalSeconds <= 0) return;
    
    const today = new Date().toISOString().split('T')[0];
    const usageId = `${user.uid}_${today}`;
    const usageRef = doc(db, 'voiceCallUsage', usageId);
    
    try {
      const docSnap = await getDoc(usageRef);
      if (docSnap.exists()) {
        await updateDoc(usageRef, {
          durationSeconds: (docSnap.data().durationSeconds || 0) + additionalSeconds,
          lastUpdatedAt: new Date().toISOString()
        });
      } else {
        await setDoc(usageRef, {
          uid: user.uid,
          date: today,
          durationSeconds: additionalSeconds,
          lastUpdatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error updating voice usage:", error);
    }
  };

  // Periodic usage update during call
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVoiceCallActive && isLiveConnected && callStartTime) {
      interval = setInterval(async () => {
        const now = Date.now();
        const elapsedSinceLastUpdate = Math.floor((now - (callStartTime || now)) / 1000);
        
        // Check if limit reached
        if (dailyUsageSeconds + elapsedSinceLastUpdate >= DAILY_LIMIT_SECONDS) {
          stopLiveCall();
          alert("Daily voice call limit reached.");
          return;
        }

        // We update the start time to "now" so we only count the delta in the next interval
        // But actually it's better to just track the total and update Firestore
        // For simplicity, let's update Firestore every 30 seconds
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [isVoiceCallActive, isLiveConnected, callStartTime, dailyUsageSeconds]);

  const playNextInQueue = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) return;

    isPlayingRef.current = true;
    setIsAiSpeaking(true);
    const pcmData = audioQueueRef.current.shift()!;
    
    const buffer = audioContextRef.current.createBuffer(1, pcmData.length, 16000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 32768.0;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);

    const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;

    source.onended = () => {
      isPlayingRef.current = false;
      setIsAiSpeaking(false);
      playNextInQueue();
    };
  };

  useEffect(() => {
    if (isVoiceCallActive) {
      startLiveCall();
    } else {
      stopLiveCall();
    }
    return () => {
      stopLiveCall();
    };
  }, [isVoiceCallActive]);

  const speakText = async (text: string) => {
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    const audioUrl = await generateSpeech(text);
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsSpeaking(false);
      audioRef.current.play();
    } else {
      setIsSpeaking(false);
    }
  };

  const handleSend = async (e?: React.FormEvent, customInput?: string) => {
    e?.preventDefault();
    const messageText = customInput || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customInput) setInput('');
    setIsLoading(true);

    try {
      const stream = await sendMessageStream(messageText);
      const modelId = (Date.now() + 1).toString();
      
      let fullText = '';
      let functionCalls: any[] = [];

      // Add initial empty model message
      setMessages((prev) => [...prev, {
        id: modelId,
        role: 'model',
        text: '',
        timestamp: Date.now(),
      }]);

      for await (const chunk of stream) {
        const response = chunk as GenerateContentResponse;
        const textChunk = response.text;
        if (textChunk) {
          fullText += textChunk;
          setMessages((prev) => prev.map(msg => 
            msg.id === modelId ? { ...msg, text: fullText } : msg
          ));
        }
        
        if (response.functionCalls) {
          functionCalls = [...functionCalls, ...response.functionCalls];
        }
      }

      // Handle Function Calls after stream completes
      if (functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === 'placeOrder') {
            const orderData = call.args as any;
            if (user) {
              await addDoc(collection(db, 'orders'), {
                ...orderData,
                uid: user.uid,
                createdAt: new Date().toISOString(),
                status: 'pending'
              });
              const successText = `\n\n✅ **Order Placed Successfully!**\n\nYour order for ${orderData.items.length} items (Total: ₦${orderData.total.toLocaleString()}) has been received. You can track it in the "My Orders" tab.`;
              fullText += successText;
              setMessages((prev) => prev.map(msg => 
                msg.id === modelId ? { ...msg, text: fullText } : msg
              ));
            }
          }
        }
      }

      if (!fullText) {
        setMessages((prev) => prev.map(msg => 
          msg.id === modelId ? { ...msg, text: "I'm sorry, I couldn't process that. Could you try again?" } : msg
        ));
      }
      
      // Auto-speak in voice call mode
      if (isVoiceCallActive && fullText) {
        speakText(fullText);
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  };

  const remainingSeconds = Math.max(0, DAILY_LIMIT_SECONDS - dailyUsageSeconds);

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Voice Call Overlay */}
      <AnimatePresence>
        {isVoiceCallActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-stone-950 flex flex-col items-center justify-between py-20 px-8 text-center"
          >
            {/* Background Ambient Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div 
                animate={{ 
                  scale: isAiSpeaking ? [1, 1.2, 1] : 1,
                  opacity: isAiSpeaking ? [0.1, 0.2, 0.1] : 0.05
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-primary rounded-full blur-[120px]"
              />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-md">
              <div className="space-y-2">
                <h2 className="text-3xl font-display text-white tracking-tight">De Choice Assistant</h2>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-stone-500 text-xs font-black uppercase tracking-[0.3em]">
                    {isLiveConnected ? (isAiSpeaking ? "Speaking..." : isUserSpeaking ? "Listening..." : "Ready") : "Connecting..."}
                  </p>
                  <p className="text-stone-600 text-[10px] font-bold uppercase tracking-widest">
                    Remaining: {formatTime(remainingSeconds)}
                  </p>
                </div>
              </div>

              {/* Two-Person Call Visualization */}
              <div className="flex flex-col items-center gap-16 w-full">
                {/* AI Avatar */}
                <div className="relative">
                  <AnimatePresence>
                    {isAiSpeaking && (
                      <>
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1.5, opacity: 0.2 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute inset-0 bg-primary rounded-full blur-xl"
                        />
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1.8, opacity: 0.1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                          className="absolute inset-0 bg-primary rounded-full blur-2xl"
                        />
                      </>
                    )}
                  </AnimatePresence>
                  <div className={cn(
                    "relative w-32 h-32 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-500",
                    isAiSpeaking ? "bg-primary scale-110 shadow-primary/40" : "bg-stone-800 scale-100"
                  )}>
                    <Bot size={64} className={cn(isAiSpeaking && "animate-pulse")} />
                  </div>
                </div>

                {/* Connection Line / Waveform */}
                <div className="flex items-center gap-1 h-8">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: (isAiSpeaking || isUserSpeaking) ? [8, 32, 8] : 8,
                        opacity: (isAiSpeaking || isUserSpeaking) ? 1 : 0.2
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 0.5, 
                        delay: i * 0.05,
                        ease: "easeInOut"
                      }}
                      className="w-1 bg-primary rounded-full"
                    />
                  ))}
                </div>

                {/* User Avatar */}
                <div className="relative">
                  <AnimatePresence>
                    {isUserSpeaking && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.4, opacity: 0.3 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="absolute inset-0 bg-white rounded-full blur-lg"
                      />
                    )}
                  </AnimatePresence>
                  <div className={cn(
                    "relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300",
                    isUserSpeaking ? "bg-stone-700 scale-110" : "bg-stone-900 scale-100 border border-stone-800"
                  )}>
                    <UserIcon size={32} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Prominent End Call Button */}
            <div className="relative z-10 w-full flex flex-col items-center gap-8">
              <div className="flex items-center gap-12">
                <button 
                  onClick={() => {}} // Could add mute functionality here
                  className="w-14 h-14 rounded-full bg-white/5 text-stone-400 flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <MicOff size={24} />
                </button>
                
                <button 
                  onClick={() => setIsVoiceCallActive(false)}
                  className="w-24 h-24 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 hover:scale-110 transition-all shadow-2xl shadow-red-600/40 group active:scale-95"
                >
                  <PhoneOff size={40} className="group-hover:rotate-12 transition-transform" />
                </button>

                <button 
                  onClick={() => {}} // Could add speaker functionality here
                  className="w-14 h-14 rounded-full bg-white/5 text-stone-400 flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <Volume2 size={24} />
                </button>
              </div>
              
              <p className="text-[10px] text-stone-600 font-black uppercase tracking-[0.2em]">End Call</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex gap-4 max-w-[90%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                msg.role === 'user' 
                  ? "bg-stone-900 text-white" 
                  : "bg-primary text-white"
              )}>
                {msg.role === 'user' ? <UserIcon size={20} /> : <Bot size={20} />}
              </div>
              <div className={cn(
                "p-4 rounded-[24px] text-sm leading-relaxed shadow-sm relative group",
                msg.role === 'user' 
                  ? "bg-stone-900 dark:bg-primary text-white rounded-tr-none" 
                  : "bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 border border-stone-100 dark:border-stone-600 rounded-tl-none"
              )}>
                <div className="markdown-body">
                  <Markdown>{msg.text}</Markdown>
                </div>
                {msg.role === 'model' && (
                  <button 
                    onClick={() => speakText(msg.text)}
                    className="absolute -right-10 top-2 p-2 text-stone-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                )}
                <span className={cn(
                  "text-[9px] font-bold opacity-30 absolute bottom-1",
                  msg.role === 'user' ? "right-4" : "left-4"
                )}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 max-w-[90%] mr-auto"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot size={20} />
            </div>
            <div className="bg-white dark:bg-stone-700 border border-stone-100 dark:border-stone-600 p-4 rounded-[24px] rounded-tl-none flex items-center gap-3">
              <div className="flex gap-1">
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
              </div>
              <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest">Assistant is thinking</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white/80 dark:bg-stone-800/80 backdrop-blur-md border-t border-stone-100 dark:border-stone-700">
        <form onSubmit={handleSend} className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsVoiceCallActive(true)}
            disabled={dailyUsageSeconds >= DAILY_LIMIT_SECONDS}
            className={cn(
              "p-4 rounded-2xl transition-all shadow-sm active:scale-95",
              dailyUsageSeconds >= DAILY_LIMIT_SECONDS 
                ? "bg-stone-100 dark:bg-stone-900 text-stone-300 dark:text-stone-700 cursor-not-allowed" 
                : "bg-stone-100 dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:bg-primary hover:text-white"
            )}
            title={dailyUsageSeconds >= DAILY_LIMIT_SECONDS ? "Daily limit reached" : "Voice Call"}
          >
            <Phone size={20} />
          </button>
          
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message here..."
              maxLength={500}
              rows={2}
              className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl pl-5 pr-20 py-4 text-base focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-stone-400 dark:text-white resize-none min-h-[80px] max-h-[200px]"
            />
            <div className="absolute right-12 bottom-4 flex items-center gap-2 pointer-events-none">
              <span className={cn(
                "text-[10px] font-black tracking-tighter",
                input.length > 450 ? "text-red-500" : "text-stone-300 dark:text-stone-600"
              )}>
                {input.length}/500
              </span>
            </div>
            <button
              type="button"
              onClick={toggleListening}
              className={cn(
                "absolute right-4 bottom-4 p-1 rounded-lg transition-colors",
                isListening ? "text-primary bg-primary/10" : "text-stone-400 hover:text-primary"
              )}
            >
              {isListening ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </form>
        
        {/* Quick Order Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {['Jollof Rice', 'Shawarma', 'Ekpang Nkukwo'].map((item) => (
            <button
              key={item}
              onClick={() => handleSend(undefined, `I'd like to order ${item}`)}
              disabled={isLoading}
              className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-700 text-stone-500 dark:text-stone-400 px-4 py-2 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-50"
            >
              <ShoppingBag size={12} className="group-hover:scale-110 transition-transform" />
              Order {item}
            </button>
          ))}
          <button
            onClick={() => handleSend(undefined, `What are your best sellers?`)}
            disabled={isLoading}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-700 text-stone-500 dark:text-stone-400 px-4 py-2 rounded-xl hover:bg-stone-900 dark:hover:bg-stone-700 hover:text-white hover:border-stone-900 dark:hover:border-stone-600 transition-all disabled:opacity-50"
          >
            <Info size={12} />
            Best Sellers
          </button>
        </div>
      </div>
    </div>
  );
}
