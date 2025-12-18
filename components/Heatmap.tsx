
import React from 'react';
import { StudyLog } from '../types';

interface HeatmapProps {
  logs: StudyLog[];
}

const Heatmap: React.FC<HeatmapProps> = ({ logs }) => {
  // Generate last 100 days
  const days = Array.from({ length: 105 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (104 - i));
    const dateStr = d.toISOString().split('T')[0];
    const log = logs.find(l => l.date === dateStr);
    return { date: dateStr, count: log ? log.count : 0 };
  });

  const getColor = (count: number) => {
    if (count === 0) return 'bg-[#30363d]';
    if (count < 10) return 'bg-lime-900/50';
    if (count < 30) return 'bg-lime-700';
    if (count < 60) return 'bg-lime-500';
    return 'bg-lime-400 shadow-[0_0_10px_rgba(190,242,100,0.5)]';
  };

  return (
    <div className="bg-[#161B22] p-8 rounded-3xl border border-[#30363d] shadow-xl shadow-black/50">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Consistencia de Estudio</h4>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
          <span>Menos</span>
          <div className="w-2 h-2 rounded-sm bg-[#30363d]"></div>
          <div className="w-2 h-2 rounded-sm bg-lime-900/50"></div>
          <div className="w-2 h-2 rounded-sm bg-lime-500"></div>
          <div className="w-2 h-2 rounded-sm bg-lime-400"></div>
          <span>Más</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {days.map((day, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${getColor(day.count)} transition-all hover:scale-125 hover:z-10 cursor-help`}
            title={`${day.date}: ${day.count} min estudiados`}
          ></div>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 mt-6 text-center font-medium">Visualizando los últimos 105 días de progreso.</p>
    </div>
  );
};

export default Heatmap;
