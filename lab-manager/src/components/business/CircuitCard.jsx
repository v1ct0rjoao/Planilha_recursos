import React from 'react';
import { 
  Clock, Link2, ArrowRightLeft, CheckSquare, Wrench, Trash2, 
  BatteryCharging, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import HighlightText from '../ui/HighlightText';
import { formatDataCurta } from '../../utils/helpers';

const CircuitCard = ({ circuit, searchTerm, onDelete, onToggleMaintenance, onViewHistory, onMove, onLink }) => {
  const rawStatus = circuit.status ? circuit.status.toString().toLowerCase().trim() : 'free';
  
  // Lógica corrigida: Se acabou o tempo (100% ou finished), ele vira Livre automaticamente na tela
  const hasEnded = rawStatus === 'finished' || (circuit.progress >= 100);
  const isMaint = rawStatus === 'maintenance';
  const isFree = (rawStatus === 'free' || hasEnded) && !isMaint;
  const isRunning = rawStatus === 'running' && !hasEnded && !isMaint;
  const isParallel = circuit.isParallel;

  const theme = {
    running: { 
      borderLeft: 'border-l-amber-400', textStatus: 'text-amber-500', 
      bar: 'bg-amber-400', iconColor: 'text-amber-500', statusText: 'EM ANDAMENTO' 
    },
    maintenance: { 
      borderLeft: 'border-l-rose-500', textStatus: 'text-rose-500', 
      bar: 'bg-rose-500', iconColor: 'text-rose-500', statusText: 'MANUTENÇÃO' 
    },
    free: { 
      borderLeft: 'border-l-emerald-400', textStatus: 'text-emerald-500', 
      bar: 'bg-emerald-400', iconColor: 'text-emerald-500', statusText: 'DISPONÍVEL' 
    }
  };

  const statusKey = isRunning ? 'running' : isMaint ? 'maintenance' : 'free';
  const style = theme[statusKey];

  const isHit = searchTerm && searchTerm.length > 2 && (
    (circuit.batteryId && circuit.batteryId.toUpperCase().includes(searchTerm)) ||
    (circuit.id.toUpperCase().includes(searchTerm))
  );

  return (
    <div className={`relative flex flex-col justify-between p-2 rounded-lg bg-white shadow-sm border transition-all hover:shadow-md h-full ${style.borderLeft} ${isHit ? 'bg-slate-50' : ''}`}>
      
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-base font-bold text-slate-700 leading-none flex items-center gap-1">
          CIRC. <HighlightText text={circuit.id} highlight={searchTerm} className="" />
          {isParallel && <Link2 size={12} className="text-purple-500" title="Em paralelo" />}
        </h3>
        
        <div className="flex gap-1">
          <button onClick={() => onViewHistory(circuit)} className="text-slate-300 hover:text-blue-500" title="Histórico">
            <Clock size={14} />
          </button>
          
          <button onClick={() => onLink(circuit)} title="Criar Paralelo" className="text-slate-300 hover:text-purple-500">
            <Link2 size={14} />
          </button>
          
          {!isMaint && (
            <button onClick={() => onMove(circuit.id)} title="Mover" className="text-slate-300 hover:text-blue-600">
              <ArrowRightLeft size={14} />
            </button>
          )}
          
          {isRunning && (
            // AQUI ESTÁ A CORREÇÃO: O botão agora envia 'free' para o banco, limpando o circuito!
            <button onClick={() => onToggleMaintenance(circuit.id, 'free')} className="text-slate-300 hover:text-emerald-500" title="Liberar Circuito">
              <CheckSquare size={14} />
            </button>
          )}
          
          {(isFree || isMaint) && (
            <button 
              onClick={() => onToggleMaintenance(circuit.id, isMaint ? 'free' : 'maintenance')} 
              className={`text-slate-300 ${isMaint ? 'text-rose-500' : 'hover:text-amber-500'}`}
              title={isMaint ? "Sair da Manutenção" : "Entrar em Manutenção"}
            >
              <Wrench size={14} />
            </button>
          )}
          
          {isFree && (
            <button onClick={() => onDelete(circuit.id)} className="text-slate-300 hover:text-rose-500" title="Excluir">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {isRunning ? (
        <div className="flex-1 flex flex-col justify-end">
          <div className="flex items-center gap-1 mb-1">
            <BatteryCharging size={14} className={style.iconColor} />
            <span className="font-bold text-xs text-slate-800 truncate" title={circuit.batteryId}>
              {circuit.batteryId && circuit.batteryId !== "Desconhecido" ? 
                <HighlightText text={circuit.batteryId} highlight={searchTerm} /> : "---"}
            </span>
          </div>
          
          <div className="mb-2 pl-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block truncate">
              {circuit.protocol || "N/A"}
            </span>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] font-bold text-slate-600">{circuit.progress}%</span>
              <span className={`text-[8px] font-black uppercase tracking-wider ${style.textStatus}`}>{style.statusText}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${style.bar}`} 
                style={{ width: `${circuit.progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-[8px] font-mono font-bold text-slate-400 border-t border-slate-100 pt-1 mt-auto">
            <span>I: {formatDataCurta(circuit.startTime)}</span>
            <span>P: {formatDataCurta(circuit.previsao)}</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center opacity-70 py-2">
          {isMaint ? (
            <>
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">MANUTENÇÃO</span>
              <AlertTriangle size={20} className="text-rose-300" />
            </>
          ) : (
            <>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">DISPONÍVEL</span>
              <CheckCircle2 size={20} className="text-emerald-300" />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CircuitCard;