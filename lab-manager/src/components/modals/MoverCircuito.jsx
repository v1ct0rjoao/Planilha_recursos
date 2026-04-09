import React, { useState } from 'react';
import { ArrowRightLeft, XCircle, Search, Check, ArrowRight } from 'lucide-react';
import { getLocationType } from '../../utils/helpers';

const MoveCircuitModal = ({ isOpen, onClose, onConfirm, baths, sourceBathId, circuitId }) => {
  const [targetBath, setTargetBath] = useState('');
  const [filter, setFilter] = useState('');
  if (!isOpen) return null;
  const availableBaths = baths.filter(b => b.id !== sourceBathId && b.id.includes(filter.toUpperCase()));
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-slate-100 relative z-[102] flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3"><div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><ArrowRightLeft size={20} className="text-white" /></div><div><h2 className="font-bold text-lg leading-tight">Mover Circuito</h2><p className="text-blue-100 text-xs font-medium">De: {sourceBathId} • Circuito: {circuitId}</p></div></div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full"><XCircle size={20} /></button>
        </div>
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Filtrar destino..." className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-bold text-sm" value={filter} onChange={e => setFilter(e.target.value)} autoFocus /></div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableBaths.map(b => (
              <button key={b.id} onClick={() => setTargetBath(b.id)} className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${targetBath === b.id ? 'border-blue-500 bg-white ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'}`}>
                {targetBath === b.id && <div className="absolute top-0 right-0 bg-blue-500 text-white p-1 rounded-bl-lg"><Check size={12} /></div>}
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{getLocationType(b.id)}</div>
                <div className="font-black text-slate-700 text-lg leading-none">{b.id.replace(/^(BANHO|SALA|THERMOTRON) - /, '')}</div>
                <div className="mt-2 flex gap-2"><span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{b.circuits ? b.circuits.length : 0} Circ.</span></div>
              </button>
            ))}
            {availableBaths.length === 0 && <p className="col-span-full text-center text-slate-400 py-10 italic">Nenhum destino encontrado.</p>}
          </div>
        </div>
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
          <button onClick={() => { if (targetBath) onConfirm(sourceBathId, targetBath, circuitId); }} disabled={!targetBath} className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition-all active:scale-95 ${!targetBath ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700'}`}>Confirmar Transferência <ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  );
};

export default MoveCircuitModal;