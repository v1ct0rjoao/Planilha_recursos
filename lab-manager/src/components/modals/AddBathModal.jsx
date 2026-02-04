import React, { useState } from 'react';

const AddBathModal = ({ isOpen, onClose, onConfirm }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('BANHO');
  const [temp, setTemp] = useState('25');
  const handleSave = () => { onConfirm(name, temp, type); setName(''); };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in">
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center"><h2 className="font-bold uppercase text-xs tracking-widest">Nova Unidade / Local</h2></div>
        <div className="p-6">
          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Tipo de Instalação</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {['BANHO', 'SALA', 'THERMOTRON'].map(t => (
              <button key={t} onClick={() => setType(t)} className={`p-2 rounded border text-[10px] font-bold transition-all ${type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>{t}</button>
            ))}
          </div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Identificação (Sufixo)</label>
          <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-200 pb-1">
            <span className="font-black text-slate-400 text-xs">{type} - </span>
            <input type="text" className="flex-1 font-black uppercase outline-none text-slate-800" placeholder="XX" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
          </div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Setpoint Inicial (ºC)</label>
          <input type="number" className="w-full border-2 p-2 rounded-lg mb-6 font-bold" value={temp} onChange={(e) => setTemp(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} />
          <div className="flex gap-2"><button onClick={onClose} className="flex-1 py-2 border rounded-lg text-xs font-bold uppercase text-slate-500">Cancelar</button><button onClick={handleSave} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase shadow-lg">Criar Unidade</button></div>
        </div>
      </div>
    </div>
  );
};

export default AddBathModal;