import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, User as UserIcon, Loader2, ThumbsUp } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface Review {
  id: string;
  uid: string;
  displayName: string;
  photoURL: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(reviewsData);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !comment.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || 'Anonymous',
        photoURL: auth.currentUser.photoURL || '',
        rating,
        comment,
        createdAt: new Date().toISOString()
      });
      setComment('');
      setRating(5);
    } catch (error) {
      console.error("Error adding review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full overflow-y-auto pr-2 custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-stone-900">Customer Reviews</h2>
          <p className="text-stone-500 text-sm">See what others are saying about De Choice</p>
        </div>
        <div className="bg-primary/10 px-4 py-2 rounded-2xl flex items-center gap-2">
          <Star className="text-primary fill-primary" size={20} />
          <span className="text-lg font-bold text-primary">
            {reviews.length > 0 
              ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
              : '0.0'}
          </span>
          <span className="text-stone-400 text-xs font-medium">({reviews.length})</span>
        </div>
      </div>

      {/* Review Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm"
      >
        <h3 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-primary" />
          Write a Review
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition-transform active:scale-90"
              >
                <Star 
                  size={24} 
                  className={star <= rating ? "text-primary fill-primary" : "text-stone-200"} 
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm min-h-[100px] resize-none"
            required
          />
          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Post Review</>}
          </button>
        </form>
      </motion.div>

      {/* Reviews List */}
      <div className="space-y-4 pb-8">
        <AnimatePresence mode="popLayout">
          {reviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm hover:border-primary/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {review.photoURL ? (
                    <img src={review.photoURL} alt={review.displayName} className="w-10 h-10 rounded-full border border-stone-100" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                      <UserIcon size={20} />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">{review.displayName}</h4>
                    <div className="flex gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={10} 
                          className={star <= review.rating ? "text-primary fill-primary" : "text-stone-200"} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 font-medium">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed italic">"{review.comment}"</p>
              <div className="mt-4 flex items-center gap-4 border-t border-stone-50 pt-3">
                <button className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 hover:text-primary transition-colors">
                  <ThumbsUp size={12} /> Helpful
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {reviews.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
              <MessageSquare size={32} />
            </div>
            <p className="text-stone-400 text-sm italic">No reviews yet. Be the first to share your experience!</p>
          </div>
        )}
      </div>
    </div>
  );
}
