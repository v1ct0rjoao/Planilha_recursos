import React from 'react';
import { Copy, Trash2, RefreshCw, CheckSquare, Square } from 'lucide-react';

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
    if (!status || status === '') return 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'; 
    switch (status) {
      case 'UP': return 'bg-emerald-500 border border-emerald-600 dark:border-emerald-400 text-white';
      case 'PQ': return 'bg-rose-500 border border-rose-600 dark:border-rose-400 text-white';
      case 'PP': return 'bg-purple-600 border border-purple-700 dark:border-purple-400 text-white';
      case 'SD': return 'bg-amber-400 border border-amber-500 dark:border-amber-300 text-white';
      default: return 'bg-slate-200 dark:bg-slate-700';
    }
  };

  const stats = row.stats || { pct_up: 0, disponibilidade: 0 };
  const isEmpty = row.is_ignored;

  const handleCopyRow = () => {
    const dayString = row.day_data ? row.day_data.join('\t') : '';
    navigator.clipboard.writeText(dayString);
    if (setToast) setToast({ message: 'Copiado para área de transferência!', type: 'info' });
  };

  return (
    <tr className={`transition-colors group ${isSelected ? 'bg-blue-50/50 dark:bg-blue-500/10' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'} ${isEmpty ? 'opacity-50 grayscale' : ''}`}>
      <td className="px-3 py-1 font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10 text-xs transition-colors flex items-center gap-2">
        {isSelectionMode && (
           <button onClick={() => onToggleSelect(row.raw_id)} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none">
             {isSelected ? <CheckSquare size={16} className="text-blue-600 dark:text-blue-400"/> : <Square size={16}/>}
           </button>
        )}
        {row.id === 'iDevice' || row.raw_id === 'iDevice' ? (
          <span className="text-blue-600 dark:text-blue-400 underline decoration-dotted decoration-blue-300 dark:decoration-blue-500/50">iDevice</span>
        ) : (
          <span>Circuit{String(row.raw_id || row.id).replace('Circuit', '').padStart(3, '0')}</span>
        )}
      </td>
      
      <td className="p-1 border-r border-slate-200 dark:border-slate-700">
        <div className="flex gap-[2px] px-1">
          {row.day_data && row.day_data.map((status, i) => (
            <div
              key={i}
              className={`w-6 h-6 flex items-center justify-center text-[8px] font-bold rounded-[3px] shrink-0 transition-transform hover:scale-110 cursor-default ${getColor(status)}`}
              title={`Dia ${i + 1}: ${status || 'Vazio'}`}
            >
              {status}
            </div>
          ))}
          {Array.from({ length: Math.max(0, daysInMonth - (row.day_data?.length || 0)) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-6 h-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[3px] opacity-50" />
          ))}
        </div>
      </td>

      <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700 text-center font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-500/5">{stats.up_dias}</td>
      <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700 text-center font-mono text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-500/5">{stats.pq_dias}</td>
      <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700 text-center font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-500/5">{stats.pp_dias}</td>
      <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700 text-center font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-500/5">{stats.sd_dias}</td>
      
      <td className="px-2 py-1 text-right sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
        {!isEmpty ? (
          <div className="flex justify-end gap-1 items-center">
            <button onClick={() => onPreset(row.raw_id, 'force_std')} title="Semana Padrão (Seg-Sex UP)" className="px-2 py-1 text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded border border-blue-200 dark:border-blue-500/30 transition-all focus:outline-none">STD</button>
            <button onClick={() => onPreset(row.raw_id, 'force_up')} title="Forçar Tudo UP" className="px-2 py-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded border border-emerald-200 dark:border-emerald-500/30 transition-all focus:outline-none">UP</button>
            <div className="w-[1px] bg-slate-200 dark:bg-slate-700 h-4 mx-1"></div>
            <button onClick={handleCopyRow} title="Copiar Grid (Excel)" className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded transition-colors focus:outline-none"><Copy size={14} /></button>
            <button onClick={() => onDelete(row.raw_id)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded transition-colors focus:outline-none" title="Excluir"><Trash2 size={14} /></button>
          </div>
        ) : (
          <div className="flex justify-end">
            <button onClick={() => onRestore(row.raw_id)} className="p-1 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 text-[10px] font-bold transition-colors focus:outline-none"><RefreshCw size={12} /> RESTAURAR</button>
          </div>
        )}
      </td>
    </tr>
  );
};
export default GridRow;