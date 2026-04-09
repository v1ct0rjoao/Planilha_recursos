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
import SolicitationsManagementView from './features/management/SolicitacaoAdm';
import LabSettingsView from './features/admin/ConfigLogin';
import ClientBatteryTracking from './features/client/AcompanharBaterias';
import GerenciadorLims from './features/lims/GerenciadorLims';

import { bathService } from './services/bathService';
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
    
    html { font-size: 14px; } 

    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; } /* slate-50 base */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    * { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
    
    .dark body { background-color: #0f1115; }
    .dark ::-webkit-scrollbar-thumb { background: #334155; }
    .dark ::-webkit-scrollbar-thumb:hover { background: #475569; }
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
      flex items-center gap-3 px-4 py-3 w-full text-sm font-bold transition-all duration-200 group focus:outline-none border-l-4
      ${active 
        ? 'bg-[#002B5C] border-amber-400 text-white dark:bg-blue-900/40 dark:border-blue-400 dark:text-blue-300' 
        : 'border-transparent text-blue-100 hover:bg-[#00336b] hover:text-white dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
      }
    `}
  >
    <i className={`fa-solid ${iconClass} text-base w-5 text-center transition-colors ${active ? 'text-amber-400 dark:text-blue-400' : 'text-blue-200 group-hover:text-white dark:text-slate-500 dark:group-hover:text-slate-300'}`}></i>
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

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isCommandOpen) {
        setIsCommandOpen(false);
        setCommandQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandOpen]);

  useEffect(() => {
    if (isCommandOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isCommandOpen]);

  const commandActions = [
    { id: 'dashboard', label: 'Ir para Visão Geral', icon: 'fa-chart-pie', perm: 'dashboard' },
    { id: 'nova_solicitacao', label: 'Nova Solicitação', icon: 'fa-file-signature', perm: 'nova_solicitacao' },
    { id: 'meus_acompanhamentos', label: 'Meus Acompanhamentos', icon: 'fa-list-check', perm: 'meus_acompanhamentos' },
    { id: 'baterias', label: 'Minhas Baterias', icon: 'fa-car-battery', perm: 'baterias' },
    { id: 'acompanhamento', label: 'Gestão de Solicitações', icon: 'fa-clipboard-check', perm: 'acompanhamento' },
    { id: 'lims', label: 'Portal myLIMS', icon: 'fa-layer-group', perm: 'lims' },
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

  const addCircuit = useCallback(async () => { }, [fetchData, askConfirm]);
  const deleteCircuit = useCallback(async () => { }, [askConfirm]);
  const updateTemp = useCallback(async () => { }, []);
  const toggleMaintenance = useCallback(async () => { }, []);
  const addBath = useCallback(async () => { }, []);
  const deleteBath = useCallback(async () => { }, [askConfirm]);
  const handleRenameBath = useCallback(async () => { }, []);
  const handleAddProtocol = useCallback(async () => { }, []);
  const handleDeleteProtocol = useCallback(async () => { }, [askConfirm]);
  const handleMoveCircuit = useCallback(async () => { }, []);
  const handleLinkCircuit = useCallback(async () => { }, []);
  const handleToggleBathFull = useCallback(async () => { }, []);
  const handleToggleCircuitNoSpace = useCallback(async () => { }, []);
  const openMoveModal = useCallback((bid, cid) => { setMoveData({ sourceBathId: bid, circuitId: cid }); setIsMoveOpen(true); }, []);
  const openLinkModal = useCallback((b, cid) => { setLinkData({ bath: b, sourceId: cid }); setIsLinkOpen(true); }, []);

  if (!user) return <LoginPage />;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0f1115] overflow-hidden font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <GlobalStyles />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={confirmModal.onCancel} type={confirmModal.type} />

      {/* PALETA DE COMANDOS */}
      {isCommandOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4 animate-in fade-in duration-200" onClick={() => setIsCommandOpen(false)}>
          <div className="bg-white dark:bg-[#1e1f22] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <Search className="text-slate-400 dark:text-slate-500 mr-4" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Busque por módulos ou ações..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                className="w-full bg-transparent text-lg font-medium text-slate-800 dark:text-white focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
              <kbd className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 px-2 py-1 rounded text-xs font-bold uppercase ml-4">ESC</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2">
              {commandActions.length > 0 ? (
                commandActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleCommandSelect(action.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group text-left focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-800"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-md bg-transparent text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center transition-colors">
                        <i className={`fa-solid ${action.icon} text-base`}></i>
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{action.label}</span>
                    </div>
                    <ArrowRight className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" size={16} />
                  </button>
                ))
              ) : (
                <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                  <p className="font-medium text-slate-500">Nenhum atalho encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <aside className={`bg-[#004383] dark:bg-[#131418] flex flex-col transition-all duration-300 z-40 border-r border-slate-200 dark:border-slate-800/80 shrink-0 ${isSidebarOpen ? 'w-[260px]' : 'w-[80px]'}`}>
        
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-[#00386E] dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-amber-400 h-8 w-8 rounded flex items-center justify-center shrink-0">
              <i className="fa-solid fa-bolt text-[#004383] text-sm font-black"></i>
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col min-w-0">
                <h1 className="text-sm font-black tracking-tight text-white truncate leading-tight">CLM Moura</h1>
                <span className="text-[10px] font-bold text-blue-200 dark:text-slate-400 uppercase tracking-widest leading-tight">LabFísico Enterprise</span>
              </div>
            )}
          </div>
        </div>

        {isSidebarOpen && (
          <div className="px-6 py-5 flex flex-col gap-1 shrink-0">
            <span className="text-[11px] font-bold text-blue-200 dark:text-slate-500 uppercase tracking-wider">{getGreeting()}</span>
            <span className="font-bold text-white text-sm truncate">{user.displayName || user.email}</span>
          </div>
        )}

        <nav className={`flex-1 overflow-y-auto py-2 custom-scrollbar space-y-1 ${isSidebarOpen ? 'px-0' : 'px-0 pt-6'}`}>
          {hasPermission('dashboard') && <MenuButton active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} iconClass="fa-chart-pie" label="Visão Geral" isSidebarOpen={isSidebarOpen} />}
          {hasPermission('nova_solicitacao') && <MenuButton active={currentView === 'nova_solicitacao'} onClick={() => setCurrentView('nova_solicitacao')} iconClass="fa-file-signature" label="Nova Solicitação" isSidebarOpen={isSidebarOpen} />}
          {hasPermission('meus_acompanhamentos') && <MenuButton active={currentView === 'meus_acompanhamentos'} onClick={() => setCurrentView('meus_acompanhamentos')} iconClass="fa-list-check" label="Acompanhamentos" isSidebarOpen={isSidebarOpen} />}
          {hasPermission('baterias') && <MenuButton active={currentView === 'baterias'} onClick={() => setCurrentView('baterias')} iconClass="fa-car-battery" label="Minhas Baterias" isSidebarOpen={isSidebarOpen} />}
          
          {(hasPermission('acompanhamento') || hasPermission('lims')) && isSidebarOpen && (
            <div className="pt-4 pb-2 px-6">
              <span className="text-[10px] font-bold text-blue-300 dark:text-slate-500 uppercase tracking-widest">Laboratório / Admin</span>
            </div>
          )}
          {hasPermission('acompanhamento') && <MenuButton active={currentView === 'acompanhamento'} onClick={() => setCurrentView('acompanhamento')} iconClass="fa-clipboard-check" label="Gestão Solicit." isSidebarOpen={isSidebarOpen} />}
          {hasPermission('lims') && <MenuButton active={currentView === 'lims'} onClick={() => setCurrentView('lims')} iconClass="fa-layer-group" label="Portal myLIMS" isSidebarOpen={isSidebarOpen} />}
          
          {(hasPermission('oee') || hasPermission('history') || hasPermission('calendar')) && isSidebarOpen && (
            <div className="pt-4 pb-2 px-6">
              <span className="text-[10px] font-bold text-blue-300 dark:text-slate-500 uppercase tracking-widest">Gestão LIMS</span>
            </div>
          )}
          {hasPermission('oee') && <MenuButton active={currentView === 'oee'} onClick={() => setCurrentView('oee')} iconClass="fa-industry" label="Lançamento OEE" isSidebarOpen={isSidebarOpen} />}
          {hasPermission('history') && <MenuButton active={currentView === 'history'} onClick={() => setCurrentView('history')} iconClass="fa-chart-line" label="Dashboard OEE" isSidebarOpen={isSidebarOpen} />}
          {hasPermission('protocolos') && <MenuButton active={isProtocolsOpen} onClick={() => setIsProtocolsOpen(true)} iconClass="fa-flask-vial" label="Protocolos" isSidebarOpen={isSidebarOpen} />}
          {hasPermission('calendar') && <MenuButton active={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} iconClass="fa-calendar-days" label="Agenda" isSidebarOpen={isSidebarOpen} />}
          {hasPermission('users') && <MenuButton active={currentView === 'users'} onClick={() => setCurrentView('users')} iconClass="fa-users" label="Acessos" isSidebarOpen={isSidebarOpen} />}
        </nav>

        <div className="py-4 border-t border-[#00386E] dark:border-slate-800/80 flex flex-col gap-1 shrink-0">
          {hasPermission('configuracoes') && <MenuButton active={currentView === 'configuracoes'} onClick={() => setCurrentView('configuracoes')} iconClass="fa-gear" label="Configurações" isSidebarOpen={isSidebarOpen} />}
          <button onClick={logout} className={`flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-300 hover:text-rose-400 hover:bg-[#00336b] dark:hover:bg-rose-500/10 transition-colors w-full group focus:outline-none border-l-4 border-transparent`}>
            <i className="fa-solid fa-right-from-bracket text-base w-5 text-center transition-colors"></i>
            {isSidebarOpen && <span>Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen relative bg-slate-50 dark:bg-[#0f1115]">
        
        <header className="bg-white dark:bg-[#131418] h-[72px] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-30 transition-colors duration-300">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors focus:outline-none">
               {isSidebarOpen ? <Menu size={20} /> : <X size={20} />}
            </button>
            <div className="hidden sm:flex items-center gap-3">
              {isLoading && <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400"><Loader2 size={14} className="animate-spin text-blue-500"/> Sincronizando...</span>}
              {isError && <span className="flex items-center gap-2 text-xs font-semibold text-rose-500"><AlertTriangle size={14}/> Desconectado</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            
            <div className="relative group hidden md:block">
               <button onClick={() => setIsCommandOpen(true)} className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors focus:outline-none">
                 <Command size={14} /> <span className="hidden lg:inline">CTRL+K</span>
               </button>
            </div>

            <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors focus:outline-none">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative group">
              <button className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors focus:outline-none relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>

              <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-[#1e1f22] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 hidden group-hover:flex flex-col z-50 animate-in fade-in">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Notificações</span>
                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Marcar lidas</button>
                </div>
                
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors relative">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full absolute left-2 top-5"></div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 pl-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">João Victor</span> compartilhou o ensaio <span className="font-bold text-blue-600">REQ-84729</span>.
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block pl-2">Há 5 minutos</span>
                  </div>
                </div>
              </div>
            </div>

            {currentView === 'dashboard' && hasPermission('import_digatron') && (
              <button onClick={() => setIsImportOpen(true)} className="ml-2 bg-[#004383] dark:bg-white text-white dark:text-[#004383] hover:bg-[#00336b] dark:hover:bg-slate-200 px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-colors focus:outline-none">
                <i className="fa-solid fa-cloud-arrow-up"></i>
                <span className="hidden sm:inline">Importar</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto flex flex-col relative w-full h-full bg-slate-50 dark:bg-[#0f1115]">
          {currentView === 'nova_solicitacao' && (
            <ProtectedRoute requiredPermission="nova_solicitacao">
              <ClientSolicitationView user={user} logout={logout} setToast={setToast} initialData={reusedData} onClearInitialData={() => setReusedData(null)} />
            </ProtectedRoute>
          )}
          {currentView === 'lims' && <ProtectedRoute requiredPermission="lims"><GerenciadorLims /></ProtectedRoute>}
          {currentView === 'acompanhamento' && <ProtectedRoute requiredPermission="acompanhamento"><SolicitationsManagementView setToast={setToast} /></ProtectedRoute>}
          {currentView === 'meus_acompanhamentos' && (
            <ProtectedRoute requiredPermission="meus_acompanhamentos">
              <div className="p-6 lg:p-8 h-full w-full"><ClientTrackingView user={user} baths={baths} setToast={setToast} onReuse={handleReuseSolicitation} /></div>
            </ProtectedRoute>
          )}
          {currentView === 'baterias' && <ProtectedRoute requiredPermission="baterias"><div className="p-6 lg:p-8 h-full w-full"><ClientBatteryTracking user={user} baths={baths} experienceOwners={experienceOwners} /></div></ProtectedRoute>}
          
          {currentView === 'calendar' && <ProtectedRoute requiredPermission="calendar"><div className="p-6 lg:p-8 w-full h-full flex flex-col"><CircuitCalendarView baths={baths} searchTerm={""} /></div></ProtectedRoute>}
          {currentView === 'history' && <ProtectedRoute requiredPermission="history"><div className="p-6 lg:p-8 w-full"><HistoryView logs={logs} setToast={setToast} /></div></ProtectedRoute>}
          {currentView === 'configuracoes' && <ProtectedRoute requiredPermission="configuracoes"><div className="p-6 lg:p-8 h-full w-full"><LabSettingsView setToast={setToast} /></div></ProtectedRoute>}
          {currentView === 'users' && <ProtectedRoute requiredPermission="users"><div className="p-6 lg:p-8 h-full w-full"><UserManagementView setToast={setToast} /></div></ProtectedRoute>}
          {currentView === 'oee' && <ProtectedRoute requiredPermission="oee"><div className="p-6 lg:p-8 h-full w-full"><OEEDashboardView setToast={setToast} /></div></ProtectedRoute>}
          {currentView === 'dashboard' && (
            <ProtectedRoute requiredPermission="dashboard">
              <div className="p-6 lg:p-8 h-full w-full flex flex-col">
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

          <footer className="w-full text-center py-6 border-t border-slate-200 dark:border-slate-800/50 mt-auto bg-slate-50 dark:bg-[#0f1115]">
            <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
              Desenvolvido por João Victor Gomes Meneses © 2026 • LabFísico v3.0
            </p>
          </footer>
        </main>
      </div>

      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImportSuccess={(db, m) => { setBaths(db.baths); setLogs(db.logs); setToast({ message: m || 'Sincronizado!', type: 'success' }); }} protocols={protocols} onRegisterProtocol={handleAddProtocol} />
      <AddCircuitModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onConfirm={addCircuit} bathId={targetBath} baths={baths} setToast={setToast} />
      <AddBathModal isOpen={isAddBathOpen} onClose={() => setIsAddBathOpen(false)} onConfirm={addBath} />
      <TestManagerModal isOpen={isProtocolsOpen} onClose={() => setIsProtocolsOpen(false)} protocols={protocols} onAddProtocol={handleAddProtocol} onDeleteProtocol={handleDeleteProtocol} setToast={setToast} />
      <CircuitHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} circuit={targetCircuit} logs={logs} />
      <MoveCircuitModal isOpen={isMoveOpen} onClose={() => setIsMoveOpen(false)} onConfirm={handleMoveCircuit} baths={baths} sourceBathId={moveData.sourceBathId} circuitId={moveData.circuitId} />
      <LinkCircuitModal isOpen={isLinkOpen} onClose={() => setIsLinkOpen(false)} onConfirm={handleLinkCircuit} bath={linkData.bath} sourceCircuitId={linkData.sourceId} />
      <EditBathModal isOpen={isEditBathOpen} onClose={() => setIsEditBathOpen(false)} onConfirm={handleRenameBath} currentBathId={bathToEdit} />
    </div>
  );
};

export default function App() { return (<AuthProvider><MainApp /></AuthProvider>); }