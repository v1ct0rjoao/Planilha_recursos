import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/Authenticador';
import ProtectedRoute from './components/ui/ProtectedRoute';
import LoginPage from './components/auth/PaginaDeLogin';
import Toast from './components/ui/BalaoAlerta';
import ConfirmModal from './components/ui/ConfirmModal';
import { Loader2, AlertTriangle, Bell, Search, Command, ArrowRight, Moon, Sun, Menu, X } from 'lucide-react';

import OEEDashboardView from './features/oee/OEEDashboardView';
import HistoryView from './features/history/VisualHistorico';
import DashboardView from './features/dashboard/Dashboard';
import CircuitCalendarView from './features/dashboard/Agenda';
import UserManagementView from './features/admin/ConfigAcessos';
import ClientSolicitationView from './features/client/SolicitacaoCliente';
import ClientTrackingView from './features/client/AcompanhamentoCliente';
import SolicitationsManagementView from './features/client/SolicitacaoAdm';
import LabSettingsView from './features/admin/ConfigLogin';
import ClientBatteryTracking from './features/client/AcompanharBaterias';
import GerenciadorLims from './features/lims/GerenciadorLims';

import { bathService } from './services/bathService';
import { apiRequest } from './services/api'; 

import ImportModal from './components/modals/ImportarDig';
import AddCircuitModal from './components/modals/AddCircuito';
import AddBathModal from './components/modals/AddBanho';
import TestManagerModal from './components/modals/GerenciadorDeTestes';
import CircuitHistoryModal from './components/modals/Rastreabilidade';
import MoveCircuitModal from './components/modals/MoverCircuito';
import LinkCircuitModal from './components/modals/Paralelo';
import EditBathModal from './components/modals/EditarBanho';

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
    
    html { font-size: 16px; }
    @media (max-width: 1600px) { html { font-size: 14px; } }
    @media (max-width: 1366px), (max-height: 800px) { html { font-size: 12px; } }
    @media (max-width: 1024px) { html { font-size: 14px; } }

    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; overflow: hidden; }
    
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    * { scrollbar-color: #cbd5e1 transparent; }
    
    .dark body { background-color: #020617; }
    .dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
    .dark ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
  `}</style>
);

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

const MenuButton = ({ active, onClick, iconClass, label, isSidebarOpen }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-3 px-4 py-2.5 w-full text-sm font-bold transition-all duration-200 group focus:outline-none border-l-4
      ${active 
        ? 'bg-[#002B5C] border-[#FFBF3C] text-white dark:bg-white/[0.05] dark:border-[#FFBF3C] dark:text-white' 
        : 'border-transparent text-blue-100 hover:bg-[#00336b] hover:text-white dark:text-slate-400 dark:hover:bg-white/[0.02] dark:hover:text-slate-200'
      }
    `}
    title={!isSidebarOpen ? label : ""}
  >
    <i className={`fa-solid ${iconClass} text-sm w-5 text-center transition-colors ${active ? 'text-[#FFBF3C] dark:text-[#FFBF3C]' : 'text-blue-200 group-hover:text-white dark:text-slate-500 dark:group-hover:text-slate-300'}`}></i>
    {isSidebarOpen && <span className="whitespace-nowrap overflow-hidden tracking-wide">{label}</span>}
  </button>
);

const MainApp = () => {
  const { user, hasPermission, logout } = useAuth();
  const [baths, setBaths] = useState([]);
  const [logs, setLogs] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [experienceOwners, setExperienceOwners] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const fetchLock = useRef(false);
  const [currentView, setCurrentView] = useState('nova_solicitacao');
  const [toast, setToast] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [reusedData, setReusedData] = useState(null);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

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

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const searchInputRef = useRef(null);

  const isFullScreenView = ['dashboard', 'acompanhamento', 'meus_acompanhamentos'].includes(currentView);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsCommandOpen((prev) => !prev); }
      if (e.key === 'Escape' && isCommandOpen) { setIsCommandOpen(false); setCommandQuery(''); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandOpen]);

  useEffect(() => { if (isCommandOpen && searchInputRef.current) searchInputRef.current.focus(); }, [isCommandOpen]);

  const commandActions = [
    { id: 'dashboard', label: 'Ir para Visão Geral', icon: 'fa-chart-pie', perm: 'dashboard' },
    { id: 'nova_solicitacao', label: 'Nova Solicitação', icon: 'fa-file-signature', perm: 'nova_solicitacao' },
    { id: 'meus_acompanhamentos', label: 'Meus Acompanhamentos', icon: 'fa-list-check', perm: 'meus_acompanhamentos' },
    { id: 'baterias', label: 'Minhas Baterias', icon: 'fa-car-battery', perm: 'baterias' },
    { id: 'acompanhamento', label: 'Gestão de Solicitações', icon: 'fa-clipboard-check', perm: 'acompanhamento' },
    { id: 'lims', label: 'Portal LABLIMS', icon: 'fa-layer-group', perm: 'lims' },
    { id: 'oee', label: 'Lançamento OEE', icon: 'fa-industry', perm: 'oee' },
    { id: 'history', label: 'Dashboard OEE', icon: 'fa-chart-line', perm: 'history' },
    { id: 'calendar', label: 'Agenda de Liberações', icon: 'fa-calendar-days', perm: 'calendar' },
    { id: 'users', label: 'Gestão de Acessos', icon: 'fa-users', perm: 'users' },
    { id: 'configuracoes', label: 'Configurações do Portal', icon: 'fa-gear', perm: 'configuracoes' }
  ].filter(action => hasPermission(action.perm) && action.label.toLowerCase().includes(commandQuery.toLowerCase()));

  const handleCommandSelect = (actionId) => {
    setCurrentView(actionId);
    setIsCommandOpen(false);
    setCommandQuery('');
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (hasPermission('dashboard') && currentView === 'nova_solicitacao') setCurrentView('dashboard');
  }, [hasPermission]);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    if (isInitialLoad) setIsLoading(true);
    try {
      const { success, data } = await bathService.getAllData();
      if (success && data) {
        setBaths(data.baths || []); setLogs(data.logs || []); setProtocols(data.protocols || []); setExperienceOwners(data.experienceOwners || {}); setIsError(false);
      } else throw new Error("Invalid structure");
    } catch (error) {
      setIsError(true); if (isInitialLoad) setToast({ message: "Falha ao conectar.", type: 'error' });
    } finally { setIsLoading(false); fetchLock.current = false; }
  }, []);

  useEffect(() => {
    if (!user || !hasPermission('dashboard')) return;
    let timeoutId; let isMounted = true;
    const pollData = async () => { if (!isMounted) return; await fetchData(); if (isMounted) timeoutId = setTimeout(pollData, 10000); };
    fetchData(true).then(() => { timeoutId = setTimeout(pollData, 10000); });
    return () => { isMounted = false; clearTimeout(timeoutId); };
  }, [fetchData, user, hasPermission]);

  const askConfirm = useCallback((title, message, onConfirm, type = 'danger') => {
    setConfirmModal({ isOpen: true, title, message, type, onConfirm: () => { setConfirmModal(prev => ({ ...prev, isOpen: false })); onConfirm(); }, onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })) });
  }, []);

  const handleReuseSolicitation = (data) => {
    const { idSolicitacao, dataCriacao, status, experiencia, sharedWith, ...cleanData } = data;
    setReusedData(cleanData);
    setCurrentView('nova_solicitacao');
  };

  const addCircuit = useCallback(async (bathId, startNum, endNum) => {
    const start = parseInt(startNum, 10);
    const end = endNum ? parseInt(endNum, 10) : start;
    let successCount = 0;
    for (let i = start; i <= end; i++) {
      const { success, data, error } = await apiRequest('/circuits/add', 'POST', { bathId, circuitId: i.toString() });
      if (success) { setBaths(data.db_atualizado?.baths || []); successCount++; } 
      else { setToast({ message: error || `Erro ao adicionar circuito ${i}`, type: 'error' }); return; }
    }
    if (successCount > 0) { setToast({ message: 'Circuito(s) adicionado(s) com sucesso!', type: 'success' }); setIsAddOpen(false); }
  }, []);

  const deleteCircuit = useCallback((bathId, circuitId) => {
    askConfirm('Excluir Circuito', `Tem certeza que deseja remover o circuito ${circuitId}?`, async () => {
      const { success, data, error } = await apiRequest('/circuits/delete', 'POST', { bathId, circuitId });
      if (success) { setBaths(data.db_atualizado?.baths || []); setToast({ message: 'Circuito removido!', type: 'success' }); } 
      else setToast({ message: error || 'Erro ao remover', type: 'error' });
    });
  }, [askConfirm]);

  const updateTemp = useCallback(async (bathId, temp) => {
    const { success, data, error } = await apiRequest('/baths/temp', 'POST', { bathId, temp });
    if (success) { setBaths(data.db_atualizado?.baths || []); setToast({ message: 'Temperatura atualizada!', type: 'success' }); } 
    else setToast({ message: error || 'Erro ao atualizar', type: 'error' });
  }, []);

  const toggleMaintenance = useCallback(async (bathId, circuitId, status) => {
    const { success, data, error } = await apiRequest('/circuits/status', 'POST', { bathId, circuitId, status });
    if (success) setBaths(data.db_atualizado?.baths || []); 
    else setToast({ message: error || 'Erro ao mudar status', type: 'error' });
  }, []);

  const addBath = useCallback(async (name, temp, type) => {
    const fullId = `${type} - ${name}`;
    const { success, data, error } = await apiRequest('/baths/add', 'POST', { bathId: fullId, temp });
    if (success) { setBaths(data.db_atualizado?.baths || []); setToast({ message: 'Nova unidade criada!', type: 'success' }); setIsAddBathOpen(false); } 
    else setToast({ message: error || 'Erro ao criar', type: 'error' });
  }, []);

  const deleteBath = useCallback((bathId) => {
    askConfirm('Excluir Unidade', `Isso removerá a unidade ${bathId} e todos os circuitos dela. Continuar?`, async () => {
      const { success, data, error } = await apiRequest('/baths/delete', 'POST', { bathId });
      if (success) { setBaths(data.db_atualizado?.baths || []); setToast({ message: 'Unidade removida!', type: 'success' }); } 
      else setToast({ message: error || 'Erro', type: 'error' });
    });
  }, [askConfirm]);

  const handleRenameBath = useCallback(async (oldId, newId) => {
    const { success, data, error } = await apiRequest('/baths/rename', 'POST', { oldId, newId });
    if (success) { setBaths(data.db_atualizado?.baths || []); setToast({ message: 'Renomeado com sucesso!', type: 'success' }); setIsEditBathOpen(false); } 
    else setToast({ message: error || 'Erro', type: 'error' });
  }, []);

  const handleAddProtocol = useCallback(async (name, duration) => {
    const { success, data, error } = await apiRequest('/protocols/add', 'POST', { name, duration });
    if (success) setProtocols(data.db_atualizado?.protocols || []); 
    else setToast({ message: error || 'Erro ao adicionar protocolo', type: 'error' });
  }, []);

  const handleDeleteProtocol = useCallback((id) => {
    askConfirm('Excluir Teste', `Remover o protocolo de teste ${id}?`, async () => {
      const { success, data, error } = await apiRequest('/protocols/delete', 'POST', { id });
      if (success) setProtocols(data.db_atualizado?.protocols || []); 
      else setToast({ message: error || 'Erro', type: 'error' });
    });
  }, [askConfirm]);

  const handleMoveCircuit = useCallback(async (sourceBathId, targetBathId, circuitId) => {
    const { success, data, error } = await apiRequest('/circuits/move', 'POST', { sourceBathId, targetBathId, circuitId });
    if (success) { setBaths(data.db_atualizado?.baths || []); setToast({ message: 'Circuito movido com sucesso!', type: 'success' }); setIsMoveOpen(false); } 
    else setToast({ message: error || 'Erro ao mover', type: 'error' });
  }, []);

  const handleLinkCircuit = useCallback(async (bathId, sourceId, targetId) => {
    const { success, data, error } = await apiRequest('/circuits/link', 'POST', { bathId, sourceId, targetId });
    if (success) { setBaths(data.db_atualizado?.baths || []); setToast({ message: 'Circuitos vinculados em paralelo!', type: 'success' }); setIsLinkOpen(false); } 
    else setToast({ message: error || 'Erro ao vincular', type: 'error' });
  }, []);

  const handleToggleBathFull = useCallback(async (bathId, isFull) => {
    const { success, data, error } = await apiRequest('/baths/toggle_full', 'POST', { bathId, isFull });
    if (success) setBaths(data.db_atualizado?.baths || []); 
    else setToast({ message: error || 'Erro de conexão', type: 'error' });
  }, []);

  const handleToggleCircuitNoSpace = useCallback(async (circuitId, noSpace) => {
    const { success, data, error } = await apiRequest('/circuits/nospace', 'POST', { circuitId, noSpace });
    if (success) setBaths(data.db_atualizado?.baths || []); 
    else setToast({ message: error || 'Erro', type: 'error' });
  }, []);

  const openMoveModal = useCallback((bid, cid) => { setMoveData({ sourceBathId: bid, circuitId: cid }); setIsMoveOpen(true); }, []);
  const openLinkModal = useCallback((bathParam, circuitId) => {
   
    const fullBath = typeof bathParam === 'string'
      ? baths.find(b => b.id === bathParam)
      : bathParam;

    setLinkData({ 
      bath: fullBath, 
      sourceId: circuitId 
    }); 
    
    setIsLinkOpen(true); 
  }, [baths]); 

  if (!user) return <LoginPage />;

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#020617] overflow-hidden font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300 relative selection:bg-[#0ea5e9]">
      <GlobalStyles />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={confirmModal.onCancel} type={confirmModal.type} />

      <div className="hidden dark:block absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#004D90] rounded-full blur-[150px] opacity-20 pointer-events-none z-0"></div>
      <div className="hidden dark:block absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#0ea5e9] rounded-full blur-[150px] opacity-10 pointer-events-none z-0"></div>
      <div className="hidden dark:block absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-0"></div>

      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/50 dark:bg-[#020617]/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:relative top-0 left-0 h-full z-50
        bg-[#004D90] dark:bg-white/[0.02] dark:backdrop-blur-2xl 
        flex flex-col transition-all duration-300 border-r border-slate-200 dark:border-white/5 shrink-0 shadow-2xl lg:shadow-none overflow-hidden
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:w-20 lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#00386E] dark:border-white/5 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-[#FFBF3C] dark:bg-gradient-to-br dark:from-[#004D90] dark:to-blue-600 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 dark:shadow-lg dark:border dark:border-blue-400/30">
              <i className="fa-solid fa-bolt text-[#004D90] dark:text-white text-sm font-black"></i>
            </div>
            {(isSidebarOpen || window.innerWidth >= 1024 === false) && (
              <div className="flex flex-col min-w-0 transition-opacity duration-300">
                <h1 className="text-sm font-black tracking-tight text-white truncate leading-tight">CLM Moura</h1>
                <span className="text-[10px] font-bold text-blue-200 dark:text-[#0ea5e9] uppercase tracking-widest leading-tight">LabFísico Enterprise</span>
              </div>
            )}
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/70 hover:text-white"><X size={18} /></button>
        </div>

        <div className={`px-5 py-4 border-b border-[#00386E] dark:border-white/5 transition-all duration-300 ${isSidebarOpen ? 'block' : 'hidden lg:hidden'}`}>
           <p className="text-[11px] text-blue-200 dark:text-slate-400 font-medium uppercase tracking-wider">{getGreeting()},</p>
           <p className="text-sm font-bold text-white truncate">{user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'}!</p>
        </div>

        <nav className={`flex-1 flex flex-col justify-start py-2 space-y-0.5 overflow-y-auto no-scrollbar ${isSidebarOpen ? 'px-0' : 'px-0 pt-4'}`}>
          {hasPermission('dashboard') && <MenuButton active={currentView === 'dashboard'} onClick={() => {setCurrentView('dashboard'); if(window.innerWidth<1024) setIsSidebarOpen(false);}} iconClass="fa-chart-pie" label="Visão Geral" isSidebarOpen={isSidebarOpen} />}
          {hasPermission('protocolos') && <MenuButton active={isProtocolsOpen} onClick={() => {setIsProtocolsOpen(true); if(window.innerWidth<1024) setIsSidebarOpen(false);}} iconClass="fa-flask-vial" label="Protocolos" isSidebarOpen={isSidebarOpen} />}
          {hasPermission('nova_solicitacao') && <MenuButton active={currentView === 'nova_solicitacao'} onClick={() => {setCurrentView('nova_solicitacao'); if(window.innerWidth<1024) setIsSidebarOpen(false);}} iconClass="fa-file-signature" label="Nova Solicitação" isSidebarOpen={isSidebarOpen} />}
          {hasPermission('meus_acompanhamentos') && <MenuButton active={currentView === 'meus_acompanhamentos'} onClick={() => {setCurrentView('meus_acompanhamentos'); if(window.innerWidth<1024) setIsSidebarOpen(false);}} iconClass="fa-list-check" label="Acompanhamentos" isSidebarOpen={isSidebarOpen} />}
          {hasPermission('baterias') && <MenuButton active={currentView === 'baterias'} onClick={() => {setCurrentView('baterias'); if(window.innerWidth<1024) setIsSidebarOpen(false);}} iconClass="fa-car-battery" label="Minhas Baterias" isSidebarOpen={isSidebarOpen} />}
          
          {(hasPermission('acompanhamento') || hasPermission('lims')) && isSidebarOpen && (
            <div className="pt-3 pb-1 px-5">
              <span className="text-[10px] font-bold text-blue-300 dark:text-slate-500 uppercase tracking-widest">Administração</span>
            </div>
          )}
          {hasPermission('acompanhamento') && <MenuButton active={currentView === 'acompanhamento'} onClick={() => {setCurrentView('acompanhamento'); if(window.innerWidth<1024) setIsSidebarOpen(false);}} iconClass="fa-clipboard-check" label="Gestão Solicit." isSidebarOpen={isSidebarOpen} />}
          {hasPermission('lims') && <MenuButton active={currentView === 'lims'} onClick={() => {setCurrentView('lims'); if(window.innerWidth<1024) setIsSidebarOpen(false);}} iconClass="fa-layer-group" label="Portal LABLIMS" isSidebarOpen={isSidebarOpen} />}
          {hasPermission('calendar') && <MenuButton active={currentView === 'calendar'} onClick={() => {setCurrentView('calendar'); if(window.innerWidth<1024) setIsSidebarOpen(false);}} iconClass="fa-calendar-days" label="Agenda" isSidebarOpen={isSidebarOpen} />}
          {hasPermission('users') && <MenuButton active={currentView === 'users'} onClick={() => {setCurrentView('users'); if(window.innerWidth<1024) setIsSidebarOpen(false);}} iconClass="fa-users" label="Acessos" isSidebarOpen={isSidebarOpen} />}

          
          {(hasPermission('oee') || hasPermission('history') || hasPermission('calendar')) && isSidebarOpen && (
            <div className="pt-3 pb-1 px-5">
              <span className="text-[10px] font-bold text-blue-300 dark:text-slate-500 uppercase tracking-widest">Indicadores</span>
            </div>
          )}
          {hasPermission('oee') && <MenuButton active={currentView === 'oee'} onClick={() => {setCurrentView('oee'); if(window.innerWidth<1024) setIsSidebarOpen(false);}} iconClass="fa-industry" label="Lançamento OEE" isSidebarOpen={isSidebarOpen} />}
          {hasPermission('history') && <MenuButton active={currentView === 'history'} onClick={() => {setCurrentView('history'); if(window.innerWidth<1024) setIsSidebarOpen(false);}} iconClass="fa-chart-line" label="Dashboard OEE" isSidebarOpen={isSidebarOpen} />}
        </nav>

        <div className="py-3 border-t border-[#00386E] dark:border-white/5 flex flex-col gap-0.5 shrink-0">
          {hasPermission('configuracoes') && <MenuButton active={currentView === 'configuracoes'} onClick={() => {setCurrentView('configuracoes'); if(window.innerWidth<1024) setIsSidebarOpen(false);}} iconClass="fa-gear" label="Configurações" isSidebarOpen={isSidebarOpen} />}
          <button onClick={logout} className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-300 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-500/10 transition-colors w-full group focus:outline-none border-l-4 border-transparent`}>
            <i className="fa-solid fa-right-from-bracket text-base w-5 text-center transition-colors"></i>
            {isSidebarOpen && <span>Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-hidden">
        <header className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-2xl h-16 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 z-30 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors focus:outline-none">
               <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-3">
              {isLoading && <span className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Loader2 size={14} className="animate-spin text-blue-500 dark:text-[#0ea5e9]"/> Sincronizando...</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative group hidden md:block">
               <button onClick={() => setIsCommandOpen(true)} className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-md text-slate-400 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-medium transition-colors focus:outline-none">
                 <Command size={14} /> <span className="hidden lg:inline">CTRL+K</span>
               </button>
            </div>
            <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors focus:outline-none">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="relative group">
              <button className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors focus:outline-none relative">
                <Bell size={20} />
                <span className="absolute top-1 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>
            </div>
            {currentView === 'dashboard' && hasPermission('import_digatron') && (
              <button onClick={() => setIsImportOpen(true)} className="ml-1 md:ml-2 bg-[#004D90] dark:bg-white/10 dark:border dark:border-white/10 text-white hover:bg-[#003870] dark:hover:bg-white/20 px-3 md:px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-colors focus:outline-none">
                <i className="fa-solid fa-cloud-arrow-up text-[#FFBF3C]"></i>
                <span className="hidden sm:inline">Importar</span>
              </button>
            )}
          </div>
        </header>

        <main className={`flex-1 relative w-full bg-slate-50 dark:bg-transparent min-h-0 ${isFullScreenView ? 'flex flex-col overflow-hidden' : 'block overflow-y-auto no-scrollbar'}`}>
          <div className={`w-full max-w-[1600px] mx-auto flex flex-col ${isFullScreenView ? 'h-full overflow-hidden min-h-0 flex-1' : 'min-h-full'}`}>
            
            <div className={`flex-1 flex flex-col w-full ${isFullScreenView ? 'h-full overflow-hidden min-h-0' : ''}`}>
              {currentView === 'dashboard' && (
                <ProtectedRoute requiredPermission="dashboard">
                  <div className="p-4 lg:p-6 h-full w-full flex flex-col overflow-hidden min-h-0">
                    <DashboardView
                      baths={baths} experienceOwners={experienceOwners} onRefreshData={fetchData}
                      onAddCircuit={(bid) => { setTargetBath(bid); setIsAddOpen(true); }}
                      onDeleteCircuit={deleteCircuit} onToggleMaintenance={toggleMaintenance}
                      onDeleteBath={deleteBath} onUpdateTemp={updateTemp}
                      onViewHistory={(c) => { setTargetCircuit(c); setIsHistoryOpen(true); }}
                      onMoveCircuit={openMoveModal} onLinkCircuit={openLinkModal}
                      onEditBath={(id) => { setBathToEdit(id); setIsEditBathOpen(true); }}
                      onOpenAddBathModal={() => setIsAddBathOpen(true)}
                      onToggleBathFull={handleToggleBathFull}
                      onToggleCircuitNoSpace={handleToggleCircuitNoSpace}
                    />
                  </div>
                </ProtectedRoute>
              )}
              
              {currentView === 'nova_solicitacao' && <ProtectedRoute requiredPermission="nova_solicitacao"><div className="w-full h-full"><ClientSolicitationView user={user} logout={logout} setToast={setToast} initialData={reusedData} onClearInitialData={() => setReusedData(null)} /></div></ProtectedRoute>}
              {currentView === 'lims' && <ProtectedRoute requiredPermission="lims"><div className="w-full h-full"><GerenciadorLims /></div></ProtectedRoute>}
              {currentView === 'acompanhamento' && <ProtectedRoute requiredPermission="acompanhamento"><div className="w-full h-full"><SolicitationsManagementView setToast={setToast} /></div></ProtectedRoute>}
              {currentView === 'meus_acompanhamentos' && <ProtectedRoute requiredPermission="meus_acompanhamentos"><div className="w-full h-full"><ClientTrackingView user={user} baths={baths} setToast={setToast} onReuse={handleReuseSolicitation} /></div></ProtectedRoute>}
              
              {currentView === 'baterias' && <ProtectedRoute requiredPermission="baterias"><div className="p-4 lg:p-6 w-full flex-1 flex flex-col"><ClientBatteryTracking user={user} baths={baths} experienceOwners={experienceOwners} /></div></ProtectedRoute>}
              {currentView === 'calendar' && <ProtectedRoute requiredPermission="calendar"><div className="p-4 lg:p-6 w-full flex-1 flex flex-col"><CircuitCalendarView baths={baths} searchTerm={""} /></div></ProtectedRoute>}
              {currentView === 'history' && <ProtectedRoute requiredPermission="history"><div className="p-4 lg:p-6 w-full flex-1 flex flex-col"><HistoryView logs={logs} setToast={setToast} /></div></ProtectedRoute>}
              {currentView === 'configuracoes' && <ProtectedRoute requiredPermission="configuracoes"><div className="p-4 lg:p-6 w-full flex-1 flex flex-col"><LabSettingsView setToast={setToast} /></div></ProtectedRoute>}
              {currentView === 'users' && <ProtectedRoute requiredPermission="users"><div className="p-4 lg:p-6 w-full flex-1 flex flex-col"><UserManagementView setToast={setToast} /></div></ProtectedRoute>}
              {currentView === 'oee' && <ProtectedRoute requiredPermission="oee"><div className="p-4 lg:p-6 w-full flex-1 flex flex-col"><OEEDashboardView setToast={setToast} /></div></ProtectedRoute>}
            </div>
            
            {!isFullScreenView && (
              <footer className="w-full text-center py-6 border-t border-slate-200 dark:border-white/5 mt-auto shrink-0 bg-transparent relative z-10">
                <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                  Desenvolvido por João Victor Gomes Meneses © 2026 • Sistema de gestão LabFísico v3.0
                </p>
              </footer>
            )}

          </div>
        </main>
      </div>

      {isCommandOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-[#020617]/80 dark:backdrop-blur-md flex items-start justify-center pt-[15vh] p-4 animate-in fade-in duration-200" onClick={() => setIsCommandOpen(false)}>
          <div className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-2xl rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center px-6 py-4 border-b border-slate-100 dark:border-white/10">
              <Search className="text-slate-400 dark:text-slate-400 mr-4" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Busque por módulos ou ações..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                className="w-full bg-transparent text-lg font-medium text-slate-800 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <kbd className="bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-400 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold uppercase ml-4">ESC</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto no-scrollbar p-2">
              {commandActions.length > 0 ? (
                commandActions.map((action) => (
                  <button key={action.id} onClick={() => handleCommandSelect(action.id)} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors group text-left focus:outline-none dark:focus:bg-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-md bg-transparent text-slate-400 dark:text-slate-400 group-hover:text-[#004D90] dark:group-hover:text-[#0ea5e9] flex items-center justify-center transition-colors">
                        <i className={`fa-solid ${action.icon} text-base`}></i>
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{action.label}</span>
                    </div>
                    <ArrowRight className="text-slate-300 dark:text-slate-600 group-hover:text-[#0ea5e9] dark:group-hover:text-[#0ea5e9] transition-colors opacity-0 group-hover:opacity-100" size={16} />
                  </button>
                ))
              ) : (
                <div className="p-8 flex flex-col items-center justify-center text-slate-400"><p className="font-medium text-slate-500">Nenhum atalho encontrado</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImportSuccess={(db, m) => { setBaths(db.baths); setLogs(db.logs); setToast({ message: m || 'Sincronizado!', type: 'success' }); }} protocols={protocols} onRegisterProtocol={handleAddProtocol} />
      <AddCircuitModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onConfirm={addCircuit} bathId={targetBath} baths={baths} setToast={setToast} />
      <AddBathModal isOpen={isAddBathOpen} onClose={() => setIsAddBathOpen(false)} onConfirm={addBath} />
      <TestManagerModal isOpen={isProtocolsOpen} onClose={() => setIsProtocolsOpen(false)} protocols={protocols} onAddProtocol={handleAddProtocol} onDeleteProtocol={handleDeleteProtocol} setToast={setToast} />
      
      {/* Aqui o onRefreshData={fetchData} foi passado para o modal de Rastreabilidade! */}
      <CircuitHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} circuit={targetCircuit} onRefreshData={fetchData} />
      
      <MoveCircuitModal isOpen={isMoveOpen} onClose={() => setIsMoveOpen(false)} onConfirm={handleMoveCircuit} baths={baths} sourceBathId={moveData.sourceBathId} circuitId={moveData.circuitId} />
      <LinkCircuitModal isOpen={isLinkOpen} onClose={() => setIsLinkOpen(false)} onConfirm={handleLinkCircuit} bath={linkData.bath} sourceCircuitId={linkData.sourceId} />
      <EditBathModal isOpen={isEditBathOpen} onClose={() => setIsEditBathOpen(false)} onConfirm={handleRenameBath} currentBathId={bathToEdit} />
    </div>
  );
};

export default function App() { return (<AuthProvider><MainApp /></AuthProvider>); }
