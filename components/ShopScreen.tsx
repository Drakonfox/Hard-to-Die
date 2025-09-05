import React from 'react';
import { observer } from 'mobx-react-lite';
import type { GameStore } from '../store';
import { ShopItem, ShopItemCategory, PlayerAction } from '../types';
import { MAX_CONSUMABLES, RARITY_DATA, REROLL_COST } from '../constants';

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
    const { ragePoints, buyShopItem, consumables, pendingShopPurchase } = store;
    const canAfford = ragePoints >= item.cost;
    
    let isDisabled = !canAfford || !!pendingShopPurchase;
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

const ReplaceActionModal: React.FC<{ store: GameStore }> = observer(({ store }) => {
    const pendingItem = store.pendingShopPurchase;
    if (!pendingItem || pendingItem.type !== 'action') return null;
    
    const newAction = pendingItem.payload as PlayerAction;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="w-full max-w-3xl bg-slate-800 p-8 rounded-xl border-2 border-slate-700 shadow-2xl">
                <h2 className="text-4xl font-bold text-center text-yellow-400 mb-4">Slot Azioni Pieno</h2>
                <p className="text-center text-slate-300 mb-2">Stai per acquistare:</p>
                <div className="text-center bg-slate-900 p-3 rounded-lg mb-6 border border-slate-600">
                    <h3 className="text-2xl font-bold text-cyan-400">{newAction.name} <span className="text-4xl">{newAction.icon}</span></h3>
                    <p className="text-slate-400 text-sm">{newAction.description}</p>
                </div>
                <p className="text-center text-slate-300 mb-4">Scegli un'azione da rimpiazzare tra quelle che possiedi:</p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {store.playerActions.map(action => (
                        <button 
                            key={action.id}
                            onClick={() => store.confirmActionReplacement(action.id)}
                            className="flex flex-col items-center justify-center p-4 bg-slate-700 rounded-lg border-2 border-slate-600 hover:border-red-500 hover:bg-slate-600 transition-all h-full"
                            title={`Rimpiazza ${action.name}`}
                        >
                             <span className="text-5xl mb-2">{action.icon}</span>
                             <h4 className="font-bold text-slate-100 text-center">{action.name}</h4>
                             <p className="text-xs text-slate-400">Lvl {action.level}</p>
                        </button>
                    ))}
                </div>

                <div className="text-center">
                    <button
                        onClick={store.cancelActionReplacement}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg text-lg transition-transform transform hover:scale-105"
                    >
                        Annulla Acquisto
                    </button>
                </div>
            </div>
        </div>
    );
});


const ShopScreen: React.FC<ShopScreenProps> = observer(({ store }) => {
  const buttonText = store.levelData === null 
    ? 'Inizia Livello 1' 
    : `Continua al Livello ${store.currentLevel + 1}`;

  const actionItems = store.shopItems.filter(item => item.type === 'action' || item.type === 'upgrade');
  const consumableItems = store.shopItems.filter(item => item.type === 'consumable');

  return (
    <>
      <ReplaceActionModal store={store} />
      <div className={`w-full max-w-6xl text-center animate-fadeIn transition-all duration-300 ${store.pendingShopPurchase ? 'pointer-events-none blur-sm' : ''}`}>
        <h1 className="text-6xl font-bold text-yellow-400 mb-4">Il Negozio della Sofferenza</h1>
        <p className="text-xl text-slate-300 mb-8">Spendi i tuoi Punti Rabbia (PR) per sbloccare nuovi modi di morire.</p>
        
        <div className="flex justify-center items-center gap-4 p-4 bg-slate-900/50 rounded-lg mb-8 border border-slate-700">
            <h2 className="text-3xl font-bold text-white">I tuoi Punti Rabbia: <span className="font-mono text-yellow-300">{store.ragePoints}</span></h2>
            <button
                onClick={store.rerollShop}
                disabled={store.ragePoints < REROLL_COST}
                className="bg-blue-600 hover:enabled:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:enabled:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed"
                title={`Costo: ${REROLL_COST} Punti Rabbia`}
            >
                Reroll ({REROLL_COST} PR)
            </button>
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
    </>
  );
});

export default ShopScreen;