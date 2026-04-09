import React from 'react';
import { Trash2, Package, PackageX } from 'lucide-react';
import LocationIcon from './IconesLocais';
import { getLocationType } from '../../utils/helpers';

const BathCardMicro = ({ bath, onClick, onDelete, onToggleFull }) => {
  // Lógica para contar os status 
  const running = bath.circuits ? bath.circuits.filter(c => { 
    const s = c.status ? c.status.toLowerCase().trim() : ''; 
    return s === 'running' && (c.progress < 100); 
  }).length : 0;

  const free = bath.circuits ? bath.circuits.filter(c => { 
    const s = c.status ? c.status.toLowerCase().trim() : 'free'; 
    return (s === 'free' || s === 'finished' || c.progress >= 100) && s !== 'maintenance'; 
  }).length : 0;

  const maint = bath.circuits ? bath.circuits.filter(c => c.status === 'maintenance').length : 0;

  // Verifica se a propriedade 'Lotado' foi ativada
  const isFull = bath.isFull === true;

  
  let blobColor = 'bg-slate-500 dark:bg-slate-600';
  if (isFull) blobColor = 'bg-slate-600 dark:bg-slate-500'; 
  else if (maint > 0 && maint >= running && maint >= free) blobColor = 'bg-rose-500 dark:bg-rose-600';
  else if (running > free) blobColor = 'bg-amber-500 dark:bg-amber-600';
  else blobColor = 'bg-emerald-500 dark:bg-emerald-600';

  return (
    <div 
      onClick={onClick} 
      className={`rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group p-3 flex flex-col h-28 justify-between relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isFull ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500'}`}
    >
      
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 pointer-events-none transition-colors ${blobColor}`}></div>
      
      <div className="flex justify-between items-start z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 flex items-center gap-1 transition-colors">
            {getLocationType(bath.id)}
            
            {isFull && <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 rounded-sm text-[8px] transition-colors">LOTADO</span>}
          </span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-200 leading-tight break-all max-w-[120px] transition-colors">
            {bath.id.replace(/^(BANHO|SALA|THERMOTRON) - /, '')}
          </span>
        </div>
        
        <div className="flex gap-1">
          
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFull && onToggleFull(bath.id, !isFull); }} 
            className={`p-1 transition-colors focus:outline-none rounded ${isFull ? 'text-slate-600 dark:text-slate-400 opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700' : 'text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title={isFull ? "Liberar Espaço" : "Marcar como Lotado (Sem Espaço)"}
          >
            {isFull ? <PackageX size={14} /> : <Package size={14} />}
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(bath.id); }} 
            className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-colors focus:outline-none rounded hover:bg-rose-50 dark:hover:bg-rose-500/20"
            title="Excluir"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between z-10 mt-2">
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 px-2 py-1 rounded-md transition-colors">
          <LocationIcon id={bath.id} size={12} className="text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors">{bath.temp}ºC</span>
        </div>
        
        <div className="flex gap-2">
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-bold text-amber-600 dark:text-amber-500 uppercase transition-colors">Uso</span>
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 transition-colors">{running}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-500 uppercase transition-colors">Livre</span>
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 transition-colors">{free}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-bold text-rose-600 dark:text-rose-500 uppercase transition-colors">Man</span>
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 transition-colors">{maint}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BathCardMicro;