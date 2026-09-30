import React, { useState, useEffect, useRef } from 'react';
import { SplineScene } from './ui/splite';
import { ArrowRight, Volume2, Sparkles, VolumeX } from 'lucide-react';
import { soundFIFO } from '../services/soundEngine';

interface CoverSplashProps {
  onEnter: () => void;
  autoEnterSeconds?: number;
}

export const CoverSplash: React.FC<CoverSplashProps> = ({
  onEnter,
  autoEnterSeconds = 15,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(autoEnterSeconds);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicePlayedRef = useRef(false);

  const triggerVoiceGreeting = () => {
    soundFIFO.unlockAudio();
    if (!voicePlayedRef.current) {
      voicePlayedRef.current = true;
      setIsSpeaking(true);
      soundFIFO.playWelcomeChime();
      soundFIFO.speak(
        'Good day. Jarvis system online. Welcome to AMA Media Vault. Ask Morpheus Alliance. Upload once, website ready.',
        () => setIsSpeaking(true)
      );
    }
  };

  // Attempt initial audio greeting + global first gesture listener
  useEffect(() => {
    // Attempt playback immediately
    const timeout = setTimeout(triggerVoiceGreeting, 400);

    // Global listener so first click/touch anywhere on screen unlocks browser audio
    const handleFirstGesture = () => {
      triggerVoiceGreeting();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  // 15s Countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      onEnter();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onEnter]);

  const handleManualEnter = () => {
    triggerVoiceGreeting();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    onEnter();
  };

  const progressPercent =
    ((autoEnterSeconds - secondsRemaining) / autoEnterSeconds) * 100;

  return (
    <div
      onClick={handleManualEnter}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-between p-4 sm:p-8 cursor-pointer select-none overflow-hidden"
    >
      {/* Top Subtle Header */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs tracking-widest text-slate-500 uppercase font-mono z-20 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-slate-400 font-bold">AMA MEDIA VAULT</span>
        </div>

        {/* Audio Indicator */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            voicePlayedRef.current = false;
            triggerVoiceGreeting();
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] hover:bg-red-500/20 transition cursor-pointer"
          title="Play Jarvis 27 Voice"
        >
          <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce text-amber-400' : ''}`} />
          <span>Jarvis Voice Active</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Auto-enter</span>
          <span className="text-red-400 font-bold font-mono">{secondsRemaining}s</span>
        </div>
      </div>

      {/* Center: Full 3D Jarvis Module */}
      <div className="w-full flex-1 max-w-4xl relative flex items-center justify-center min-h-[360px] sm:min-h-[480px]">
        <SplineScene
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full min-h-[360px] sm:min-h-[480px] pointer-events-auto"
        />
      </div>

      {/* Bottom Floating Card & Enter Prompt */}
      <div className="w-full max-w-lg z-20 flex flex-col items-center text-center space-y-4 pb-4">
        <div>
          <p className="text-xs sm:text-sm font-bold tracking-[0.3em] text-red-500 uppercase font-mono">
            ASK MORPHEUS ALLIANCE
          </p>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1 font-display">
            AMA MEDIA VAULT
          </h1>
          <p className="text-slate-400 text-xs tracking-widest uppercase mt-1">
            UPLOAD ONCE. WEBSITE READY.
          </p>
        </div>

        {/* Tap to Enter Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleManualEnter();
          }}
          className="group px-8 py-3.5 bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm rounded-2xl shadow-2xl shadow-red-500/40 active:scale-95 transition flex items-center gap-2.5 cursor-pointer"
        >
          <span>TAP TO ENTER</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>

        {/* 15s Progress Bar */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
