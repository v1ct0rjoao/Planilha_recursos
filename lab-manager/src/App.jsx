import React, { useState, useEffect } from 'react';
import {
  Zap, Factory, List, Settings, Clipboard
} from 'lucide-react';

// Componentes de Interface
import Toast from './components/ui/Toast';
import ConfirmModal from './components/ui/ConfirmModal';

// Features (Telas Principais)
import OEEDashboardView from './features/oee/OEEDashboardView';
import HistoryView from './features/history/HistoryView';
import DashboardView from './features/dashboard/DashboardView';

// Modais (O Gran Finale!)
import ImportModal from './components/modals/ImportModal';
import AddCircuitModal from './components/modals/AddCircuitModal';
import AddBathModal from './components/modals/AddBathModal';
import TestManagerModal from './components/modals/TestManagerModal';
import CircuitHistoryModal from './components/modals/CircuitHistoryModal';
import MoveCircuitModal from './components/modals/MoveCircuitModal';
import LinkCircuitModal from './components/modals/LinkCircuitModal';
import EditBathModal from './components/modals/EditBathModal';

// Serviço de API
import { bathService } from './services/bathService';

// Estilos Globais
const GlobalStyles = () => (
  <style>{`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  `}</style>
);

export default function LabManagerApp() {
  const [baths, setBaths] = useState([]);
  const [logs, setLogs] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [toast, setToast] = useState(null);
  
  // Estados para Controle de Modais
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddBathOpen, setIsAddBathOpen] = useState(false);
  const [isProtocolsOpen, setIsProtocolsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEditBathOpen, setIsEditBathOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  
  // Estados de Dados Temporários (para passar para os modais)
  const [bathToEdit, setBathToEdit] = useState(null);
  const [moveData, setMoveData] = useState({ sourceBathId: null, circuitId: null });
  const [linkData, setLinkData] = useState({ bath: null, sourceId: null });
  const [targetBath, setTargetBath] = useState(null);
  const [targetCircuit, setTargetCircuit] = useState(null);
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { }, onCancel: () => { }, type: 'danger' });

  // Carregamento Inicial e Polling (atualiza a cada 10s)
  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(fetchData, 10000); 
    return () => clearInterval(interval); 
  }, []);

  const fetchData = async () => { 
    const { success, data } = await bathService.getAllData();
    if (success) {
      setBaths(data.baths || []); 
      setLogs(data.logs || []); 
      setProtocols(data.protocols || []); 
    } else {
      console.error("Falha ao carregar dados."); 
    }
  };

  const askConfirm = (title, message, onConfirm, type = 'danger') => {
    setConfirmModal({
      isOpen: true, title, message, type,
      onConfirm: () => { setConfirmModal(prev => ({ ...prev, isOpen: false })); onConfirm(); },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  // --- Funções de Lógica de Negócio (Usando bathService) ---

  const addCircuit = async (bathId, start, end) => {
    const startNum = parseInt(start);
    if (isNaN(startNum)) return;
    const endNum = end ? parseInt(end) : startNum;
    
    const executeAdd = async () => {
      try {
        // Loop para adicionar múltiplos circuitos
        for (let i = startNum; i <= endNum; i++) {
          await bathService.addCircuit(bathId, i);
        }
        fetchData(); // Recarrega os dados para mostrar os novos circuitos
        setIsAddOpen(false);
        setToast({ message: `Circuitos adicionados com sucesso!`, type: 'success' });
      } catch (e) { 
        setToast({ message: "Erro ao adicionar circuitos.", type: 'error' }); 
      }
    };

    if (endNum - startNum > 50) {
        askConfirm("Muitos Circuitos", `Você está prestes a adicionar ${endNum - startNum + 1} circuitos. Isso pode demorar. Continuar?`, executeAdd, 'warning');
    } else {
        executeAdd();
    }
  };

  const deleteCircuit = async (bathId, circuitId) => {
    askConfirm("Excluir Circuito", `Tem certeza que deseja remover o circuito ${circuitId}? Esta ação não pode ser desfeita.`, async () => {
      const { success, data } = await bathService.deleteCircuit(bathId, circuitId);
      if (success) { 
          setBaths(data.baths); 
          setLogs(data.logs); 
      } else {
          setToast({ message: "Erro ao deletar.", type: 'error' }); 
      }
    });
  };

  const updateTemp = async (bathId, temp) => { 
      const { success, data } = await bathService.updateTemp(bathId, temp);
      if (success) {
          setBaths(data.baths);
          setLogs(data.logs);
      } else {
          setToast({ message: "Erro ao salvar temperatura.", type: 'error' }); 
      }
  };

  const toggleMaintenance = async (bathId, circuitId, isMaint) => {
    const newStatus = isMaint ? 'free' : 'maintenance';
    const { success, data } = await bathService.updateStatus(bathId, circuitId, newStatus);
    if (success) {
        setBaths(data.baths);
        setLogs(data.logs);
    } else {
        setToast({ message: "Erro ao atualizar status.", type: 'error' }); 
    }
  };

  const addBath = async (id, temp, type = 'BANHO') => {
    if (!id) return;
    const fullId = `${type} - ${id.toUpperCase()}`;
    const { success, data } = await bathService.addBath(fullId, temp);
    
    if (success) {
        if (data.error) {
            setToast({ message: data.error, type: 'error' });
        } else {
            setBaths(data.baths); 
            setLogs(data.logs); 
            setIsAddBathOpen(false); 
        }
    } else {
        setToast({ message: "Erro ao criar unidade.", type: 'error' }); 
    }
  };

  const deleteBath = async (bathId) => {
    askConfirm("Excluir Unidade", `Você vai excluir a unidade ${bathId} e todos os seus circuitos. Tem certeza?`, async () => {
        const { success, data } = await bathService.deleteBath(bathId);
        if (success) {
            setBaths(data.baths); 
            setLogs(data.logs); 
        } else {
            setToast({ message: "Erro ao excluir banho.", type: 'error' }); 
        }
    });
  };

  const handleRenameBath = async (oldId, newId) => {
    if (oldId === newId) { setIsEditBathOpen(false); return; }
    const { success, data } = await bathService.renameBath(oldId, newId);
    
    if (success) { 
        setBaths(data.baths); 
        setLogs(data.logs); 
        setIsEditBathOpen(false); 
        setToast({ message: "Local renomeado com sucesso!", type: 'success' }); 
    } else { 
        setToast({ message: `Erro: ${data?.error || 'Erro desconhecido'}`, type: 'error' }); 
    }
  };

  const handleAddProtocol = async (name, duration) => {
    const { success, data } = await bathService.addProtocol(name, duration);
    if (success) {
        setProtocols(data.protocols); 
        setToast({ message: "Teste adicionado!", type: 'success' });
    } else {
        setToast({ message: "Erro protocolos", type: 'error' }); 
    }
  };

  const handleDeleteProtocol = async (id) => {
    askConfirm("Apagar Teste", `Remover o teste ${id}?`, async () => {
        const { success, data } = await bathService.deleteProtocol(id);
        if (success) {
            setProtocols(data.protocols); 
        } else {
            setToast({ message: "Erro ao apagar", type: 'error' }); 
        }
    });
  };

  const handleMoveCircuit = async (sourceBathId, targetBathId, circuitId) => {
    if (!circuitId) { setToast({ message: "Erro: ID do circuito inválido.", type: 'error' }); return; }
    const { success, data } = await bathService.moveCircuit(sourceBathId, targetBathId, circuitId);
    
    if (success) { 
        setBaths(data.baths); 
        setLogs(data.logs); 
        setIsMoveOpen(false); 
        setToast({ message: `Circuito movido com sucesso!`, type: 'success' }); 
    } else { 
        setToast({ message: `Erro: ${data?.error || 'Erro ao mover'}`, type: 'error' }); 
    }
  };

  const handleLinkCircuit = async (bathId, sourceId, targetId) => {
    const { success, data } = await bathService.linkCircuit(bathId, sourceId, targetId);
    if (success) { 
        setBaths(data.baths); 
        setLogs(data.logs); 
        setIsLinkOpen(false); 
        setToast({ message: "Circuitos vinculados em paralelo!", type: 'success' }); 
    } else { 
        setToast({ message: `Erro: ${data?.error || 'Erro ao vincular'}`, type: 'error' }); 
    }
  };

  const openMoveModal = (bathId, circuitId) => { setMoveData({ sourceBathId: bathId, circuitId }); setIsMoveOpen(true); };
  const openLinkModal = (bath, circuitId) => { setLinkData({ bath, sourceId: circuitId }); setIsLinkOpen(true); };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-10 flex flex-col">
      <GlobalStyles />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={confirmModal.onCancel} type={confirmModal.type} />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3"><div className="bg-blue-900 text-white p-1.5 rounded-md"><Zap size={24} fill="currentColor" /></div><div><h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">LabFísico</h1><span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Controle de Recursos</span></div></div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-slate-100 p-1 rounded-lg mr-4">
              <button onClick={() => setCurrentView('dashboard')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${currentView === 'dashboard' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Banhos</button>
              <button onClick={() => setCurrentView('oee')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'oee' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Factory size={14} />OEE</button>
              <button onClick={() => setCurrentView('history')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${currentView === 'history' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Histórico</button>
            </div>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <button onClick={() => setIsProtocolsOpen(true)} className="text-slate-400 hover:text-slate-600 transition-colors" title="Configurar Testes"><Settings size={20} /></button>
            <button onClick={() => setIsImportOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"><Clipboard size={18} /><span className="hidden sm:inline">Importar Digatron</span></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full overflow-hidden flex flex-col">
        {currentView === 'oee' && <div className="h-full overflow-y-auto pr-2 custom-scrollbar"><OEEDashboardView setToast={setToast} /></div>}
        {currentView === 'history' && <div className="h-full overflow-y-auto pr-2 custom-scrollbar"><HistoryView logs={logs} /></div>}
        {currentView === 'dashboard' && (
          <div className="h-full flex flex-col">
            <DashboardView 
              baths={baths}
              onAddCircuit={(bid) => { setTargetBath(bid); setIsAddOpen(true); }}
              onDeleteCircuit={deleteCircuit}
              onToggleMaintenance={toggleMaintenance}
              onDeleteBath={deleteBath}
              onUpdateTemp={updateTemp}
              onViewHistory={(c) => { setTargetCircuit(c); setIsHistoryOpen(true); }}
              onMoveCircuit={openMoveModal}
              onLinkCircuit={openLinkModal}
              onEditBath={(id) => { setBathToEdit(id); setIsEditBathOpen(true); }}
              onOpenAddBathModal={() => setIsAddBathOpen(true)}
            />
          </div>
        )}
      </main>

      <footer className="w-full text-center py-6 border-t border-slate-200 mt-auto shrink-0"><p className="text-xs text-slate-400 font-medium">Desenvolvido por <span className="font-bold text-slate-600">João Victor</span> © 2026<br />LabFísico Sistema v2.2</p></footer>

      {/* Renderização dos Modais */}
      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImportSuccess={(db, message) => { setBaths(db.baths); setLogs(db.logs); setToast({ message: message || 'Sincronização concluída!', type: 'success' }); }} protocols={protocols} onRegisterProtocol={handleAddProtocol} />
      <AddCircuitModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onConfirm={addCircuit} bathId={targetBath} baths={baths} setToast={setToast} />
      <AddBathModal isOpen={isAddBathOpen} onClose={() => setIsAddBathOpen(false)} onConfirm={addBath} />
      <TestManagerModal isOpen={isProtocolsOpen} onClose={() => setIsProtocolsOpen(false)} protocols={protocols} onAddProtocol={handleAddProtocol} onDeleteProtocol={handleDeleteProtocol} setToast={setToast} />
      <CircuitHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} circuit={targetCircuit} logs={logs} />
      <MoveCircuitModal isOpen={isMoveOpen} onClose={() => setIsMoveOpen(false)} onConfirm={handleMoveCircuit} baths={baths} sourceBathId={moveData.sourceBathId} circuitId={moveData.circuitId} />
      <LinkCircuitModal isOpen={isLinkOpen} onClose={() => setIsLinkOpen(false)} onConfirm={handleLinkCircuit} bath={linkData.bath} sourceCircuitId={linkData.sourceId} />
      <EditBathModal isOpen={isEditBathOpen} onClose={() => setIsEditBathOpen(false)} onConfirm={handleRenameBath} currentBathId={bathToEdit} />
    </div>
  );
}