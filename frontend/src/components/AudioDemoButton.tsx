"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AudioDemoButton() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio only on client side with no preloading for PageSpeed
    audioRef.current = new Audio("/demo-voice.mp3");
    audioRef.current.preload = "none";
    audioRef.current.onended = () => setIsPlaying(false);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Audio playback failed:", err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <Button 
      size="lg" 
      variant="outline" 
      onClick={togglePlay}
      className={`h-12 px-8 text-base transition-all duration-300 border-border/40 hover:border-emerald-500/50 ${
        isPlaying 
          ? 'border-emerald-500/60 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20' 
          : 'bg-card/30'
      }`}
    >
      {isPlaying ? (
        <span className="flex items-center gap-2.5">
          <div className="flex items-end gap-[2px] h-3 mb-[2px]">
            <div className="w-[3px] bg-emerald-400 rounded-full animate-[sound-pulse_0.8s_ease-in-out_infinite] [animation-delay:-0.4s]" style={{ height: '60%' }}></div>
            <div className="w-[3px] bg-emerald-400 rounded-full animate-[sound-pulse_0.8s_ease-in-out_infinite] [animation-delay:-0.2s]" style={{ height: '100%' }}></div>
            <div className="w-[3px] bg-emerald-400 rounded-full animate-[sound-pulse_0.8s_ease-in-out_infinite]" style={{ height: '80%' }}></div>
          </div>
          <span className="font-semibold text-emerald-400">Pause Demo</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>Hear how it works</span>
        </span>
      )}
      
      <style jsx>{`
        @keyframes sound-pulse {
          0%, 100% { height: 40%; }
          50% { height: 100%; }
        }
      `}</style>
    </Button>
  );
}
