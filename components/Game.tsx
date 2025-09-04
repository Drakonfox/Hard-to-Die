// FIX: Implement the main Game component with game loop and state management.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Level, PlayerActionState, Healer, EventLogMessage, ActiveDotState, ShieldState, ActiveHotState, HealerAbility } from '../types';
import CharacterStatus from './CharacterStatus';
import ActionButton from './ActionButton';
import HealerDisplay from './HealerDisplay';
import EventLog from './EventLog';

interface GameProps {
  levelData: Level;
  playerActions: PlayerActionState[];
  setPlayerActions: React.Dispatch<React.SetStateAction<PlayerActionState[]>>;
  onLevelComplete: () => void;
  onGameOver: (win: boolean) => void;
  onTakeDamage: () => void;
}

const GAME_TICK_MS = 100;

const Game: React.FC<GameProps> = ({ levelData, playerActions, setPlayerActions, onLevelComplete, onGameOver, onTakeDamage }) => {
  const [hp, setHp] = useState(levelData.characterMaxHp);
  const [shield, setShield] = useState<ShieldState | null>(null);
  const [timer, setTimer] = useState(levelData.timer);
  const [healers, setHealers] = useState<Healer[]>(() => 
    levelData.healers.map(h => ({...h}))
  );
  const [log, setLog] = useState<EventLogMessage[]>([]);
  const logIdCounter = useRef(0);
  const prevHpRef = useRef(hp);

  const [stunTimer, setStunTimer] = useState(0);
  const [activeDots, setActiveDots] = useState<ActiveDotState[]>([]);
  const [activeHots, setActiveHots] = useState<ActiveHotState[]>([]);

  // Effect to trigger damage animation
  useEffect(() => {
    if (hp < prevHpRef.current) {
      onTakeDamage();
    }
    prevHpRef.current = hp;
  }, [hp, onTakeDamage]);

  const addLog = useCallback((message: string, type: EventLogMessage['type']) => {
    setLog(prevLog => [{ id: logIdCounter.current++, message, type }, ...prevLog.slice(0, 49)]);
  }, []);
  
  const takeDamage = useCallback((damageAmount: number) => {
    let damageToDeal = damageAmount;
    setShield(prevShield => {
        if (prevShield && prevShield.amount > 0) {
            const shieldDamage = Math.min(damageToDeal, prevShield.amount);
            damageToDeal -= shieldDamage;
            addLog(`Your shield absorbed ${shieldDamage.toFixed(0)} damage.`, 'shield');
            const newShieldAmount = prevShield.amount - shieldDamage;
            return newShieldAmount > 0 ? { ...prevShield, amount: newShieldAmount } : null;
        }
        return prevShield;
    });

    if (damageToDeal > 0) {
        setHp(prevHp => prevHp - damageToDeal);
    }
  }, [addLog]);

  // Game loop
  useEffect(() => {
    const interval = setInterval(() => {
      const timeDelta = GAME_TICK_MS / 1000;

      // Update timer & stun timer
      setTimer(prev => Math.max(0, prev - timeDelta));
      setStunTimer(prev => Math.max(0, prev - timeDelta));

      // Update player action cooldowns
      setPlayerActions(prevActions => 
        prevActions.map(action => ({
          ...action,
          currentCooldown: Math.max(0, action.currentCooldown - timeDelta)
        }))
      );

      // Update DoTs and apply damage
      setActiveDots(prevDots => {
        const stillActiveDots = [];
        for (const dot of prevDots) {
            let newTimeToNextTick = dot.timeToNextTick - timeDelta;
            if (newTimeToNextTick <= 0) {
                takeDamage(dot.damagePerTick);
                addLog(`You take ${dot.damagePerTick.toFixed(0)} damage from ${dot.id}.`, 'damage');
                newTimeToNextTick += dot.interval;
            }
            const newRemainingDuration = dot.remainingDuration - timeDelta;
            if (newRemainingDuration > 0) {
                stillActiveDots.push({ ...dot, timeToNextTick: newTimeToNextTick, remainingDuration: newRemainingDuration });
            }
        }
        return stillActiveDots;
      });

      // Update HoTs and apply healing
      setActiveHots(prevHots => {
        const stillActiveHots = [];
        for (const hot of prevHots) {
            let newTimeToNextTick = hot.timeToNextTick - timeDelta;
            if (newTimeToNextTick <= 0) {
                setHp(prevHp => Math.min(levelData.characterMaxHp, prevHp + hot.healPerTick));
                addLog(`You regenerate ${hot.healPerTick.toFixed(0)} HP from ${hot.id}.`, 'heal');
                newTimeToNextTick += hot.interval;
            }
            const newRemainingDuration = hot.remainingDuration - timeDelta;
            if (newRemainingDuration > 0) {
                stillActiveHots.push({ ...hot, timeToNextTick: newTimeToNextTick, remainingDuration: newRemainingDuration });
            }
        }
        return stillActiveHots;
      });

      // Update healers and use abilities
      setHealers(prevHealers => prevHealers.map(healer => {
        const newAbilities = healer.abilities.map(ability => {
            let newTimeToNextUse = ability.timeToNextUse - timeDelta;
            if (newTimeToNextUse <= 0) {
                // Ability triggers
                newTimeToNextUse = ability.cooldown;
                switch(ability.type) {
                    case 'direct_heal':
                        setHp(prevHp => {
                            const newHp = Math.min(levelData.characterMaxHp, prevHp + (ability.amount || 0));
                            if (newHp > prevHp) {
                                addLog(`${healer.name}'s ${ability.name} healed you for ${ability.amount} HP.`, 'heal');
                            }
                            return newHp;
                        });
                        break;
                    case 'cleanse':
                        if (activeDots.length > 0) {
                            addLog(`${healer.name}'s ${ability.name} removed your harmful effects.`, 'effect');
                            setActiveDots([]);
                        }
                        break;
                    case 'shield':
                        addLog(`${healer.name}'s ${ability.name} grants you a ${ability.amount} HP shield.`, 'shield');
                        setShield(prev => ({ amount: (prev?.amount || 0) + (ability.amount || 0) }));
                        break;
                    case 'regeneration':
                        addLog(`${healer.name}'s ${ability.name} causes you to regenerate health.`, 'heal');
                        const newHot: ActiveHotState = {
                            id: ability.id,
                            icon: ability.icon,
                            remainingDuration: ability.duration || 5,
                            healPerTick: (ability.amount || 10) / (ability.ticks || 5),
                            interval: (ability.duration || 5) / (ability.ticks || 5),
                            timeToNextTick: (ability.duration || 5) / (ability.ticks || 5),
                        };
                        setActiveHots(prev => [...prev, newHot]);
                        break;
                }
            }
            return { ...ability, timeToNextUse: newTimeToNextUse };
        });
        return { ...healer, abilities: newAbilities };
      }));

    }, GAME_TICK_MS);

    return () => clearInterval(interval);
  }, [addLog, levelData.characterMaxHp, setPlayerActions, takeDamage, activeDots.length]);

  // Check for win/loss conditions
  useEffect(() => {
    if (hp <= 0) {
      addLog('You have successfully died!', 'info');
      onLevelComplete();
    } else if (timer <= 0) {
      addLog('Time is up! You failed to die.', 'info');
      onGameOver(false);
    }
  }, [hp, timer, onLevelComplete, onGameOver, addLog]);

  const handleUseAction = useCallback((action: PlayerActionState) => {
    if (action.currentCooldown > 0 || stunTimer > 0) return;

    if(action.damage > 0) {
      takeDamage(action.damage);
      addLog(`You used '${action.name}' and dealt ${action.damage} damage to yourself.`, 'damage');
    }

    if (action.stunDuration) {
        setStunTimer(action.stunDuration);
        addLog(`You stunned yourself for ${action.stunDuration}s.`, 'effect');
    }

    if (action.dot) {
        const newDot: ActiveDotState = {
            id: action.dot.id,
            icon: action.dot.icon,
            remainingDuration: action.dot.duration,
            damagePerTick: action.dot.damage / action.dot.ticks,
            interval: action.dot.duration / action.dot.ticks,
            timeToNextTick: action.dot.duration / action.dot.ticks,
        };
        setActiveDots(prevDots => [...prevDots, newDot]);
        addLog(`You are now afflicted with ${action.dot.id}.`, 'effect');
    }

    setPlayerActions(prevActions => 
      prevActions.map(a => 
        a.id === action.id ? { ...a, currentCooldown: a.cooldown } : a
      )
    );
  }, [addLog, setPlayerActions, stunTimer, takeDamage]);

  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 animate-fadeIn">
      {stunTimer > 0 && (
          <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-50 rounded-lg">
            <h2 className="text-6xl font-bold text-yellow-400 animate-pulse">STUNNED</h2>
            <p className="text-4xl font-mono text-white mt-4">{stunTimer.toFixed(1)}s</p>
          </div>
      )}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <CharacterStatus hp={hp} maxHp={levelData.characterMaxHp} shield={shield} activeDots={activeDots} activeHots={activeHots} />
        
        <div>
          <h2 className="text-2xl font-bold mb-4 text-center">Your Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {playerActions.map(action => (
              <ActionButton 
                key={action.id} 
                action={action} 
                onUse={handleUseAction}
                disabled={action.currentCooldown > 0 || stunTimer > 0} 
              />
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4 text-center">Pesky Healers</h2>
          <HealerDisplay healers={healers} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-center">
          <h2 className="text-xl font-bold text-slate-300">Time to Die</h2>
          <p className="text-5xl font-bold text-red-500">{timer.toFixed(1)}s</p>
        </div>
        <EventLog log={log} />
      </div>
    </div>
  );
};

export default Game;