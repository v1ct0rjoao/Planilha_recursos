import React, { useState, useMemo } from 'react';
import CircuitCard from './CircuitoCard';

const AllCircuitsView = ({ baths, searchTerm, onToggleMaintenance, onDeleteCircuit, onViewHistory, onToggleNoSpace }) => {
  const [filter, setFilter] = useState('ALL');

  const filtered = useMemo(() => {
    const all = (baths || []).flatMap(b => 
      (b.circuits || []).map(c => ({ ...c, parentBathId: b.id }))
    );

    all.sort((a, b) => {
      const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    const term = searchTerm?.toUpperCase().trim();

    return all.filter(c => {
      const s = c.status ? c.status.toLowerCase().trim() : 'free';
      const isFinished = s === 'finished' || (c.progress >= 100);

      let matchesTab = true;
      if (filter === 'RUNNING') matchesTab = (s === 'running' && !isFinished);
      else if (filter === 'FREE') matchesTab = ((s === 'free' || isFinished) && s !== 'maintenance');
      else if (filter === 'MAINT') matchesTab = s === 'maintenance';

      if (!matchesTab) return false;

      if (term) {
        return c.id.toUpperCase().includes(term) || 
               (c.batteryId && c.batteryId.toUpperCase().includes(term)) ||
               c.parentBathId.toUpperCase().includes(term) ||
               (c.protocol && c.protocol.toUpperCase().includes(term));
      }
      return true;
    });
  }, [baths, searchTerm, filter]);

  const counts = useMemo(() => {
    let r = 0, f = 0, m = 0;
    (baths || []).forEach(b => {
      (b.circuits || []).forEach(c => {
        const s = c.status ? c.status.toLowerCase().trim() : 'free';
        if (s === 'maintenance') m++;
        else if (s === 'running' && c.progress < 100) r++;
        else f++;
      });
    });
    return { all: r + f + m, running: r, free: f, maint: m };
  }, [baths]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 transition-colors">
      
      <div className="mb-6 flex gap-3 overflow-x-auto custom-scrollbar pb-2 items-center">
        <i className="fa-solid fa-filter text-slate-400 dark:text-slate-500 mr-1 shrink-0 transition-colors"></i>
        {[
          { id: 'ALL', label: 'Todos', count: counts.all },
          { id: 'RUNNING', label: 'Em Uso', count: counts.running },
          { id: 'FREE', label: 'Livres', count: counts.free },
          { id: 'MAINT', label: 'Manutenção', count: counts.maint }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border-b-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              filter === tab.id
                ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-600 dark:border-blue-500 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] transition-colors ${filter === tab.id ? 'bg-blue-200/50 dark:bg-blue-500/30 text-blue-800 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 content-start">
        {filtered.map(c => (
          <CircuitCard
            key={`${c.parentBathId}-${c.id}`}
            circuit={c}
            searchTerm={searchTerm}
            onDelete={(cid) => onDeleteCircuit(c.parentBathId, cid)}
            onToggleMaintenance={(cid, isMaint) => onToggleMaintenance(c.parentBathId, cid, isMaint)}
            onViewHistory={onViewHistory}
            onMove={() => { }}
            onToggleNoSpace={onToggleNoSpace}
          />
        ))}
        
        {filtered.length === 0 && (
          <div className="col-span-full mt-8 py-20 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2rem] bg-slate-50 dark:bg-slate-800/30 transition-colors">
            <div className="bg-white dark:bg-slate-900 w-20 h-20 rounded-3xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 mb-6 transition-colors">
               <i className="fa-solid fa-magnifying-glass text-3xl text-slate-300 dark:text-slate-600"></i>
            </div>
            <p className="font-bold text-slate-600 dark:text-slate-300 text-xl tracking-tight transition-colors">
              {searchTerm ? `Nenhum circuito encontrado para "${searchTerm}"` : "Nenhum circuito nesta categoria."}
            </p>
            <p className="text-sm font-medium mt-2">Tente ajustar seus filtros ou termos de busca.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllCircuitsView;