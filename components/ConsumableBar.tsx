import React from 'react';
import { Consumable } from '../types';
import { MAX_CONSUMABLES } from '../constants';

interface ConsumableBarProps {
  consumables: Consumable[];
  onUse: (consumableId: string) => void;
}

const ConsumableBar: React.FC<ConsumableBarProps> = ({ consumables, onUse }) => {
  const slots = Array(MAX_CONSUMABLES).fill(null);
  consumables.forEach((item, index) => {
    if (index < MAX_CONSUMABLES) {
      slots[index] = item;
    }
  });

  return (
    <div>
        <h2 className="text-2xl font-bold mb-4 text-center">Consumabili</h2>
        <div className="flex justify-center items-center gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700 min-h-[100px]">
        {slots.map((item, index) => 
            item ? (
                <button
                    key={item.id}
                    onClick={() => onUse(item.id)}
                    disabled={item.quantity <= 0}
                    title={`${item.name} - ${item.description}`}
                    className="relative w-20 h-20 bg-slate-900 rounded-lg border-2 border-slate-600 flex flex-col items-center justify-center
                            hover:enabled:border-yellow-400 hover:enabled:bg-slate-800 transition-all
                            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="text-4xl">{item.icon}</span>
                    <span className="text-sm font-bold">{item.name}</span>
                    {item.quantity > 0 && (
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-slate-900 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm border-2 border-slate-700">
                        {item.quantity}
                    </div>
                    )}
                </button>
            ) : (
                <div key={`empty-${index}`}
                     className="w-20 h-20 bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center"
                >
                    <span className="text-slate-600 text-3xl">+</span>
                </div>
            )
        )}
        </div>
    </div>
  );
};

export default ConsumableBar;