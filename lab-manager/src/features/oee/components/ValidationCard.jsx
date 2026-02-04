//Componente de lógica de negócio pura para integridade de dados

import React from 'react';
import { Calculator } from 'lucide-react';

const ValidationCard = ({ medias }) => {
  if (!medias) return null;
  
  const getPct = (val) => medias.total_dias > 0 ? ((val / medias.total_dias) * 100).toFixed(1) : '0.0';
  
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm mb-6 border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
        <Calculator size={16} className="text-blue-600" /> Conferência de Cálculo (Médias Globais)
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Circuitos Ativos</span>
          <span className="font-mono font-bold text-xl text-slate-700">{medias.circuitos_considerados}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Média UP (Dias)</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono font-bold text-xl text-emerald-700">{medias.up_dias}</span>
            <span className="text-xs font-bold text-emerald-500">({getPct(medias.up_dias)}%)</span>
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1">Média PQ (Dias)</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono font-bold text-xl text-rose-700">{medias.pq_dias}</span>
            <span className="text-xs font-bold text-rose-500">({getPct(medias.pq_dias)}%)</span>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block mb-1">Média PP (Dias)</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono font-bold text-xl text-purple-700">{medias.pp_dias}</span>
            <span className="text-xs font-bold text-purple-500">({getPct(medias.pp_dias)}%)</span>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1">Média SD (Dias)</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono font-bold text-xl text-amber-700">{medias.sd_dias}</span>
            <span className="text-xs font-bold text-amber-500">({getPct(medias.sd_dias)}%)</span>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium flex justify-between items-center">
        <span>* Fórmula da Média: (Soma dos Dias de todos os circuitos) ÷ {medias.circuitos_considerados}</span>
        <span>Total Dias Mês: {medias.total_dias}</span>
      </div>
    </div>
  );
};

export default ValidationCard;