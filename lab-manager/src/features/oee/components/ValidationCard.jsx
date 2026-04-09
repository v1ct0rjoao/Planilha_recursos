import React from 'react';
import { Calculator, ClipboardList, Clock } from 'lucide-react';

const ValidationCard = ({ medias }) => {
  if (!medias) return null;
  
  const getPct = (val) => medias.total_dias > 0 ? ((val / medias.total_dias) * 100).toFixed(1) : '0.0';
  
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm dark:shadow-none mb-6 border border-slate-200 dark:border-slate-800 transition-colors animate-in fade-in slide-in-from-bottom-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
            <Calculator size={16} className="text-blue-600 dark:text-blue-400" /> Médias Globais (Dias)
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
             <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-2 rounded-lg transition-colors">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Média UP</span>
              <div className="font-mono font-bold text-lg text-emerald-700 dark:text-emerald-300">{medias.up_dias} <span className="text-xs text-emerald-500 dark:text-emerald-400/70">dias</span></div>
             </div>
             <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-2 rounded-lg transition-colors">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Média PQ</span>
              <div className="font-mono font-bold text-lg text-rose-700 dark:text-rose-300">{medias.pq_dias} <span className="text-xs text-rose-500 dark:text-rose-400/70">dias</span></div>
             </div>
             <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 p-2 rounded-lg transition-colors">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Média PP</span>
              <div className="font-mono font-bold text-lg text-purple-700 dark:text-purple-300">{medias.pp_dias} <span className="text-xs text-purple-500 dark:text-purple-400/70">dias</span></div>
             </div>
             <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-2 rounded-lg transition-colors">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Média SD</span>
              <div className="font-mono font-bold text-lg text-amber-700 dark:text-amber-300">{medias.sd_dias} <span className="text-xs text-amber-500 dark:text-amber-400/70">dias</span></div>
             </div>
          </div>
          <div className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 transition-colors">
             <div className="flex flex-col">
               <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Tempo Disp.</span>
               <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{medias.tempo_disp_calc}</span>
             </div>
             <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
             <div className="flex flex-col text-right">
               <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Tempo Real</span>
               <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{medias.tempo_real_calc}</span>
             </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
            <ClipboardList size={16} className="text-blue-600 dark:text-blue-400" /> Conversão (Geral)
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 transition-colors">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Ensaios Solicitados</span>
              <span className="font-mono font-bold text-slate-800 dark:text-white">{medias.ensaios_solic}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20 transition-colors">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Ensaios Executados</span>
              <span className="font-mono font-bold text-blue-800 dark:text-blue-300">{medias.ensaios_exec}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 transition-colors">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Rel. Emitidos</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">{medias.relatorios_emit}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 transition-colors">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Rel. no Prazo</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{medias.relatorios_prazo}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ValidationCard;