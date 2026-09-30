import React from 'react';
import { SplineScene } from './ui/splite';
import { Spotlight } from './ui/spotlight';
import { motion } from 'framer-motion';
import {
  Flame,
  ArrowRight,
  UploadCloud,
  LayoutDashboard,
  Zap,
  Sparkles,
  HardDrive,
  Volume2,
} from 'lucide-react';
import { ClientProfile } from '../types/vault';
import { soundFIFO } from '../services/soundEngine';

interface SplashHeroProps {
  onEnterClient: (client?: ClientProfile) => void;
  onEnterAdmin: () => void;
  clients: ClientProfile[];
  selectedClient: ClientProfile;
}

export const SplashHero: React.FC<SplashHeroProps> = ({
  onEnterClient,
  onEnterAdmin,
  clients,
  selectedClient,
}) => {
  const handleVoiceWelcome = () => {
    soundFIFO.playWelcomeChime();
    soundFIFO.speak('Welcome to AMA Media Vault. Upload once, website ready.');
  };

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-3 sm:px-4 py-4 sm:py-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[350px] sm:h-[500px] bg-red-600/[0.07] rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-blue-600/[0.05] rounded-full blur-[90px]" />
      </div>

      {/* Main Glass Card with 3D Jarvis Module */}
      <div className="w-full max-w-5xl relative overflow-hidden flex flex-col lg:flex-row rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#11141c]/95 via-[#0d1017]/95 to-[#090b0e]/95 backdrop-blur-2xl shadow-2xl shadow-black/80">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="rgba(230, 57, 70, 0.35)"
        />

        {/* 3D Spline Module for Mobile - Clean, unobstructed */}
        <div className="lg:hidden w-full h-[280px] sm:h-[320px] relative bg-[#090b0e]/40 border-b border-white/10 overflow-hidden touch-pan-y">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>

        {/* Text & Action Controls - Centered and Borderless Header */}
        <div className="flex-1 p-6 sm:p-10 lg:p-12 relative z-10 flex flex-col justify-center items-center text-center">
          
          {/* Centered Brand Title (No pill, No border) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-2 text-red-400 text-xs sm:text-sm font-bold uppercase tracking-[0.25em] mb-3"
          >
            <Flame className="w-4 h-4 text-red-500 fill-red-500" />
            <span>ASK MORPHEUS ALLIANCE</span>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-1 sm:space-y-2 text-center"
          >
            <p className="text-[10px] sm:text-xs font-bold tracking-[0.25em] text-slate-400 uppercase font-mono">
              WELCOME TO
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display leading-[1.1]">
              AMA MEDIA{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-amber-300">
                VAULT
              </span>
            </h1>
          </motion.div>

          {/* Tagline & Description - Clean & Centered */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-4 sm:mt-5 space-y-2.5 max-w-lg mx-auto"
          >
            <div className="inline-block font-mono text-[11px] sm:text-xs font-bold text-red-400 tracking-widest uppercase">
              UPLOAD ONCE. WEBSITE READY.
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-light">
              The private bulk-media ingestion portal. Drop high-resolution photography. The system converts to JPG, resizes, compresses, cleans filenames, and stores into Google Drive.
            </p>
          </motion.div>

          {/* Feature Badges */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 font-mono"
          >
            <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              <Zap className="w-3 h-3 text-amber-400" /> Auto JPG 82%
            </span>
            <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              <Sparkles className="w-3 h-3 text-emerald-400" /> 1920px Max Edge
            </span>
            <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              <HardDrive className="w-3 h-3 text-blue-400" /> Google Drive
            </span>
            <button
              onClick={handleVoiceWelcome}
              className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2.5 py-1 rounded-lg border border-red-500/20 transition cursor-pointer"
              title="Voice Greeting FIFO"
            >
              <Volume2 className="w-3 h-3" /> Voice
            </button>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-md mx-auto"
          >
            <button
              onClick={() => onEnterClient(selectedClient)}
              className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-600 rounded-xl sm:rounded-2xl shadow-lg shadow-red-500/25 active:scale-95 transition cursor-pointer flex-1"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Enter Portal ({selectedClient.name})</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={onEnterAdmin}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl sm:rounded-2xl transition cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin Vault</span>
            </button>
          </motion.div>
        </div>

        {/* Right 3D Spline Scene for Desktop - Clean, unobstructed */}
        <div className="hidden lg:block flex-1 relative min-h-[480px] bg-[#090b0e]/50 border-l border-white/10 overflow-hidden">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};
