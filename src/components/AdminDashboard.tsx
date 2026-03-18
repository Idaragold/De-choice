import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Clock, CheckCircle2, XCircle, Truck, 
  Package, MessageCircle, Trash2, Filter, Search,
  TrendingUp, Users, DollarSign, ArrowRight, Share2, Copy, Check,
  BookOpen, Save, Plus, AlertCircle, Loader2
} from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  uid: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'out-for-delivery' | 'completed' | 'cancelled';
  total: number;
  deliveryAddress?: string;
  paymentMethod?: string;
  createdAt: string;
}

interface Feedback {
  id: string;
  uid: string;
  email: string;
  message: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'feedback' | 'knowledge'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [knowledge, setKnowledge] = useState<{ id: string, content: string }[]>([]);
  const [newKnowledge, setNewKnowledge] = useState('');
  const [isSavingKnowledge, setIsSavingKnowledge] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'knowledge' | 'feedback' } | null>(null);

  const sharedUrl = "https://ais-pre-sclyeaytwhcpytd3l5itwd-215431310901.europe-west2.run.app";
  const customerLink = `${sharedUrl}?view=customer`;
  const downloadAppLink = `${sharedUrl}?action=install`;

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const ordersQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const feedbackQ = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));

    const unsubscribeOrders = onSnapshot(ordersQ, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
    });

    const unsubscribeFeedback = onSnapshot(feedbackQ, (snapshot) => {
      setFeedback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Feedback[]);
      setLoading(false);
    });

    const unsubscribeKnowledge = onSnapshot(collection(db, 'knowledge'), (snapshot) => {
      setKnowledge(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as { id: string, content: string }[]);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeFeedback();
      unsubscribeKnowledge();
    };
  }, []);

  const addKnowledge = async () => {
    if (!newKnowledge.trim()) return;
    setIsSavingKnowledge(true);
    try {
      await addDoc(collection(db, 'knowledge'), {
        content: newKnowledge,
        createdAt: new Date().toISOString()
      });
      setNewKnowledge('');
    } catch (error) {
      console.error("Error adding knowledge:", error);
    } finally {
      setIsSavingKnowledge(false);
    }
  };

  const deleteKnowledge = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'knowledge', id));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting knowledge:", error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const deleteFeedback = async (feedbackId: string) => {
    try {
      await deleteDoc(doc(db, 'feedback', feedbackId));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting feedback:", error);
    }
  };

  const stats = {
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.total, 0),
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'processing').length,
    activeUsers: new Set(orders.map(o => o.uid)).size
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-primary">
          <ShoppingBag size={32} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 h-full overflow-y-auto pr-2 custom-scrollbar">
      {/* Share Links Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer View Link */}
        <div className="bg-primary/5 border border-primary/20 p-6 rounded-[32px] flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-primary/20">
              <Share2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-display text-stone-900 dark:text-white">Share Customer Link</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Share this link with your customers to give them access only to the Assistant, Menu, and Reviews.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2 text-[10px] font-mono text-stone-500 truncate">
              {customerLink}
            </div>
            <button 
              onClick={() => copyLink(customerLink)}
              className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shrink-0"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span className="text-xs font-bold">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Direct Download App Link */}
        <div className="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-[32px] flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-500 p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="text-lg font-display text-stone-900 dark:text-white">Direct App Link</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Create a link for users to download/install the app directly on their mobile devices.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2 text-[10px] font-mono text-stone-500 truncate">
              {downloadAppLink}
            </div>
            <button 
              onClick={() => copyLink(downloadAppLink)}
              className="bg-indigo-500 text-white p-2.5 rounded-xl hover:bg-indigo-600 transition-all flex items-center gap-2 shrink-0"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span className="text-xs font-bold">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₦${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Pending', value: stats.pendingOrders, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Active Users', value: stats.activeUsers, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-stone-800 p-5 rounded-3xl border border-stone-100 dark:border-stone-700 shadow-sm"
          >
            <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-2xl flex items-center justify-center mb-3`}>
              <stat.icon size={20} />
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-xl font-black text-stone-900 dark:text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex bg-stone-100 dark:bg-stone-900 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveSubTab('orders')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'orders' ? 'bg-white dark:bg-stone-800 text-primary shadow-sm' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveSubTab('feedback')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'feedback' ? 'bg-white dark:bg-stone-800 text-primary shadow-sm' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'}`}
          >
            Feedback
          </button>
          <button 
            onClick={() => setActiveSubTab('knowledge')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'knowledge' ? 'bg-white dark:bg-stone-800 text-primary shadow-sm' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'}`}
          >
            AI Knowledge
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input 
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-4 pb-8">
        <AnimatePresence mode="popLayout">
          {confirmDelete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <div className="bg-white dark:bg-stone-800 p-8 rounded-[40px] max-w-sm w-full shadow-2xl border border-white/20">
                <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-3xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-display text-center text-stone-900 dark:text-white mb-2">Are you sure?</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 text-center mb-8">This action cannot be undone. This will permanently delete the item.</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 py-3 rounded-2xl bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 font-bold text-xs hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (confirmDelete.type === 'knowledge') deleteKnowledge(confirmDelete.id);
                      else deleteFeedback(confirmDelete.id);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeSubTab === 'orders' ? (
            filteredOrders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white dark:bg-stone-800 p-6 rounded-[32px] border border-stone-100 dark:border-stone-700 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-2xl">
                      <ShoppingBag size={20} className="text-stone-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-white">Order #{order.id.slice(-6).toUpperCase()}</h4>
                      <p className="text-[10px] text-stone-400 font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                      className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="out-for-delivery">Out for Delivery</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-2">Order Items</p>
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-stone-600 dark:text-stone-400 font-medium">{item.quantity}x {item.name}</span>
                        <span className="text-stone-900 dark:text-white font-bold">₦{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-stone-50 dark:border-stone-700 flex justify-between">
                      <span className="text-xs font-black text-stone-900 dark:text-white">Total</span>
                      <span className="text-xs font-black text-primary">₦{order.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-1">Delivery Address</p>
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{order.deliveryAddress || 'Pickup'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-1">Payment Method</p>
                      <p className="text-xs text-stone-600 dark:text-stone-400 font-bold uppercase">{order.paymentMethod || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : activeSubTab === 'feedback' ? (
            feedback.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-stone-800 p-6 rounded-[32px] border border-stone-100 dark:border-stone-700 shadow-sm relative group"
              >
                <button 
                  onClick={() => setConfirmDelete({ id: item.id, type: 'feedback' })}
                  className="absolute top-6 right-6 p-2 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white">{item.email}</h4>
                    <p className="text-[10px] text-stone-400 font-medium">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed italic">"{item.message}"</p>
              </motion.div>
            ))
          ) : (
            <div className="space-y-6">
              <div className="bg-white dark:bg-stone-800 p-6 rounded-[32px] border border-stone-100 dark:border-stone-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white">Update AI Knowledge</h4>
                    <p className="text-[10px] text-stone-400 font-medium">Add new information, rules, or facts for the AI assistant.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <textarea 
                    value={newKnowledge}
                    onChange={(e) => setNewKnowledge(e.target.value)}
                    placeholder="Enter new knowledge (e.g., 'We now offer free delivery on orders above ₦5000')"
                    className="w-full h-32 p-4 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={addKnowledge}
                      disabled={isSavingKnowledge || !newKnowledge.trim()}
                      className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                      {isSavingKnowledge ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                      Add to Knowledge Base
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Current Knowledge Base</h3>
                {knowledge.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-stone-800 p-4 rounded-2xl border border-stone-100 dark:border-stone-700 shadow-sm flex items-start justify-between gap-4 group"
                  >
                    <div className="flex gap-3">
                      <div className="mt-1 text-primary">
                        <AlertCircle size={16} />
                      </div>
                      <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{item.content}</p>
                    </div>
                    <button 
                      onClick={() => setConfirmDelete({ id: item.id, type: 'knowledge' })}
                      className="p-2 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
                {knowledge.length === 0 && (
                  <div className="text-center py-10 bg-stone-50 dark:bg-stone-900 rounded-[32px] border border-dashed border-stone-200 dark:border-stone-700">
                    <p className="text-xs text-stone-400 italic">No custom knowledge added yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </AnimatePresence>

        {((activeSubTab === 'orders' && filteredOrders.length === 0) || (activeSubTab === 'feedback' && feedback.length === 0)) && (
          <div className="text-center py-20">
            <div className="bg-stone-100 dark:bg-stone-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300 dark:text-stone-700">
              {activeSubTab === 'orders' ? <ShoppingBag size={40} /> : <MessageCircle size={40} />}
            </div>
            <p className="text-stone-400 text-sm italic">No records found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
