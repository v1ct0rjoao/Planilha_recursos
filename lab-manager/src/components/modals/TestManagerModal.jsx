import React, { useState } from 'react';
import { 
  Search, Settings, X, Plus, Trash2, 
  FlaskConical, Clock, CalendarDays, FileText 
} from 'lucide-react';
import { normalizeStr } from '../../utils/helpers';

const TestManagerModal = ({ isOpen, onClose, protocols = [], onAddProtocol, onDeleteProtocol, setToast }) => {
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newName || !newDuration) {
        if(setToast) setToast({ message: 'Preencha todos os campos!', type: 'error' });
        return;
    }
    const exists = protocols.some(p => normalizeStr(p.name) === normalizeStr(newName));
    if (exists) {
      if(setToast) setToast({ message: `Teste ${newName} já existe!`, type: 'error' });
      return;
    }
    onAddProtocol(newName.toUpperCase(), newDuration);
    setNewName(''); setNewDuration('');
    if(setToast) setToast({ message: 'Protocolo adicionado!', type: 'success' });
  };

  const filteredProtocols = protocols.filter(p => 
    p.name.toUpperCase().includes(searchTerm.toUpperCase())
  );

  const previewDays = newDuration ? (parseFloat(newDuration) / 24).toFixed(1) : '0.0';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[600px] border border-slate-200">
        
        {/* LADO ESQUERDO: CRIAÇÃO (FORMULÁRIO) */}
        <div className="w-full md:w-5/12 bg-slate-50 p-8 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col relative">
          
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Settings className="text-blue-600" />
              Gerenciar Testes
            </h2>
            <p className="text-sm text-slate-500 mt-1">Configure os padrões de ensaio.</p>
          </div>

          <div className="space-y-4 flex-1">
            {/* Input Nome */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Nome do Protocolo</label>
                <div className="relative group">
                    <FlaskConical className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Ex: SAE J2801" 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                        value={newName} 
                        onChange={e => setNewName(e.target.value)} 
                    />
                </div>
            </div>

            {/* Input Duração */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Duração (Horas)</label>
                <div className="relative group">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                        type="number" 
                        placeholder="Ex: 48" 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                        value={newDuration} 
                        onChange={e => setNewDuration(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                </div>
            </div>

            {/* Card Preview */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4 mt-2">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <CalendarDays size={20} />
                </div>
                <div>
                    <span className="text-xs font-bold text-blue-400 uppercase block">Estimativa</span>
                    <span className="text-sm font-bold text-blue-800">
                        {previewDays} Dias de Ensaio
                    </span>
                </div>
            </div>
          </div>

          <button 
            onClick={handleAdd} 
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus size={20} /> Adicionar Protocolo
          </button>
        </div>

        {/* LADO DIREITO: LISTAGEM */}
        <div className="w-full md:w-7/12 bg-white p-6 flex flex-col h-full relative">
            
            {/* --- CABEÇALHO CORRIGIDO (FLEX) --- */}
            <div className="flex justify-between items-center mb-6 gap-3">
                <div className="shrink-0">
                    <h3 className="font-bold text-slate-700 text-lg">Catálogo</h3>
                    <span className="text-xs text-slate-400 font-bold">{filteredProtocols.length} Disponíveis</span>
                </div>
                
                {/* Grupo: Busca + Botão Fechar (lado a lado) */}
                <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="relative w-full max-w-[180px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 transition-colors"
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-colors flex-shrink-0">
                        <X size={20} />
                    </button>
                </div>
            </div>
            {/* ---------------------------------- */}

            {/* Lista com Scroll */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 pb-4">
                {filteredProtocols.length > 0 ? (
                    filteredProtocols.map(p => {
                        const days = Math.round(p.duration / 24) || (p.duration > 0.5 ? 1 : 0);
                        return (
                            <div key={p.id} className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <span className="block font-black text-slate-700 text-sm">{p.name}</span>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                                <Clock size={10} /> {p.duration}h
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                                <CalendarDays size={10} /> {days}d
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => onDeleteProtocol(p.id)} 
                                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                                    title="Excluir Teste"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <FlaskConical size={48} className="mb-2 stroke-1" />
                        <p className="text-sm">Nenhum teste encontrado.</p>
                    </div>
                )}
            </div>

            {/* Footer da Lista */}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                 <span>Total cadastrado: {protocols.length}</span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default TestManagerModal;