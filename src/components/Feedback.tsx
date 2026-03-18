import React, { useState } from 'react';
import { Send, MessageCircle, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { motion } from 'motion/react';

export default function Feedback() {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !message.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      await addDoc(collection(db, 'feedback'), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || 'Anonymous',
        message: message.trim(),
        createdAt: new Date().toISOString()
      });
      setMessage('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error("Error adding feedback:", err);
      setError("Failed to send feedback. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full overflow-y-auto pr-2 custom-scrollbar">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display text-stone-900 dark:text-white">Send Feedback</h2>
        <p className="text-stone-500 dark:text-stone-400 text-sm">Help us improve De Choice by sharing your thoughts</p>
      </div>

      {/* Feedback Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-stone-800 p-8 rounded-3xl border border-stone-200 dark:border-stone-700 shadow-sm"
      >
        <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-primary">
          <MessageCircle size={32} />
        </div>
        
        <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">We'd love to hear from you!</h3>
        <p className="text-stone-500 dark:text-stone-400 text-sm mb-8 leading-relaxed">
          Whether it's a suggestion, a compliment, or a concern, your feedback is invaluable to us.
        </p>

        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 text-green-600 dark:text-green-400 rounded-2xl flex items-center gap-3 text-sm"
          >
            <CheckCircle2 size={24} />
            <div>
              <p className="font-bold">Thank you for your feedback!</p>
              <p className="text-xs opacity-80">We've received your message and will review it shortly.</p>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 text-sm">
            <AlertCircle size={24} />
            <p className="font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Your Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              className="w-full p-5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm min-h-[200px] resize-none text-stone-900 dark:text-white"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" size={24} /> : <><Send size={20} /> Send Feedback</>}
          </button>
        </form>
      </motion.div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
        <div className="bg-stone-50 dark:bg-stone-900 p-6 rounded-3xl border border-stone-100 dark:border-stone-800">
          <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-2">Direct Support</h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">For urgent issues, please call us directly at +234 800 DE CHOICE.</p>
        </div>
        <div className="bg-stone-50 dark:bg-stone-900 p-6 rounded-3xl border border-stone-100 dark:border-stone-800">
          <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-2">Visit Us</h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">Abak Road, Uyo, Akwa Ibom State. Open daily 8:00 AM - 10:00 PM.</p>
        </div>
      </div>
    </div>
  );
}
