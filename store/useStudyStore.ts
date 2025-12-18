
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StudyArea, StudyLog, StudyStatus, Topic } from '../types';
import { dbService } from '../services/dbService';

interface StudyState {
  areas: StudyArea[];
  studyLogs: StudyLog[];
  activeAreaId: string | null;
  isDarkMode: boolean;
  isLoading: boolean;
  
  // Actions
  init: () => Promise<void>;
  toggleDarkMode: () => void;
  setActiveAreaId: (id: string | null) => void;
  addArea: (name: string) => Promise<void>;
  updateArea: (updatedArea: StudyArea) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  logActivity: () => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      areas: [],
      studyLogs: [],
      activeAreaId: null,
      isDarkMode: false,
      isLoading: true,

      init: async () => {
        set({ isLoading: true });
        try {
          const fetchedAreas = await dbService.fetchAreas();
          const fetchedLogs = await dbService.fetchLogs();
          
          // Theme initialization logic
          const savedTheme = localStorage.getItem('edustream_theme');
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
          
          if (isDark) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');

          set({ 
            areas: fetchedAreas.length > 0 ? fetchedAreas : get().areas, 
            studyLogs: fetchedLogs.length > 0 ? fetchedLogs : get().studyLogs,
            isDarkMode: isDark,
            isLoading: false 
          });
        } catch (e) {
          console.error("Error initializing store", e);
          set({ isLoading: false });
        }
      },

      toggleDarkMode: () => {
        const current = get().isDarkMode;
        const next = !current;
        localStorage.setItem('edustream_theme', next ? 'dark' : 'light');
        if (next) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        set({ isDarkMode: next });
      },

      setActiveAreaId: (id) => set({ activeAreaId: id }),

      addArea: async (name) => {
        const icons = ['🧠', '💻', '🌍', '📊', '🔬', '🎨', '📜', '⚖️', '🏔️', '🧬', '🎼', '🚀'];
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];
        const newArea: StudyArea = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          description: 'Gestión maestra de conocimientos.',
          icon: randomIcon,
          topics: [],
          createdAt: new Date().toISOString()
        };

        set((state) => ({ 
          areas: [...state.areas, newArea],
          activeAreaId: newArea.id 
        }));
        
        await dbService.saveArea(newArea);
      },

      updateArea: async (updatedArea) => {
        set((state) => ({
          areas: state.areas.map(a => a.id === updatedArea.id ? updatedArea : a)
        }));
        await dbService.saveArea(updatedArea);
        get().logActivity();
      },

      deleteArea: async (id) => {
        set((state) => ({
          areas: state.areas.filter(a => a.id !== id),
          activeAreaId: state.activeAreaId === id ? null : state.activeAreaId
        }));
        await dbService.deleteArea(id);
      },

      logActivity: () => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => {
          const existing = state.studyLogs.find(l => l.date === today);
          if (existing) {
            return {
              studyLogs: state.studyLogs.map(l => l.date === today ? { ...l, count: l.count + 1 } : l)
            };
          }
          return {
            studyLogs: [...state.studyLogs, { date: today, count: 1 }]
          };
        });
      }
    }),
    {
      name: 'edustream-storage',
      partialize: (state) => ({ areas: state.areas, studyLogs: state.studyLogs }), // Solo persistimos datos, no UI state
    }
  )
);
