
import React from 'react';
import { EventLogMessage } from '../types';

interface EventLogProps {
  log: EventLogMessage[];
}

const EventLog: React.FC<EventLogProps> = ({ log }) => {
  
  const getTextColor = (type: EventLogMessage['type']) => {
    switch(type) {
        case 'damage': return 'text-red-400';
        case 'heal': return 'text-green-400';
        case 'effect': return 'text-purple-400';
        case 'shield': return 'text-cyan-400';
        case 'info': return 'text-slate-400';
        default: return 'text-slate-300';
    }
  }

  return (
    <div className="flex flex-col">
        <h3 className="text-xl font-bold mb-2 text-center text-slate-300">Event Log</h3>
        <div className="bg-slate-900 rounded-md p-2 overflow-y-auto h-96">
            <ul className="flex flex-col-reverse gap-1">
                {log.map((item) => (
                    <li key={item.id} className={`text-sm ${getTextColor(item.type)}`}>
                        {item.message}
                    </li>
                ))}
            </ul>
        </div>
    </div>
  );
};

export default EventLog;