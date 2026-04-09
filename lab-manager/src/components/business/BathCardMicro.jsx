import React from 'react';
import { Trash2, Package, PackageX } from 'lucide-react';
import LocationIcon from './LocationIcon';
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

  // Lógica visual: Decide a cor baseada na maioria 
  let statusColor = 'bg-slate-100 text-slate-600';
  if (isFull) statusColor = 'bg-slate-200 text-slate-700'; 
  else if (maint > 0 && maint >= running && maint >= free) statusColor = 'bg-rose-100 text-rose-700';
  else if (running > free) statusColor = 'bg-amber-100 text-amber-700';
  else statusColor = 'bg-emerald-100 text-emerald-700';

  return (
    <div 
      onClick={onClick} 
      className={`rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group p-3 flex flex-col h-28 justify-between relative overflow-hidden ${isFull ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200 hover:border-blue-400'}`}
    >
      
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 pointer-events-none ${statusColor.replace('text', 'bg').replace('100', '500')}`}></div>
      
      <div className="flex justify-between items-start z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
            {getLocationType(bath.id)}
            {/* Tag visual de Sem Espaço */}
            {isFull && <span className="bg-slate-200 text-slate-600 px-1.5 rounded-sm text-[8px]">LOTADO</span>}
          </span>
          <span className="text-sm font-black text-slate-800 leading-tight break-all max-w-[120px]">
            {bath.id.replace(/^(BANHO|SALA|THERMOTRON) - /, '')}
          </span>
        </div>
        
        <div className="flex gap-1">
          {/* Botão para marcar o banho inteiro como Lotado */}
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFull && onToggleFull(bath.id, !isFull); }} 
            className={`p-1 transition-opacity ${isFull ? 'text-slate-600 opacity-100' : 'text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100'}`}
            title={isFull ? "Liberar Espaço" : "Marcar como Lotado (Sem Espaço)"}
          >
            {isFull ? <PackageX size={14} /> : <Package size={14} />}
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(bath.id); }} 
            className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Excluir"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between z-10 mt-2">
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
          <LocationIcon id={bath.id} size={12} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-600">{bath.temp}ºC</span>
        </div>
        
        <div className="flex gap-2">
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-bold text-amber-600 uppercase">Uso</span>
            <span className="text-xs font-black text-slate-700">{running}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-bold text-emerald-600 uppercase">Livre</span>
            <span className="text-xs font-black text-slate-700">{free}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-bold text-rose-600 uppercase">Man</span>
            <span className="text-xs font-black text-slate-700">{maint}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BathCardMicro;
