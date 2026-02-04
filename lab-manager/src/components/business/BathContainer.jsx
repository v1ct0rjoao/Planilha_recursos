//Esse componente agrupa a lógica de um banho específico (temperatura, botões de adicionar circuito, lista de cards).

import React, { useState, useEffect } from 'react';
import { 
  Edit2, Trash2, Save, XCircle, 
  Activity, CheckCircle, Wrench, Plus 
} from 'lucide-react';

import CircuitCard from './CircuitCard';
import LocationIcon from './LocationIcon'; 

const BathContainer = ({ bath, searchTerm, onAddCircuit, onUpdateTemp, onDeleteCircuit, onToggleMaintenance, onDeleteBath, onViewHistory, onMoveCircuit, onLinkCircuit, onEditBath }) => {
  const [isEditingTemp, setIsEditingTemp] = useState(false);
  const [tempValue, setTempValue] = useState(bath.temp);

  useEffect(() => { setTempValue(bath.temp); }, [bath.temp]);

  // Cálculos de contagem
  const runningCount = bath.circuits ? bath.circuits.filter(c => { 
    const s = c.status ? c.status.toLowerCase().trim() : ''; 
    return s === 'running' && (c.progress < 100); 
  }).length : 0;
  
  const freeCount = bath.circuits ? bath.circuits.filter(c => { 
    const s = c.status ? c.status.toLowerCase().trim() : 'free'; 
    return (s === 'free' || s === 'finished' || c.progress >= 100) && s !== 'maintenance'; 
  }).length : 0;
  
  const maintCount = bath.circuits ? bath.circuits.filter(c => c.status === 'maintenance').length : 0;
  
  const handleSaveTemp = () => { onUpdateTemp(bath.id, tempValue); setIsEditingTemp(false); };

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-6 transition-all hover:border-blue-300 hover:shadow-sm">
      {/* Cabeçalho do Banho */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-700 p-2 rounded-md">
            <LocationIcon id={bath.id} size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-lg">{bath.id}</h3>
              <button onClick={() => onEditBath(bath.id)} className="text-slate-300 hover:text-blue-500 transition-opacity p-1" title="Editar Nome/Tipo">
                <Edit2 size={14} />
              </button>
              <button onClick={() => onDeleteBath(bath.id)} className="text-slate-300 hover:text-rose-500 transition-opacity p-1">
                <Trash2 size={14} />
              </button>
            </div>
            
            {/* Edição de Temperatura */}
            <div className="flex items-center gap-2 mt-1 h-6">
              {isEditingTemp ? (
                <div className="flex items-center gap-1 animate-in fade-in duration-200">
                  <input type="number" value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="w-12 px-1 py-0.5 text-xs border border-blue-400 rounded focus:outline-none" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveTemp()} />
                  <span className="text-xs font-medium text-slate-500">ºC</span>
                  <button onClick={handleSaveTemp} className="text-emerald-600 hover:bg-emerald-50 p-0.5 rounded"><Save size={14} /></button>
                  <button onClick={() => setIsEditingTemp(false)} className="text-rose-500 hover:bg-rose-50 p-0.5 rounded"><XCircle size={14} /></button>
                </div>
              ) : (
                <div className="group flex items-center gap-2 cursor-pointer" onClick={() => setIsEditingTemp(true)}>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-transparent group-hover:border-blue-200 group-hover:text-blue-600 transition-all">SET: {bath.temp}ºC</span>
                  <Edit2 size={10} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumo de Status */}
        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-[10px] font-bold">
            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100"><Activity size={10} /> {runningCount}</span>
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100"><CheckCircle size={10} /> {freeCount}</span>
            <span className={`flex items-center gap-1 px-2 py-1 rounded border ${maintCount > 0 ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}><Wrench size={10} /> {maintCount}</span>
          </div>
          <button onClick={() => onAddCircuit(bath.id)} className="flex items-center gap-1 text-xs font-bold text-blue-600 border border-blue-200 bg-white px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors shadow-sm">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Grid de Circuitos */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {bath.circuits && bath.circuits.map(circuit => (
          <CircuitCard 
            key={circuit.id} 
            circuit={circuit} 
            searchTerm={searchTerm} 
            onDelete={(cid) => onDeleteCircuit(bath.id, cid)} 
            onToggleMaintenance={(cid, isMaint) => onToggleMaintenance(bath.id, cid, isMaint)} 
            onViewHistory={onViewHistory} 
            onMove={(cid) => onMoveCircuit(bath.id, cid)} 
            onLink={(c) => onLinkCircuit(bath, c.id)} 
          />
        ))}
        {(!bath.circuits || bath.circuits.length === 0) && (
          <div className="col-span-full py-6 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg text-xs italic">Nenhum circuito neste local.</div>
        )}
      </div>
    </div>
  );
};

export default BathContainer;