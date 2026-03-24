import React from 'react';
import { 
  Clock, Link2, ArrowRightLeft, CheckSquare, Wrench, Trash2, 
  BatteryCharging, AlertTriangle, CheckCircle2, PackageX 
} from 'lucide-react';
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
      borderLeft: 'border-l-amber-400', textStatus: 'text-amber-500', 
      bar: 'bg-amber-400', iconColor: 'text-amber-500', statusText: 'EM ANDAMENTO' 
    },
    maintenance: { 
      borderLeft: 'border-l-rose-500', textStatus: 'text-rose-500', 
      bar: 'bg-rose-500', iconColor: 'text-rose-500', statusText: 'MANUTENÇÃO' 
    },
    no_space: { 
      borderLeft: 'border-l-slate-400', textStatus: 'text-slate-500', 
      bar: 'bg-slate-400', iconColor: 'text-slate-500', statusText: 'SEM ESPAÇO FÍSICO' 
    },
    free: { 
      borderLeft: 'border-l-emerald-400', textStatus: 'text-emerald-500', 
      bar: 'bg-emerald-400', iconColor: 'text-emerald-500', statusText: 'DISPONÍVEL' 
    }
  };

  const statusKey = isRunning ? 'running' : isMaint ? 'maintenance' : (isNoSpace ? 'no_space' : 'free');
  const style = theme[statusKey];

  const isHit = searchTerm && searchTerm.length > 2 && (
    (circuit.batteryId && circuit.batteryId.toUpperCase().includes(searchTerm)) ||
    (circuit.id.toUpperCase().includes(searchTerm))
  );

  return (
    <div className={`relative flex flex-col justify-between p-3 rounded-xl bg-white shadow-sm border transition-all hover:shadow-md h-full ${style.borderLeft} border-l-[4px] ${isHit ? 'bg-blue-50/50' : ''}`}>
      
      {/* CABEÇALHO DO CARD (Corrigido o esmagamento) */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <h3 className="text-sm font-bold text-slate-700 leading-tight flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-[10px] text-slate-400 font-bold shrink-0">CIRC.</span>
          <span className="truncate" title={circuit.id}>
            <HighlightText text={circuit.id} highlight={searchTerm} />
          </span>
          {isParallel && <Link2 size={12} className="text-purple-500 shrink-0" title="Em paralelo" />}
        </h3>
        
        <div className="flex gap-1 shrink-0 flex-wrap justify-end max-w-[50%]">
          <button onClick={() => onViewHistory(circuit)} className="text-slate-300 hover:text-blue-500 p-0.5" title="Histórico">
            <Clock size={14} />
          </button>
          
          <button onClick={() => onLink(circuit)} title="Criar Paralelo" className="text-slate-300 hover:text-purple-500 p-0.5">
            <Link2 size={14} />
          </button>
          
          {!isMaint && (
            <button onClick={() => onMove(circuit.id)} title="Mover" className="text-slate-300 hover:text-blue-600 p-0.5">
              <ArrowRightLeft size={14} />
            </button>
          )}

          {isFree && (
            <button 
              onClick={() => onToggleNoSpace && onToggleNoSpace(circuit.id, !isNoSpace)} 
              className={`p-0.5 transition-colors ${isNoSpace ? 'text-slate-600' : 'text-slate-300 hover:text-slate-600'}`}
              title={isNoSpace ? "Restaurar Espaço" : "Marcar Sem Espaço Físico"}
            >
              <PackageX size={14} />
            </button>
          )}
          
          {isRunning && (
            <button onClick={() => onToggleMaintenance(circuit.id, 'free')} className="text-slate-300 hover:text-emerald-500 p-0.5" title="Liberar Circuito">
              <CheckSquare size={14} />
            </button>
          )}
          
          {(isFree || isMaint) && (
            <button 
              onClick={() => onToggleMaintenance(circuit.id, isMaint ? 'free' : 'maintenance')} 
              className={`p-0.5 ${isMaint ? 'text-rose-500' : 'text-slate-300 hover:text-amber-500'}`}
              title={isMaint ? "Sair da Manutenção" : "Entrar em Manutenção"}
            >
              <Wrench size={14} />
            </button>
          )}
          
          {isFree && (
            <button onClick={() => onDelete(circuit.id)} className="text-slate-300 hover:text-rose-500 p-0.5" title="Excluir">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {isRunning ? (
        <div className="flex-1 flex flex-col justify-end">
          
          {/* BATERIA E PROTOCOLO (Com truncate para não quebrar linha) */}
          <div className="flex items-center gap-1.5 mb-1 min-w-0">
            <BatteryCharging size={14} className={`shrink-0 ${style.iconColor}`} />
            <span className="font-bold text-xs text-slate-800 truncate" title={circuit.batteryId}>
              {circuit.batteryId && circuit.batteryId !== "Desconhecido" ? 
                <HighlightText text={circuit.batteryId} highlight={searchTerm} /> : "---"}
            </span>
          </div>
          
          <div className="mb-3 pl-5 min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block truncate" title={circuit.protocol}>
              {circuit.protocol || "N/A"}
            </span>
          </div>
          
          {/* BARRA DE PROGRESSO */}
          <div className="mb-2">
            <div className="flex justify-between items-end mb-1 gap-2">
              <span className="text-[10px] font-bold text-slate-600 shrink-0">{circuit.progress}%</span>
              <span className={`text-[8px] font-black uppercase tracking-wider truncate text-right ${style.textStatus}`} title={style.statusText}>
                {style.statusText}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${style.bar}`} 
                style={{ width: `${circuit.progress}%` }}
              ></div>
            </div>
          </div>
          
          {/* DATAS (Com gap e truncate) */}
          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400 border-t border-slate-100 pt-1.5 mt-auto gap-2">
            <span className="truncate" title={`Início: ${formatDataCurta(circuit.startTime)}`}>I: {formatDataCurta(circuit.startTime)}</span>
            <span className="truncate text-right" title={`Previsão: ${formatDataCurta(circuit.previsao)}`}>P: {formatDataCurta(circuit.previsao)}</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center opacity-70 py-3">
          {isMaint ? (
            <>
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1.5">MANUTENÇÃO</span>
              <AlertTriangle size={22} className="text-rose-300" />
            </>
          ) : isNoSpace ? (
            <>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center leading-tight">SEM ESPAÇO<br/>FÍSICO</span>
              <PackageX size={22} className="text-slate-300 mt-1" />
            </>
          ) : (
            <>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">DISPONÍVEL</span>
              <CheckCircle2 size={22} className="text-emerald-300" />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CircuitCard;