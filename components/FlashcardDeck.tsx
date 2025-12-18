import React, { useState } from 'react';
import { Flashcard } from '../types';

interface FlashcardDeckProps {
    cards: Flashcard[];
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    if (!cards || cards.length === 0) return null;

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 200);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length), 200);
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
            <div
                className="relative w-full aspect-[5/3] perspective-1000 cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`w-full h-full relative transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-white dark:bg-[#161B22] border-2 border-slate-200 dark:border-[#30363d] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg group-hover:border-blue-400 dark:group-hover:border-lime-400 transition-colors">
                        <span className="text-xs uppercase font-black text-slate-400 mb-4 tracking-widest">Pregunta</span>
                        <p className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-200">{cards[currentIndex].front}</p>
                        <div className="absolute bottom-4 text-[10px] text-slate-400 font-bold">Clic para voltear ↻</div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-blue-50 dark:bg-lime-900/10 border-2 border-blue-200 dark:border-lime-400/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg">
                        <span className="text-xs uppercase font-black text-blue-500 dark:text-lime-400 mb-4 tracking-widest">Respuesta</span>
                        <p className="text-lg md:text-xl font-medium text-slate-800 dark:text-white">{cards[currentIndex].back}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button onClick={handlePrev} className="p-3 rounded-xl bg-slate-100 dark:bg-[#30363d] text-slate-500 hover:bg-slate-200 dark:hover:bg-[#161B22] transition-colors">
                    ←
                </button>
                <span className="font-mono font-bold text-slate-400 text-sm">
                    {currentIndex + 1} / {cards.length}
                </span>
                <button onClick={handleNext} className="p-3 rounded-xl bg-slate-100 dark:bg-[#30363d] text-slate-500 hover:bg-slate-200 dark:hover:bg-[#161B22] transition-colors">
                    →
                </button>
            </div>
        </div>
    );
};

export default FlashcardDeck;
