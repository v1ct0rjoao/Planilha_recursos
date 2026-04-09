import React from 'react';
import HighlightText from '../ui/HighlightText';
import { formatDataCurta } from '../../utils/helpers';

const CircuitCard = ({ circuit, searchTerm, onDelete, onToggleMaintenance, onViewHistory, onMove, onLink, onToggleNoSpace }) => {
  const rawStatus = circuit.status ? circuit.status.toString().toLowerCase().trim() : 'free';
  
  const hasEnded = rawStatus === 'finished' || (circuit.progress >= 100);
  const isMaint = rawStatus === 'maintenance';
  const isFree = (rawStatus === 'free' || hasEnded) && !isMaint;
  const isRunning = rawStatus === 'running' && !hasEnded && !isMaint;
  const isParallel = circuit.isParallel;
  
  const isNoSpace = circuit.noSpace === true; 

  const theme = {
    running: { 
      borderTop: 'border-t-amber-500', textStatus: 'text-amber-600 dark:text-amber-400', 
      bar: 'bg-amber-500', iconColor: 'text-amber-500 dark:text-amber-400', statusText: 'EM ANDAMENTO',
      mainIcon: 'fa-bolt'
    },
    maintenance: { 
      borderTop: 'border-t-rose-500', textStatus: 'text-rose-600 dark:text-rose-400', 
      bar: 'bg-rose-500', iconColor: 'text-rose-500 dark:text-rose-400', statusText: 'MANUTENÇÃO',
      mainIcon: 'fa-triangle-exclamation'
    },
    finished: { 
      borderTop: 'border-t-emerald-500', textStatus: 'text-emerald-600 dark:text-emerald-400', 
      bar: 'bg-emerald-500', iconColor: 'text-emerald-500 dark:text-emerald-400', statusText: 'CONCLUÍDO',
      mainIcon: 'fa-check'
    },
    free: { 
      borderTop: 'border-t-slate-300 dark:border-t-slate-600', textStatus: 'text-slate-500 dark:text-slate-400', 
      bar: 'bg-slate-300 dark:bg-slate-600', iconColor: 'text-slate-400 dark:text-slate-500', statusText: 'LIVRE',
      mainIcon: 'fa-power-off'
    }
  };

  const currentTheme = isMaint ? theme.maintenance : hasEnded ? theme.finished : isRunning ? theme.running : theme.free;

  const bgColor = isNoSpace 
    ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 opacity-90 grayscale-[0.2]' 
    : (isFree || isMaint) 
      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800' 
      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700';

  return (
    <div className={`relative flex flex-col rounded-xl border border-slate-200 dark:border-slate-700/60 ${bgColor} ${currentTheme.borderTop} border-t-[3px] shadow-sm hover:shadow-md transition-all duration-300 min-h-[180px] group overflow-hidden`}>
      
      {isParallel && (
        <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-[8px] font-black px-2 py-1 rounded-bl-lg shadow-sm z-10 uppercase tracking-widest">
          Paralelo
        </div>
      )}

      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 transition-colors">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isFree ? 'bg-slate-200 dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-800'} transition-colors`}>
             <i className={`fa-solid ${currentTheme.mainIcon} text-[10px] ${currentTheme.iconColor}`}></i>
          </div>
          <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight transition-colors">
            <HighlightText text={circuit.id} highlight={searchTerm} />
          </span>
        </div>
        
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
           {onToggleNoSpace && (
              <button onClick={() => onToggleNoSpace(circuit.id, !isNoSpace)} className={`w-6 h-6 flex items-center justify-center rounded text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/20 transition-colors focus:outline-none`} title={isNoSpace ? "Marcar como Com Espaço" : "Marcar como Sem Espaço"}>
                <i className={`fa-solid ${isNoSpace ? 'fa-box-open' : 'fa-box'}`}></i>
              </button>
           )}
           {onMove && <button onClick={() => onMove(circuit.id)} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-colors focus:outline-none" title="Mover"><i className="fa-solid fa-arrows-up-down-left-right"></i></button>}
           {onLink && <button onClick={() => onLink(circuit)} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 dark:text-slate-500 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/20 transition-colors focus:outline-none" title="Vincular Paralelo"><i className="fa-solid fa-link"></i></button>}
           <button onClick={() => onViewHistory(circuit)} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-colors focus:outline-none" title="Histórico"><i className="fa-solid fa-clock-rotate-left"></i></button>
           <button onClick={() => onToggleMaintenance(circuit.id, !isMaint)} className={`w-6 h-6 flex items-center justify-center rounded transition-colors focus:outline-none ${isMaint ? 'text-rose-500 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/20' : 'text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20'}`} title="Manutenção"><i className="fa-solid fa-wrench"></i></button>
           <button onClick={() => onDelete(circuit.id)} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors focus:outline-none" title="Excluir"><i className="fa-solid fa-trash-can"></i></button>
        </div>
      </div>

      {!isFree && !isMaint && !isNoSpace ? (
        <div className="flex-1 flex flex-col p-4">
          <div className="mb-2">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 block transition-colors">Bateria / Lote</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 text-sm leading-tight block break-all transition-colors" title={circuit.batteryId}>
              <HighlightText text={circuit.batteryId} highlight={searchTerm} />
            </span>
          </div>
          
          <div className="mb-auto">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 block transition-colors">Protocolo</span>
            <span className="font-semibold text-slate-600 dark:text-slate-400 text-xs truncate block transition-colors" title={circuit.protocol}>
              {circuit.protocol || '-'}
            </span>
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-xl font-black text-slate-800 dark:text-slate-200 leading-none transition-colors">{circuit.progress}%</span>
              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 ${currentTheme.textStatus} transition-colors`}>{currentTheme.statusText}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden transition-colors">
              <div className={`h-full ${currentTheme.bar} transition-all duration-1000 relative`} style={{ width: `${circuit.progress}%` }}>
                 {isRunning && <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/50 pt-2 mt-auto gap-2 transition-colors">
            <span className="truncate" title={`Início: ${formatDataCurta(circuit.startTime)}`}>I: {formatDataCurta(circuit.startTime)}</span>
            <span className="truncate text-right" title={`Previsão: ${formatDataCurta(circuit.previsao)}`}>P: {formatDataCurta(circuit.previsao)}</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center opacity-80 py-4 transition-colors">
          {isMaint ? (
            <>
              <span className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-2 transition-colors">MANUTENÇÃO</span>
              <i className="fa-solid fa-triangle-exclamation text-3xl text-rose-300 dark:text-rose-500/50 drop-shadow-sm transition-colors"></i>
            </>
          ) : isNoSpace ? (
            <>
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 text-center leading-tight transition-colors">SEM ESPAÇO<br/>FÍSICO</span>
              <i className="fa-solid fa-box-open text-3xl text-slate-300 dark:text-slate-600 drop-shadow-sm transition-colors"></i>
            </>
          ) : (
            <>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 transition-colors">LIVRE</span>
              <i className="fa-solid fa-power-off text-3xl text-slate-200 dark:text-slate-700 drop-shadow-sm transition-colors"></i>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CircuitCard;