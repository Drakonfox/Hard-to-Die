import React, { useState, useCallback, useRef } from 'react';
import { GameStatus, PlayerActionState, Upgrade, Difficulty, Level } from './types';
import { INITIAL_ACTIONS, generateLevel } from './constants';
import StartScreen from './components/StartScreen';
import Game from './components/Game';
import UpgradeScreen from './components/UpgradeScreen';
import EndScreen from './components/EndScreen';
import { deepCopy } from './utils';
import ActionButton from './components/ActionButton';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.StartScreen);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [playerActions, setPlayerActions] = useState<PlayerActionState[]>(() => deepCopy(INITIAL_ACTIONS));
  const [win, setWin] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Normal);
  const [isTakingDamage, setIsTakingDamage] = useState(false);
  const damageTimeoutRef = useRef<number | null>(null);

  // Stats for the stun mechanic
  const [healerStunDuration, setHealerStunDuration] = useState(2.0); // in seconds
  const [instabilityGainMultiplier, setInstabilityGainMultiplier] = useState(1.0);

  const [actionToReplaceWith, setActionToReplaceWith] = useState<PlayerActionState | null>(null);

  const triggerDamageEffect = useCallback(() => {
    if (damageTimeoutRef.current) {
      clearTimeout(damageTimeoutRef.current);
    }
    setIsTakingDamage(true);
    damageTimeoutRef.current = window.setTimeout(() => {
      setIsTakingDamage(false);
      damageTimeoutRef.current = null;
    }, 400); // Corresponds to animation duration
  }, []);

  const startGame = useCallback((selectedDifficulty: Difficulty) => {
    setCurrentLevel(1);
    setPlayerActions(deepCopy(INITIAL_ACTIONS));
    setDifficulty(selectedDifficulty);
    setHealerStunDuration(2.0);
    setInstabilityGainMultiplier(1.0);
    setGameStatus(GameStatus.Playing);
  }, []);
  
  const restartGame = useCallback(() => {
    setGameStatus(GameStatus.StartScreen);
  }, []);

  const handleLevelComplete = useCallback(() => {
    setGameStatus(GameStatus.LevelComplete);
  }, []);
  
  const handleGameOver = useCallback((didWin: boolean) => {
    setWin(didWin);
    setGameStatus(GameStatus.GameOver);
  }, []);

  const handleUpgrade = useCallback((upgrade: Upgrade) => {
    if (upgrade.type === 'stat_boost') {
      const upgradedActions = upgrade.apply(playerActions);
      setPlayerActions(upgradedActions.map(action => ({ ...action, currentCooldown: 0 })));
    } else if (upgrade.type === 'new_action') {
      if (playerActions.length < 4) {
        setPlayerActions(prev => [...prev, { ...upgrade.action, currentCooldown: 0 }]);
      } else {
        setActionToReplaceWith(upgrade.action);
        setGameStatus(GameStatus.ReplacingAction);
        return; // Don't advance level yet
      }
    } else if (upgrade.type === 'healer_stun_upgrade') {
        if (upgrade.stat === 'duration') {
            setHealerStunDuration(prev => prev + upgrade.amount);
        } else if (upgrade.stat === 'instability_gain') {
            setInstabilityGainMultiplier(prev => prev * upgrade.amount);
        }
    }

    setCurrentLevel(prevLevel => prevLevel + 1);
    setGameStatus(GameStatus.Playing);
  }, [playerActions]);

  const handleConfirmReplace = useCallback((actionToDiscardId: string) => {
    if (!actionToReplaceWith) return;

    setPlayerActions(prev => {
        const newActions = prev.filter(a => a.id !== actionToDiscardId);
        newActions.push({ ...actionToReplaceWith, currentCooldown: 0 });
        return newActions;
    });

    setActionToReplaceWith(null);
    setCurrentLevel(prevLevel => prevLevel + 1);
    setGameStatus(GameStatus.Playing);
  }, [actionToReplaceWith]);

  const renderReplaceActionScreen = () => {
    if (!actionToReplaceWith) return null;
    return (
        <div className="text-center animate-fadeIn p-4">
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">Action Slots Full</h1>
            <p className="text-lg text-slate-300 mb-4">Choose an action to replace.</p>
            
            <div className="mb-8 p-4 bg-slate-800 border-2 border-cyan-500 rounded-lg max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">New Action</h2>
                <div className="flex justify-between items-start text-left">
                    <h3 className="text-xl font-bold flex items-center gap-2 flex-grow">
                        <span className="text-2xl w-8 text-center">{actionToReplaceWith.icon}</span>
                        <span>{actionToReplaceWith.name}</span>
                    </h3>
                    <p className="text-lg font-mono whitespace-nowrap pl-2">{actionToReplaceWith.damage} DMG</p>
                </div>
                <p className="text-slate-300 text-sm mt-1 text-left">{actionToReplaceWith.description}</p>
            </div>

            <h2 className="text-2xl font-bold mb-4">Your Current Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {playerActions.map(action => (
                    <ActionButton
                        key={action.id}
                        action={action}
                        onUse={() => handleConfirmReplace(action.id)}
                        disabled={false}
                    />
                ))}
            </div>
        </div>
    );
  };
  
  const renderContent = () => {
    switch (gameStatus) {
      case GameStatus.StartScreen:
        return <StartScreen onStart={startGame} />;
      case GameStatus.Playing:
        const levelData = generateLevel(currentLevel);
        return (
          <Game 
            key={currentLevel}
            levelData={levelData}
            playerActions={playerActions}
            setPlayerActions={setPlayerActions}
            onLevelComplete={handleLevelComplete}
            onGameOver={handleGameOver}
            onTakeDamage={triggerDamageEffect}
            healerStunDuration={healerStunDuration}
            instabilityGainMultiplier={instabilityGainMultiplier}
          />
        );
      case GameStatus.LevelComplete:
          return <UpgradeScreen onUpgrade={handleUpgrade} currentActions={playerActions} />;
      case GameStatus.GameOver:
        return <EndScreen win={win} onRestart={restartGame} />;
      case GameStatus.ReplacingAction:
        return renderReplaceActionScreen();
      default:
        return <StartScreen onStart={startGame} />;
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className={`w-full max-w-5xl mx-auto ${isTakingDamage ? 'animate-take-damage' : ''}`}>
            {renderContent()}
        </div>
    </main>
  );
};

export default App;