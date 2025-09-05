// FIX: Implement the main App component to manage game state views.
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { GameStore } from './store';
import StartScreen from './components/StartScreen';
import Game from './components/Game';
import EndScreen from './components/EndScreen';
import PostLevelSummaryScreen from './components/PostLevelSummaryScreen';
import ShopScreen from './components/ShopScreen';

const App: React.FC = observer(() => {
  const [store] = useState(() => new GameStore());
  
  const renderGameState = () => {
    switch(store.gameState) {
      case 'start':
        return <StartScreen store={store} />;
      case 'playing':
        return <Game store={store} />;
      case 'level-won':
        return <PostLevelSummaryScreen store={store} />;
      case 'game-over':
        return <EndScreen store={store} />;
      case 'shop':
        return <ShopScreen store={store} />;
      default:
        return <StartScreen store={store} />;
    }
  }

  return (
    <main className="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-7xl flex items-center justify-center">
        {renderGameState()}
      </div>
    </main>
  );
});

export default App;