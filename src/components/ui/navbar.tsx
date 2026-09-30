import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl transition-all duration-500 ${scrolled ? 'top-2 md:top-4' : ''}`}
    >
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/50">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 pl-2 md:pl-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-neutral-500 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-black" />
          </div>
          <span className="text-white font-bold tracking-wide text-lg">
            Brand
          </span>
        </div>

        {/* Right: Links + CTA */}
        <div className="flex items-center gap-2 md:gap-8">
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            {['Home', 'Features', 'About', 'Contact'].map((item) => (
              <a key={item} href="#" className="relative hover:text-white transition-colors group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-full rounded-full" />
              </a>
            ))}
          </div>
          <button className="hidden md:inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            Get Started
          </button>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-neutral-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-0 w-full mt-2 p-4 rounded-3xl bg-black/80 border border-white/10 backdrop-blur-2xl flex flex-col gap-2 shadow-2xl overflow-hidden"
          >
            {['Home', 'Features', 'About', 'Contact'].map((item, i) => (
              <motion.a 
                key={item}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                href="#" 
                className="text-neutral-300 hover:text-white text-base font-medium transition-colors px-6 py-4 rounded-xl hover:bg-white/10"
              >
                {item}
              </motion.a>
            ))}
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-2 mx-2 px-6 py-4 rounded-xl bg-white text-black text-base font-semibold hover:bg-neutral-200 transition-colors"
            >
              Get Started
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
