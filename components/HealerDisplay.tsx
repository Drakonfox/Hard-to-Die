
import React from 'react';
import { Healer } from '../types';

interface HealerDisplayProps {
  healers: Healer[];
}

const HealerDisplay: React.FC<HealerDisplayProps> = ({ healers }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {healers.map(healer => (
        <div key={healer.id} className="bg-slate-700 p-3 rounded-lg border border-slate-600 flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <span className="text-4xl">{healer.icon}</span>
                <div>
                    <p className="font-bold text-lg">{healer.name}</p>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                {healer.abilities.map(ability => {
                    const progress = 100 - (ability.timeToNextUse / ability.cooldown) * 100;
                    return (
                        <div key={ability.id} className="text-sm">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg">{ability.icon}</span>
                                    <span>{ability.name}</span>
                                </div>
                                <span className="font-mono text-xs">{ability.timeToNextUse.toFixed(1)}s</span>
                            </div>
                            <div className="w-full bg-slate-600 rounded-full h-2 mt-1">
                                <div className="bg-green-500 h-2 rounded-full" style={{width: `${progress}%`}}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      ))}
    </div>
  );
};

export default HealerDisplay;