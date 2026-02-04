import React from 'react';
import { XCircle } from 'lucide-react';

const CircuitHistoryModal = ({ isOpen, onClose, circuit, logs }) => {
  if (!isOpen || !circuit) return null;
  const circuitLogs = logs.filter(l => (l.details && l.details.includes(`C-${circuit.id}`)) || (circuit.batteryId && l.details && l.details.includes(circuit.batteryId)));
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-4">
        <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center"><div><h2 className="font-bold text-xl text-slate-800">Histórico {circuit.id}</h2><p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Rastreabilidade Individual</p></div><button onClick={onClose} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><XCircle size={20} /></button></div>
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest sticky top-0"><tr><th className="px-6 py-3">Data</th><th className="px-6 py-3">Evento</th><th className="px-6 py-3">Detalhes</th></tr></thead><tbody className="divide-y divide-slate-100">{circuitLogs.map(log => (<tr key={log.id} className="hover:bg-blue-50/30"><td className="px-6 py-4 font-mono text-[10px] text-slate-500">{log.date}</td><td className="px-6 py-4 font-bold text-slate-700">{log.action}</td><td className="px-6 py-4 text-slate-600 text-xs italic">{log.details}</td></tr>))}{circuitLogs.length === 0 && <tr><td colSpan="3" className="text-center py-8 text-slate-400 text-xs">Sem registros específicos.</td></tr>}</tbody></table>
        </div>
      </div>
    </div>
  );
};

export default CircuitHistoryModal;