// FIX: Implement the CharacterStatus component to display player health.
import React from 'react';
import { ActiveDotState, ShieldState, ActiveHotState } from '../types';

interface CharacterStatusProps {
  hp: number;
  maxHp: number;
  shield: ShieldState | null;
  activeDots: ActiveDotState[];
  activeHots: ActiveHotState[];
}

const CharacterStatus: React.FC<CharacterStatusProps> = ({ hp, maxHp, shield, activeDots, activeHots }) => {
  const hpPercentage = (hp / maxHp) * 100;
  const shieldPercentage = shield ? (shield.amount / maxHp) * 100 : 0;

  const getHpColor = () => {
    if (hpPercentage > 50) return 'bg-green-500';
    if (hpPercentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full bg-slate-700 rounded-lg p-4 border border-slate-600">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-slate-200">Your Pathetic Life</h2>
        <div className="text-right">
            <p className="text-lg font-bold text-slate-200">
              {Math.max(0, Math.round(hp))} / {maxHp}
            </p>
            {shield && <p className="text-sm font-bold text-cyan-400">Shield: {Math.round(shield.amount)}</p>}
        </div>
      </div>
      <div className="relative w-full bg-slate-900 rounded-full h-6 border-2 border-slate-600">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${getHpColor()}`}
          style={{ width: `${Math.max(0, hpPercentage)}%` }}
        />
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-cyan-500/50 border-2 border-cyan-400"
          style={{ width: `${Math.max(0, shieldPercentage)}%` }}
        />
      </div>
      <div className="flex items-center flex-wrap gap-2 mt-2 min-h-[36px]">
        {(activeDots.length > 0 || activeHots.length > 0) && (
            <>
                <h3 className="text-sm font-bold text-slate-400">Effects:</h3>
                {activeDots.map(dot => (
                    <div key={dot.id} className="flex items-center gap-1 bg-red-900/50 px-2 py-1 rounded-md" title={`${dot.id.charAt(0).toUpperCase() + dot.id.slice(1)}`}>
                        <span className="text-lg">{dot.icon}</span>
                        <span className="text-xs font-mono text-slate-300">{dot.remainingDuration.toFixed(1)}s</span>
                    </div>
                ))}
                {activeHots.map(hot => (
                    <div key={hot.id} className="flex items-center gap-1 bg-green-900/50 px-2 py-1 rounded-md" title={`${hot.id.charAt(0).toUpperCase() + hot.id.slice(1)}`}>
                        <span className="text-lg">{hot.icon}</span>
                        <span className="text-xs font-mono text-slate-300">{hot.remainingDuration.toFixed(1)}s</span>
                    </div>
                ))}
            </>
        )}
      </div>
    </div>
  );
};

export default CharacterStatus;