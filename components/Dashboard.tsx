
import React from 'react';
import { StudyArea, StudyStatus, Topic, StudyLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import Heatmap from './Heatmap';

interface DashboardProps {
  areas: StudyArea[];
  logs: StudyLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ areas, logs }) => {
  const isDark = document.documentElement.classList.contains('dark');
  
  const stats = areas.map(area => {
    const total = area.topics.length;
    const completed = area.topics.filter(t => t.status === StudyStatus.COMPLETED).length;
    return {
      name: area.name,
      progreso: total === 0 ? 0 : Math.round((completed / total) * 100),
      total,
      completed
    };
  });

  const allTopics: Topic[] = areas.flatMap(a => a.topics);
  const totalTopics = allTopics.length;
  const completedTopics = allTopics.filter(t => t.status === StudyStatus.COMPLETED).length;
  const reviewDueTopics = allTopics.filter(t => t.nextReviewAt && new Date(t.nextReviewAt) <= new Date());
  
  const overallProgress = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

  const pieData = [
    { name: 'Completado', value: completedTopics, color: '#10b981' },
    { name: 'Pendiente', value: totalTopics - completedTopics, color: isDark ? '#1e293b' : '#f1f5f9' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Tu Central de Aprendizaje 🚀</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Analizando tu crecimiento intelectual día a día.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Key Stats and Heatmap */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-200 dark:shadow-none flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
              </div>
              <div>
                <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-1">Impacto Global</p>
                <h3 className="text-4xl font-black">{overallProgress}%</h3>
              </div>
              <p className="mt-4 text-xs font-medium text-blue-100">Has dominado {completedTopics} de {totalTopics} temas propuestos.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Nivel Cognitivo</p>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white">
                  {(allTopics.reduce((acc, t) => acc + (t.reviewLevel || 0), 0) / (totalTopics || 1)).toFixed(1)}
                </h3>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-500">Promedio de retención según Spaced Repetition.</p>
            </div>
          </div>

          <Heatmap logs={logs} />

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Eficiencia por Área Maestra</h3>
            <div className="h-[300px]">
              {stats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b'}} />
                    <Tooltip 
                      cursor={{fill: isDark ? '#1e293b' : '#f1f5f9'}}
                      contentStyle={{ 
                        borderRadius: '20px', 
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        border: 'none', 
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                        color: isDark ? '#f1f5f9' : '#1e293b'
                      }}
                    />
                    <Bar dataKey="progreso" radius={[8, 8, 0, 0]} barSize={45}>
                      {stats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#fbbf24'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">Sin datos</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Summary and Tasks */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
             <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-6 w-full text-left">Distribución</h4>
             <div className="w-full h-48">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="mt-4 text-center">
                <span className="text-3xl font-black text-slate-800 dark:text-white">{completedTopics}</span>
                <span className="text-slate-400 dark:text-slate-500 font-bold"> / {totalTopics}</span>
                <p className="text-xs text-slate-400 uppercase font-black tracking-widest mt-1">Temas Listos</p>
             </div>
          </div>

          {reviewDueTopics.length > 0 && (
            <div className="bg-amber-500 p-8 rounded-3xl text-white shadow-xl shadow-amber-200 dark:shadow-none animate-pulse">
               <h4 className="font-black text-xl mb-2">¡Repaso Urgente!</h4>
               <p className="text-sm text-amber-50 font-medium mb-6">La curva del olvido está actuando sobre {reviewDueTopics.length} temas.</p>
               <div className="space-y-3">
                 {reviewDueTopics.slice(0, 3).map(t => (
                   <div key={t.id} className="bg-white/20 p-3 rounded-xl backdrop-blur-sm text-xs font-bold truncate">
                     {t.title}
                   </div>
                 ))}
               </div>
            </div>
          )}

          <div className="bg-slate-900 p-8 rounded-3xl text-white">
             <h4 className="text-sm font-black uppercase tracking-widest mb-6 text-slate-500">Logros Desbloqueados</h4>
             <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎓</div>
                  <div>
                    <p className="text-xs font-black">Primeros pasos</p>
                    <p className="text-[10px] text-slate-500">Has creado tu primera área.</p>
                  </div>
                </div>
                {overallProgress > 50 && (
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🔥</div>
                    <div>
                      <p className="text-xs font-black">Mitad de camino</p>
                      <p className="text-[10px] text-slate-500">Más del 50% completado.</p>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
