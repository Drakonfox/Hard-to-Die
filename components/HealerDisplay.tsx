import React from 'react';
import { Healer } from '../types';

interface HealerDisplayProps {
  healers: Healer[];
}

const HealerDisplay: React.FC<HealerDisplayProps> = ({ healers }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {healers.map(healer => {
        const isStunned = healer.stunTimer && healer.stunTimer > 0;
        return (
          <div key={healer.id} className="relative bg-slate-800 p-4 rounded-lg border border-slate-700 text-slate-300">
              
              <div className={`transition-opacity duration-300 ${isStunned ? 'opacity-25 pointer-events-none' : ''}`}>
                <div className="flex items-center mb-4">
                    {/* FIX: Corrected typo from text-5x1 to text-5xl */}
                    <span className="text-5xl mr-4">{healer.icon}</span>
                    <span className="font-bold text-xl text-slate-100">{healer.name}</span>
                </div>
                <div className="space-y-2">
                    {healer.abilities.map(ability => {
                        const progress = 100 - (ability.timeToNextUse / ability.cooldown) * 100;
                        return (
                            <div key={ability.id} className="text-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{ability.icon}</span>
                                        <span>{ability.name}</span>
                                    </div>
                                    <span className="font-mono text-xs text-slate-400">{ability.timeToNextUse.toFixed(1)}s</span>
                                </div>
                                <div className="w-full bg-slate-600/50 rounded-full h-2.5 shadow-inner">
                                    <div className="bg-green-500 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
              </div>

              {isStunned && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                      <p className="text-5xl animate-pulse">😵</p>
                      <p className="text-2xl font-bold text-yellow-300 mt-2">STUNNED</p>
                      <p className="text-xl font-mono text-white">{healer.stunTimer?.toFixed(1)}s</p>
                  </div>
              )}
          </div>
        );
      })}
    </div>
  );
};

export default HealerDisplay;
