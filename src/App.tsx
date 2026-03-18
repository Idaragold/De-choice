import { useState, useEffect } from 'react';
import { 
  Utensils, MapPin, Clock, Phone, Sparkles, Gift, LogOut, 
  User as UserIcon, Search, CreditCard, X, MessageSquare, 
  Star, MessageCircle, Menu as MenuIcon, ChevronRight,
  Home, LayoutGrid, Heart, Info, ShoppingBag, ShieldCheck,
  Sun, Moon, Image as ImageIcon, Download
} from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import Login from './components/Login';
import Reviews from './components/Reviews';
import Feedback from './components/Feedback';
import FullMenu from './components/FullMenu';
import Orders from './components/Orders';
import AdminDashboard from './components/AdminDashboard';
import Promotions from './components/Promotions';
import { MENU, DEALS_OF_THE_DAY, MEAL_COMBOS } from './constants';
import { auth, onAuthStateChanged, logout, User } from './firebase';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'chat' | 'menu' | 'reviews' | 'feedback' | 'orders' | 'admin' | 'promotions';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCustomerView, setIsCustomerView] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'customer') {
      setIsCustomerView(true);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
    if (params.get('action') === 'install') {
      setShowInstallPrompt(true);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert('To install the app, please use your browser menu (e.g., "Add to Home Screen" or "Install App").');
      setShowInstallPrompt(false);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const todayDeal = DEALS_OF_THE_DAY.find(d => d.day === currentDay);

  const isAdmin = user?.email === 'udohgodstime79@gmail.com';

  const navItems = [
    { id: 'chat', label: 'Chat Assistant', icon: MessageSquare },
    { id: 'menu', label: 'Full Menu', icon: Utensils },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'promotions', label: 'Promotions', icon: Sparkles },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'feedback', label: 'Feedback', icon: MessageCircle },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: ShieldCheck }] : []),
  ].filter(item => {
    if (isCustomerView) {
      return ['chat', 'menu', 'reviews'].includes(item.id);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900">
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

  return (
    <>
      {/* Install Prompt Modal */}
      <AnimatePresence>
        {showInstallPrompt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-stone-900 rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
                  <Download size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-display text-stone-900 dark:text-white mb-2">Install De Choice App</h2>
                  <p className="text-stone-500 dark:text-stone-400">Install our app on your home screen for faster access and a better experience.</p>
                </div>
                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={handleInstall}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Install Now
                  </button>
                  <button
                    onClick={() => setShowInstallPrompt(false)}
                    className="w-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 py-4 rounded-2xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
      {!user ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full h-full"
        >
          <Login />
        </motion.div>
      ) : (
        <motion.div 
          key="dashboard"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="min-h-screen flex flex-col md:flex-row bg-stone-50 dark:bg-stone-900 font-sans text-stone-900 dark:text-stone-100 overflow-hidden"
        >
          {/* Mobile Header */}
          <header className="md:hidden bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 p-4 flex items-center justify-between z-50">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20">
                <Utensils size={20} />
              </div>
              <h1 className="text-xl font-display tracking-tight">De Choice</h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl transition-colors"
              >
                {theme === 'light' ? <motion.div initial={{rotate: -90}} animate={{rotate: 0}}><Moon size={20} /></motion.div> : <motion.div initial={{rotate: 90}} animate={{rotate: 0}}><Sun size={20} /></motion.div>}
              </button>
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl transition-colors"
              >
                <MenuIcon size={24} />
              </button>
            </div>
          </header>

          {/* Sidebar / Info Panel */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.aside 
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="fixed inset-0 md:relative md:inset-auto w-full md:w-80 lg:w-96 bg-white dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700 p-6 flex flex-col gap-8 overflow-y-auto z-40 shadow-2xl md:shadow-none"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-primary/20">
                      <Utensils size={32} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-display tracking-tight text-stone-900 dark:text-white">De Choice</h1>
                      <p className="text-xs font-bold text-primary uppercase tracking-widest">Fast Food Uyo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={toggleTheme}
                      className="p-2 text-stone-400 hover:text-primary transition-colors hidden md:block"
                      title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
                    >
                      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className="md:hidden p-2 text-stone-400 hover:text-primary transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                {/* User Profile */}
                <div className="bg-stone-50 dark:bg-stone-900 rounded-3xl p-4 border border-stone-100 dark:border-stone-700 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border-2 border-white dark:border-stone-800 shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400">
                        <UserIcon size={20} />
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-stone-900 dark:text-white truncate">{user.displayName || 'Guest User'}</p>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">{user.email}</p>
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
                          : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 hover:text-stone-900 dark:hover:text-white'
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
                <section className="bg-stone-900 dark:bg-black text-white p-8 rounded-[32px] shadow-2xl shadow-stone-900/20 border border-stone-800 relative overflow-hidden group">
                  <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700">
                    <CreditCard size={120} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-primary p-2.5 rounded-2xl text-white shadow-lg shadow-primary/20">
                        <CreditCard size={18} />
                      </div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Payment Gateway</h3>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <p className="text-[9px] text-stone-500 uppercase font-black tracking-widest mb-1.5 opacity-60">Account Number</p>
                        <p className="text-2xl font-mono font-black text-primary tracking-[0.15em]">0012821377</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] text-stone-500 uppercase font-black tracking-widest mb-1.5 opacity-60">Account Name</p>
                          <p className="text-[11px] font-bold leading-tight">Nkechi Lois Udoh</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-stone-500 uppercase font-black tracking-widest mb-1.5 opacity-60">Bank</p>
                          <p className="text-[11px] font-bold leading-tight">Union Bank</p>
                        </div>
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
                      <h4 className="text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-1">Today's Deal</h4>
                      <p className="text-sm font-bold text-stone-900 dark:text-white leading-tight">{todayDeal.deal}</p>
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <section className="space-y-4 pb-8">
                  <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Contact Us</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-stone-600 dark:text-stone-400 group">
                      <div className="bg-stone-100 dark:bg-stone-900 p-2 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <MapPin size={16} />
                      </div>
                      <span className="text-xs font-medium">Abak Road, Uyo, Akwa Ibom</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-600 dark:text-stone-400 group">
                      <div className="bg-stone-100 dark:bg-stone-900 p-2 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Clock size={16} />
                      </div>
                      <span className="text-xs font-medium">Daily: 8:00 AM - 10:00 PM</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-600 dark:text-stone-400 group">
                      <div className="bg-stone-100 dark:bg-stone-900 p-2 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Phone size={16} />
                      </div>
                      <span className="text-xs font-medium">+234 800 DE CHOICE</span>
                    </div>
                  </div>
                </section>

                <footer className="mt-auto pt-8 border-t border-stone-100 dark:border-stone-700">
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
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.h2 
                    key={activeTab}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-display text-stone-900 dark:text-white"
                  >
                    {activeTab === 'chat' && `Hello, ${user.displayName?.split(' ')[0]}!`}
                    {activeTab === 'menu' && "Explore Our Menu"}
                    {activeTab === 'orders' && "Your Orders"}
                    {activeTab === 'promotions' && "Promotions Studio"}
                    {activeTab === 'reviews' && "Customer Reviews"}
                    {activeTab === 'feedback' && "Your Feedback"}
                    {activeTab === 'admin' && "Admin Panel"}
                  </motion.h2>
                  <p className="text-stone-500 dark:text-stone-400 text-sm font-medium mt-1">
                    {activeTab === 'chat' && "How can I help you satisfy your cravings today?"}
                    {activeTab === 'menu' && "Discover Uyo's finest jollof, shawarma, and more."}
                    {activeTab === 'orders' && "Keep track of your delicious moments."}
                    {activeTab === 'promotions' && "Create stunning visuals for your deals."}
                    {activeTab === 'reviews' && "What our community is saying about us."}
                    {activeTab === 'feedback' && "Help us make De Choice even better."}
                    {activeTab === 'admin' && "Manage the heart of De Choice."}
                  </p>
                </motion.div>
                
                <div className="pointer-events-auto flex gap-3">
                  {!isSidebarOpen && (
                    <button 
                      onClick={() => setIsSidebarOpen(true)}
                      className="glass p-3.5 rounded-2xl text-stone-500 dark:text-stone-400 hover:text-primary hover:scale-110 transition-all active:scale-95"
                    >
                      <MenuIcon size={22} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-hidden pt-4 md:pt-36 pb-4 md:pb-10 px-4 md:px-8">
              <div className="max-w-4xl w-full mx-auto h-full glass rounded-[48px] overflow-hidden flex flex-col relative group/container">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/container:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="flex-1 p-6 md:p-10 overflow-hidden relative z-10"
                  >
                    {activeTab === 'chat' && <ChatInterface user={user} />}
                    {activeTab === 'menu' && <FullMenu />}
                    {activeTab === 'orders' && <Orders />}
                    {activeTab === 'promotions' && <Promotions />}
                    {activeTab === 'reviews' && <Reviews />}
                    {activeTab === 'feedback' && <Feedback />}
                    {activeTab === 'admin' && isAdmin && <AdminDashboard />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
