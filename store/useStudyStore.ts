
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StudyArea, StudyLog, StudyStatus, Topic } from '../types';
import { dbService } from '../services/dbService';

interface StudyState {
  areas: StudyArea[];
  studyLogs: StudyLog[];
  activeAreaId: string | null;
  activeTopicId: string | null;  // New
  isDarkMode: boolean;
  isLoading: boolean;

  // Actions
  init: () => Promise<void>;
  toggleDarkMode: () => void;
  setActiveAreaId: (id: string | null) => void;
  setActiveTopicId: (id: string | null) => void; // New
  addArea: (name: string) => Promise<void>;
  updateArea: (updatedArea: StudyArea) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  logActivity: () => void;
  reorderAreas: (oldIndex: number, newIndex: number) => void;
  reorderTopics: (areaId: string, oldIndex: number, newIndex: number) => void;
  getStreak: () => number;
  getRank: () => string;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      areas: [],
      studyLogs: [],
      activeAreaId: null,
      activeTopicId: null, // New
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

      setActiveAreaId: (id) => set({ activeAreaId: id, activeTopicId: null }), // Reset topic on area change
      setActiveTopicId: (id) => set({ activeTopicId: id }), // New

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
      },

      reorderAreas: (oldIndex, newIndex) => {
        set((state) => {
          const newAreas = [...state.areas];
          const [movedArea] = newAreas.splice(oldIndex, 1);
          newAreas.splice(newIndex, 0, movedArea);
          dbService.saveAllAreas(newAreas).catch(console.error); // Fire and forget save
          return { areas: newAreas };
        });
      },

      reorderTopics: (areaId, oldIndex, newIndex) => {
        set((state) => {
          const areaIndex = state.areas.findIndex(a => a.id === areaId);
          if (areaIndex === -1) return {};

          const area = state.areas[areaIndex];
          const newTopics = [...area.topics];
          const [movedTopic] = newTopics.splice(oldIndex, 1);
          newTopics.splice(newIndex, 0, movedTopic);

          const updatedArea = { ...area, topics: newTopics };
          const newAreas = [...state.areas];
          newAreas[areaIndex] = updatedArea;

          dbService.saveArea(updatedArea).catch(console.error);

          return { areas: newAreas };
        });
      },

      getStreak: () => {
        const logs = get().studyLogs;
        if (logs.length === 0) return 0;

        const sortedDates = [...new Set(logs.map(l => l.date))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // If no study today or yesterday, streak is broken (0), unless it's just today missing (start check from yesterday)
        if (!sortedDates.includes(today) && !sortedDates.includes(yesterday)) return 0;

        let streak = 0;
        let currentDate = sortedDates.includes(today) ? new Date(today) : new Date(yesterday);

        // Iterate backwards
        for (let i = 0; i < sortedDates.length; i++) {
          const dateStr = currentDate.toISOString().split('T')[0];
          if (sortedDates.includes(dateStr)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
        return streak;
      },

      getRank: () => {
        const totalSeconds = get().areas.flatMap(a => a.topics).reduce((acc, t) => acc + (t.timeSpent || 0), 0);
        const hours = totalSeconds / 3600;

        if (hours < 5) return "Novato";
        if (hours < 20) return "Aprendiz";
        if (hours < 50) return "Erudito";
        if (hours < 100) return "Maestro";
        return "Gran Maestro";
      }
    }),
    {
      name: 'edustream-storage',
      partialize: (state) => ({ areas: state.areas, studyLogs: state.studyLogs }),
    }
  )
);
