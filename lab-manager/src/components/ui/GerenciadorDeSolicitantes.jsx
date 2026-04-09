import React, { useState, useEffect } from 'react';
import { X, Search, Users, Plus, Trash2, Save, Loader2, ArrowRight, UserPlus } from 'lucide-react';
import { apiRequest } from '../../services/api';

const ExperienceOwnerModal = ({ isOpen, onClose, baths = [], experienceOwners = {}, onRefreshData, onNavigateToCircuits }) => {
  const [owners, setOwners] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOwners({ ...(experienceOwners || {}) });
      setSearchTerm('');
      setNewCode('');
      setNewName('');
      setHasChanges(false);
    }
  }, [isOpen, experienceOwners]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      
      const cleanData = {};
      Object.entries(owners).forEach(([k, v]) => {
        if (k && k.trim() !== '') {
           const safeKey = k.trim().replace(/[\.\/\[\]]/g, '_').toUpperCase();
           cleanData[safeKey] = v;
        }
      });

      
      const response = await apiRequest('/experience/owners', 'POST', cleanData);
      
      if (response.success) {
        setHasChanges(false);
        if (onRefreshData) onRefreshData();
        onClose();
      } else {
        alert('Erro do Servidor: ' + (response.data?.erro || response.error));
      }
    } catch (e) {
      alert('Erro no painel: ' + e.message);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    if (!newCode.trim() || !newName.trim()) return;
    const code = newCode.toUpperCase().trim().replace(/[\.\/\[\]]/g, '_');
    setOwners(prev => ({ ...prev, [code]: newName }));
    setNewCode('');
    setNewName('');
    setHasChanges(true);
  };

  const removeOwner = (code) => {
    const temp = { ...owners };
    delete temp[code];
    setOwners(temp);
    setHasChanges(true);
  };

  const updateOwnerName = (code, val) => {
    setOwners(prev => ({ ...prev, [code]: val }));
    setHasChanges(true);
  };

  const filteredKeys = Object.keys(owners).filter(k => 
    k.includes(searchTerm.toUpperCase()) || 
    (owners[k] && owners[k].toUpperCase().includes(searchTerm.toUpperCase()))
  );

  const getActiveCircuits = (code) => {
    let count = 0;
    const searchTarget = code.replace('_', '/'); 
    baths.forEach(b => {
      if (b.circuits) {
        b.circuits.forEach(c => {
          if (c.batteryId && c.batteryId.toUpperCase().includes(searchTarget)) count++;
        });
      }
    });
    return count;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[600px] border border-slate-200">
        
        {/* Esquerda: Adicionar Novo */}
        <div className="w-full md:w-5/12 bg-slate-50 p-8 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col relative">
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Users className="text-blue-600" />
              Gerenciar Solicitantes
            </h2>
            <p className="text-sm text-slate-500 mt-1">Vincule donos aos códigos das baterias.</p>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Código da Experiência</label>
              <input 
                type="text" 
                placeholder="Ex: E129_2026" 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                value={newCode} 
                onChange={e => setNewCode(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Nome do Solicitante</label>
              <input 
                type="text" 
                placeholder="Ex: João Victor" 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
          </div>

          <button 
            onClick={handleAdd} 
            className="mt-6 w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Adicionar à Lista
          </button>
        </div>

        
        <div className="w-full md:w-7/12 bg-white p-6 flex flex-col h-full relative">
          <div className="flex justify-between items-center mb-6 gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar código ou nome..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors"
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 pb-4">
            {filteredKeys.length > 0 ? (
              filteredKeys.map(code => {
                const activeCount = getActiveCircuits(code);
                return (
                  <div key={code} className="group flex flex-col p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-slate-700 text-sm flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs tracking-wider">{code.replace('_', '/')}</span>
                      </span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {activeCount > 0 && onNavigateToCircuits && (
                          <button onClick={() => onNavigateToCircuits(code.replace('_', '/'))} className="text-xs font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded flex items-center gap-1">
                            Ver {activeCount} <ArrowRight size={12} />
                          </button>
                        )}
                        <button onClick={() => removeOwner(code)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-100 rounded-md">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <input 
                      type="text" 
                      value={owners[code]} 
                      onChange={(e) => updateOwnerName(code, e.target.value)}
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none text-slate-600 font-medium transition-colors pb-1"
                    />
                  </div>
                )
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <UserPlus size={48} className="mb-4 stroke-1" />
                <p className="text-sm">Nenhum solicitante encontrado.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-auto">
            <span className="text-xs font-bold text-slate-400">{Object.keys(owners).length} Registros</span>
            <button 
              onClick={handleSave} 
              disabled={!hasChanges || loading}
              className={`py-3 px-6 rounded-xl font-bold flex items-center gap-2 transition-all ${hasChanges ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceOwnerModal;