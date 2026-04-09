import React, { useState, useEffect } from 'react';
import { Link2, ChevronDown, Search, Check } from 'lucide-react';

const LinkCircuitModal = ({ isOpen, onClose, onConfirm, bath, sourceCircuitId }) => {
  const [targetCircuit, setTargetCircuit] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) { setIsDropdownOpen(false); setTargetCircuit(''); setSearchTerm(''); }
  }, [isOpen]);

  if (!isOpen || !bath) return null;
  const availableCircuits = bath.circuits.filter(c => c.id !== sourceCircuitId && c.id.toString().toUpperCase().includes(searchTerm.toUpperCase()));
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {isDropdownOpen && <div className="fixed inset-0 z-[101]" onClick={() => setIsDropdownOpen(false)} />}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-visible animate-in zoom-in-95 duration-200 border border-slate-100 relative z-[102]">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-5 flex justify-between items-center relative overflow-hidden rounded-t-2xl"><div className="relative z-10 flex items-center gap-2"><div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Link2 size={20} className="text-white" /></div><div><h2 className="font-bold text-lg leading-tight">Criar Paralelo</h2><p className="text-purple-100 text-xs font-medium">Vincular circuitos na mesma bateria</p></div></div><Link2 size={80} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" /></div>
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-6 bg-purple-50 p-3 rounded-lg border border-purple-100">Você está vinculando o circuito <strong>{sourceCircuitId}</strong>.<br />Selecione o circuito vizinho para replicar os dados:</p>
          <div className="relative mb-8">
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`w-full p-3 pl-4 pr-10 bg-white border-2 rounded-xl text-sm font-bold text-left flex items-center justify-between transition-all ${isDropdownOpen ? 'border-purple-500 ring-4 ring-purple-500/10' : 'border-slate-200 hover:border-slate-300'}`}><span className={targetCircuit ? 'text-slate-800' : 'text-slate-400'}>{targetCircuit || "Selecione o circuito..."}</span><ChevronDown size={18} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180 text-purple-500' : ''}`} /></button>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-[110] animate-in slide-in-from-top-2 fade-in duration-200 flex flex-col">
                <div className="p-2 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl z-20"><div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2"><Search size={14} className="text-slate-400" /><input type="text" autoFocus className="w-full p-2 bg-transparent text-xs font-bold outline-none" placeholder="Filtrar número..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">{availableCircuits.length > 0 ? availableCircuits.map(c => (<div key={c.id} onClick={() => { setTargetCircuit(c.id); setIsDropdownOpen(false); }} className={`p-3 px-4 cursor-pointer flex items-center justify-between group transition-colors ${targetCircuit === c.id ? 'bg-purple-50 text-purple-700' : 'hover:bg-slate-50 text-slate-600'}`}><span className="font-bold text-sm">{c.id} - <span className="text-[10px] font-normal uppercase opacity-70">{c.status || 'Livre'}</span></span>{targetCircuit === c.id && <Check size={16} className="text-purple-600" />}</div>)) : (<div className="p-4 text-center text-xs text-slate-400 italic">Nenhum circuito encontrado.</div>)}</div>
              </div>
            )}
          </div>
          <div className="flex gap-3"><button onClick={onClose} className="flex-1 py-3 border-2 border-slate-100 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50">Cancelar</button><button onClick={() => { if (targetCircuit) onConfirm(bath.id, sourceCircuitId, targetCircuit); }} disabled={!targetCircuit} className={`flex-1 py-3 rounded-xl font-bold text-sm shadow-lg text-white flex items-center justify-center gap-2 transition-all active:scale-95 ${!targetCircuit ? 'bg-slate-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 hover:shadow-purple-500/30'}`}>Vincular <Link2 size={16} /></button></div>
        </div>
      </div>
    </div>
  );
};

export default LinkCircuitModal;