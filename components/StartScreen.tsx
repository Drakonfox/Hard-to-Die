import React from 'react';
import { Difficulty } from '../types';
import { DIFFICULTY_MODIFIERS } from '../constants';

interface StartScreenProps {
  onStart: (difficulty: Difficulty) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="text-center animate-fadeIn flex flex-col items-center justify-center h-full">
      <h1 className="text-7xl font-bold text-red-500 mb-4 tracking-wider">HARD TO DIE</h1>
      <p className="text-xl text-slate-300 mb-8 max-w-2xl">
        Your goal is simple: die. Unfortunately, a group of pesky healers is determined to keep you alive. Use your abilities to end your misery before time runs out.
      </p>
      <div className="w-full max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-cyan-400 mb-6">Choose Your Suffering</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {(Object.keys(DIFFICULTY_MODIFIERS) as Difficulty[]).map(difficulty => (
            <button
              key={difficulty}
              onClick={() => onStart(difficulty)}
              className="flex flex-col text-left p-6 bg-slate-800 rounded-lg border-2 border-slate-700 hover:border-cyan-500 hover:bg-slate-700 transition-all duration-200 transform hover:-translate-y-1"
            >
              <h3 className="text-2xl font-bold text-cyan-400 mb-2">{difficulty}</h3>
              <p className="text-slate-300 flex-grow">{DIFFICULTY_MODIFIERS[difficulty].description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StartScreen;