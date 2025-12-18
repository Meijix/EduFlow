
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
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
    if (count < 10) return 'bg-indigo-200 dark:bg-indigo-900/40';
    if (count < 30) return 'bg-indigo-400 dark:bg-indigo-700';
    if (count < 60) return 'bg-indigo-600 dark:bg-indigo-500';
    return 'bg-indigo-800 dark:bg-indigo-400';
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Consistencia de Estudio</h4>
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
          <span>Menos</span>
          <div className="w-2 h-2 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
          <div className="w-2 h-2 rounded-sm bg-indigo-200"></div>
          <div className="w-2 h-2 rounded-sm bg-indigo-500"></div>
          <div className="w-2 h-2 rounded-sm bg-indigo-800"></div>
          <span>Más</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {days.map((day, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${getColor(day.count)} transition-all hover:ring-2 hover:ring-indigo-300 cursor-help`}
            title={`${day.date}: ${day.count} min estudiados`}
          ></div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 mt-4 text-center font-medium">Visualizando los últimos 15 fines de semana de progreso.</p>
    </div>
  );
};

export default Heatmap;
