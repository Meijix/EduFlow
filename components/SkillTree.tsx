
import React from 'react';
import { Topic, StudyStatus } from '../types';

interface SkillTreeProps {
  topics: Topic[];
  onSelectTopic: (id: string) => void;
}

const SkillTree: React.FC<SkillTreeProps> = ({ topics, onSelectTopic }) => {
  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-3xl min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-12 max-w-4xl w-full">
        <div className="bg-blue-600 text-white px-8 py-4 rounded-full font-black text-xl shadow-xl shadow-blue-200 dark:shadow-none animate-pulse">
          NÚCLEO DEL ÁREA
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {topics.map((topic, index) => (
            <div 
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              className={`relative p-6 rounded-3xl border-2 transition-all cursor-pointer group flex flex-col items-center text-center ${
                topic.status === StudyStatus.COMPLETED 
                  ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-100 dark:shadow-none' 
                  : topic.status === StudyStatus.IN_PROGRESS || topic.status === StudyStatus.REVIEWING
                  ? 'bg-white dark:bg-slate-900 border-blue-400 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60 grayscale'
              }`}
            >
              {/* Connector Line (conceptually) */}
              <div className="absolute -top-8 left-1/2 w-0.5 h-8 bg-blue-200 dark:bg-blue-800 -translate-x-1/2 group-first:hidden"></div>
              
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-xl shadow-inner ${
                topic.status === StudyStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {topic.status === StudyStatus.COMPLETED ? '🌟' : '💎'}
              </div>
              
              <h5 className="font-black text-slate-800 dark:text-white mb-2 leading-tight">{topic.title}</h5>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-auto">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    topic.status === StudyStatus.COMPLETED ? 'w-full bg-emerald-500' : 
                    topic.status === StudyStatus.IN_PROGRESS ? 'w-1/2 bg-amber-500' : 
                    topic.status === StudyStatus.REVIEWING ? 'w-3/4 bg-blue-500' : 'w-0'
                  }`}
                ></div>
              </div>
              
              {topic.status === StudyStatus.COMPLETED && (
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full animate-bounce">
                  MASTERED
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillTree;
