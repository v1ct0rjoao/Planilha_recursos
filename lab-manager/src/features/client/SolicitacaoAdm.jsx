import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Printer, Paperclip, Edit, MessageSquare, Check, UserCircle2, 
  Inbox, Save, Loader2, Plus, ArrowDownToLine, Send, X, FileText, CheckCircle, XCircle, Download, RefreshCw, Info, History
} from 'lucide-react';
import { useAuth } from '../../context/Authenticador';
import { apiRequest } from '../../services/api';
import ClientSolicitationView from './SolicitacaoCliente';

const DEFAULT_STATUS = [
  'Aguardando aprovação do solicitante',
  'Aguardando Aprovação',
  'Em Análise',
  'Pendente de Atualização de Dados',
  'Programado',
  'Em Andamento',
  'Rejeitada',
  'Cancelada',
  'Concluída'
];

const DataField = ({ label, value, colSpan = "col-span-1" }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className={`${colSpan} flex flex-col gap-0.5`}>
      <span className="text-[13px] text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-[14px] font-medium text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
};

const SolicitationsManagementView = ({ setToast }) => {
  const { user, userRole } = useAuth();
  const perfilAtual = (userRole || '').toLowerCase();
  const canManage = ['admin', 'administrador', 'gestor', 'lider', 'programacao', 'programacao_adm'].includes(perfilAtual);
  const chatEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [solicitations, setSolicitations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [searchId, setSearchId] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [statusOptions, setStatusOptions] = useState(DEFAULT_STATUS);
  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('detalhes');

  const [approvalForm, setApprovalForm] = useState({
    status: '', dataEntrega: '', responsavel: '', dataInicio: '', experiencia: '', dataFim: ''
  });

  const fetchSolicitations = async () => {
    setIsLoading(true);
    try {
        const response = await apiRequest('/solicitacoes/listar', 'GET');
        if (response.success && response.data) {
            const rawData = response.data;
            const listaReal = Array.isArray(rawData) ? rawData : (rawData.data || rawData.solicitacoes || []);
            
            listaReal.sort((a, b) => {
               if (!a.dataCriacao || !b.dataCriacao) return 0;
               const parseDate = (dateStr) => {
                   const [data, hora = '00:00'] = dateStr.split(' ');
                   const [dia, mes, ano] = data.split('/');
                   return new Date(`${ano}-${mes}-${dia}T${hora}`).getTime();
               };
               return parseDate(b.dataCriacao) - parseDate(a.dataCriacao);
            });
            
            setSolicitations(listaReal);
            if (listaReal.length > 0 && !selectedId) setSelectedId(listaReal[0].idSolicitacao);
        } else {
            setSolicitations([]);
        }
    } catch (e) {
        setSolicitations([]);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => { fetchSolicitations(); }, []);

  const selectedItem = useMemo(() => 
    solicitations.find(s => s.idSolicitacao === selectedId), 
  [solicitations, selectedId]);

  useEffect(() => {
    if (selectedItem) {
      setActiveTab('detalhes');
      setApprovalForm({
        status: selectedItem.status || 'Aguardando Aprovação',
        dataEntrega: selectedItem.dataEntrega || '',
        responsavel: selectedItem.responsavel || user?.displayName || '',
        dataInicio: selectedItem.dataInicio || '',
        experiencia: selectedItem.experiencia || '',
        dataFim: selectedItem.dataFim || ''
      });
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      setIsAddingStatus(false);
    }
  }, [selectedItem, user]);

  useEffect(() => {
    if (activeTab === 'timeline') {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeTab, selectedItem?.mensagens]);

  const handleStatusChange = (e) => {
    const value = e.target.value;
    if (value === 'ADD_NEW_STATUS') {
      setIsAddingStatus(true);
      setApprovalForm(prev => ({ ...prev, status: '' }));
    } else {
      setIsAddingStatus(false);
      setApprovalForm(prev => ({ ...prev, status: value }));
    }
  };

  const handleApprovalChange = (e) => {
    const { name, value } = e.target;
    setApprovalForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCustomStatus = () => {
    if (newStatusName.trim() && !statusOptions.includes(newStatusName)) {
      setStatusOptions([...statusOptions, newStatusName]);
      setApprovalForm(prev => ({ ...prev, status: newStatusName }));
      setNewStatusName('');
      setIsAddingStatus(false);
    }
  };

  const handleSalvarRascunho = async () => {
    if (!canManage) return;
    setIsSaving(true);
    const payload = { ...approvalForm, dataMovimentacao: new Date().toISOString() };
    const response = await apiRequest('/solicitacoes/update', 'POST', { id: selectedItem.idSolicitacao, dados: payload });
    
    if (response.success) {
      await fetchSolicitations();
      setToast?.({ message: 'Rascunho salvo com sucesso!', type: 'success' });
    } else {
      setToast?.({ message: 'Erro ao salvar.', type: 'error' });
    }
    setIsSaving(false);
  };

  const handleAtualizarStatus = async () => {
    if (!canManage) {
        setToast?.({ message: 'Você não tem permissão de administrador para atualizar.', type: 'error' });
        return; 
    }

    setIsSaving(true);
    try {
        const payload = {
            status: approvalForm.status,
            responsavel: approvalForm.responsavel,
            experiencia: approvalForm.experiencia,
            dataInicio: approvalForm.dataInicio,
            dataFim: approvalForm.dataFim,
            dataEntrega: approvalForm.dataEntrega,
            dataMovimentacao: new Date().toISOString()
        };

        const response = await apiRequest('/solicitacoes/update', 'POST', { 
            id: selectedItem.idSolicitacao, 
            dados: payload 
        });
        
        if (response.success) {
            setSolicitations(prevSolicitacoes => 
                prevSolicitacoes.map(solic => 
                    solic.idSolicitacao === selectedItem.idSolicitacao ? { ...solic, ...payload } : solic
                )
            );
            setToast?.({ message: 'Painel e Status atualizados com sucesso no Banco!', type: 'success' });
        } else {
            setToast?.({ message: `Erro da API: ${response.erro || 'Desconhecido'}`, type: 'error' });
        }
    } catch (error) {
        setToast?.({ message: 'Erro de comunicação ao salvar os dados.', type: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleAprovar = async () => {
    if (!canManage) return;
    if (!approvalForm.experiencia) {
        setToast?.({ message: "Preencha o ID da Experiência no campo de Controle para aprovar.", type: "error" });
        return;
    }
    setIsSaving(true);
    const limsPayload = {
        idSolicitacao: selectedItem.idSolicitacao,
        experiencia: approvalForm.experiencia,
        previsaoFinal: approvalForm.dataFim,
        dadosSolicitacao: selectedItem
    };
    const response = await apiRequest('/solicitacoes/experiencias/gerar', 'POST', limsPayload);
    
    if (response.success) {
        await fetchSolicitations();
        setToast?.({ message: `Aprovado e Experiência ${approvalForm.experiencia} gerada!`, type: 'success' });
    } else {
        setToast?.({ message: `Erro: ${response.data?.erro}`, type: 'error' });
    }
    setIsSaving(false);
  };

  const handleSendMessage = async () => {
    if (!novaMensagem.trim() || !canManage) return;
    const newMessage = {
      id: Date.now().toString(),
      autor: user?.displayName || user?.email?.split('@')[0] || 'Administração',
      role: 'admin',
      data: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      texto: novaMensagem.trim()
    };
    const mensagensAtualizadas = [...(selectedItem.mensagens || []), newMessage];
    
    setSolicitations(prev => prev.map(s => s.idSolicitacao === selectedItem.idSolicitacao ? { ...s, mensagens: mensagensAtualizadas, dataMovimentacao: new Date().toISOString() } : s));
    setNovaMensagem('');
    
    const response = await apiRequest('/solicitacoes/update', 'POST', { id: selectedItem.idSolicitacao, dados: { mensagens: mensagensAtualizadas } });
    if (!response.success) {
      setToast?.({ message: 'Erro ao enviar.', type: 'error' });
      fetchSolicitations();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !canManage) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      const novoAnexo = {
        id: Date.now().toString(),
        nome: file.name,
        url: base64String,
        data: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
        autor: user?.displayName || 'Administração'
      };
      
      const anexosAtualizados = [...(selectedItem.anexos || []), novoAnexo];
      const response = await apiRequest('/solicitacoes/update', 'POST', {
        id: selectedItem.idSolicitacao,
        dados: { anexos: anexosAtualizados }
      });

      if (response.success) {
        setSolicitations(prev => prev.map(s => s.idSolicitacao === selectedItem.idSolicitacao ? { ...s, anexos: anexosAtualizados, dataMovimentacao: new Date().toISOString() } : s));
        setToast?.({ message: 'Anexo enviado!', type: 'success' });
      } else {
        setToast?.({ message: 'Erro ao enviar.', type: 'error' });
      }
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = (anexo) => {
    const link = document.createElement('a');
    link.href = anexo.url;
    link.download = anexo.nome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDataMovimentacao = (isoString) => {
      if (!isoString) return '-';
      try {
          const d = new Date(isoString);
          if (isNaN(d.getTime())) return isoString;
          return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
      } catch(e) { return '-'; }
  };

  if (editingRequest) {
      return (
          <ClientSolicitationView 
             user={user}
             initialData={editingRequest}
             isEditMode={true}
             onCancelEdit={() => setEditingRequest(null)}
             onSaveSuccess={() => {
                 setEditingRequest(null);
                 fetchSolicitations();
             }}
             setToast={setToast}
          />
      );
  }

  const filteredList = solicitations.filter(s => {
    const matchId = s.idSolicitacao.toLowerCase().includes(searchId.toLowerCase());
    const matchModel = (s.modeloAmostras || s.nomeProduto || '').toLowerCase().includes(searchModel.toLowerCase());
    const matchStatus = filterStatus === 'Todos' || s.status === filterStatus;
    return matchId && matchModel && matchStatus;
  });

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-800 bg-slate-50 dark:bg-[#1a1d21] dark:text-slate-200">
         <Loader2 size={32} className="animate-spin mb-4 text-slate-400" />
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col lg:flex-row w-full bg-[#f4f6f8] dark:bg-[#1a1d21] font-sans text-slate-900 dark:text-slate-200">
        
        <div className="w-full lg:w-[340px] flex flex-col bg-white dark:bg-[#202327] border-r border-slate-200 dark:border-slate-800 shrink-0 h-full z-10 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1d21]">
            <h2 className="text-lg font-bold text-[#1e3a8a] dark:text-blue-100 mb-4 flex items-center gap-2">
              Ensaios Solicitados
            </h2>
            <div className="space-y-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-white dark:bg-[#1a1d21] border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm">
                <option value="Todos">Status: Todos</option>
                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div className="flex gap-2">
                  <input type="text" placeholder="Pesquisar ID" value={searchId} onChange={(e) => setSearchId(e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-[#1a1d21] border border-slate-300 dark:border-slate-700 rounded-md text-[13px] text-slate-900 dark:text-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all shadow-sm" />
                  <input type="text" placeholder="Pesquisar modelo" value={searchModel} onChange={(e) => setSearchModel(e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-[#1a1d21] border border-slate-300 dark:border-slate-700 rounded-md text-[13px] text-slate-900 dark:text-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all shadow-sm" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-[#f4f6f8] dark:bg-[#1a1d21] custom-scrollbar p-3 space-y-3">
            {filteredList.map(solic => {
              const isSelected = selectedId === solic.idSolicitacao;
              const dataSol = solic.dataCriacao || '-';
              const dataMov = formatDataMovimentacao(solic.dataMovimentacao) !== '-' ? formatDataMovimentacao(solic.dataMovimentacao) : dataSol;
              const lab = solic.laboratorio ? `Laboratório Físico - UN${solic.laboratorio.replace('UND ', '0')}` : 'Laboratório Físico - UN01';
              const expStr = solic.experiencia ? `${solic.experiencia}` : 'Aguardando LIMS';
              
              const isConcluido = solic.status === 'Concluída';
              const isEmAndamento = solic.status === 'Em Andamento' || solic.status === 'Programado';
              const isErro = solic.status === 'Rejeitada' || solic.status === 'Cancelada';
              const dotColor = isConcluido ? 'bg-emerald-500' : isEmAndamento ? 'bg-blue-500' : isErro ? 'bg-rose-500' : 'bg-amber-400';

              return (
                <div 
                  key={solic.idSolicitacao} 
                  onClick={() => setSelectedId(solic.idSolicitacao)} 
                  className={`p-3 cursor-pointer flex flex-col gap-1.5 rounded-xl border-2 transition-all ${isSelected ? 'bg-[#eef2f6] dark:bg-[#2a3038] border-blue-500 shadow-sm' : 'bg-white dark:bg-[#202327] border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="text-[14px] font-black text-[#1e3a8a] dark:text-blue-200 truncate">{solic.idSolicitacao}</span>
                      <span className="text-[11px] text-[#0f172a] dark:text-slate-200 mt-0.5 truncate">{lab}</span>
                      <span className="text-[11px] text-[#0f172a] dark:text-blue-300 mt-0.5 truncate"><span className="font-bold">Experiência:</span> {expStr}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
                       <UserCircle2 size={16} className="text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>

                  <div className="text-[12px] text-[#0f172a] dark:text-blue-400 mt-1 truncate">
                      <span className="font-bold">Modelo:</span> {solic.modeloAmostras || solic.nomeProduto || '-'}
                  </div>
                  
                  <div className="flex justify-between items-end mt-0.5">
                     <div className="flex flex-col leading-tight">
                        <span className="text-[10px] text-[#1e3a8a] dark:text-blue-300 font-bold">Solicitação:</span>
                        <span className="text-[11px] text-slate-800 dark:text-slate-300">{dataSol.split(' ')[0]}</span>
                     </div>
                     <div className="flex flex-col text-right leading-tight">
                        <span className="text-[10px] text-[#1e3a8a] dark:text-blue-300 font-bold">Movimentação:</span>
                        <span className="text-[11px] text-slate-800 dark:text-slate-300">{dataMov.split(' ')[0]}</span>
                     </div>
                  </div>

                  <div className="text-[11px] font-bold text-[#0f172a] dark:text-slate-100 mt-1 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800/50 pt-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
                    <span className="truncate">Status: <span className="font-normal text-[#0f172a] dark:text-slate-300 ml-0.5">{solic.status || 'Pendente'}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden h-full">
          {selectedItem ? (
            <>
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#202327] flex justify-between items-center shrink-0 z-20 shadow-sm">
                 <div>
                   <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedItem.idSolicitacao}</h2>
                      
                   </div>
                   <p className="text-sm text-slate-500">{selectedItem.dataCriacao}</p>
                 </div>
                 
                 <div className="flex gap-3">
                   <button onClick={() => setEditingRequest(selectedItem)} className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#26292e] border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-[#30343a] shadow-sm transition-colors flex items-center gap-2">
                     <Edit size={16} /> Editar Completo
                   </button>
                   <button onClick={() => setShowPrintModal(true)} className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#26292e] border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-[#30343a] shadow-sm transition-colors flex items-center gap-2">
                     <Printer size={16} /> Imprimir
                   </button>
                   <button onClick={handleSalvarRascunho} disabled={isSaving} className="px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#26292e] border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-[#30343a] shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70">
                     {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Rascunho
                   </button>
                   <div className="w-px h-8 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                   
                   <button onClick={handleAtualizarStatus} disabled={isSaving} className="px-4 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/50 rounded-lg hover:bg-blue-100 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70">
                     {isSaving ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Atualizar Status
                   </button>
                   <button onClick={handleAprovar} disabled={isSaving || selectedItem.status === 'Programado'} className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70">
                     <CheckCircle size={16} /> Salvar Aprovação
                   </button>
                 </div>
              </div>

              <div className="flex gap-2 px-6 pt-3 bg-[#f4f6f8] dark:bg-[#1a1d21] border-b border-slate-200 dark:border-slate-800">
                 <button onClick={() => setActiveTab('detalhes')} className={`px-5 py-2.5 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'detalhes' ? 'bg-white dark:bg-[#202327] text-blue-600 dark:text-blue-400 border-t border-l border-r border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}><Info size={16}/> Controle & Especificações</button>
                 <button onClick={() => setActiveTab('historico')} className={`px-5 py-2.5 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'historico' ? 'bg-white dark:bg-[#202327] text-blue-600 dark:text-blue-400 border-t border-l border-r border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}><History size={16}/> Histórico</button>
                 <button onClick={() => setActiveTab('anexos')} className={`px-5 py-2.5 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'anexos' ? 'bg-white dark:bg-[#202327] text-blue-600 dark:text-blue-400 border-t border-l border-r border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}><Paperclip size={16}/> Anexos <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] ml-1">{selectedItem.anexos?.length || 0}</span></button>
                 <button onClick={() => setActiveTab('timeline')} className={`px-5 py-2.5 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'timeline' ? 'bg-white dark:bg-[#202327] text-blue-600 dark:text-blue-400 border-t border-l border-r border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}><MessageSquare size={16}/> Timeline <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] ml-1">{selectedItem.mensagens?.length || 0}</span></button>
              </div>

              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar bg-[#f4f6f8] dark:bg-[#1a1d21]">
                
                {activeTab === 'detalhes' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <section className="bg-white dark:bg-[#202327] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Controle de Teste</h3>
                      </div>
                      
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Status operacional</label>
                          {!isAddingStatus ? (
                            <select name="status" value={approvalForm.status} onChange={handleStatusChange} className="flex-1 px-3 py-2 bg-white dark:bg-[#1a1d21] border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all">
                              {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              <option value="ADD_NEW_STATUS" className="font-bold text-blue-600">+ Adicionar novo status...</option>
                            </select>
                          ) : (
                            <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                              <input type="text" value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} placeholder="Digite o novo status" autoFocus className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm shadow-sm outline-none focus:border-blue-500" />
                              <button onClick={handleAddCustomStatus} className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors hover:bg-slate-800"><Check size={16}/></button>
                              <button onClick={() => setIsAddingStatus(false)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm transition-colors hover:bg-slate-200"><X size={16}/></button>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Responsável pela agenda</label>
                          <input type="text" name="responsavel" value={approvalForm.responsavel} onChange={handleApprovalChange} className="w-full px-3 py-2 bg-white dark:bg-[#1a1d21] border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">ID da Experiência (LIMS)</label>
                          <input type="text" name="experiencia" value={approvalForm.experiencia} onChange={handleApprovalChange} placeholder="Ex: E166/2026" className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a1d21] border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-900 dark:text-blue-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner transition-all" />
                        </div>

                        <div className="flex flex-col gap-1.5"><label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Início do Ensaio</label><input type="datetime-local" name="dataInicio" value={approvalForm.dataInicio} onChange={handleApprovalChange} className="w-full px-3 py-2 bg-white dark:bg-[#1a1d21] border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none shadow-sm" /></div>
                        <div className="flex flex-col gap-1.5"><label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Finalização Estimada</label><input type="datetime-local" name="dataFim" value={approvalForm.dataFim} onChange={handleApprovalChange} className="w-full px-3 py-2 bg-white dark:bg-[#1a1d21] border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none shadow-sm" /></div>
                        <div className="flex flex-col gap-1.5"><label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Previsão de Relatório</label><input type="datetime-local" name="dataEntrega" value={approvalForm.dataEntrega} onChange={handleApprovalChange} className="w-full px-3 py-2 bg-white dark:bg-[#1a1d21] border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none shadow-sm" /></div>
                      </div>
                    </section>

                    <section className="bg-white dark:bg-[#202327] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                         <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Especificações do Pedido</h3>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                         <DataField label="Projeto / Motivo" value={selectedItem.tituloProjeto} colSpan="md:col-span-2" />
                         <DataField label="Solicitante" value={selectedItem.nomeSolicitante} />
                         <DataField label="Laboratório" value={selectedItem.laboratorio} />
                         <DataField label="Modelo" value={selectedItem.modeloAmostras || selectedItem.nomeProduto} />
                         <DataField label="Qtd. de Amostras" value={selectedItem.qtdAmostras ? `${selectedItem.qtdAmostras} unidades` : ''} />
                         <DataField label="Código SAP" value={selectedItem.codigoSap} />
                         <DataField label="Objetivo" value={selectedItem.objetivoEnsaio} colSpan="md:col-span-2" />
                         <DataField label="Base Normativa" value={selectedItem.tituloNorma || selectedItem.nomeProcedimento} colSpan="md:col-span-2" />
                         
                         <div className="col-span-full pt-4 border-t border-slate-100 dark:border-slate-800">
                           <span className="text-[13px] text-slate-500 block mb-1">Escopo do Serviço</span>
                           <p className="text-[14px] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-[#1a1d21] p-4 rounded-lg border border-slate-100 dark:border-slate-800">{selectedItem.descricao}</p>
                         </div>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'historico' && (
                  <section className="bg-white dark:bg-[#202327] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Histórico de Alterações</h3>
                    </div>
                    <div className="p-6">
                        {(!selectedItem.historicoEdicoes || selectedItem.historicoEdicoes.length === 0) ? (
                            <div className="text-center py-8 text-slate-500 text-[13px]">Nenhum histórico de alteração registrado.</div>
                        ) : (
                            <div className="space-y-4">
                                {selectedItem.historicoEdicoes.map(log => (
                                    <div key={log.id} className="bg-slate-50 dark:bg-[#1a1d21] p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{log.autor}</span>
                                            <span className="text-xs text-slate-500">{log.data}</span>
                                        </div>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {log.alteracoes.map((alt, idx) => (
                                                <li key={idx} className="text-[13px] text-slate-600 dark:text-slate-400">{alt}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                  </section>
                )}

                {activeTab === 'anexos' && (
                  <section className="bg-white dark:bg-[#202327] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col no-print animate-in fade-in duration-300">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Documentos e Anexos</h3>
                      <div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-4 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 shadow-sm transition-colors flex items-center gap-2">
                          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />} Anexar Arquivo
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      {(!selectedItem.anexos || selectedItem.anexos.length === 0) ? (
                         <div className="text-center py-8 text-slate-500 text-[13px]">Nenhum anexo fornecido.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedItem.anexos.map((anexo) => (
                            <div key={anexo.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#1a1d21] border border-slate-200 dark:border-slate-700 rounded-lg">
                              <div className="flex flex-col overflow-hidden pr-4">
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{anexo.nome}</span>
                                <span className="text-[10px] text-slate-500">{anexo.autor} • {anexo.data}</span>
                              </div>
                              <button onClick={() => handleDownload(anexo)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Download size={16}/></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                )}

              {activeTab === 'timeline' && (
                  <section id="chat-section" className="bg-white dark:bg-[#202327] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col no-print animate-in fade-in duration-300 h-[350px]">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Comentários</h3>
                    </div>
                    
                    <div className="p-6 flex-1 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-[#1a1d21]/50 custom-scrollbar">
                       {(!selectedItem.mensagens || selectedItem.mensagens.length === 0) ? (
                         <div className="text-center py-6 text-slate-500 text-[13px]">Nenhuma anotação registrada.</div>
                       ) : selectedItem.mensagens.map((msg) => (
                           <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.role === 'admin' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                             <div className={`px-4 py-2.5 rounded-xl text-[14px] shadow-sm border ${msg.role === 'admin' ? 'bg-slate-100 border-slate-200 text-slate-900 dark:bg-[#30343a] dark:border-slate-700 dark:text-slate-100 rounded-br-sm' : 'bg-white border-slate-200 text-slate-800 dark:bg-[#202327] dark:border-slate-700 dark:text-slate-200 rounded-bl-sm'}`}>
                               {msg.texto}
                             </div>
                             <span className="text-[11px] text-slate-500 mt-1.5">{msg.autor} • {msg.data}</span>
                           </div>
                       ))}
                       <div ref={chatEndRef} />
                    </div>
                    
                    {canManage && (
                      <div className="p-4 bg-slate-50 dark:bg-[#202327] border-t border-slate-200 dark:border-slate-800 flex gap-3 items-center rounded-b-xl shrink-0">
                        <input 
                          type="text" 
                          value={novaMensagem} 
                          onChange={(e) => setNovaMensagem(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                          placeholder="Deixe uma nota no histórico da requisição..." 
                          className="flex-1 px-4 py-2 bg-white dark:bg-[#1a1d21] border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm shadow-sm transition-all" 
                        />
                        <button 
                          onClick={handleSendMessage} 
                          disabled={!novaMensagem.trim()} 
                          className="px-4 py-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                        >
                          <Send size={14} /> Enviar
                        </button>
                      </div>
                    )}
                  </section>
                )}

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Inbox size={48} className="opacity-30 mb-4" />
              <span className="text-sm font-medium">Selecione uma requisição para visualizar os detalhes</span>
            </div>
          )}
        </div>
      </div>

      {showPrintModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 lg:p-8 backdrop-blur-sm animate-in fade-in print:absolute print:inset-0 print:bg-white print:p-0 print:block print:z-[9999]">
          <style type="text/css">
            {`
              @media print {
                body * { visibility: hidden; }
                #printable-a4, #printable-a4 * { visibility: visible; }
                #printable-a4 { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
                @page { size: A4; margin: 10mm; }
              }
            `}
          </style>
          
          <div className="bg-slate-100 rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col h-[95vh] print:h-auto print:shadow-none print:rounded-none print:bg-white print:w-full print:block print:m-0">
            
            <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center shrink-0 print:hidden bg-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <FileText size={24} className="text-blue-600" />
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Pré-visualização de Impressão</h3>
                  <p className="text-sm text-slate-500">Ficha de Solicitação de Ensaio</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPrintModal(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors">Fechar</button>
                <button onClick={() => window.print()} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md flex gap-2 items-center"><Printer size={18} /> Imprimir Agora</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar print:overflow-visible print:p-0 flex justify-center print:block">
              
              <div id="printable-a4" className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg print:shadow-none mx-auto text-black p-10 font-sans print:max-w-full print:w-full print:min-h-0" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                
                <div className="bg-[#3B5998] text-white px-4 py-3 flex items-center justify-between mb-6" style={{ backgroundColor: '#3B5998', color: '#ffffff' }}>
                   <span className="text-xl font-bold">←</span>
                   <h2 className="text-lg font-bold tracking-wide">Laboratório Físico UN{selectedItem?.laboratorio?.replace('UND ', '0') || '01'} - Solicitação de Ensaio</h2>
                   <div className="w-5"></div> 
                </div>

                <div className="flex justify-between items-center mb-4 px-2">
                   <div className="flex gap-2 items-center">
                      <div className="flex h-8">
                         <div className="w-4 bg-amber-500 transform skew-x-[-20deg]" style={{ backgroundColor: '#f59e0b' }}></div>
                         <div className="w-4 bg-[#1e3a8a] transform skew-x-[-20deg] -ml-2" style={{ backgroundColor: '#1e3a8a' }}></div>
                      </div>
                      <span className="font-black text-3xl italic text-black tracking-tighter lowercase">moura</span>
                   </div>
                   <div className="text-center">
                      <h3 className="font-extrabold text-sm uppercase text-black">Laboratório Elétrico e Mecânico</h3>
                      <p className="text-[11px] font-medium text-black mt-1 uppercase">Acumuladores Moura S/A - Matriz</p>
                   </div>
                   <div className="text-right flex gap-2 items-center">
                      <span className="font-extrabold text-sm uppercase text-black">Experiência Nº:</span>
                      <span className="font-normal text-sm text-black">{selectedItem?.experiencia || '---'}</span>
                   </div>
                </div>

                <div className="text-center mb-2 px-10">
                  <p className="text-[10px] text-black leading-tight">Endereço: Rua Diário de Pernambuco - Bairro: Edson Mororó Moura, Nº 195 Belo Jardim - PE - CEP:55150-615. Tel.: (81) 3726-1044</p>
                </div>

                <div className="border-b-[1.5px] border-dashed border-slate-400 my-4 w-full"></div>

                <div className="flex justify-between px-2 mb-4">
                   <div className="flex flex-col gap-3">
                      <div className="text-sm text-black"><span className="font-bold">Solicitação para:</span> <span className="ml-1">{selectedItem?.nomeSolicitante || ''}</span></div>
                      <div className="text-sm text-black"><span className="font-bold">Título do Projeto:</span> <span className="ml-1">{selectedItem?.tituloProjeto || ''}</span></div>
                   </div>
                   <div className="text-sm text-black mr-12"><span className="font-bold">ID da solicitação:</span> <span className="ml-1">{selectedItem?.idSolicitacao || ''}</span></div>
                </div>

                <div className="border-b-[1.5px] border-dashed border-slate-400 my-4 w-full"></div>

                <div className="flex px-2 mb-4">
                   <div className="flex flex-col gap-3 w-1/2">
                      <div className="text-sm text-black"><span className="font-bold">Modelo de bateria:</span> <span className="ml-1">{selectedItem?.modeloAmostras || selectedItem?.nomeProduto || ''}</span></div>
                      <div className="text-sm text-black"><span className="font-bold">Quantidade de Amostras:</span> <span className="ml-1">{selectedItem?.qtdAmostras || ''}</span></div>
                      <div className="text-sm text-black"><span className="font-bold">Código SAP:</span> <span className="ml-1">{selectedItem?.codigoSap || ''}</span></div>
                   </div>
                   <div className="flex flex-col gap-3 w-1/2 pl-4">
                      <div className="text-sm text-black"><span className="font-bold">Tipo de bateria:</span> <span className="ml-1">{selectedItem?.tipoBateria || ''}</span></div>
                      <div className="text-sm text-black"><span className="font-bold">Capacidade nominal:</span> <span className="ml-1">{selectedItem?.capacidadeNominal || ''}</span></div>
                      <div className="text-sm text-black"><span className="font-bold">CCA:</span> <span className="ml-1">{selectedItem?.cca || ''}</span></div>
                      <div className="text-sm text-black"><span className="font-bold">RC (min):</span> <span className="ml-1">{selectedItem?.rc || ''}</span></div>
                   </div>
                </div>

                <div className="border-b-[1.5px] border-dashed border-slate-400 my-4 w-full"></div>

                <div className="flex flex-col gap-3 px-2 mb-4">
                    <div className="text-sm text-black"><span className="font-bold">Separador:</span> <span className="ml-1">{selectedItem?.separador || ''}</span></div>
                    <div className="text-sm text-black"><span className="font-bold">Densidade de eletrólito (g/l):</span> <span className="ml-1">{selectedItem?.densidade || ''}</span></div>
                    <div className="text-sm text-black"><span className="font-bold">Nível de eletrólito (mm):</span> <span className="ml-1">{selectedItem?.nivelEletrolito || ''}</span></div>
                    <div className="text-sm text-black"><span className="font-bold">Tipo de placa (-):</span> <span className="ml-1">{selectedItem?.placaNeg || ''}</span></div>
                    <div className="text-sm text-black"><span className="font-bold">Tipo de placa (+):</span> <span className="ml-1">{selectedItem?.placaPos || ''}</span></div>
                </div>

                <div className="border-b-[1.5px] border-dashed border-slate-400 my-4 w-full"></div>

                <div className="flex flex-col gap-3 px-2">
                    <div className="text-sm text-black">
                        <span className="font-bold">Tipo de Procedimento:</span> 
                        <span className="ml-2 italic uppercase">
                          {selectedItem?.tipoProcedimento === 'normativo' 
                            ? `${selectedItem?.tituloNorma || ''} - ${selectedItem?.tituloEnsaio || ''}` 
                            : selectedItem?.nomeProcedimento || ''}
                        </span>
                    </div>
                </div>

                <div className="mt-auto pt-20 text-[9px] text-slate-400 text-center">
                    Documento gerado eletronicamente pelo LabFísico Enterprise - Moura © 2026
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SolicitationsManagementView;