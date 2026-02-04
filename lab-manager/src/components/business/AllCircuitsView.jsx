//Essa é a tela que mostra todos os cartões soltos, sem agrupar por banho.


import React, { useState } from 'react';
import { Activity, Search } from 'lucide-react';
import CircuitCard from './CircuitCard';

const AllCircuitsView = ({ baths, searchTerm, onToggleMaintenance, onDeleteCircuit, onViewHistory }) => {
  //  pega todos os circuitos de todos os banhos e coloca num array só
  const allCircuits = baths.flatMap(b => b.circuits ? b.circuits.map(c => ({ ...c, parentBathId: b.id })) : []);
  
  // Ordenação numérica
  allCircuits.sort((a, b) => {
    const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const [filter, setFilter] = useState('ALL');

  // Filtragem (Todos, Rodando, Livres, Manutenção) + Busca por texto
  const filtered = allCircuits.filter(c => {
    const s = c.status ? c.status.toLowerCase().trim() : 'free';
    const isFinished = s === 'finished' || (c.progress >= 100);

    let matchesTab = true;
    if (filter === 'RUNNING') matchesTab = (s === 'running' && !isFinished);
    else if (filter === 'FREE') matchesTab = ((s === 'free' || isFinished) && s !== 'maintenance');
    else if (filter === 'MAINT') matchesTab = s === 'maintenance';

    if (!matchesTab) return false;

    if (searchTerm && searchTerm.trim().length > 0) {
      const term = searchTerm.toUpperCase().trim();
      const matchesId = c.id.toString().toUpperCase().includes(term);
      const matchesBattery = c.batteryId && c.batteryId.toUpperCase().includes(term);

      if (!matchesId && !matchesBattery) return false;
    }

    return true;
  });

  return (
    <div className="animate-in fade-in zoom-in duration-300 relative h-full flex flex-col">
      <div className="sticky top-0 z-30 bg-slate-100/95 backdrop-blur-sm border-b border-slate-200 shadow-sm p-4 mb-4 -mx-4 px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Visão Geral de Circuitos</h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2"><Activity size={14} /> Monitoramento em tempo real.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          {['ALL', 'RUNNING', 'FREE', 'MAINT'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === f ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-blue-600'}`}>
              {f === 'ALL' ? 'Todos' : f === 'RUNNING' ? 'Em Uso' : f === 'FREE' ? 'Livres' : 'Manutenção'}
            </button>
          ))}
        </div>
      </div>

      <div className="custom-scrollbar overflow-y-auto pr-2 pb-10 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {filtered.map(c => (
            <CircuitCard
              key={`${c.parentBathId}-${c.id}`}
              circuit={c}
              searchTerm={searchTerm}
              onDelete={(cid) => onDeleteCircuit(c.parentBathId, cid)}
              onToggleMaintenance={(cid, isMaint) => onToggleMaintenance(c.parentBathId, cid, isMaint)}
              onViewHistory={onViewHistory}
              onMove={() => { }}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="font-medium">
                {searchTerm ? `Nenhum circuito encontrado para "${searchTerm}"` : "Nenhum circuito nesta categoria."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllCircuitsView;