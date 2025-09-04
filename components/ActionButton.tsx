// FIX: Implement the ActionButton component for player actions.
import React from 'react';
import { PlayerActionState } from '../types';

interface ActionButtonProps {
  action: PlayerActionState;
  onUse: (action: PlayerActionState) => void;
  disabled: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, onUse, disabled }) => {
  const cooldownPercentage = (action.cooldown - action.currentCooldown) / action.cooldown * 100;
  const showCooldownTimer = action.currentCooldown > 0;

  return (
    <button
      onClick={() => onUse(action)}
      disabled={disabled}
      title={action.description} // Keep description as a tooltip for more info
      className="relative w-full p-3 bg-slate-800 rounded-lg border-2 border-slate-700 text-left overflow-hidden
                 disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:text-slate-500
                 hover:enabled:border-cyan-500 hover:enabled:bg-slate-700 transition-all duration-200
                 min-h-[96px] flex flex-col justify-between" // Use a vertical layout to prevent text cutoff
    >
      {/* Top Section: Name and Icon */}
      <div className="flex justify-between items-start w-full">
        <h3 className="font-bold text-cyan-400 text-lg leading-tight">{action.name}</h3>
        <span className="text-2xl ml-2">{action.icon}</span>
      </div>

      {/* Bottom Section: Stats */}
      <div className="flex justify-between items-end text-xs text-slate-300 mt-2 w-full">
        <p className="font-mono space-x-2 flex items-center flex-wrap">
          {action.damage > 0 && <span className="text-red-400">{action.damage} DMG</span>}
          {action.dot && <span className="text-purple-400">+{action.dot.damage} DoT</span>}
          {action.stunDuration && <span className="text-yellow-400">{action.stunDuration}s Stun</span>}
        </p>
        <p className="font-mono text-blue-400 whitespace-nowrap pl-2">{action.cooldown.toFixed(1)}s CD</p>
      </div>
      
      {showCooldownTimer && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <p className="text-2xl font-bold text-white">{action.currentCooldown.toFixed(1)}s</p>
        </div>
      )}
      <div 
        className="absolute bottom-0 left-0 h-1 bg-cyan-600"
        style={{ width: `${showCooldownTimer ? cooldownPercentage : 100}%` }}
      ></div>
    </button>
  );
};

export default ActionButton;