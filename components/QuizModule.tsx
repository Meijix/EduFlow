
import React, { useState } from 'react';
import { QuizQuestion } from '../types';

interface QuizModuleProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
  onCancel: () => void;
}

const QuizModule: React.FC<QuizModuleProps> = ({ questions, onComplete, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleNext = () => {
    if (selectedOption === questions[currentIndex].correctAnswerIndex) {
      setScore(score + 1);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl text-center animate-scale-in border border-slate-100 dark:border-slate-800">
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-2xl font-black mb-2">¡Cuestionario completado!</h3>
        <p className="text-slate-500 mb-6">Tu puntuación: <span className="font-bold text-indigo-600">{score} de {questions.length}</span></p>
        <button 
          onClick={() => onComplete(score)}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
        >
          Finalizar y Guardar Progreso
        </button>
      </div>
    );
  }

  const current = questions[currentIndex];

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl animate-scale-in border border-slate-100 dark:border-slate-800 shadow-xl max-w-2xl w-full">
      <div className="flex justify-between items-center mb-8">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Pregunta {currentIndex + 1} de {questions.length}</span>
        <button onClick={onCancel} className="text-slate-400 hover:text-rose-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-8 leading-tight">{current.question}</h4>

      <div className="space-y-3 mb-8">
        {current.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedOption(idx)}
            className={`w-full p-4 rounded-2xl text-left font-medium transition-all border-2 ${
              selectedOption === idx 
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${selectedOption === idx ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {String.fromCharCode(65 + idx)}
              </span>
              {option}
            </div>
          </button>
        ))}
      </div>

      <button
        disabled={selectedOption === null}
        onClick={handleNext}
        className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-bold disabled:opacity-50 hover:bg-black dark:hover:bg-indigo-700 transition-all shadow-lg"
      >
        {currentIndex === questions.length - 1 ? 'Ver resultados' : 'Siguiente pregunta'}
      </button>
    </div>
  );
};

export default QuizModule;
