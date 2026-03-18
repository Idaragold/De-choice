import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, UtensilsCrossed, Sparkles, ShoppingBag, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { sendMessage } from '../services/gemini';
import { Message } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db, auth } from '../firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ChatInterface() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const responseText = await sendMessage(messageText);
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I'm sorry, I couldn't process that. Could you try again?",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
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
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={cn(
                "p-4 rounded-[24px] text-sm leading-relaxed shadow-sm relative group",
                msg.role === 'user' 
                  ? "bg-stone-900 text-white rounded-tr-none" 
                  : "bg-white text-stone-800 border border-stone-100 rounded-tl-none"
              )}>
                <div className="markdown-body">
                  <Markdown>{msg.text}</Markdown>
                </div>
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
            <div className="bg-white border border-stone-100 p-4 rounded-[24px] rounded-tl-none flex items-center gap-3">
              <div className="flex gap-1">
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
              </div>
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Assistant is thinking</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white/80 backdrop-blur-md border-t border-stone-100">
        <form onSubmit={handleSend} className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-5 pr-12 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-stone-400"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Sparkles size={16} className="text-primary opacity-50" />
            </div>
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
              className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-stone-50 border border-stone-100 text-stone-500 px-4 py-2 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-50"
            >
              <ShoppingBag size={12} className="group-hover:scale-110 transition-transform" />
              Order {item}
            </button>
          ))}
          <button
            onClick={() => handleSend(undefined, `What are your best sellers?`)}
            disabled={isLoading}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-stone-50 border border-stone-100 text-stone-500 px-4 py-2 rounded-xl hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all disabled:opacity-50"
          >
            <Info size={12} />
            Best Sellers
          </button>
        </div>
      </div>
    </div>
  );
}
