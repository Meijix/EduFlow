
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AreaView from './components/AreaView';
import { useStudyStore } from './store/useStudyStore';

const App: React.FC = () => {
  const { isLoading, init, activeAreaId, areas, studyLogs, updateArea, deleteArea, addArea } = useStudyStore();
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');

  useEffect(() => {
    init();
  }, [init]);

  const handleAddArea = async () => {
    if (!newAreaName.trim()) return;
    await addArea(newAreaName);
    setNewAreaName('');
    setIsAddingArea(false);
  };

  const activeArea = areas.find(a => a.id === activeAreaId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Cargando tu base de conocimientos...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 selection:bg-blue-200 dark:selection:bg-blue-900/50">
      <Sidebar onAddArea={() => setIsAddingArea(true)} />
      
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          {!activeAreaId ? (
            <Dashboard areas={areas} logs={studyLogs} />
          ) : activeArea ? (
            <AreaView 
              area={activeArea} 
              onUpdateArea={updateArea} 
              onDeleteArea={deleteArea} 
            />
          ) : null}
        </div>
      </main>

      {isAddingArea && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-3xl">🧩</div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Nueva Área Maestra</h3>
            <input 
              type="text" autoFocus className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 mb-8 text-lg font-bold dark:text-white"
              placeholder="Ej: Física Cuántica, UX Design..."
              value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddArea()}
            />
            <div className="flex gap-4">
              <button onClick={() => setIsAddingArea(false)} className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold transition-colors">Cancelar</button>
              <button onClick={handleAddArea} className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-200 dark:shadow-none">Crear Área</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
