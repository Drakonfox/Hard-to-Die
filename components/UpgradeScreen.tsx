import React, { useState } from 'react';
import { Upgrade, PlayerActionState, NewActionUpgrade, HealerStunUpgrade, StatUpgrade } from '../types';
import { STAT_UPGRADE_POOL, ACTION_POOL, HEALER_STUN_UPGRADE_POOL } from '../constants';
import { getRandomElements } from '../utils';

interface UpgradeScreenProps {
  onUpgrade: (upgrade: Upgrade) => void;
  currentActions: PlayerActionState[];
}

const UpgradeScreen: React.FC<UpgradeScreenProps> = ({ onUpgrade, currentActions }) => {
  
  const [selectedUpgrades] = useState(() => {
    const upgrades: Upgrade[] = [];
    
    // Get 1 random stat upgrade
    const statUpgrades = getRandomElements(STAT_UPGRADE_POOL, 1);
    upgrades.push(...statUpgrades);
    
    // Get 1 random stun upgrade
    const stunUpgrade = getRandomElements(HEALER_STUN_UPGRADE_POOL, 1);
    upgrades.push(...stunUpgrade);

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
    let title: string, description: string, icon: string;

    switch (upgrade.type) {
        case 'new_action':
            title = `New Action: ${upgrade.action.name}`;
            description = upgrade.action.description;
            icon = upgrade.action.icon;
            break;
        case 'stat_boost':
        case 'healer_stun_upgrade':
            title = upgrade.title;
            description = upgrade.description;
            icon = upgrade.icon;
            break;
    }


    return (
        <button
            key={upgrade.id}
            onClick={() => onUpgrade(upgrade)}
            className="flex flex-col text-left p-6 bg-slate-800 rounded-lg border-2 border-slate-700 hover:border-cyan-500 hover:bg-slate-700 transition-all duration-200 transform hover:-translate-y-1 h-full"
        >
            <h2 className="text-2xl font-bold text-cyan-400 mb-2 flex items-center gap-3">
              <span className="text-3xl w-8 text-center">{icon}</span>
              <span className="flex-1">{title}</span>
            </h2>
            <p className="text-slate-300 flex-grow">{description}</p>
        </button>
    );
  };

  return (
    <div className="text-center animate-fadeIn p-4">
      <h1 className="text-5xl font-bold text-cyan-400 mb-2">Speravi di esser morto...</h1>
      <p className="text-lg text-slate-300 mb-8">...ma ti hanno rianimato. Scegli un metodo migliore per farti più male.</p>
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {selectedUpgrades.map(upgrade => renderUpgradeCard(upgrade))}
      </div>
    </div>
  );
};

export default UpgradeScreen;