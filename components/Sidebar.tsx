
import React from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StudyArea } from '../types';

interface SidebarProps {
  onAddArea: () => void;
}

const SortableAreaItem: React.FC<{ area: StudyArea, isActive: boolean, onClick: () => void }> = ({ area, isActive, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: area.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left pr-10 ${isActive ? 'bg-blue-50 dark:bg-lime-400 text-blue-700 dark:text-black font-extrabold shadow-sm dark:shadow-lg dark:shadow-lime-400/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#0F1115] hover:text-slate-900 dark:hover:text-white'}`}
      >
        <span className="text-xl bg-white dark:bg-[#0F1115] w-10 h-10 flex items-center justify-center rounded-lg shadow-sm border border-slate-200 dark:border-[#30363d]">{area.icon || '📚'}</span>
        <span className="truncate flex-1">{area.name}</span>
      </button>
      <span
        {...attributes}
        {...listeners}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 dark:text-slate-600 cursor-grab hover:text-slate-500 active:cursor-grabbing z-10"
      >
        ⋮⋮
      </span>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ onAddArea }) => {
  const { areas, activeAreaId, setActiveAreaId, isDarkMode, toggleDarkMode, reorderAreas } = useStudyStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = areas.findIndex((a) => a.id === active.id);
      const newIndex = areas.findIndex((a) => a.id === over?.id);
      reorderAreas(oldIndex, newIndex);
    }
  };

  return (
    <aside className="w-72 bg-white dark:bg-[#161B22] border-r border-slate-200 dark:border-[#30363d] h-screen sticky top-0 flex flex-col transition-colors duration-300">
      <div className="p-6 border-b border-slate-200 dark:border-[#30363d] flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-lime-400 flex items-center gap-2 cursor-pointer" onClick={() => setActiveAreaId(null)}>
          <svg className="w-8 h-8 text-blue-600 dark:text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          EduFlow
        </h1>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-slate-100 dark:bg-[#0F1115] text-slate-500 dark:text-slate-400 hover:ring-2 hover:ring-blue-200 dark:hover:ring-lime-400/50 transition-all"
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
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${!activeAreaId ? 'bg-blue-50 dark:bg-lime-400 text-blue-700 dark:text-black font-bold shadow-sm dark:shadow-lg dark:shadow-lime-400/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#0F1115] hover:text-slate-900 dark:hover:text-white'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Panel Principal
        </button>

        <div className="pt-4 pb-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">
          Mis Áreas de Estudio
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={areas.map(a => a.id)}
            strategy={verticalListSortingStrategy}
          >
            {areas.map((area) => (
              <SortableAreaItem
                key={area.id}
                area={area}
                isActive={activeAreaId === area.id}
                onClick={() => setActiveAreaId(area.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-[#30363d]">
        <button
          onClick={onAddArea}
          className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-[#0F1115] dark:hover:bg-black text-white dark:text-lime-400 border border-slate-700 dark:border-lime-400/20 hover:border-slate-500 dark:hover:border-lime-400/50 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
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
