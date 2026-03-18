import { useState, useEffect } from 'react';
import { 
  Utensils, MapPin, Clock, Phone, Sparkles, Gift, LogOut, 
  User as UserIcon, Search, CreditCard, X, MessageSquare, 
  Star, MessageCircle, Menu as MenuIcon, ChevronRight,
  Home, LayoutGrid, Heart, Info
} from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import Login from './components/Login';
import Reviews from './components/Reviews';
import Feedback from './components/Feedback';
import FullMenu from './components/FullMenu';
import { MENU, DEALS_OF_THE_DAY, MEAL_COMBOS } from './constants';
import { auth, onAuthStateChanged, logout, User } from './firebase';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'chat' | 'menu' | 'reviews' | 'feedback';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const todayDeal = DEALS_OF_THE_DAY.find(d => d.day === currentDay);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-primary"
        >
          <Utensils size={48} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const navItems = [
    { id: 'chat', label: 'Assistant', icon: MessageSquare },
    { id: 'menu', label: 'Menu', icon: LayoutGrid },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'feedback', label: 'Feedback', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-50 font-sans text-stone-900 overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-stone-200 p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20">
            <Utensils size={20} />
          </div>
          <h1 className="text-xl font-display tracking-tight">De Choice</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-stone-500 hover:bg-stone-100 rounded-xl transition-colors"
        >
          <MenuIcon size={24} />
        </button>
      </header>

      {/* Sidebar / Info Panel */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed inset-0 md:relative md:inset-auto w-full md:w-80 lg:w-96 bg-white border-r border-stone-200 p-6 flex flex-col gap-8 overflow-y-auto z-40 shadow-2xl md:shadow-none"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-primary/20">
                  <Utensils size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-display tracking-tight text-stone-900">De Choice</h1>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Fast Food Uyo</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-2 text-stone-400 hover:text-primary transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* User Profile */}
            <div className="bg-stone-50 rounded-3xl p-4 border border-stone-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500">
                    <UserIcon size={20} />
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-stone-900 truncate">{user.displayName || 'Guest User'}</p>
                  <p className="text-[10px] text-stone-500 truncate">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={() => logout()}
                className="p-2 text-stone-400 hover:text-primary transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as Tab);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all group ${
                    activeTab === item.id 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-stone-400 group-hover:text-primary transition-colors'} />
                    <span className="text-sm font-bold tracking-tight">{item.label}</span>
                  </div>
                  <ChevronRight size={16} className={activeTab === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'} />
                </button>
              ))}
            </nav>

            {/* Payment Details Section */}
            <section className="bg-stone-900 text-white p-6 rounded-3xl shadow-xl shadow-stone-900/10 border border-stone-800 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <CreditCard size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary/20 p-2 rounded-xl text-primary">
                    <CreditCard size={20} />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Payment Info</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest mb-1">Account Number</p>
                    <p className="text-xl font-mono font-bold text-primary tracking-widest">0012821377</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest mb-1">Account Name</p>
                    <p className="text-sm font-bold">Nkechi Lois Udoh</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest mb-1">Bank Name</p>
                    <p className="text-sm font-bold">Union Bank of NIGERIA</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Today's Deal Banner */}
            {todayDeal && (
              <div className="bg-accent/10 border border-accent/30 p-5 rounded-3xl flex gap-4 items-start relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:rotate-12 transition-transform">
                  <Sparkles size={40} />
                </div>
                <div className="bg-accent p-2 rounded-xl text-stone-900 shadow-sm">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Today's Deal</h4>
                  <p className="text-sm font-bold text-stone-900 leading-tight">{todayDeal.deal}</p>
                </div>
              </div>
            )}

            {/* Contact Info */}
            <section className="space-y-4 pb-8">
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-stone-600 group">
                  <div className="bg-stone-100 p-2 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <MapPin size={16} />
                  </div>
                  <span className="text-xs font-medium">Abak Road, Uyo, Akwa Ibom</span>
                </div>
                <div className="flex items-center gap-3 text-stone-600 group">
                  <div className="bg-stone-100 p-2 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Clock size={16} />
                  </div>
                  <span className="text-xs font-medium">Daily: 8:00 AM - 10:00 PM</span>
                </div>
                <div className="flex items-center gap-3 text-stone-600 group">
                  <div className="bg-stone-100 p-2 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Phone size={16} />
                  </div>
                  <span className="text-xs font-medium">+234 800 DE CHOICE</span>
                </div>
              </div>
            </section>

            <footer className="mt-auto pt-8 border-t border-stone-100">
              <p className="text-[10px] text-stone-400 text-center font-medium">
                © 2026 De Choice Fast Food. Crafted for Uyo.
              </p>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen relative overflow-hidden">
        {/* Desktop Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-8 z-10 pointer-events-none hidden md:block">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <motion.h2 
                key={activeTab}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-display text-stone-900"
              >
                {activeTab === 'chat' && `Welcome back, ${user.displayName?.split(' ')[0]}!`}
                {activeTab === 'menu' && "Explore Our Menu"}
                {activeTab === 'reviews' && "Customer Stories"}
                {activeTab === 'feedback' && "We're Listening"}
              </motion.h2>
              <p className="text-stone-500 text-sm">
                {activeTab === 'chat' && "Our AI assistant is ready to take your order."}
                {activeTab === 'menu' && "From local delicacies to fast food favorites."}
                {activeTab === 'reviews' && "See why Uyo loves De Choice."}
                {activeTab === 'feedback' && "Your thoughts help us grow."}
              </p>
            </div>
            
            <div className="pointer-events-auto flex gap-2">
              {!isSidebarOpen && (
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm text-stone-500 hover:text-primary transition-colors"
                >
                  <MenuIcon size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-hidden pt-4 md:pt-32 pb-4 md:pb-8 px-4 md:px-8">
          <div className="max-w-4xl w-full mx-auto h-full bg-white/50 backdrop-blur-sm rounded-[40px] border border-white/50 shadow-2xl shadow-stone-200/50 overflow-hidden flex flex-col relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 p-6 md:p-8 overflow-hidden"
              >
                {activeTab === 'chat' && <ChatInterface />}
                {activeTab === 'menu' && <FullMenu />}
                {activeTab === 'reviews' && <Reviews />}
                {activeTab === 'feedback' && <Feedback />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
