import React from 'react';
import { observer } from 'mobx-react-lite';
import type { GameStore } from '../store';

interface EndScreenProps {
  store: GameStore;
}

const EndScreen: React.FC<EndScreenProps> = observer(({ store }) => {
  const { win, restartGame } = store;
    
  return (
    <div className="text-center animate-fadeIn">
      <h1 className={`text-6xl font-bold mb-4 ${win ? 'text-green-400' : 'text-red-500'}`}>
        {win ? 'Congratulations, You Died!' : 'You Survived... Pathetic.'}
      </h1>
      <p className="text-xl text-slate-300 mb-8">
        {win ? 'You successfully ended your misery. See you in the next life (level)!' : 'The healers won. You are doomed to live another day. Try harder to fail next time.'}
      </p>
      <button 
        onClick={restartGame}
        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105"
      >
        Play Again
      </button>
    </div>
  );
});

export default EndScreen;