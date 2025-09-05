import React from 'react';
import { Consumable } from '../types';

interface ConsumableBarProps {
  consumables: Consumable[];
  onUse: (consumable: Consumable) => void;
}

const ConsumableBar: React.FC<ConsumableBarProps> = ({ consumables, onUse }) => {
  if (consumables.length === 0) {
    return null; // Don't render if there are no items
  }

  return (
    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
      <h2 className="text-xl font-bold text-slate-200 mb-3 text-center">Consumables</h2>
      <div className="flex flex-wrap justify-center gap-4">
        {consumables.map(item => (
          <button
            key={item.instanceId}
            onClick={() => onUse(item)}
            title={`${item.name}\n${item.description}`}
            className="w-16 h-16 bg-slate-800 rounded-lg border-2 border-slate-700
                       flex items-center justify-center text-4xl
                       hover:border-cyan-500 hover:bg-slate-700 transition-all duration-200 transform hover:-translate-y-1"
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ConsumableBar;
