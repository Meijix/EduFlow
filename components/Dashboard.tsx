
import React from 'react';
import { StudyArea, StudyStatus, Topic, StudyLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import Heatmap from './Heatmap';

import { useStudyStore } from '../store/useStudyStore';

interface DashboardProps {
  areas: StudyArea[];
  logs: StudyLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ areas, logs }) => {
  const { isDarkMode } = useStudyStore();

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
    { name: 'Pendiente', value: totalTopics - completedTopics, color: isDarkMode ? '#1e293b' : '#f1f5f9' },
  ];

  const totalSeconds = allTopics.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Tu Central de Aprendizaje 🚀</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Analizando tu crecimiento intelectual día a día.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Key Stats and Heatmap */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-3xl text-slate-900 dark:text-white shadow-sm dark:shadow-xl dark:shadow-black/50 border border-slate-200 dark:border-[#30363d] flex flex-col justify-between overflow-hidden relative group min-h-[160px]">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" /></svg>
              </div>
              <div>
                <p className="text-blue-600 dark:text-lime-400 text-[10px] font-black uppercase tracking-widest mb-1">Impacto Global</p>
                <h3 className="text-4xl font-black">{overallProgress}%</h3>
              </div>
              <p className="mt-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wide">Has dominado {completedTopics} de {totalTopics} temas.</p>
            </div>

            <div className="bg-white dark:bg-[#161B22] p-6 rounded-3xl text-slate-900 dark:text-white shadow-sm dark:shadow-xl dark:shadow-black/50 border border-slate-200 dark:border-[#30363d] flex flex-col justify-between overflow-hidden relative group min-h-[160px]">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
              </div>
              <div>
                <p className="text-blue-600 dark:text-lime-400 text-[10px] font-black uppercase tracking-widest mb-1">Tiempo Enfocado</p>
                <h3 className="text-4xl font-black">{totalHours}h {totalMinutes}m</h3>
              </div>
              <p className="mt-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wide">Inversión total en tu futuro.</p>
            </div>

            <div className="bg-white dark:bg-[#161B22] p-6 rounded-3xl text-slate-900 dark:text-white shadow-sm dark:shadow-xl dark:shadow-black/50 border border-slate-200 dark:border-[#30363d] flex flex-col justify-between overflow-hidden relative group min-h-[160px]">
              <div>
                <p className="text-blue-600 dark:text-lime-400 text-[10px] font-black uppercase tracking-widest mb-1">Nivel Cognitivo</p>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white">
                  {(allTopics.reduce((acc, t) => acc + (t.reviewLevel || 0), 0) / (totalTopics || 1)).toFixed(1)}
                </h3>
              </div>
              <p className="mt-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wide">Promedio de retención actual.</p>
            </div>
          </div>

          <Heatmap logs={logs} />

          <div className="bg-white dark:bg-[#161B22] p-8 rounded-3xl border border-slate-200 dark:border-[#30363d] shadow-sm dark:shadow-xl dark:shadow-black/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Eficiencia por Área</h3>
            <div style={{ width: '100%', height: 300, minHeight: 300 }}>
              {stats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#30363d" : "#e2e8f0"} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                    <Tooltip
                      cursor={{ fill: isDarkMode ? '#30363d' : '#f1f5f9' }}
                      contentStyle={{
                        borderRadius: '12px',
                        backgroundColor: isDarkMode ? '#0F1115' : '#ffffff',
                        border: isDarkMode ? '1px solid #30363d' : '1px solid #e2e8f0',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        color: isDarkMode ? '#f1f5f9' : '#0f172a'
                      }}
                    />
                    <Bar dataKey="progreso" radius={[4, 4, 0, 0]} barSize={45}>
                      {stats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={isDarkMode ? (index % 2 === 0 ? '#bef264' : '#84cc16') : (index % 2 === 0 ? '#3b82f6' : '#60a5fa')} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">Sin datos</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Summary and Tasks */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-[#161B22] p-8 rounded-3xl border border-slate-200 dark:border-[#30363d] shadow-sm dark:shadow-xl dark:shadow-black/50 flex flex-col items-center">
            <h4 className="text-sm font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-6 w-full text-left">Distribución</h4>
            <div style={{ width: '100%', height: 200, minHeight: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color === '#10b981' ? (isDarkMode ? '#bef264' : '#3b82f6') : (isDarkMode ? '#30363d' : '#f1f5f9')} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <span className="text-4xl font-black text-slate-900 dark:text-white">{completedTopics}</span>
              <span className="text-slate-400 dark:text-slate-500 font-bold"> / {totalTopics}</span>
              <p className="text-xs text-blue-600 dark:text-lime-400 uppercase font-black tracking-widest mt-1">Temas Listos</p>
            </div>
          </div>

          {reviewDueTopics.length > 0 && (
            <div className="bg-white dark:bg-[#161B22] border border-red-200 dark:border-red-500/30 p-8 rounded-3xl text-slate-900 dark:text-white shadow-sm dark:shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 blur-xl rounded-full"></div>
              <h4 className="font-black text-xl mb-2 text-red-500 dark:text-red-400">¡Repaso Urgente!</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">La curva del olvido está actuando sobre {reviewDueTopics.length} temas.</p>
              <div className="space-y-3 relative z-10">
                {reviewDueTopics.slice(0, 3).map(t => (
                  <div key={t.id} className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-xl backdrop-blur-sm text-xs font-bold truncate text-red-700 dark:text-red-200">
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-[#161B22] p-8 rounded-3xl text-slate-900 dark:text-white border border-slate-200 dark:border-[#30363d] shadow-sm dark:shadow-none">
            <h4 className="text-sm font-black uppercase tracking-widest mb-6 text-slate-500">Logros Desbloqueados</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-blue-100 dark:bg-lime-400/10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform text-blue-600 dark:text-lime-400 border border-blue-200 dark:border-lime-400/20">🎓</div>
                <div>
                  <p className="text-xs font-black">Primeros pasos</p>
                  <p className="text-[10px] text-slate-500">Has creado tu primera área.</p>
                </div>
              </div>
              {overallProgress > 50 && (
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-lime-400/10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform text-blue-600 dark:text-lime-400 border border-blue-200 dark:border-lime-400/20">🔥</div>
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
