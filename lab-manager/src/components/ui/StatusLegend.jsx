//HTML (JSX) estático para mostrar o que significa cada cor (UP, PQ, PP, SD).


import React from 'react';
import { Info } from 'lucide-react';

const StatusLegend = () => (
  <div className="flex flex-wrap gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-xs font-bold uppercase text-slate-600 shadow-sm">
    <span className="text-slate-400 mr-2 flex items-center gap-1">
      <Info size={14} /> Legenda Visual:
    </span>
    
    <div className="flex items-center gap-1">
      <div className="w-4 h-4 bg-emerald-500 rounded shadow-sm flex items-center justify-center text-[8px] text-white">UP</div> 
      Uso Prog.
    </div>
    
    <div className="flex items-center gap-1">
      <div className="w-4 h-4 bg-rose-500 rounded shadow-sm flex items-center justify-center text-[8px] text-white">PQ</div> 
      Quebra
    </div>
    
    <div className="flex items-center gap-1">
      <div className="w-4 h-4 bg-purple-600 rounded shadow-sm flex items-center justify-center text-[8px] text-white">PP</div> 
      Planejada
    </div>
    
    <div className="flex items-center gap-1">
      <div className="w-4 h-4 bg-amber-400 rounded shadow-sm flex items-center justify-center text-[8px] text-white">SD</div> 
      Sem Demanda
    </div>
  </div>
);

export default StatusLegend;