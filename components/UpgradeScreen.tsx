

import React, { useState } from 'react';
import { Upgrade, PlayerActionState, NewActionUpgrade, StatUpgrade } from '../types';
import { STAT_UPGRADE_POOL, ACTION_POOL } from '../constants';

interface UpgradeScreenProps {
  onUpgrade: (upgrade: Upgrade) => void;
  currentActions: PlayerActionState[];
}

// Function to get N random unique elements from an array
const getRandomElements = <T,>(arr: T[], n: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
}

const UpgradeScreen: React.FC<UpgradeScreenProps> = ({ onUpgrade, currentActions }) => {
  
  const [selectedUpgrades] = useState(() => {
    const upgrades: Upgrade[] = [];
    
    // Get 2 random stat upgrades
    const statUpgrades = getRandomElements(STAT_UPGRADE_POOL, 2);
    upgrades.push(...statUpgrades);

    // Get 1 random new action that the player doesn't already have
    const availableActions = ACTION_POOL.filter(poolAction => 
        !currentActions.some(playerAction => playerAction.id === poolAction.id)
    );

    if (availableActions.length > 0) {
        const randomAction = getRandomElements(availableActions, 1)[0];
        const newActionUpgrade: NewActionUpgrade = {
            id: `new_action_${randomAction.id}`,
            type: 'new_action',
            action: randomAction
        };
        upgrades.push(newActionUpgrade);
    } else {
        // If player has all actions, offer one more stat upgrade
        const anotherStatUpgrade = getRandomElements(STAT_UPGRADE_POOL.filter(u => !upgrades.some(up => up.id === u.id)), 1);
        upgrades.push(...anotherStatUpgrade);
    }


    return upgrades.sort(() => 0.5 - Math.random());
  });

  const renderUpgradeCard = (upgrade: Upgrade) => {
    if (upgrade.type === 'new_action') {
        const { action } = upgrade;
        return (
            <button
                key={upgrade.id}
                onClick={() => onUpgrade(upgrade)}
                className="flex flex-col text-left p-6 bg-slate-800 rounded-lg border-2 border-slate-700 hover:border-cyan-500 hover:bg-slate-700 transition-all duration-200 transform hover:-translate-y-1 h-full"
            >
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">New Action: {action.name} {action.icon}</h2>
                <p className="text-slate-300 flex-grow">{action.description}</p>
            </button>
        );
    }
    // stat_boost
    return (
        <button
            key={upgrade.id}
            onClick={() => onUpgrade(upgrade)}
            className="flex flex-col text-left p-6 bg-slate-800 rounded-lg border-2 border-slate-700 hover:border-cyan-500 hover:bg-slate-700 transition-all duration-200 transform hover:-translate-y-1 h-full"
        >
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">{upgrade.title}</h2>
            <p className="text-slate-300 flex-grow">{upgrade.description}</p>
        </button>
    );
  };

  return (
    <div className="text-center animate-fadeIn p-4">
      <h1 className="text-5xl font-bold text-cyan-400 mb-2">A Brief Respite</h1>
      <p className="text-lg text-slate-300 mb-8">You've earned a moment of peace. Choose a new way to hurt yourself for the next level.</p>
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {selectedUpgrades.map(upgrade => renderUpgradeCard(upgrade))}
      </div>
    </div>
  );
};

export default UpgradeScreen;