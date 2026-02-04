//A representação visual (UI) de iteração de dados (listas/tabelas).

import React from 'react';
import { Copy, Trash2, RefreshCw } from 'lucide-react';

const GridRow = ({ row, daysInMonth, onDelete, onRestore, onPreset, setToast }) => {
  const getColor = (status) => {
    switch (status) {
      case 'UP': return 'bg-emerald-500';
      case 'PQ': return 'bg-rose-500';
      case 'PP': return 'bg-purple-600';
      case 'SD': return 'bg-amber-400';
      default: return 'bg-slate-200';
    }
  };

  const stats = row.stats || { pct_up: 0, pct_pq: 0, pct_pp: 0, pct_sd: 0, tempo_disponivel: 0, tempo_real: 0, disponibilidade: 0 };
  const isEmpty = (row.is_zero_up && !row.is_ignored) || row.is_ignored;

  const handleCopyRow = () => {
    const dayString = row.day_data ? row.day_data.join('\t') : Array(daysInMonth).fill('').join('\t');
    const textToCopy = `${row.id}\t${dayString}\t${row.UP}\t${row.PQ}\t${row.PP}\t${row.SD}`;
    navigator.clipboard.writeText(textToCopy).then(() => { 
        if (setToast) setToast({ message: `Linha ${row.id} copiada!`, type: 'success' }); 
    });
  };

  return (
    <tr className={`transition-colors ${row.is_ignored ? 'bg-slate-50 opacity-40' : 'hover:bg-blue-50/20'}`}>
      <td className="px-3 py-2 font-mono font-bold text-slate-700 border-r border-slate-200 w-32 sticky left-0 bg-white z-10 shadow-sm group relative">
        <div className="flex flex-col cursor-help">
          <span className={`flex items-center gap-1 ${isEmpty ? 'text-slate-400' : 'text-blue-600 underline decoration-dotted decoration-blue-300'}`}>{row.id}</span>
          {!isEmpty && (
            <div className="absolute left-full top-0 ml-2 w-48 bg-slate-800 text-white text-[10px] p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
              <h4 className="font-bold border-b border-slate-600 pb-1 mb-2 text-emerald-400">Indicadores</h4>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Disponibilidade:</span> <span className="font-bold">{stats.disponibilidade}%</span></div>
                <div className="flex justify-between text-slate-300"><span>Tempo Disponível:</span> <span>{stats.tempo_disponivel} dias</span></div>
                <div className="flex justify-between text-slate-300"><span>Tempo Real (UP):</span> <span>{stats.tempo_real} dias</span></div>
              </div>
            </div>
          )}
          {row.is_zero_up && !row.is_ignored && <span className="text-[9px] text-slate-300 italic font-normal mt-1">Inativo</span>}
          {row.is_ignored && <span className="text-[9px] text-rose-400 font-bold border border-rose-100 px-1 rounded w-fit bg-rose-50 mt-1">EXCLUÍDO</span>}
        </div>
      </td>
      <td className="p-1 border-r border-slate-200 overflow-hidden">
        <div className="flex gap-[2px]">
          {isEmpty ? (
            Array.from({ length: daysInMonth }).map((_, i) => (<div key={i} className="w-5 h-6 border border-slate-100 bg-white rounded-[2px]" title="Sem atividade"></div>))
          ) : (
            row.day_data && row.day_data.map((status, i) => (
              <div key={i} className={`w-5 h-6 flex items-center justify-center text-[9px] font-bold text-white rounded-[2px] cursor-default transition-transform hover:scale-125 hover:z-20 ${getColor(status)}`} title={`Dia ${i + 1}: ${status}`}>{status}</div>
            ))
          )}
        </div>
      </td>
      <td className="px-1 py-2 text-center border-r border-emerald-100 bg-emerald-50/30">
        {!isEmpty ? (<div className="flex flex-col"><span className="text-xs font-bold text-emerald-700">{row.UP}</span><span className="text-[9px] text-emerald-600/70">{stats.pct_up}%</span></div>) : <span className="text-slate-200">-</span>}
      </td>
      <td className="px-1 py-2 text-center border-r border-rose-100 bg-rose-50/30">
        {!isEmpty ? (<div className="flex flex-col"><span className="text-xs font-bold text-rose-700">{row.PQ}</span><span className="text-[9px] text-rose-600/70">{stats.pct_pq}%</span></div>) : <span className="text-slate-200">-</span>}
      </td>
      <td className="px-1 py-2 text-center border-r border-purple-100 bg-purple-50/30">
        {!isEmpty ? (<div className="flex flex-col"><span className="text-xs font-bold text-purple-700">{row.PP}</span><span className="text-[9px] text-purple-600/70">{stats.pct_pp}%</span></div>) : <span className="text-slate-200">-</span>}
      </td>
      <td className="px-1 py-2 text-center border-r border-slate-200 bg-amber-50/30">
        {!isEmpty ? (<div className="flex flex-col"><span className="text-xs font-bold text-amber-700">{row.SD}</span><span className="text-[9px] text-amber-600/70">{stats.pct_sd}%</span></div>) : <span className="text-slate-200">-</span>}
      </td>
      <td className="px-2 py-2 text-right w-40">
        {!row.is_ignored ? (
          <div className="flex justify-end gap-1">
            {isEmpty ? (
              <>
                <button onClick={handleCopyRow} title="Copiar" className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors mr-1"><Copy size={14} /></button>
                <button onClick={() => onPreset(row.raw_id, 'force_up')} title="Forçar" className="px-3 py-1 text-[10px] font-bold text-slate-400 bg-white hover:bg-emerald-50 hover:text-emerald-600 rounded border border-slate-200 transition-all">Ativar</button>
                <button onClick={() => onDelete(row.raw_id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"><Trash2 size={14} /></button>
              </>
            ) : (
              <>
                <button onClick={handleCopyRow} title="Copiar" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors mr-1"><Copy size={14} /></button>
                <button onClick={() => onPreset(row.raw_id, 'force_std')} title="Semana Padrão" className="px-2 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 shadow-sm transition-all">STD</button>
                <button onClick={() => onPreset(row.raw_id, 'force_up')} title="Tudo UP" className="px-2 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 shadow-sm transition-all">UP</button>
                <button onClick={() => onRestore(row.raw_id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded ml-1 transition-colors" title="Restaurar"><RefreshCw size={14} /></button>
                <button onClick={() => onDelete(row.raw_id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors" title="Excluir"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        ) : (
          <button onClick={() => onRestore(row.raw_id)} className="ml-auto px-2 py-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded font-bold text-[10px] flex items-center gap-1 border border-emerald-200 shadow-sm transition-all"><RefreshCw size={10} /> Restaurar</button>
        )}
      </td>
    </tr>
  );
};

export default GridRow;