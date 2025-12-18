
import React from 'react';
import { Topic, StudyStatus } from '../types';

interface KanbanBoardProps {
  topics: Topic[];
  onMoveTopic: (topicId: string, newStatus: StudyStatus) => void;
  onSelectTopic: (topicId: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ topics, onMoveTopic, onSelectTopic }) => {
  const columns = [
    { id: StudyStatus.PENDING, title: 'Por aprender', color: 'bg-slate-200 dark:bg-slate-800' },
    { id: StudyStatus.IN_PROGRESS, title: 'En proceso', color: 'bg-amber-100 dark:bg-amber-900/30' },
    { id: StudyStatus.REVIEWING, title: 'Repasando', color: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { id: StudyStatus.COMPLETED, title: 'Dominado', color: 'bg-emerald-100 dark:bg-emerald-900/30' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      {columns.map((col) => (
        <div key={col.id} className={`${col.color} p-4 rounded-3xl min-h-[500px] border border-transparent dark:border-slate-800/50 flex flex-col gap-4`}>
          <div className="flex items-center justify-between px-2">
            <h4 className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">{col.title}</h4>
            <span className="bg-white/50 dark:bg-black/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {topics.filter(t => t.status === col.id).length}
            </span>
          </div>
          <div className="space-y-3">
            {topics.filter(t => t.status === col.id).map((topic) => (
              <div 
                key={topic.id}
                onClick={() => onSelectTopic(topic.id)}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
              >
                <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1 truncate">{topic.title}</h5>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{topic.description}</p>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                   <div className="flex gap-1">
                      {columns.map(c => (
                        <button 
                          key={c.id}
                          onClick={(e) => { e.stopPropagation(); onMoveTopic(topic.id, c.id); }}
                          className={`w-2 h-2 rounded-full transition-all ${topic.status === c.id ? 'scale-125 ring-2 ring-offset-1 ring-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                          title={`Mover a ${c.title}`}
                        />
                      ))}
                   </div>
                   <div className="text-[9px] font-black text-indigo-500/50 uppercase">
                      {Math.floor(topic.timeSpent / 60)}m dedicado
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
