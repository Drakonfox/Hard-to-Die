// FIX: Implement the CharacterStatus component to display player health.
import React from 'react';
import { ActiveDotState, ShieldState, ActiveHotState } from '../types';

interface CharacterStatusProps {
  hp: number;
  maxHp: number;
  shield: ShieldState | null;
  activeDots: ActiveDotState[];
  activeHots: ActiveHotState[];
  instability: number;
  maxInstability: number;
}

const CharacterStatus: React.FC<CharacterStatusProps> = ({ hp, maxHp, shield, activeDots, activeHots, instability, maxInstability }) => {
  const hpPercentage = (hp / maxHp) * 100;
  const shieldPercentage = shield ? (shield.amount / maxHp) * 100 : 0;
  const instabilityPercentage = (instability / maxInstability) * 100;

  const getHpColor = () => {
    if (hpPercentage > 50) return 'bg-green-500';
    if (hpPercentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-slate-700 space-y-4">
      {/* Health Section */}
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <h2 className="text-xl font-bold text-slate-100">Character Status</h2>
          <p className="font-mono text-xl text-slate-100">
            <span>{Math.max(0, Math.round(hp))} / {maxHp}</span>
            {shield && <span className="text-cyan-400 font-bold ml-2">(+{Math.round(shield.amount)})</span>}
          </p>
        </div>
        <div className="relative w-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-full h-8 border-2 border-slate-600 shadow-inner">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${getHpColor()} shadow-lg`}
            style={{ width: `${Math.max(0, hpPercentage)}%` }}
          />
          {shield && shield.amount > 0 && (
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-cyan-500/50 border-2 border-cyan-400"
              style={{ width: `${Math.max(0, hpPercentage + shieldPercentage)}%`, zIndex: -1 }}
            />
          )}
        </div>
      </div>
      
      {/* Instability Section */}
      <div>
        <div className="flex justify-between items-baseline mb-1">
            <h3 className="font-bold text-purple-300">Instability</h3>
            <p className="font-mono text-purple-300">{Math.floor(instability)} / {maxInstability}</p>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-4 border border-slate-600 shadow-inner">
            <div
            className="h-full rounded-full bg-purple-500 transition-all duration-200"
            style={{ width: `${instabilityPercentage}%` }}
            />
        </div>
      </div>

      {/* Effects Section */}
      <div className="flex items-center flex-wrap gap-2 min-h-[28px]">
        {(activeDots.length > 0 || activeHots.length > 0) ? (
            <>
                {activeDots.map(dot => (
                    <div key={dot.id} className="flex items-center gap-2 bg-slate-900/70 px-3 py-1 rounded-full border border-red-500/50" title={`${dot.id.charAt(0).toUpperCase() + dot.id.slice(1)}`}>
                        <span className="text-lg">{dot.icon}</span>
                        <span className="text-sm font-mono text-red-300">{dot.remainingDuration.toFixed(1)}s</span>
                    </div>
                ))}
                {activeHots.map(hot => (
                    <div key={hot.id} className="flex items-center gap-2 bg-slate-900/70 px-3 py-1 rounded-full border border-green-500/50" title={`${hot.id.charAt(0).toUpperCase() + hot.id.slice(1)}`}>
                        <span className="text-lg">{hot.icon}</span>
                        <span className="text-sm font-mono text-green-300">{hot.remainingDuration.toFixed(1)}s</span>
                    </div>
                ))}
            </>
        ) : (
            <p className="text-sm text-slate-500">No active effects.</p>
        )}
      </div>
    </div>
  );
};

export default CharacterStatus;