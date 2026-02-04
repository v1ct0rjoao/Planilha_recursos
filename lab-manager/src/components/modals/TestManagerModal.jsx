import React, { useState, useMemo } from 'react';
import { Search, Settings, XCircle, Plus, Trash2 } from 'lucide-react';
import { normalizeStr } from '../../utils/helpers';

const TestManagerModal = ({ isOpen, onClose, protocols, onAddProtocol, onDeleteProtocol, setToast }) => {
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = () => {
    if (!newName || !newDuration) return;
    const exists = protocols.some(p => normalizeStr(p.name) === normalizeStr(newName));
    if (exists) {
      setToast({ message: `Teste ${newName} já existe!`, type: 'error' });
      return;
    }
    onAddProtocol(newName.toUpperCase(), newDuration);
    setNewName(''); setNewDuration('');
  };

  if (!isOpen) return null;
  const filteredProtocols = protocols.filter(p => p.name.toUpperCase().includes(searchTerm.toUpperCase()));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in">
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="font-bold uppercase text-xs tracking-widest flex items-center gap-2"><Settings size={16} /> Configurar Testes</h2>
          <button onClick={onClose}><XCircle size={20} /></button>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Filtrar testes..." className="w-full pl-10 p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 mb-2 bg-slate-50 p-4 rounded-t-xl border border-slate-200 border-b-0">
            <input type="text" placeholder="Nome (ex: SAEJ2801)" className="flex-1 p-2 text-xs font-bold border rounded uppercase focus:border-blue-500 outline-none" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <input type="number" placeholder="Horas" className="w-20 p-2 text-xs font-bold border rounded focus:border-blue-500 outline-none" value={newDuration} onChange={e => setNewDuration(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <button onClick={handleAdd} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 shadow-sm"><Plus size={16} /></button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
            {filteredProtocols.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <div>
                  <span className="font-bold text-slate-700 text-sm block">{p.name}</span>
                  <span className="text-xs text-slate-400 font-bold">{p.duration} Horas ({Math.round(p.duration / 24) || (p.duration > 0.5 ? 1 : 0)} dias)</span>
                </div>
                <button onClick={() => onDeleteProtocol(p.id)} className="text-rose-400 hover:text-rose-600 p-2"><Trash2 size={14} /></button>
              </div>
            ))}
            {filteredProtocols.length === 0 && <p className="text-center text-slate-400 text-xs py-4">Nenhum teste encontrado.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestManagerModal;