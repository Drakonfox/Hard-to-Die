import React from 'react';
import { observer } from 'mobx-react-lite';
import type { GameStore } from '../store';
import { ShopItem, ShopItemCategory, PlayerAction } from '../types';
import { MAX_CONSUMABLES, RARITY_DATA } from '../constants';

interface ShopScreenProps {
  store: GameStore;
}

const getCategoryStyles = (category: ShopItemCategory): string => {
    switch(category) {
        case 'Azione': return 'bg-cyan-500 text-cyan-900';
        case 'Potenziamento': return 'bg-purple-500 text-purple-900';
        case 'Consumabile': return 'bg-yellow-500 text-yellow-900';
        default: return 'bg-slate-500 text-slate-900';
    }
}


const ShopItemCard: React.FC<{ item: ShopItem, store: GameStore }> = ({ item, store }) => {
    const { ragePoints, buyShopItem, consumables } = store;
    const canAfford = ragePoints >= item.cost;
    
    let isDisabled = !canAfford;
    let buttonText = 'Acquista';

    if (item.type === 'action' && item.owned) {
        isDisabled = true;
        buttonText = 'Acquistato';
    } else if (item.type === 'upgrade') {
        buttonText = 'Potenzia';
    } else if (item.type === 'consumable') {
        const inventoryFull = consumables.length >= MAX_CONSUMABLES;
        const alreadyOwned = consumables.some(c => c.id === item.payload.id);
        if (inventoryFull && !alreadyOwned) {
            isDisabled = true;
            buttonText = 'Inventario Pieno';
        }
    }

    const isActionOrUpgrade = item.type === 'action' || item.type === 'upgrade';
    const actionPayload = isActionOrUpgrade ? (item.payload as PlayerAction) : null;
    const rarity = actionPayload?.rarity;
    const rarityInfo = rarity ? RARITY_DATA[rarity] : null;
    
    const borderColor = rarityInfo ? rarityInfo.color : 'border-slate-700';

    return (
        <div className={`relative flex flex-col text-left p-4 bg-slate-800 rounded-lg border-2 ${borderColor} transition-all ${isDisabled && !item.owned ? 'opacity-60' : ''}`}>
            
            <div className={`absolute -top-3 left-3 text-xs font-bold px-2 py-0.5 rounded-full ${getCategoryStyles(item.category)}`}>
                {item.category}
            </div>

            <div className="pt-2 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-cyan-400 mb-2">{item.name}</h3>
                <p className="text-slate-300 text-sm mb-4">{item.description}</p>
                
                {isActionOrUpgrade && rarityInfo && (
                    <div className="mb-4">
                        <span className={`font-bold ${rarityInfo.textColor}`}>{rarityInfo.name}</span>
                        {item.type === 'action' && <span className="text-slate-400 text-sm"> (Chance: {rarityInfo.chance * 100}%)</span>}
                    </div>
                )}
            </div>

            <div className="mt-auto flex justify-between items-center pt-3 border-t border-slate-700/50">
                <span className="text-xl font-bold text-yellow-400">{item.cost} PR</span>
                <button
                    onClick={() => buyShopItem(item)}
                    disabled={isDisabled}
                    className="bg-green-600 hover:enabled:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:enabled:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {buttonText}
                </button>
            </div>
        </div>
    )
}

const ShopScreen: React.FC<ShopScreenProps> = observer(({ store }) => {
  const buttonText = store.levelData === null 
    ? 'Inizia Livello 1' 
    : `Continua al Livello ${store.currentLevel + 1}`;

  const actionItems = store.shopItems.filter(item => item.type === 'action' || item.type === 'upgrade');
  const consumableItems = store.shopItems.filter(item => item.type === 'consumable');

  return (
    <div className="w-full max-w-6xl text-center animate-fadeIn">
      <h1 className="text-6xl font-bold text-yellow-400 mb-4">Il Negozio della Sofferenza</h1>
      <p className="text-xl text-slate-300 mb-8">Spendi i tuoi Punti Rabbia (PR) per sbloccare nuovi modi di morire.</p>
      
      <div className="p-4 bg-slate-900/50 rounded-lg mb-8 border border-slate-700">
          <h2 className="text-3xl font-bold text-white">I tuoi Punti Rabbia: <span className="font-mono text-yellow-300">{store.ragePoints}</span></h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Actions Column */}
        <section>
          <h2 className="text-3xl font-bold text-slate-100 mb-4 text-left">Azioni e Potenziamenti</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {actionItems.map(item => (
                <ShopItemCard 
                    key={item.id} 
                    item={item} 
                    store={store}
                />
            ))}
            {actionItems.length === 0 && <p className="text-slate-400 md:col-span-2">Non ci sono più oggetti da acquistare.</p>}
          </div>
        </section>

        {/* Consumables Column */}
        <section>
            <h2 className="text-3xl font-bold text-slate-100 mb-4 text-left">Consumabili</h2>
            <div className="grid md:grid-cols-2 gap-4">
                {consumableItems.map(item => (
                    <ShopItemCard 
                        key={item.id} 
                        item={item} 
                        store={store}
                    />
                ))}
                {consumableItems.length === 0 && <p className="text-slate-400 md:col-span-2">Nessun consumabile disponibile.</p>}
            </div>
        </section>
      </div>

      <button
        onClick={store.proceedFromShop}
        disabled={store.playerActions.length === 0}
        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-lg text-2xl transition-transform transform hover:scale-105
                   disabled:bg-slate-600 disabled:cursor-not-allowed"
        title={store.playerActions.length === 0 ? 'Devi acquistare almeno un\'azione per iniziare' : ''}
      >
        {buttonText}
      </button>
    </div>
  );
});

export default ShopScreen;