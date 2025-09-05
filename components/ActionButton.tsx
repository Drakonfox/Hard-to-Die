// FIX: Implement the ActionButton component for player actions.
import React from 'react';
import { PlayerActionState } from '../types';
import { RARITY_DATA, MAX_ACTION_LEVEL } from '../constants';

interface ActionButtonProps {
  action: PlayerActionState;
  onUse: (action: PlayerActionState) => void;
  disabled: boolean;
}

const StatGridItem: React.FC<{ label: string; value: string | number; colorClass: string }> = ({ label, value, colorClass }) => (
    <div className="flex justify-between items-baseline">
        <span className="text-slate-400">{label}:</span>
        <span className={`font-bold font-mono ${colorClass}`}>{value}</span>
    </div>
);


const ActionButton: React.FC<ActionButtonProps> = ({ action, onUse, disabled }) => {
  const cooldownPercentage = action.cooldown > 0 ? (action.cooldown - action.currentCooldown) / action.cooldown * 100 : 0;
  const showCooldownTimer = action.currentCooldown > 0;
  const rarityColor = RARITY_DATA[action.rarity]?.color || 'border-slate-700';

  return (
    <button
      onClick={() => onUse(action)}
      disabled={disabled}
      title={action.description}
      className={`relative w-full p-4 bg-slate-800 rounded-lg border-2 ${rarityColor} text-left overflow-hidden
                 disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:text-slate-500
                 hover:enabled:border-cyan-500 hover:enabled:bg-slate-700/80 transition-all duration-200
                 flex flex-col group`}
    >
      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">
          {action.level >= MAX_ACTION_LEVEL ? 'Lvl MAX' : `Lvl ${action.level}`}
      </div>

      <div className="flex-grow">
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-cyan-400 text-xl leading-tight break-words pr-2 group-hover:text-cyan-300">{action.name}</h3>
            <span className="text-4xl group-hover:scale-110 transition-transform">{action.icon}</span>
        </div>
        <p className="text-sm text-slate-400">{action.description}</p>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-600/50 text-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {action.damage > 0 && <StatGridItem label="Damage" value={action.damage} colorClass="text-red-400" />}
            
            <StatGridItem label="Cooldown" value={`${action.cooldown.toFixed(1)}s`} colorClass="text-blue-400" />

            {action.instabilityGain > 0 && <StatGridItem label="Instability" value={`+${action.instabilityGain}`} colorClass="text-fuchsia-400" />}
            
            {action.stunDuration && <StatGridItem label="Self Stun" value={`${action.stunDuration}s`} colorClass="text-yellow-400" />}
            
            {action.damageScalingOnMissingHp && <StatGridItem label="Danno Extra" value={`+${action.damageScalingOnMissingHp} x HP mancanti`} colorClass="text-rose-400" />}

            {action.dot && (
                <div className="col-span-2 flex justify-between items-baseline">
                    <span className="text-slate-400">DoT:</span>
                    <span className="font-bold font-mono text-purple-400">{action.dot.damage} over {action.dot.duration}s</span>
                </div>
            )}
            
            {action.stunChance && action.healerStunDuration && (
                <div className="col-span-2 flex justify-between items-baseline">
                    <span className="text-slate-400">Stun Chance:</span>
                    <span className="font-bold font-mono text-yellow-400">{action.stunChance * 100}% per {action.healerStunDuration}s</span>
                </div>
            )}
        </div>
      </div>
      
      {showCooldownTimer && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
          <p className="text-3xl font-bold text-white font-mono">{action.currentCooldown.toFixed(1)}s</p>
        </div>
      )}

      <div 
        className="absolute bottom-0 left-0 h-1 bg-cyan-500"
        style={{ 
          width: `${showCooldownTimer ? cooldownPercentage : 100}%`,
          transition: showCooldownTimer ? 'width 0.1s linear' : 'none',
        }}
      ></div>
    </button>
  );
};

export default ActionButton;