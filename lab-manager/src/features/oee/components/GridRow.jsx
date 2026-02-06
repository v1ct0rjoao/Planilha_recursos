import React from 'react';
import { Copy, Trash2, RefreshCw, Star, CheckSquare, Square } from 'lucide-react';

const GridRow = ({ 
  row, 
  daysInMonth, 
  onDelete, 
  onRestore, 
  onPreset, 
  setToast, 
  isSelectionMode, 
  isSelected, 
  onToggleSelect 
}) => {
  
  const getColor = (status) => {
    if (!status || status === '') return 'bg-white border border-slate-200'; 
    switch (status) {
      case 'UP': return 'bg-emerald-500 border border-emerald-600';
      case 'PQ': return 'bg-rose-500 border border-rose-600';
      case 'PP': return 'bg-purple-600 border border-purple-700';
      case 'SD': return 'bg-amber-400 border border-amber-500';
      default: return 'bg-slate-200';
    }
  };

  const stats = row.stats || { pct_up: 0, disponibilidade: 0 };
  const isEmpty = (row.is_zero_up && !row.is_ignored && !row.is_bonus) || row.is_ignored;

  // --- NOVA FUNÇÃO DE COPIAR ---
  const handleCopyRow = () => {
    // Cria string separada por TAB: "UP  UP  SD  PP ..."
    const dayString = row.day_data ? row.day_data.join('\t') : '';
    
    // Se quiser copiar TUDO (ID + Dias + KPIs):
    // const fullString = `${row.id}\t${dayString}\t${row.UP}`;
    
    // Se quiser copiar SÓ O GRID (para colar no excel nas células dos dias):
    const gridString = dayString;

    navigator.clipboard.writeText(gridString).then(() => { 
        if (setToast) setToast({ message: `Grid do ${row.id} copiado!`, type: 'success' }); 
    });
  };

  let rowClass = "transition-colors border-b border-slate-100 last:border-0 ";
  if (row.is_ignored) rowClass += "bg-slate-50 opacity-60 ";
  else if (row.is_bonus) rowClass += "bg-amber-50 ";
  else if (isSelected) rowClass += "bg-blue-50 ";
  else rowClass += "hover:bg-slate-50 ";

  return (
    <tr className={rowClass}>
      
      {/* Checkbox */}
      {isSelectionMode && (
        <td className="px-3 py-2 border-r border-slate-200 w-10 text-center sticky left-0 bg-white z-[35]">
          <button onClick={(e) => { e.stopPropagation(); onToggleSelect(); }} className="flex items-center justify-center w-full h-full cursor-pointer">
            {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} className="text-slate-300 hover:text-blue-400" />}
          </button>
        </td>
      )}

      {/* Nome */}
      <td className={`px-3 py-2 font-mono font-bold text-slate-700 border-r border-slate-200 w-32 sticky bg-white z-[30] shadow-sm ${isSelectionMode ? 'left-10' : 'left-0'}`}>
        <div className="flex flex-col">
          <span className={`flex items-center gap-1 ${isEmpty ? 'text-slate-400' : 'text-blue-600 underline decoration-dotted decoration-blue-300'}`}>
            {row.id}
            {row.is_bonus && <Star size={12} className="text-amber-600 fill-amber-600" />}
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {row.is_zero_up && !row.is_ignored && !row.is_bonus && <span className="text-[9px] text-slate-300 italic font-normal">Inativo</span>}
            {row.is_ignored && <span className="text-[9px] text-rose-600 font-bold border border-rose-200 px-1 rounded bg-rose-50">EXCLUÍDO</span>}
            {row.is_bonus && <span className="text-[9px] text-amber-700 font-bold border border-amber-300 px-1 rounded bg-amber-100">EXTRA</span>}
          </div>
        </div>
      </td>
      
      {/* Grid Dias */}
      <td className="p-1 border-r border-slate-200 overflow-hidden">
        <div className="flex gap-[2px] px-1">
          {isEmpty ? (
            Array.from({ length: daysInMonth }).map((_, i) => (
              <div key={i} className="w-5 h-6 border border-slate-100 bg-white rounded-[2px]" />
            ))
          ) : (
            row.day_data && row.day_data.map((status, i) => (
              <div 
                key={i} 
                className={`w-5 h-6 flex items-center justify-center text-[9px] font-bold text-white rounded-[2px] shrink-0 ${getColor(status)}`} 
                title={`Dia ${i + 1}: ${status}`}
              >
                {status}
              </div>
            ))
          )}
        </div>
      </td>
      
      {/* KPIs */}
      <td className="px-1 py-2 text-center border-r border-emerald-100 bg-emerald-50/30">
        {!isEmpty ? <div className="flex flex-col"><span className="text-xs font-bold text-emerald-700">{row.UP}</span><span className="text-[9px] text-emerald-600/70">{stats.pct_up}%</span></div> : <span className="text-slate-200">-</span>}
      </td>
      <td className="px-1 py-2 text-center border-r border-rose-100 bg-rose-50/30">
        {!isEmpty ? <div className="flex flex-col"><span className="text-xs font-bold text-rose-700">{row.PQ}</span><span className="text-[9px] text-rose-600/70">{stats.pct_pq}%</span></div> : <span className="text-slate-200">-</span>}
      </td>
      <td className="px-1 py-2 text-center border-r border-purple-100 bg-purple-50/30">
        {!isEmpty ? <div className="flex flex-col"><span className="text-xs font-bold text-purple-700">{row.PP}</span><span className="text-[9px] text-purple-600/70">{stats.pct_pp}%</span></div> : <span className="text-slate-200">-</span>}
      </td>
      <td className="px-1 py-2 text-center border-r border-slate-200 bg-amber-50/30">
        {!isEmpty ? <div className="flex flex-col"><span className="text-xs font-bold text-amber-700">{row.SD}</span><span className="text-[9px] text-amber-600/70">{stats.pct_sd}%</span></div> : <span className="text-slate-200">-</span>}
      </td>
      
      {/* Botões */}
      <td className="px-2 py-2 text-right w-48">
        {!row.is_ignored ? (
          <div className="flex justify-end gap-1 items-center">
            
            <button 
              onClick={() => onPreset(row.raw_id, 'bonus_list')} 
              title="Uso Extra (Preenche SD/PP com UP)" 
              className={`px-2 py-1 text-[9px] font-bold rounded border transition-all ${row.is_bonus ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'text-amber-600 bg-white hover:bg-amber-50 border-amber-200'}`}
            >
              EXT
            </button>

            <button onClick={() => onPreset(row.raw_id, 'force_std')} title="Semana Padrão (Seg-Sex UP)" className="px-2 py-1 text-[9px] font-bold text-blue-600 bg-white hover:bg-blue-50 rounded border border-blue-200 transition-all">STD</button>
            <button onClick={() => onPreset(row.raw_id, 'force_up')} title="Forçar Tudo UP" className="px-2 py-1 text-[9px] font-bold text-emerald-600 bg-white hover:bg-emerald-50 rounded border border-emerald-200 transition-all">UP</button>
            
            <div className="w-[1px] bg-slate-200 h-4 mx-1"></div>

            <button onClick={handleCopyRow} title="Copiar Grid (Excel)" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Copy size={14} /></button>
            <button onClick={() => onDelete(row.raw_id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors" title="Excluir"><Trash2 size={14} /></button>
          </div>
        ) : (
          <button onClick={() => onRestore(row.raw_id)} className="ml-auto px-2 py-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded font-bold text-[10px] flex items-center gap-1 border border-emerald-200 transition-all"><RefreshCw size={10} /> Restaurar</button>
        )}
      </td>
    </tr>
  );
};

export default GridRow;