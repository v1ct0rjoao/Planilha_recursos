import React from 'react';
import { Calculator, ClipboardList, Clock } from 'lucide-react';

const ValidationCard = ({ medias }) => {
  if (!medias) return null;
  
  const getPct = (val) => medias.total_dias > 0 ? ((val / medias.total_dias) * 100).toFixed(1) : '0.0';
  
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm mb-6 border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Médias */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <Calculator size={16} className="text-blue-600" /> Médias Globais (Dias)
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
             <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Média UP</span>
              <div className="font-mono font-bold text-lg text-emerald-700">{medias.up_dias} <span className="text-xs text-emerald-500">({getPct(medias.up_dias)}%)</span></div>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-2 rounded-lg">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Média PQ</span>
              <div className="font-mono font-bold text-lg text-rose-700">{medias.pq_dias} <span className="text-xs text-rose-500">({getPct(medias.pq_dias)}%)</span></div>
            </div>
            <div className="bg-purple-50 border border-purple-100 p-2 rounded-lg">
              <span className="text-[10px] font-bold text-purple-600 uppercase">Média PP</span>
              <div className="font-mono font-bold text-lg text-purple-700">{medias.pp_dias} <span className="text-xs text-purple-500">({getPct(medias.pp_dias)}%)</span></div>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Média SD</span>
              <div className="font-mono font-bold text-lg text-amber-700">{medias.sd_dias} <span className="text-xs text-amber-500">({getPct(medias.sd_dias)}%)</span></div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-medium flex justify-between">
            <span>Circuitos Ativos: <strong>{medias.circuitos_considerados}</strong></span>
            <span>Dias no Mês: <strong>{medias.total_dias}</strong></span>
          </div>
        </div>

        {/* Lado Direito: Dados Supervisor */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <ClipboardList size={16} className="text-slate-600" /> Dados de Entrada & Tempos
          </h3>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
            {/* Tempos */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Clock size={10}/> Tempo Disponível</span>
                <span className="text-base font-mono font-bold text-slate-700">{medias.tempo_disp_calc}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Clock size={10}/> Tempo Real Utilizado</span>
                <span className="text-base font-mono font-bold text-blue-600">{medias.tempo_real_calc}</span>
              </div>
            </div>

            {/* Ensaios */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Ensaios Solicitados</span>
                <span className="text-sm font-mono font-bold text-slate-700 block">{medias.ensaios_solic}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Ensaios Executados</span>
                <span className="text-sm font-mono font-bold text-slate-700 block">{medias.ensaios_exec}</span>
              </div>
            </div>

            {/* Relatórios */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Relatórios Emitidos</span>
                <span className="text-sm font-mono font-bold text-slate-700 block">{medias.relatorios_emit}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Relatórios no Prazo</span>
                <span className="text-sm font-mono font-bold text-slate-700 block">{medias.relatorios_prazo}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationCard;