import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Save, XCircle, Activity, CheckCircle, Wrench, Plus } from 'lucide-react';
import CircuitCard from './CircuitoCard';
import LocationIcon from './IconesLocais'; 

const BathContainer = ({ bath, searchTerm, onAddCircuit, onUpdateTemp, onDeleteCircuit, onToggleMaintenance, onDeleteBath, onViewHistory, onMoveCircuit, onLinkCircuit, onEditBath, onToggleNoSpace }) => {
  const [isEditingTemp, setIsEditingTemp] = useState(false);
  const [tempValue, setTempValue] = useState(bath.temp);

  useEffect(() => { setTempValue(bath.temp); }, [bath.temp]);

  const runningCount = bath.circuits ? bath.circuits.filter(c => { 
    const s = c.status ? c.status.toLowerCase().trim() : ''; 
    return s === 'running' && (c.progress < 100); 
  }).length : 0;
  
  const freeCount = bath.circuits ? bath.circuits.filter(c => { 
    const s = c.status ? c.status.toLowerCase().trim() : 'free'; 
    return (s === 'free' || s === 'finished' || c.progress >= 100) && s !== 'maintenance'; 
  }).length : 0;

  const maintCount = bath.circuits ? bath.circuits.filter(c => c.status === 'maintenance').length : 0;

  const filteredCircuits = (bath.circuits || []).filter(c => {
    if (!searchTerm || searchTerm.length < 2) return true;
    const term = searchTerm.toUpperCase();
    return (c.id.toUpperCase().includes(term)) || (c.batteryId && c.batteryId.toUpperCase().includes(term));
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 transition-colors flex flex-col">
      <div className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 p-6 sm:px-8 sm:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center shadow-sm text-slate-500 dark:text-slate-400 transition-colors">
             <LocationIcon id={bath.id} size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2 transition-colors">
                {bath.id}
                <button onClick={() => onEditBath(bath.id)} className="text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none"><Edit2 size={14}/></button>
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">Temp:</span>
              {isEditingTemp ? (
                <div className="flex items-center gap-1">
                  <input type="number" value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="w-16 px-2 py-0.5 text-xs font-bold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" autoFocus />
                  <button onClick={() => { onUpdateTemp(bath.id, tempValue); setIsEditingTemp(false); }} className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 p-1 rounded focus:outline-none"><Save size={14}/></button>
                  <button onClick={() => { setTempValue(bath.temp); setIsEditingTemp(false); }} className="text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 p-1 rounded focus:outline-none"><XCircle size={14}/></button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300 transition-colors">{bath.temp}ºC</span>
                  <button onClick={() => setIsEditingTemp(true)} className="text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded focus:outline-none"><Edit2 size={12}/></button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
            <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 px-2 py-1 rounded border transition-colors ${runningCount > 0 ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700'}`}><Activity size={10} /> {runningCount}</span>
            <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 px-2 py-1 rounded border transition-colors ${freeCount > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700'}`}><CheckCircle size={10} /> {freeCount}</span>
            <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 px-2 py-1 rounded border transition-colors ${maintCount > 0 ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700'}`}><Wrench size={10} /> {maintCount}</span>
          </div>
          <button onClick={() => onAddCircuit(bath.id)} className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 content-start">
        {filteredCircuits.map(circuit => (
          <CircuitCard 
            key={circuit.id} 
            circuit={circuit} 
            searchTerm={searchTerm} 
            onDelete={(cid) => onDeleteCircuit(bath.id, cid)} 
            onToggleMaintenance={(cid, isMaint) => onToggleMaintenance(bath.id, cid, isMaint)} 
            onViewHistory={onViewHistory} 
            onMove={(cid) => onMoveCircuit(bath.id, cid)} 
            onLink={(c) => onLinkCircuit({ ...c, bathId: bath.id })}
            onToggleNoSpace={onToggleNoSpace}
          />
        ))}
      </div>
    </div>
  );
};

export default BathContainer;