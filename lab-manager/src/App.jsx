import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap, Factory, Settings, Clipboard, Calendar, Loader2, AlertTriangle,
  LayoutDashboard, PieChart, History, // Importei icones novos para o menu
  Menu
} from 'lucide-react';

import Toast from './components/ui/Toast';
import ConfirmModal from './components/ui/ConfirmModal';

import OEEDashboardView from './features/oee/OEEDashboardView';
import HistoryView from './features/history/HistoryView';
import DashboardView from './features/dashboard/DashboardView';
import CircuitCalendarView from './features/dashboard/CircuitCalendarView';

import ImportModal from './components/modals/ImportModal';
import AddCircuitModal from './components/modals/AddCircuitModal';
import AddBathModal from './components/modals/AddBathModal';
import TestManagerModal from './components/modals/TestManagerModal';
import CircuitHistoryModal from './components/modals/CircuitHistoryModal';
import MoveCircuitModal from './components/modals/MoveCircuitModal';
import LinkCircuitModal from './components/modals/LinkCircuitModal';
import EditBathModal from './components/modals/EditBathModal';

import { bathService } from './services/bathService';

const GlobalStyles = () => (
  <style>{`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  `}</style>
);

// Componente auxiliar apenas para o botão do menu do header
const MenuButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200
      ${active
        ? 'bg-blue-50 text-blue-600 shadow-sm'
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
    `}
  >
    <Icon size={16} strokeWidth={2} className={active ? "text-blue-600" : "text-slate-400"} />
    <span>{label}</span>
  </button>
);

export default function LabManagerApp() {
  const [baths, setBaths] = useState([]);
  const [logs, setLogs] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [experienceOwners, setExperienceOwners] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const fetchLock = useRef(false);

  const [currentView, setCurrentView] = useState('dashboard');
  const [toast, setToast] = useState(null);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddBathOpen, setIsAddBathOpen] = useState(false);
  const [isProtocolsOpen, setIsProtocolsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEditBathOpen, setIsEditBathOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);

  const [bathToEdit, setBathToEdit] = useState(null);
  const [moveData, setMoveData] = useState({ sourceBathId: null, circuitId: null });
  const [linkData, setLinkData] = useState({ bath: null, sourceId: null });
  const [targetBath, setTargetBath] = useState(null);
  const [targetCircuit, setTargetCircuit] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { }, onCancel: () => { }, type: 'danger' });

  useEffect(() => {
    document.title = "LabFísico | Controle de Recursos";

    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/svg+xml';
    link.rel = 'shortcut icon';
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231e3a8a" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';
    document.head.appendChild(link);
  }, []);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;

    if (isInitialLoad) setIsLoading(true);

    try {
      const { success, data } = await bathService.getAllData();
      if (success && data) {
        setBaths(data.baths || []);
        setLogs(data.logs || []);
        setProtocols(data.protocols || []);
        setExperienceOwners(data.experienceOwners || {});
        setIsError(false);
      } else {
        throw new Error("Invalid structure");
      }
    } catch (error) {
      setIsError(true);
      if (isInitialLoad) {
        setToast({ message: "Falha ao conectar com o servidor.", type: 'error' });
      }
    } finally {
      setIsLoading(false);
      fetchLock.current = false;
    }
  }, []);

  useEffect(() => {
    let timeoutId;
    let isMounted = true;

    const pollData = async () => {
      if (!isMounted) return;
      await fetchData();
      if (isMounted) {
        timeoutId = setTimeout(pollData, 10000);
      }
    };

    fetchData(true).then(() => {
      timeoutId = setTimeout(pollData, 10000);
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [fetchData]);

  const askConfirm = useCallback((title, message, onConfirm, type = 'danger') => {
    setConfirmModal({
      isOpen: true, title, message, type,
      onConfirm: () => { setConfirmModal(prev => ({ ...prev, isOpen: false })); onConfirm(); },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  }, []);

  const addCircuit = useCallback(async (bathId, start, end) => {
    const startNum = parseInt(start);
    if (isNaN(startNum)) return;
    const endNum = end ? parseInt(end) : startNum;

    const executeAdd = async () => {
      try {
        for (let i = startNum; i <= endNum; i++) {
          await bathService.addCircuit(bathId, i);
        }
        await fetchData();
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
  }, [fetchData, askConfirm]);

  const deleteCircuit = useCallback(async (bathId, circuitId) => {
    askConfirm("Excluir Circuito", `Tem certeza que deseja remover o circuito ${circuitId}? Esta ação não pode ser desfeita.`, async () => {
      const { success, data } = await bathService.deleteCircuit(bathId, circuitId);
      if (success && data) {
        const db = data.db_atualizado || data;
        setBaths(db.baths || []);
        setLogs(db.logs || []);
      } else {
        setToast({ message: "Erro ao deletar.", type: 'error' });
      }
    });
  }, [askConfirm]);

  const updateTemp = useCallback(async (bathId, temp) => {
    const { success, data } = await bathService.updateTemp(bathId, temp);
    if (success && data) {
      const db = data.db_atualizado || data;
      setBaths(db.baths || []);
      setLogs(db.logs || []);
    } else {
      setToast({ message: "Erro ao salvar temperatura.", type: 'error' });
    }
  }, []);

  const toggleMaintenance = useCallback(async (bathId, circuitId, newStatus) => {
    const { success, data } = await bathService.updateStatus(bathId, circuitId, newStatus);
    if (success && data) {
      const db = data.db_atualizado || data;
      setBaths(db.baths || []);
      setLogs(db.logs || []);
    } else {
      setToast({ message: "Erro ao atualizar status.", type: 'error' });
    }
  }, []);

  const addBath = useCallback(async (id, temp, type = 'BANHO') => {
    if (!id) return;
    const fullId = `${type} - ${id.toUpperCase()}`;
    const { success, data } = await bathService.addBath(fullId, temp);

    if (success && data) {
      if (data.error) {
        setToast({ message: data.error, type: 'error' });
      } else {
        const db = data.db_atualizado || data;
        setBaths(db.baths || []);
        setLogs(db.logs || []);
        setIsAddBathOpen(false);
      }
    } else {
      setToast({ message: "Erro ao criar unidade.", type: 'error' });
    }
  }, []);

  const deleteBath = useCallback(async (bathId) => {
    askConfirm("Excluir Unidade", `Você vai excluir a unidade ${bathId} e todos os seus circuitos. Tem certeza?`, async () => {
      const { success, data } = await bathService.deleteBath(bathId);
      if (success && data) {
        const db = data.db_atualizado || data;
        setBaths(db.baths || []);
        setLogs(db.logs || []);
      } else {
        setToast({ message: "Erro ao excluir banho.", type: 'error' });
      }
    });
  }, [askConfirm]);

  const handleRenameBath = useCallback(async (oldId, newId) => {
    if (oldId === newId) { setIsEditBathOpen(false); return; }
    const { success, data } = await bathService.renameBath(oldId, newId);

    if (success && data) {
      const db = data.db_atualizado || data;
      setBaths(db.baths || []);
      setLogs(db.logs || []);
      setIsEditBathOpen(false);
      setToast({ message: "Local renomeado com sucesso!", type: 'success' });
    } else {
      setToast({ message: `Erro: ${data?.error || 'Erro desconhecido'}`, type: 'error' });
    }
  }, []);

  const handleAddProtocol = useCallback(async (name, duration) => {
    const { success, data } = await bathService.addProtocol(name, duration);
    if (success && data) {
      const db = data.db_atualizado || data;
      setProtocols(db.protocols || data.protocols || []);
      setToast({ message: "Teste adicionado!", type: 'success' });
    } else {
      setToast({ message: "Erro protocolos", type: 'error' });
    }
  }, []);

  const handleDeleteProtocol = useCallback(async (id) => {
    askConfirm("Apagar Teste", `Remover o teste ${id}?`, async () => {
      const { success, data } = await bathService.deleteProtocol(id);
      if (success && data) {
        const db = data.db_atualizado || data;
        setProtocols(db.protocols || data.protocols || []);
      } else {
        setToast({ message: "Erro ao apagar", type: 'error' });
      }
    });
  }, [askConfirm]);

  const handleMoveCircuit = useCallback(async (sourceBathId, targetBathId, circuitId) => {
    if (!circuitId) { setToast({ message: "Erro: ID do circuito inválido.", type: 'error' }); return; }
    const { success, data } = await bathService.moveCircuit(sourceBathId, targetBathId, circuitId);

    if (success && data) {
      const db = data.db_atualizado || data;
      setBaths(db.baths || []);
      setLogs(db.logs || []);
      setIsMoveOpen(false);
      setToast({ message: `Circuito movido com sucesso!`, type: 'success' });
    } else {
      setToast({ message: `Erro: ${data?.error || 'Erro ao mover'}`, type: 'error' });
    }
  }, []);

  const handleLinkCircuit = useCallback(async (bathId, sourceId, targetId) => {
    const { success, data } = await bathService.linkCircuit(bathId, sourceId, targetId);
    if (success && data) {
      const db = data.db_atualizado || data;
      setBaths(db.baths || []);
      setLogs(db.logs || []);
      setIsLinkOpen(false);
      setToast({ message: "Circuitos vinculados em paralelo!", type: 'success' });
    } else {
      setToast({ message: `Erro: ${data?.error || 'Erro ao vincular'}`, type: 'error' });
    }
  }, []);

  const openMoveModal = useCallback((bathId, circuitId) => { setMoveData({ sourceBathId: bathId, circuitId }); setIsMoveOpen(true); }, []);
  const openLinkModal = useCallback((bath, circuitId) => { setLinkData({ bath, sourceId: circuitId }); setIsLinkOpen(true); }, []);

  const closeImport = useCallback(() => setIsImportOpen(false), []);
  const closeAdd = useCallback(() => setIsAddOpen(false), []);
  const closeAddBath = useCallback(() => setIsAddBathOpen(false), []);
  const closeProtocols = useCallback(() => setIsProtocolsOpen(false), []);
  const closeHistory = useCallback(() => setIsHistoryOpen(false), []);
  const closeMove = useCallback(() => setIsMoveOpen(false), []);
  const closeLink = useCallback(() => setIsLinkOpen(false), []);
  const closeEditBath = useCallback(() => setIsEditBathOpen(false), []);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-10 flex flex-col">
      <GlobalStyles />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={confirmModal.onCancel} type={confirmModal.type} />

      {/* HEADER ALTERADO CONFORME SOLICITADO (Estilo da imagem) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shrink-0 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center relative">

          {/* Lado Esquerdo: Marca LabFísico */}
          <div className="flex items-center gap-3">
            <div className="bg-[#004D90] h-9 w-9 rounded-lg flex items-center justify-center shadow-sm">
              <Zap size={20} fill="currentColor" className="text-yellow-400" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                LabFísico
                {isLoading && <Loader2 size={14} className="animate-spin text-blue-500" />}
                {isError && <AlertTriangle size={14} className="text-red-500" title="Erro de conexão" />}
              </h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Controle de Recursos</span>
            </div>
          </div>

          {/* Centro: Navegação em Cápsula (Centralizado Absolutamente) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex">
            <div className="bg-slate-50 border border-slate-200 p-1 rounded-xl flex items-center gap-1 shadow-sm">
              <MenuButton
                active={currentView === 'dashboard'}
                onClick={() => setCurrentView('dashboard')}
                icon={LayoutDashboard}
                label="Visão Geral"
              />
              <MenuButton
                active={currentView === 'oee'}
                onClick={() => setCurrentView('oee')}
                icon={Factory}
                label="OEE"
              />
              <MenuButton
                active={currentView === 'history'}
                onClick={() => setCurrentView('history')}
                icon={History}
                label="Histórico"
              />

              <MenuButton
                active={currentView === 'calendar'}
                onClick={() => setCurrentView('calendar')}
                icon={Calendar}
                label="Agenda" />
            </div>
          </div>


          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsProtocolsOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Configurações"
            >
              <Settings size={20} />
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <button
              onClick={() => setIsImportOpen(true)}
              className="bg-[#004D90] hover:bg-[#003870] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <Clipboard size={18} className="text-yellow-400" />
              <span>Importar Digatron</span>
            </button>
          </div>
        </div>
      </header>


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full overflow-hidden flex flex-col">
        {currentView === 'oee' && <div className="h-full overflow-y-auto pr-2 custom-scrollbar"><OEEDashboardView setToast={setToast} /></div>}
        {currentView === 'history' && <div className="h-full overflow-y-auto pr-2 custom-scrollbar"><HistoryView logs={logs} /></div>}
        {currentView === 'calendar' && <div className="h-full overflow-y-auto pr-2 custom-scrollbar"><CircuitCalendarView baths={baths} searchTerm={""} /></div>}
        {currentView === 'dashboard' && (
          <div className="h-full flex flex-col">
            <DashboardView
              baths={baths || []}
              experienceOwners={experienceOwners}
              onRefreshData={fetchData}
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

      <footer className="w-full text-center py-6 border-t border-slate-200 mt-auto shrink-0">
        <p className="text-xs text-slate-400 font-medium">
          Desenvolvido por <span className="font-bold text-slate-600">João Victor</span> © 2026<br />LabFísico Sistema v2.2
        </p>
      </footer>

      <ImportModal isOpen={isImportOpen} onClose={closeImport} onImportSuccess={(db, message) => { setBaths(db.baths || []); setLogs(db.logs || []); setToast({ message: message || 'Sincronização concluída!', type: 'success' }); }} protocols={protocols} onRegisterProtocol={handleAddProtocol} />
      <AddCircuitModal isOpen={isAddOpen} onClose={closeAdd} onConfirm={addCircuit} bathId={targetBath} baths={baths} setToast={setToast} />
      <AddBathModal isOpen={isAddBathOpen} onClose={closeAddBath} onConfirm={addBath} />
      <TestManagerModal isOpen={isProtocolsOpen} onClose={closeProtocols} protocols={protocols} onAddProtocol={handleAddProtocol} onDeleteProtocol={handleDeleteProtocol} setToast={setToast} />
      <CircuitHistoryModal isOpen={isHistoryOpen} onClose={closeHistory} circuit={targetCircuit} logs={logs} />
      <MoveCircuitModal isOpen={isMoveOpen} onClose={closeMove} onConfirm={handleMoveCircuit} baths={baths} sourceBathId={moveData.sourceBathId} circuitId={moveData.circuitId} />
      <LinkCircuitModal isOpen={isLinkOpen} onClose={closeLink} onConfirm={handleLinkCircuit} bath={linkData.bath} sourceCircuitId={linkData.sourceId} />
      <EditBathModal isOpen={isEditBathOpen} onClose={closeEditBath} onConfirm={handleRenameBath} currentBathId={bathToEdit} />
    </div>
  );
}