import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import type { GameStore } from '../store';

const useCountUp = (target: number, duration: number = 1000) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            const currentCount = Math.floor(target * percentage);
            setCount(currentCount);

            if (progress < duration) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, [target, duration]);

    return count;
};

const ScoreRow: React.FC<{ label: string; score: number, icon: string, delay: number }> = ({ label, score, icon, delay }) => {
    const [isVisible, setIsVisible] = useState(false);
    const animatedScore = useCountUp(score, 1000);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    if (!isVisible) return <div className="h-12"></div>;

    return (
        <div className="flex justify-between items-center text-2xl animate-fadeIn p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-4">
                <span className="text-4xl">{icon}</span>
                <span className="text-slate-300">{label}</span>
            </div>
            <span className="font-mono font-bold text-cyan-300">{animatedScore}</span>
        </div>
    )
}

const PostLevelSummaryScreen: React.FC<{ store: GameStore }> = observer(({ store }) => {
    const { levelSummaryStats } = store;
    const [showButton, setShowButton] = useState(false);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowButton(true);
        }, 4000); // Show button after animations
        return () => clearTimeout(timer);
    }, []);

    if (!levelSummaryStats) {
        return <div>Calculating results...</div>;
    }

    return (
        <div className="w-full max-w-2xl bg-slate-800 p-8 rounded-xl border-2 border-slate-700 shadow-2xl animate-fadeIn">
            <h1 className="text-5xl font-bold text-center text-cyan-400 mb-2">Livello Completato!</h1>
            <p className="text-center text-slate-400 mb-8">Ecco la tua ricompensa per una morte ben eseguita.</p>

            <div className="space-y-4 mb-8">
                <ScoreRow label="Bonus Danni" score={levelSummaryStats.damageBonus} icon="💥" delay={500} />
                <ScoreRow label="Bonus Tempo" score={levelSummaryStats.timeBonus} icon="⏱️" delay={1500} />
                <ScoreRow label="Bonus Overkill" score={levelSummaryStats.overkillBonus} icon="💀" delay={2500} />
                <div className="border-t-2 border-slate-600 my-4"></div>
                <ScoreRow label="Punti Rabbia Totali" score={levelSummaryStats.total} icon="😡" delay={3000} />
            </div>

            {showButton && (
                 <div className="text-center animate-fadeIn">
                    <button 
                        onClick={store.enterShop}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-lg text-2xl transition-transform transform hover:scale-105"
                    >
                        Vai al Negozio
                    </button>
                 </div>
            )}
        </div>
    );
});

export default PostLevelSummaryScreen;