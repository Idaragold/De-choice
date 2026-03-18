import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Clock, CheckCircle2, XCircle, Truck, Package, MapPin } from 'lucide-react';

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

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'orders'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-amber-500" />;
      case 'processing': return <Package size={16} className="text-blue-500" />;
      case 'out-for-delivery': return <Truck size={16} className="text-indigo-500" />;
      case 'completed': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'cancelled': return <XCircle size={16} className="text-red-500" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
      case 'processing': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'out-for-delivery': return 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800';
      case 'completed': return 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    }
  };

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
    <div className="flex flex-col gap-8 h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
      <AnimatePresence mode="popLayout">
        {orders.map((order, idx) => (
          <motion.div
            key={order.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}
            className="bg-white dark:bg-stone-900 p-8 rounded-[40px] border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-stone-50 dark:bg-stone-800 p-4 rounded-3xl text-primary shadow-inner border border-stone-100 dark:border-stone-700">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight">Order #{order.id.slice(-6).toUpperCase()}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">
                    <Clock size={12} />
                    {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                {order.status.replace(/-/g, ' ')}
              </div>
            </div>

            {/* Order Items List */}
            <div className="bg-stone-50/50 dark:bg-stone-800/30 rounded-3xl p-6 mb-8 border border-stone-100/50 dark:border-stone-700/30">
              <div className="space-y-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group/item">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-stone-800 flex items-center justify-center text-[10px] font-black text-primary border border-stone-100 dark:border-stone-700 shadow-sm">
                        {item.quantity}x
                      </div>
                      <span className="text-sm text-stone-700 dark:text-stone-300 font-bold group-hover/item:text-primary transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm text-stone-900 dark:text-white font-black tracking-tight">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="space-y-1">
                <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest">Total Investment</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-primary tracking-tighter">₦{order.total.toLocaleString()}</span>
                  <span className="text-[10px] text-stone-400 font-bold">NGN</span>
                </div>
              </div>
              
              {order.deliveryAddress && (
                <div className="text-right flex flex-col items-end gap-1 max-w-[240px]">
                  <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest">Destination</p>
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-100 dark:border-stone-700">
                    <MapPin size={12} className="text-primary" />
                    <span className="truncate">{order.deliveryAddress}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-stone-100 dark:bg-stone-900 w-20 h-20 rounded-full flex items-center justify-center mb-4 text-stone-300 dark:text-stone-700">
            <ShoppingBag size={40} />
          </div>
          <h3 className="text-stone-900 dark:text-white font-bold mb-1">No orders yet</h3>
          <p className="text-stone-400 text-sm italic">Hungry? Our AI assistant is ready to help you order!</p>
        </div>
      )}
    </div>
  );
}
