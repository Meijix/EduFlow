
import React from 'react';
import { useStudyStore } from '../store/useStudyStore';

interface SidebarProps {
  onAddArea: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onAddArea }) => {
  const { areas, activeAreaId, setActiveAreaId, isDarkMode, toggleDarkMode } = useStudyStore();

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 flex flex-col transition-colors duration-300">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 cursor-pointer" onClick={() => setActiveAreaId(null)}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          EduStream
        </h1>
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:ring-2 hover:ring-indigo-300 transition-all"
          title="Alternar Modo Oscuro"
        >
          {isDarkMode ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l-.707-.707M6.343 6.364l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        <button
          onClick={() => setActiveAreaId(null)}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${!activeAreaId ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Panel Principal
        </button>

        <div className="pt-4 pb-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">
          Mis Áreas de Estudio
        </div>

        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() => setActiveAreaId(area.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeAreaId === area.id ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold ring-1 ring-indigo-200 dark:ring-indigo-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <span className="text-xl bg-white dark:bg-slate-800 w-10 h-10 flex items-center justify-center rounded-lg shadow-sm">{area.icon || '📚'}</span>
            <span className="truncate flex-1">{area.name}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onAddArea}
          className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Crear Área Maestra
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
