
import React, { useState, useEffect } from 'react';
import { StudyArea, StudyStatus, Topic, Resource, ResourceType, QuizQuestion } from '../types';
import { generateStudyPlan, getAITutorExplanation, generateQuiz } from '../services/geminiService';
import Timer from './Timer';
import KanbanBoard from './KanbanBoard';
import QuizModule from './QuizModule';
import SkillTree from './SkillTree';
import { useStudyStore } from '../store/useStudyStore';
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AreaViewProps {
  area: StudyArea;
  onUpdateArea: (updatedArea: StudyArea) => void;
  onDeleteArea: (id: string) => void;
}

const SortableTopicItem = ({ topic, selectedTopicId, onSelect, isReviewDue }: { topic: Topic, selectedTopicId: string | null, onSelect: (id: string) => void, isReviewDue: (t: Topic) => boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: topic.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div
        onClick={() => onSelect(topic.id)}
        className={`p-4 rounded-2xl border transition-all cursor-pointer relative mb-3 ${selectedTopicId === topic.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/30' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300'}`}
      >
        {isReviewDue(topic) && (
          <div className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </div>
        )}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-4">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-2">
              <span className="text-slate-300 cursor-grab">⋮⋮</span>
              {topic.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${topic.reviewLevel > 3 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>Nivel {topic.reviewLevel}</span>
              <span className="text-[9px] font-bold text-slate-400">{Math.floor(topic.timeSpent / 60)}m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const AreaView: React.FC<AreaViewProps> = ({ area, onUpdateArea, onDeleteArea }) => {
  const { reorderTopics } = useStudyStore();
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicData, setNewTopicData] = useState({ title: '', description: '' });
  const [viewMode, setViewMode] = useState<'kanban' | 'detail' | 'tree'>('kanban');
  const [showTimer, setShowTimer] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = area.topics.findIndex((t) => t.id === active.id);
      const newIndex = area.topics.findIndex((t) => t.id === over?.id);
      reorderTopics(area.id, oldIndex, newIndex);
    }
  };

  // Local state for topic editing
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editTopicDesc, setEditTopicDesc] = useState('');
  const [editTopicNotes, setEditTopicNotes] = useState('');
  const [topicResources, setTopicResources] = useState<Resource[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const selectedTopic = area.topics.find(t => t.id === selectedTopicId) || null;

  useEffect(() => {
    if (selectedTopic) {
      setEditTopicTitle(selectedTopic.title);
      setEditTopicDesc(selectedTopic.description);
      setEditTopicNotes(selectedTopic.notes);
      setTopicResources(selectedTopic.resources || []);
      setHasUnsavedChanges(false);
    }
  }, [selectedTopicId]);

  const handleSaveTopic = () => {
    if (!selectedTopicId) return;
    const updatedTopics = area.topics.map(t =>
      t.id === selectedTopicId ? { ...t, title: editTopicTitle, description: editTopicDesc, notes: editTopicNotes, resources: topicResources } : t
    );
    onUpdateArea({ ...area, topics: updatedTopics });
    setHasUnsavedChanges(false);
  };

  const updateTimeSpent = (seconds: number) => {
    if (!selectedTopicId) return;
    const updatedTopics = area.topics.map(t =>
      t.id === selectedTopicId ? { ...t, timeSpent: (t.timeSpent || 0) + seconds } : t
    );
    onUpdateArea({ ...area, topics: updatedTopics });
  };

  const moveTopic = (topicId: string, newStatus: StudyStatus) => {
    const updatedTopics = area.topics.map(t =>
      t.id === topicId ? { ...t, status: newStatus } : t
    );
    onUpdateArea({ ...area, topics: updatedTopics });
  };

  const handleCompleteReview = (topicId: string, success: boolean) => {
    const updatedTopics = area.topics.map(t => {
      if (t.id === topicId) {
        const nextLevel = success ? Math.min(t.reviewLevel + 1, 6) : Math.max(t.reviewLevel - 1, 0);
        const intervals = [1, 3, 7, 14, 30, 60, 120]; // Days
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + intervals[nextLevel]);
        return {
          ...t,
          reviewLevel: nextLevel,
          nextReviewAt: nextReview.toISOString(),
          lastStudied: new Date().toISOString()
        };
      }
      return t;
    });
    onUpdateArea({ ...area, topics: updatedTopics });
    alert(success ? "¡Buen trabajo! Nivel de repaso actualizado." : "Repasaremos este tema pronto para reforzarlo.");
  };

  const startQuiz = async () => {
    if (!selectedTopic) return;
    setLoadingQuiz(true);
    try {
      const questions = await generateQuiz(selectedTopic.title, selectedTopic.notes);
      setQuizQuestions(questions);
      setIsQuizMode(true);
    } catch (err) {
      alert("Error al generar el cuestionario.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleGeneratePlan = async () => {
    setLoadingPlan(true);
    try {
      const plan = await generateStudyPlan(area.name);
      const newTopics: Topic[] = plan.recommendedTopics.map(t => ({
        id: Math.random().toString(36).substr(2, 9),
        title: t.title,
        description: t.description,
        status: StudyStatus.PENDING,
        notes: '',
        resources: [],
        timeSpent: 0,
        reviewLevel: 0
      }));
      onUpdateArea({ ...area, topics: [...area.topics, ...newTopics] });
    } catch (err) {
      console.error(err);
      alert("Error generando el plan con IA.");
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleAddManualTopic = () => {
    if (!newTopicData.title.trim()) return;
    const newTopic: Topic = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTopicData.title,
      description: newTopicData.description,
      status: StudyStatus.PENDING,
      notes: '',
      resources: [],
      timeSpent: 0,
      reviewLevel: 0
    };
    onUpdateArea({ ...area, topics: [...area.topics, newTopic] });
    setNewTopicData({ title: '', description: '' });
    setIsAddingTopic(false);
    setSelectedTopicId(newTopic.id);
    setViewMode('detail');
  };

  const handleAskAI = async (topicTitle: string) => {
    const q = prompt(`¿Qué quieres preguntarle a la IA sobre "${topicTitle}"?`);
    if (!q) return;
    setLoadingAI(true);
    try {
      const res = await getAITutorExplanation(topicTitle, q);
      setAiResponse(res || "No se obtuvo respuesta.");
    } catch (err) {
      alert("Error al contactar al tutor AI.");
    } finally {
      setLoadingAI(false);
    }
  };

  const addResource = (topicId: string) => {
    const title = prompt("Título del material:");
    const url = prompt("URL:");
    const description = prompt("Breve descripción (opcional):") || "";
    if (!title || !url) return;

    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
    let type: ResourceType = isYoutube ? 'video' : 'link';

    if (!isYoutube) {
      const typeInput = prompt("Tipo (link, book, pdf, other):", "link") as ResourceType;
      type = ['link', 'book', 'pdf', 'other'].includes(typeInput) ? typeInput : 'link';
    }

    const newResource: Resource = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      url,
      description,
      type,
      watched: false,
      videoNotes: ''
    };
    setTopicResources(prev => [...prev, newResource]);
    setHasUnsavedChanges(true);
  };

  const updateResource = (resId: string, updates: Partial<Resource>) => {
    setTopicResources(prev => prev.map(r => r.id === resId ? { ...r, ...updates } : r));
    setHasUnsavedChanges(true);
  };

  const removeResource = (resourceId: string) => {
    setTopicResources(prev => prev.filter(r => r.id !== resourceId));
    setHasUnsavedChanges(true);
  };

  const moveResource = (index: number, direction: 'up' | 'down') => {
    const newResources = [...topicResources];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newResources.length) return;

    [newResources[index], newResources[targetIndex]] = [newResources[targetIndex], newResources[index]];
    setTopicResources(newResources);
    setHasUnsavedChanges(true);
  };

  const isReviewDue = (topic: Topic) => {
    if (!topic.nextReviewAt) return false;
    return new Date(topic.nextReviewAt) <= new Date();
  };

  const videoResources = topicResources.filter(r => r.type === 'video');
  const otherResources = topicResources.filter(r => r.type !== 'video');

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'video': return '📺';
      case 'pdf': return '📄';
      case 'book': return '📖';
      case 'link': return '🔗';
      default: return '📁';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">{area.icon}</span>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white">{area.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                onClick={() => setViewMode('kanban')}
                className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full transition-all tracking-widest ${viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
              >Tablero</button>
              <button
                onClick={() => setViewMode('detail')}
                className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full transition-all tracking-widest ${viewMode === 'detail' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
              >Feynman & Detalle</button>
              <button
                onClick={() => setViewMode('tree')}
                className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full transition-all tracking-widest ${viewMode === 'tree' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
              >Árbol de Habilidades</button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleGeneratePlan} disabled={loadingPlan} className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all text-sm">
            {loadingPlan ? '...' : 'Sugerencias IA'}
          </button>
          <button onClick={() => setIsAddingTopic(true)} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm">
            Nuevo Tema
          </button>
        </div>
      </header>

      {viewMode === 'kanban' && (
        <KanbanBoard
          topics={area.topics}
          onMoveTopic={moveTopic}
          onSelectTopic={(id) => { setSelectedTopicId(id); setViewMode('detail'); }}
        />
      )}

      {viewMode === 'tree' && (
        <SkillTree
          topics={area.topics}
          onSelectTopic={(id) => { setSelectedTopicId(id); setViewMode('detail'); }}
        />
      )}

      {viewMode === 'detail' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={area.topics.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {area.topics.map(topic => (
                  <SortableTopicItem
                    key={topic.id}
                    topic={topic}
                    selectedTopicId={selectedTopicId}
                    onSelect={setSelectedTopicId}
                    isReviewDue={isReviewDue}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <div className="lg:col-span-2">
            {selectedTopic ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 min-h-[700px] flex flex-col relative animate-fade-in">

                <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-6 mb-8 gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={editTopicTitle}
                        onChange={(e) => { setEditTopicTitle(e.target.value); setHasUnsavedChanges(true); }}
                        className="text-3xl font-black text-slate-800 dark:text-white bg-transparent border-none focus:ring-0 p-0 w-full"
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {Math.floor(selectedTopic.timeSpent / 3600)}h {Math.floor((selectedTopic.timeSpent % 3600) / 60)}m
                      </span>
                      <button onClick={() => setShowTimer(!showTimer)} className="text-blue-500 hover:text-blue-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        {showTimer ? 'Cerrar Pomodoro' : 'Timer Pomodoro'}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={startQuiz}
                      disabled={loadingQuiz}
                      className="px-4 py-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-2 font-bold transition-all hover:scale-105 text-sm"
                    >
                      {loadingQuiz ? '...' : 'Quiz'}
                    </button>
                    <button onClick={handleSaveTopic} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${hasUnsavedChanges ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>Guardar Todo</button>
                  </div>
                </div>

                {showTimer && (
                  <div className="mb-8">
                    <Timer topicTitle={editTopicTitle} onTimeUpdate={updateTimeSpent} />
                  </div>
                )}

                <div className="flex-1 space-y-8">
                  {/* Spaced Repetition Bar */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h5 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">Estatus de Retención</h5>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className={`h-2 w-4 rounded-full ${i < (selectedTopic.reviewLevel || 0) ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-400">Nivel {selectedTopic.reviewLevel}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleCompleteReview(selectedTopic.id, true)}
                        className="flex-1 md:flex-none px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                      >
                        Repaso Exitoso
                      </button>
                      <button
                        onClick={() => handleCompleteReview(selectedTopic.id, false)}
                        className="flex-1 md:flex-none px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 transition-all"
                      >
                        Olvidé algo
                      </button>
                    </div>
                  </div>

                  {/* Feynman Notes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                        Bitácora Feynman
                      </label>
                      <button onClick={() => handleAskAI(editTopicTitle)} disabled={loadingAI} className="text-[10px] font-black uppercase text-blue-500 hover:underline">Consultar Tutor IA</button>
                    </div>
                    <textarea
                      className="w-full h-64 p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 text-lg leading-relaxed transition-all placeholder:text-slate-300"
                      placeholder="Explica el concepto como si se lo enseñaras a un niño..."
                      value={editTopicNotes}
                      onChange={(e) => { setEditTopicNotes(e.target.value); setHasUnsavedChanges(true); }}
                    />
                  </div>

                  {/* Enhanced Resources Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>
                        Biblioteca de Recursos
                      </label>
                      <button onClick={() => addResource(selectedTopic.id)} className="text-xs bg-blue-600 text-white px-4 py-2 rounded-full font-bold transition-all shadow-md hover:bg-blue-700">Añadir Recurso</button>
                    </div>

                    <div className="space-y-4">
                      {topicResources.length > 0 ? topicResources.map((res, index) => (
                        <div key={res.id} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all hover:border-blue-300 relative group">
                          <div className="flex flex-col md:flex-row gap-5">
                            {/* Reordering and Category Icon */}
                            <div className="flex flex-row md:flex-col items-center justify-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-4">
                              <button
                                onClick={() => moveResource(index, 'up')}
                                disabled={index === 0}
                                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-20 text-slate-400"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg>
                              </button>
                              <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-xl shadow-sm">
                                {getResourceIcon(res.type)}
                              </div>
                              <button
                                onClick={() => moveResource(index, 'down')}
                                disabled={index === topicResources.length - 1}
                                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-20 text-slate-400"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                              </button>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                {res.type === 'video' && (
                                  <button
                                    onClick={() => updateResource(res.id, { watched: !res.watched })}
                                    className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${res.watched ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent'}`}
                                  >
                                    {res.watched && '✓'}
                                  </button>
                                )}
                                <div className="flex-1 truncate">
                                  <a href={res.url} target="_blank" rel="noreferrer" className={`font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 block truncate ${res.watched ? 'line-through opacity-50' : ''}`}>
                                    {res.title}
                                  </a>
                                  <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">{res.type}</span>
                                </div>
                              </div>

                              {res.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-3 px-1">{res.description}</p>
                              )}

                              {res.type === 'video' && (
                                <textarea
                                  placeholder="Notas del video..."
                                  className="w-full bg-white dark:bg-slate-900/50 p-3 rounded-2xl border-none focus:ring-1 focus:ring-rose-500 text-xs h-20 resize-none dark:text-slate-300"
                                  value={res.videoNotes || ''}
                                  onChange={(e) => updateResource(res.id, { videoNotes: e.target.value })}
                                />
                              )}
                            </div>

                            <div className="flex md:flex-col gap-2 justify-center pl-4 border-l border-slate-200 dark:border-slate-700">
                              <button
                                onClick={() => removeResource(res.id)}
                                className="p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                          <p className="text-sm text-slate-400">Sin recursos organizados aún. Agrega videos, libros o enlaces para centralizar tu conocimiento.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {aiResponse && (
                  <div className="mt-10 p-8 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/50 relative animate-fade-in shadow-inner">
                    <button onClick={() => setAiResponse(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
                    <h4 className="text-blue-600 dark:text-blue-300 font-black mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">Tutoría IA</h4>
                    <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-base leading-relaxed prose prose-blue dark:prose-invert">{aiResponse}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 h-full min-h-[700px] flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                <svg className="w-20 h-20 opacity-20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <h4 className="text-xl font-black mb-2 text-slate-700 dark:text-slate-300">Domina tu camino</h4>
                <p className="text-sm max-w-xs text-slate-500">Selecciona un subtema para gestionar sus recursos, realizar repasos y profundizar.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quiz Overlay */}
      {isQuizMode && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <QuizModule
            questions={quizQuestions}
            onCancel={() => setIsQuizMode(false)}
            onComplete={(score) => {
              setIsQuizMode(false);
              if (score > quizQuestions.length * 0.7) {
                handleCompleteReview(selectedTopicId!, true);
              } else {
                handleCompleteReview(selectedTopicId!, false);
              }
            }}
          />
        </div>
      )}

      {/* New Topic Modal */}
      {isAddingTopic && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full animate-scale-in border border-slate-100 dark:border-slate-800 shadow-2xl">
            <h3 className="text-2xl font-black mb-6 text-slate-800 dark:text-white">Nuevo Subtema</h3>
            <div className="space-y-4">
              <input
                type="text" autoFocus placeholder="Título"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white"
                value={newTopicData.title} onChange={e => setNewTopicData({ ...newTopicData, title: e.target.value })}
              />
              <textarea
                placeholder="Resumen rápido..." className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 h-24 dark:text-white"
                value={newTopicData.description} onChange={e => setNewTopicData({ ...newTopicData, description: e.target.value })}
              />
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsAddingTopic(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold dark:text-slate-400">Cancelar</button>
                <button onClick={handleAddManualTopic} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaView;
