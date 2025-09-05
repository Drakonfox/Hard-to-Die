// FIX: Implement the main Game component with game loop and state management.
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import CharacterStatus from './CharacterStatus';
import ActionButton from './ActionButton';
import HealerDisplay from './HealerDisplay';
import ConsumableBar from './ConsumableBar';
import type { GameStore } from '../store';
import { MAX_INSTABILITY } from '../constants';

interface GameProps {
  store: GameStore;
}

const Game: React.FC<GameProps> = observer(({ store }) => {
  // The component now primarily renders state from the store.
  // The game loop is handled within the store.

  // Effect to clean up the game loop when the component unmounts
  useEffect(() => {
    return () => {
      store.stopGameLoop();
    };
  }, [store]);

  if (!store.levelData) {
    return <div>Loading level...</div>; // Placeholder
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto p-4 animate-fadeIn flex flex-col gap-6">
      {store.stunTimer > 0 && (
          <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-50 rounded-lg">
            <h2 className="text-6xl font-bold text-yellow-400 animate-pulse">STUNNED</h2>
            <p className="text-4xl font-mono text-white mt-4">{store.stunTimer.toFixed(1)}s</p>
          </div>
      )}
      
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-center">
        <h2 className="text-xl font-bold text-slate-300">Tempo per Morire</h2>
        <p className="text-5xl font-bold text-red-500">{store.timer.toFixed(1)}s</p>
      </div>

      <CharacterStatus 
          hp={store.hp} 
          maxHp={store.levelData.characterMaxHp} 
          shield={store.shield} 
          activeDots={store.activeDots} 
          activeHots={store.activeHots} 
          instability={store.instability} 
          maxInstability={MAX_INSTABILITY}
          healingReduction={store.healingReduction}
          instabilityTriggered={store.instabilityTriggered}
      />
      
      <ConsumableBar consumables={store.consumables} onUse={store.useConsumable} />
      
      <div>
        <h2 className="text-2xl font-bold mb-4 text-center">Le Tue Azioni</h2>
        <div className="max-w-xl mx-auto">
          <div className="grid grid-cols-2 gap-4">
            {store.playerActions.map(action => (
              <ActionButton 
                key={action.id} 
                action={action} 
                onUse={() => store.useAction(action)}
                disabled={action.currentCooldown > 0 || store.stunTimer > 0 || store.gameState === 'level-won'} 
              />
            ))}
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4 text-center">Guaritori Fastidiosi</h2>
        <HealerDisplay healers={store.healers} />
      </div>

    </div>
  );
});

export default Game;