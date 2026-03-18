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
          <h2 className="text-2xl font-display text-stone-900">Our Menu</h2>
          <p className="text-stone-500 text-sm">Explore the best of Uyo's culinary delights</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
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
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
        <AnimatePresence mode="popLayout">
          {filteredMenu.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm hover:border-primary/20 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <Utensils size={14} />
                </div>
              </div>
              
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                  {item.category}
                </span>
              </div>
              
              <h3 className="text-base font-bold text-stone-900 group-hover:text-primary transition-colors mb-1">
                {item.name}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 mb-4">
                {item.description}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                <div className="flex items-center gap-1 text-primary">
                  <Tag size={12} />
                  <span className="text-xs font-bold">Available Now</span>
                </div>
                <button className="text-[10px] font-bold text-stone-400 hover:text-primary transition-colors flex items-center gap-1">
                  <Info size={12} /> Details
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredMenu.length === 0 && (
          <div className="col-span-full text-center py-20">
            <div className="bg-stone-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
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
            <div className="h-px flex-1 bg-stone-100"></div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">Featured Combos</h3>
            <div className="h-px flex-1 bg-stone-100"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MEAL_COMBOS.map((combo) => (
              <div key={combo.id} className="bg-stone-900 text-white p-6 rounded-3xl border border-stone-800 shadow-xl relative overflow-hidden group">
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
