import React, { useState, useEffect } from 'react';
import { StudyArea, StudyStatus, Topic, Resource, ResourceType, QuizQuestion } from '../types';
import { generateStudyPlan, getAITutorExplanation, generateQuiz, generateFlashcards } from '../services/geminiService';
import Timer from './Timer';
import KanbanBoard from './KanbanBoard';
import QuizModule from './QuizModule';
import SkillTree from './SkillTree';
import FlashcardDeck from './FlashcardDeck';
import ResourceModal from './ResourceModal';
import { useStudyStore } from '../store/useStudyStore';
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AreaViewProps {
  area: StudyArea;
  onUpdateArea: (updatedArea: StudyArea) => void;
  onDeleteArea: (id: string) => void;
}

const SortableTopicItem = ({ topic, selectedTopicId, onSelect, isReviewDue }: { topic: Topic, selectedTopicId: string | null, onSelect: (id: string) => void, isReviewDue: (t: Topic) => boolean } & React.HTMLAttributes<HTMLDivElement>) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: topic.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        onClick={() => onSelect(topic.id)}
        className={`p-4 rounded-xl border transition-all cursor-pointer relative mb-3 ${selectedTopicId === topic.id ? 'border-lime-400/50 bg-lime-400/10' : 'border-[#30363d] bg-[#161B22] hover:border-lime-400/30'}`}
      >
        {isReviewDue(topic) && (
          <div className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-500"></span>
          </div>
        )}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-4">
            <h4 className={`font-bold truncate flex items-center gap-2 ${selectedTopicId === topic.id ? 'text-lime-400' : 'text-slate-200'}`}>
              <span
                {...attributes}
                {...listeners}
                className="text-slate-500 cursor-grab hover:text-slate-300 active:cursor-grabbing p-1"
              >
                ⋮⋮
              </span>
              {topic.title}
            </h4>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${topic.reviewLevel > 3 ? 'bg-lime-400/20 text-lime-400' : 'bg-[#0F1115] text-slate-500'}`}>Nivel {topic.reviewLevel}</span>
              <span className="text-[9px] font-bold text-slate-500">{Math.floor(topic.timeSpent / 60)}m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



const AreaView: React.FC<AreaViewProps> = ({ area, onUpdateArea, onDeleteArea }) => {
  const { reorderTopics, activeTopicId, setActiveTopicId } = useStudyStore();
  const [loadingPlan, setLoadingPlan] = useState(false);
  // Remove local selectedTopicId state
  // const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newTopicData, setNewTopicData] = useState({ title: '', description: '' });
  const [viewMode, setViewMode] = useState<'kanban' | 'detail' | 'tree'>('kanban');
  // Remove local showTimer
  // const [showTimer, setShowTimer] = useState(false);
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

  const selectedTopic = area.topics.find(t => t.id === activeTopicId) || null;

  useEffect(() => {
    if (selectedTopic) {
      setEditTopicTitle(selectedTopic.title);
      setEditTopicDesc(selectedTopic.description);
      setEditTopicNotes(selectedTopic.notes);
      setTopicResources(selectedTopic.resources || []);
      setHasUnsavedChanges(false);
    }
  }, [activeTopicId]);

  const handleSaveTopic = () => {
    if (!activeTopicId) return;
    const updatedTopics = area.topics.map(t =>
      t.id === activeTopicId ? { ...t, title: editTopicTitle, description: editTopicDesc, notes: editTopicNotes, resources: topicResources } : t
    );
    onUpdateArea({ ...area, topics: updatedTopics });
    setHasUnsavedChanges(false);
  };

  const updateTimeSpent = (seconds: number) => {
    if (!activeTopicId) return;
    const updatedTopics = area.topics.map(t =>
      t.id === activeTopicId ? { ...t, timeSpent: (t.timeSpent || 0) + seconds } : t
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

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);

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

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const text = selectedTopic?.notes || selectedTopic?.description || '';
      if (!text) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onend = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedTopic) return;
    setLoadingFlashcards(true);
    try {
      const cardsData = await generateFlashcards(selectedTopic.title, selectedTopic.notes || selectedTopic.description);
      const newFlashcards = cardsData.map(c => ({
        id: Math.random().toString(36).substr(2, 9),
        ...c
      }));

      const updatedTopics = area.topics.map(t =>
        t.id === selectedTopic.id ? { ...t, flashcards: newFlashcards } : t
      );
      onUpdateArea({ ...area, topics: updatedTopics });
    } catch (err) {
      alert("Error generando flashcards.");
      console.error(err);
    } finally {
      setLoadingFlashcards(false);
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
    setActiveTopicId(newTopic.id);
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
    // Should select topic first if not already (although button is usually in context)
    if (activeTopicId !== topicId) setActiveTopicId(topicId);
    setShowResourceModal(true);
  };

  const handleSaveResource = (resourceData: { title: string; url: string; description: string; type: ResourceType }) => {
    const newResource: Resource = {
      id: Math.random().toString(36).substr(2, 9),
      title: resourceData.title,
      url: resourceData.url,
      description: resourceData.description,
      type: resourceData.type,
      watched: false,
      videoNotes: ''
    };
    setTopicResources(prev => [...prev, newResource]);
    setHasUnsavedChanges(true);
    setShowResourceModal(false);
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
            <span className="text-5xl bg-[#161B22] p-3 rounded-2xl shadow-sm border border-[#30363d]">{area.icon}</span>
            <div>
              <input
                type="text"
                value={area.name}
                onChange={(e) => onUpdateArea({ ...area, name: e.target.value })}
                className="text-3xl font-black text-white bg-transparent border-none focus:ring-0 p-0 w-full"
              />
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full transition-all tracking-widest ${viewMode === 'kanban' ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'bg-[#161B22] text-slate-500 hover:bg-[#30363d]'}`}
                >Tablero</button>
                <button
                  onClick={() => setViewMode('detail')}
                  className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full transition-all tracking-widest ${viewMode === 'detail' ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'bg-[#161B22] text-slate-500 hover:bg-[#30363d]'}`}
                >Feynman & Detalle</button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full transition-all tracking-widest ${viewMode === 'tree' ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'bg-[#161B22] text-slate-500 hover:bg-[#30363d]'}`}
                >Árbol de Habilidades</button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleGeneratePlan} disabled={loadingPlan} className="bg-[#161B22] border border-lime-400/30 text-lime-400 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-lime-400/10 hover:border-lime-400 transition-all text-sm">
              {loadingPlan ? '...' : 'Sugerencias IA'}
            </button>
            <button onClick={() => setIsAddingTopic(true)} className="bg-lime-400 text-black px-5 py-2.5 rounded-xl font-bold hover:bg-lime-300 transition-all text-sm shadow-lg shadow-lime-400/20">
              Nuevo Tema
            </button>
          </div>
        </header>

        {viewMode === 'kanban' && (
          <KanbanBoard
            topics={area.topics}
            onMoveTopic={moveTopic}
            onSelectTopic={(id) => { setActiveTopicId(id); setViewMode('detail'); }}
          />
        )}

        {viewMode === 'tree' && (
          <SkillTree
            topics={area.topics}
            onSelectTopic={(id) => { setActiveTopicId(id); setViewMode('detail'); }}
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
                      selectedTopicId={activeTopicId}
                      onSelect={setActiveTopicId}
                      isReviewDue={isReviewDue}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>

            <div className="lg:col-span-2">
              {selectedTopic ? (
                <div className="bg-[#161B22] p-8 rounded-3xl shadow-sm border border-[#30363d] min-h-[700px] flex flex-col relative animate-fade-in">

                  <div className="flex flex-col md:flex-row justify-between items-start border-b border-[#30363d] pb-6 mb-8 gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="text"
                          value={editTopicTitle}
                          onChange={(e) => { setEditTopicTitle(e.target.value); setHasUnsavedChanges(true); }}
                          className="text-3xl font-black text-slate-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 w-full placeholder-slate-400"
                          placeholder="Título del Tema"
                        />
                        <textarea
                          value={editTopicDesc}
                          onChange={(e) => { setEditTopicDesc(e.target.value); setHasUnsavedChanges(true); }}
                          className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-transparent border-none focus:ring-0 p-0 w-full resize-none h-auto placeholder-slate-400/50"
                          placeholder="Añade una descripción breve..."
                          rows={1}
                        />
                      </div>
                      {hasUnsavedChanges && (
                        <div className="mt-2 flex justify-start">
                          <button
                            onClick={handleSaveTopic}
                            className="text-xs bg-lime-400 text-black px-3 py-1.5 rounded-lg font-bold shadow-lg shadow-lime-400/20 animate-fade-in hover:scale-105 transition-transform"
                          >
                            Guardar Cambios
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {Math.floor(selectedTopic.timeSpent / 3600)}h {Math.floor((selectedTopic.timeSpent % 3600) / 60)}m
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={startQuiz}
                        disabled={loadingQuiz}
                        className="px-4 py-2.5 bg-lime-400/10 text-lime-400 rounded-xl border border-lime-400/20 flex items-center gap-2 font-bold transition-all hover:bg-lime-400/20 text-sm"
                      >
                        {loadingQuiz ? '...' : 'Quiz'}
                      </button>
                      <button onClick={handleSaveTopic} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${hasUnsavedChanges ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20 scale-105' : 'bg-[#0F1115] text-slate-500'}`}>Guardar Todo</button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-8">
                    {/* Spaced Repetition Bar */}
                    <div className="bg-[#0F1115] p-6 rounded-3xl border border-[#30363d] flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                        <h5 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1">Estatus de Retención</h5>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[...Array(6)].map((_, i) => (
                              <div key={i} className={`h-2 w-4 rounded-full ${i < (selectedTopic.reviewLevel || 0) ? 'bg-lime-400' : 'bg-[#30363d]'}`}></div>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-500">Nivel {selectedTopic.reviewLevel}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          onClick={() => handleCompleteReview(selectedTopic.id, true)}
                          className="flex-1 md:flex-none px-4 py-2 bg-lime-400 text-black rounded-xl text-xs font-bold hover:bg-lime-300 transition-all shadow-lg shadow-lime-400/10"
                        >
                          Repaso Exitoso
                        </button>
                        <button
                          onClick={() => handleCompleteReview(selectedTopic.id, false)}
                          className="flex-1 md:flex-none px-4 py-2 bg-[#30363d] text-slate-400 rounded-xl text-xs font-bold hover:bg-[#161B22] transition-all"
                        >
                          Olvidé algo
                        </button>
                      </div>
                    </div>

                    {/* Flashcards Section */}
                    <div className="bg-[#0F1115] dark:bg-[#0F1115] bg-slate-50 p-6 rounded-3xl border border-slate-200 dark:border-[#30363d] flex flex-col items-center justify-center gap-6 min-h-[250px]">
                      <div className="flex items-center justify-between w-full">
                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                          Flashcards Pro
                        </label>
                        {selectedTopic.flashcards && selectedTopic.flashcards.length > 0 && (
                          <button
                            onClick={handleGenerateFlashcards}
                            disabled={loadingFlashcards}
                            className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors"
                          >
                            {loadingFlashcards ? 'Regenerando...' : 'Regenerar'}
                          </button>
                        )}
                      </div>

                      {!selectedTopic.flashcards || selectedTopic.flashcards.length === 0 ? (
                        <div className="text-center">
                          <p className="text-slate-500 text-sm mb-4">Convierte tus notas en cartas de estudio activo.</p>
                          <button
                            onClick={handleGenerateFlashcards}
                            disabled={loadingFlashcards}
                            className="px-6 py-3 rounded-xl bg-purple-600 dark:bg-purple-500/20 text-white dark:text-purple-300 font-bold border border-purple-400/30 hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                          >
                            {loadingFlashcards ? (
                              <span className="animate-spin">↻</span>
                            ) : (
                              <span>✨ Generar Mazo IA</span>
                            )}
                          </button>
                        </div>
                      ) : (
                        <FlashcardDeck cards={selectedTopic.flashcards} />
                      )}
                    </div>

                    {/* Feynman Notes */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <svg className="w-4 h-4 text-lime-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                          Bitácora Feynman
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={toggleSpeech}
                            className={`text-[10px] font-black uppercase flex items-center gap-1 ${isSpeaking ? 'text-red-400 animate-pulse' : 'text-blue-400 dark:text-lime-400 hover:underline'}`}
                          >
                            {isSpeaking ? (
                              <>
                                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                Detener Audio
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 0 010 7.072m2.828-9.9a9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                Escuchar Notas
                              </>
                            )}
                          </button>
                          <button onClick={() => handleAskAI(editTopicTitle)} disabled={loadingAI} className="text-[10px] font-black uppercase text-lime-400 hover:underline">Consultar Tutor IA</button>
                        </div>
                      </div>
                      <textarea
                        className="w-full h-64 p-6 rounded-3xl bg-[#0F1115] border-none focus:ring-2 focus:ring-lime-400 text-slate-300 text-lg leading-relaxed transition-all placeholder:text-slate-600"
                        placeholder="Explica el concepto como si se lo enseñaras a un niño..."
                        value={editTopicNotes}
                        onChange={(e) => { setEditTopicNotes(e.target.value); setHasUnsavedChanges(true); }}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSaveTopic}
                          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${hasUnsavedChanges ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/10 hover:scale-105' : 'bg-[#161B22] text-slate-500 cursor-default opacity-50'}`}
                          disabled={!hasUnsavedChanges}
                        >
                          {hasUnsavedChanges ? 'Guardar Notas' : 'Guardado'}
                        </button>
                      </div>
                    </div>

                    {/* Enhanced Resources Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <svg className="w-4 h-4 text-lime-400" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>
                          Biblioteca de Recursos
                        </label>
                        <button onClick={() => addResource(selectedTopic.id)} className="text-xs bg-lime-400 text-black px-4 py-2 rounded-full font-bold transition-all shadow-md hover:bg-lime-300">Añadir Recurso</button>
                      </div>

                      <div className="space-y-4">
                        {topicResources.length > 0 ? topicResources.map((res, index) => (
                          <div key={res.id} className="bg-[#0F1115] p-5 rounded-3xl border border-[#30363d] transition-all hover:border-lime-400/30 relative group">
                            <div className="flex flex-col md:flex-row gap-5">
                              {/* Reordering and Category Icon */}
                              <div className="flex flex-row md:flex-col items-center justify-center gap-2 border-r border-[#30363d] pr-4">
                                <button
                                  onClick={() => moveResource(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1.5 rounded-lg hover:bg-[#161B22] disabled:opacity-20 text-slate-500"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg>
                                </button>
                                <div className="w-10 h-10 bg-[#161B22] rounded-xl flex items-center justify-center text-xl shadow-sm border border-[#30363d]">
                                  {getResourceIcon(res.type)}
                                </div>
                                <button
                                  onClick={() => moveResource(index, 'down')}
                                  disabled={index === topicResources.length - 1}
                                  className="p-1.5 rounded-lg hover:bg-[#161B22] disabled:opacity-20 text-slate-500"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                </button>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  {res.type === 'video' && (
                                    <button
                                      onClick={() => updateResource(res.id, { watched: !res.watched })}
                                      className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${res.watched ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600 text-transparent'}`}
                                    >
                                      {res.watched && '✓'}
                                    </button>
                                  )}
                                  <div className="flex-1 truncate">
                                    <a href={res.url} target="_blank" rel="noreferrer" className={`font-bold text-white hover:text-lime-400 block truncate ${res.watched ? 'line-through opacity-50' : ''}`}>
                                      {res.title}
                                    </a>
                                    <span className="text-[10px] font-black uppercase text-lime-400 tracking-widest">{res.type}</span>
                                  </div>
                                </div>

                                {res.description && (
                                  <p className="text-xs text-slate-400 italic mb-3 px-1">{res.description}</p>
                                )}

                                {res.type === 'video' && (
                                  <textarea
                                    placeholder="Notas del video..."
                                    className="w-full bg-[#161B22] p-3 rounded-2xl border-none focus:ring-1 focus:ring-lime-400 text-xs h-20 resize-none text-slate-300"
                                    value={res.videoNotes || ''}
                                    onChange={(e) => updateResource(res.id, { videoNotes: e.target.value })}
                                  />
                                )}
                              </div>

                              <div className="flex md:flex-col gap-2 justify-center pl-4 border-l border-[#30363d]">
                                <button
                                  onClick={() => removeResource(res.id)}
                                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-10 border-2 border-dashed border-[#30363d] rounded-3xl">
                            <p className="text-sm text-slate-500">Sin recursos organizados aún. Agrega videos, libros o enlaces para centralizar tu conocimiento.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {aiResponse && (
                    <div className="mt-10 p-8 bg-black rounded-3xl border border-lime-400/20 relative animate-fade-in shadow-inner">
                      <button onClick={() => setAiResponse(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">✕</button>
                      <h4 className="text-lime-400 font-black mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">Tutoría IA</h4>
                      <div className="text-slate-300 whitespace-pre-wrap text-base leading-relaxed">{aiResponse}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#161B22] rounded-3xl border-2 border-dashed border-[#30363d] h-full min-h-[700px] flex flex-col items-center justify-center text-slate-500 p-12 text-center">
                  <svg className="w-20 h-20 opacity-20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  <h4 className="text-xl font-black mb-2 text-white">Domina tu camino</h4>
                  <p className="text-sm max-w-xs text-slate-500">Selecciona un subtema para gestionar sus recursos, realizar repasos y profundizar.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quiz Overlay */}
        {isQuizMode && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <QuizModule
              questions={quizQuestions}
              onCancel={() => setIsQuizMode(false)}
              onComplete={(score) => {
                setIsQuizMode(false);
                if (score > quizQuestions.length * 0.7) {
                  handleCompleteReview(activeTopicId!, true);
                } else {
                  handleCompleteReview(activeTopicId!, false);
                }
              }}
            />
          </div>
        )}

        {/* New Topic Modal */}
        {isAddingTopic && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#161B22] rounded-3xl p-8 max-w-md w-full animate-scale-in border border-[#30363d] shadow-2xl">
              <h3 className="text-2xl font-black mb-6 text-white">Nuevo Subtema</h3>
              <div className="space-y-4">
                <input
                  type="text" autoFocus placeholder="Título"
                  className="w-full px-5 py-4 rounded-2xl bg-[#0F1115] border-none focus:ring-2 focus:ring-lime-400 font-bold text-white placeholder-slate-600"
                  value={newTopicData.title} onChange={e => setNewTopicData({ ...newTopicData, title: e.target.value })}
                />
                <textarea
                  placeholder="Resumen rápido..." className="w-full px-5 py-4 rounded-2xl bg-[#0F1115] border-none focus:ring-2 focus:ring-lime-400 h-24 text-white placeholder-slate-600"
                  value={newTopicData.description} onChange={e => setNewTopicData({ ...newTopicData, description: e.target.value })}
                />
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setIsAddingTopic(false)} className="flex-1 py-4 bg-[#0F1115] rounded-2xl font-bold text-slate-400 hover:bg-[#30363d]">Cancelar</button>
                  <button onClick={handleAddManualTopic} className="flex-1 py-4 bg-lime-400 text-black rounded-2xl font-bold hover:bg-lime-300">Guardar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resource Modal */}
        {showResourceModal && (
          <ResourceModal
            onClose={() => setShowResourceModal(false)}
            onSave={handleSaveResource}
          />
        )}
      </div>
  );
};

export default AreaView;
