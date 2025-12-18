
import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
  topicTitle: string;
  onTimeUpdate: (seconds: number) => void;
}

const Timer: React.FC<TimerProps> = ({ topicTitle, onTimeUpdate }) => {
  const [seconds, setSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && seconds > 0) {
      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => prev - 1);
        if (mode === 'work') onTimeUpdate(1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      alert(mode === 'work' ? "¡Sesión terminada! Tómate un respiro." : "¡Descanso terminado! ¿Volvemos?");
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, seconds, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = (newMode: 'work' | 'break') => {
    setIsActive(false);
    setMode(newMode);
    setSeconds(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl border border-slate-700 flex flex-col items-center gap-4 animate-scale-in">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Sesión de: {topicTitle}</div>
      <div className="text-5xl font-mono font-black tabular-nums tracking-tighter">
        {formatTime(seconds)}
      </div>
      <div className="flex gap-2">
        <button 
          onClick={toggleTimer}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
        >
          {isActive ? 'Pausar' : 'Empezar'}
        </button>
        <button 
          onClick={() => resetTimer('work')}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
          title="Modo Pomodoro"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
        <button 
          onClick={() => resetTimer('break')}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
          title="Descanso Corto"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4M12 20V4" /></svg>
        </button>
      </div>
    </div>
  );
};

export default Timer;
