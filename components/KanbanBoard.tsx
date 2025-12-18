import React from 'react';
import { Topic, StudyStatus } from '../types';
import { DndContext, useDraggable, useDroppable, DragEndEvent, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface KanbanBoardProps {
  topics: Topic[];
  onMoveTopic: (topicId: string, newStatus: StudyStatus) => void;
  onSelectTopic: (topicId: string) => void;
}

const KanbanCard = ({ topic, onSelect }: { topic: Topic, onSelect: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: topic.id,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: 100,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(topic.id)}
      className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-indigo-300 transition-all cursor-grab group active:cursor-grabbing touch-none"
    >
      <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1 truncate">{topic.title}</h5>
      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{topic.description}</p>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/50">
        <div className="text-[9px] font-black text-indigo-500/50 uppercase">
          {Math.floor(topic.timeSpent / 60)}m dedicado
        </div>
      </div>
    </div>
  );
};

const KanbanColumn = ({ id, title, color, topics, onSelectTopic }: { id: string, title: string, color: string, topics: Topic[], onSelectTopic: (id: string) => void }) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div ref={setNodeRef} className={`${color} p-4 rounded-3xl min-h-[500px] border border-transparent dark:border-slate-800/50 flex flex-col gap-4`}>
      <div className="flex items-center justify-between px-2">
        <h4 className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</h4>
        <span className="bg-white/50 dark:bg-black/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {topics.length}
        </span>
      </div>
      <div className="space-y-3">
        {topics.map((topic) => (
          <KanbanCard key={topic.id} topic={topic} onSelect={onSelectTopic} />
        ))}
      </div>
    </div>
  );
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ topics, onMoveTopic, onSelectTopic }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Find which column (status) the dragged item belongs to currently
      const currentTopic = topics.find(t => t.id === active.id);
      const newStatus = over.id as StudyStatus; // Drop target is the column ID (StudyStatus)

      if (currentTopic && currentTopic.status !== newStatus) {
        onMoveTopic(currentTopic.id, newStatus);
      }
    }
  };

  const columns = [
    { id: StudyStatus.PENDING, title: 'Por aprender', color: 'bg-slate-200 dark:bg-slate-800' },
    { id: StudyStatus.IN_PROGRESS, title: 'En proceso', color: 'bg-amber-100 dark:bg-amber-900/30' },
    { id: StudyStatus.REVIEWING, title: 'Repasando', color: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { id: StudyStatus.COMPLETED, title: 'Dominado', color: 'bg-emerald-100 dark:bg-emerald-900/30' },
  ];

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            topics={topics.filter(t => t.status === col.id)}
            onSelectTopic={onSelectTopic}
          />
        ))}
      </div>
    </DndContext>
  );
};

export default KanbanBoard;
