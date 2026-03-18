import React, { useState } from 'react';
import { Search, X, Utensils, Info, Tag } from 'lucide-react';
import { MENU, DEALS_OF_THE_DAY, MEAL_COMBOS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

export default function FullMenu() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(MENU.map(item => item.category)))];

  const filteredMenu = MENU.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-8 h-full overflow-y-auto pr-2 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display text-stone-900 dark:text-white">Our Menu</h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm">Explore the best of Uyo's culinary delights</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-stone-900 dark:text-white"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              activeCategory === cat 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-stone-100 dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
        <AnimatePresence mode="popLayout">
          {filteredMenu.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.02 }}
              className="bg-white dark:bg-stone-900 p-6 rounded-[32px] border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                <div className="bg-primary text-white p-2.5 rounded-2xl shadow-lg shadow-primary/20">
                  <Utensils size={16} />
                </div>
              </div>
              
              <div className="flex items-start justify-between mb-4">
                <span className="text-[10px] bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 px-3 py-1 rounded-full uppercase font-black tracking-widest border border-stone-100 dark:border-stone-700">
                  {item.category}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-stone-900 dark:text-white group-hover:text-primary transition-colors mb-2 leading-tight">
                {item.name}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2 mb-6 font-medium">
                {item.description}
              </p>
              
              <div className="flex items-center justify-between pt-5 border-t border-stone-50 dark:border-stone-800">
                <div className="flex items-center gap-1.5 text-primary">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Available</span>
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-primary transition-colors flex items-center gap-1.5 group/btn">
                  <Info size={14} className="group-hover/btn:rotate-12 transition-transform" /> 
                  Details
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredMenu.length === 0 && (
          <div className="col-span-full text-center py-20">
            <div className="bg-stone-100 dark:bg-stone-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
              <Search size={40} />
            </div>
            <p className="text-stone-400 text-sm italic">No items found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Featured Combos */}
      {activeCategory === 'All' && !searchTerm && (
        <section className="space-y-6 pb-12">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800"></div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">Featured Combos</h3>
            <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MEAL_COMBOS.map((combo) => (
              <div key={combo.id} className="bg-stone-900 dark:bg-black text-white p-6 rounded-3xl border border-stone-800 dark:border-stone-700 shadow-xl relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Utensils size={120} />
                </div>
                <div className="relative z-10">
                  <h4 className="text-lg font-bold text-primary mb-2">{combo.name}</h4>
                  <p className="text-xs text-stone-400 mb-4 leading-relaxed">{combo.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {combo.items.map((item, idx) => (
                      <span key={idx} className="text-[10px] bg-white/10 border border-white/10 text-white px-2 py-1 rounded-lg">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
