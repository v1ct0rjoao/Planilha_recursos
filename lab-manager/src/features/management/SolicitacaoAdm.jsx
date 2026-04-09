import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Printer, Paperclip, Edit, MessageSquare, Check, UserCircle2, 
  Inbox, AlertCircle, Save, Loader2, Plus, UploadCloud, FileText, CheckCircle2,
  Clock, Battery, X, Send, ArrowDownToLine
} from 'lucide-react';
import { useAuth } from '../../context/Authenticador';
import { apiRequest } from '../../services/api';

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
  if (value === undefined || value === null) return null;
  return (
    <div className={colSpan}>
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{label}</span>
      <div className="text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg">
        {value || '-'}
      </div>
    </div>
  );
};

const SolicitationsManagementView = ({ setToast }) => {
  const { user } = useAuth();
  const canManage = ['admin', 'gestor', 'lider', 'programacao_adm'].includes(user?.role);

  const [solicitations, setSolicitations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [searchId, setSearchId] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [hasNewMessages, setHasNewMessages] = useState(false);
  
  const [statusOptions, setStatusOptions] = useState(DEFAULT_STATUS);
  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [novaMensagem, setNovaMensagem] = useState('');

  const [approvalForm, setApprovalForm] = useState({
    status: '',
    dataEntrega: '',
    responsavel: '',
    dataInicio: '',
    experiencia: '',
    dataFim: '',
    houveReprogramacao: 'Não',
    motivoReprogramacao: ''
  });

  const fetchSolicitations = async () => {
    setIsLoading(true);
    const response = await apiRequest('/solicitacoes', 'GET');
    if (response.success) {
      const data = response.data;
      data.sort((a, b) => (new Date(b.dataCriacao.split('/').reverse().join('-')) - new Date(a.dataCriacao.split('/').reverse().join('-'))));
      setSolicitations(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].idSolicitacao);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchSolicitations(); }, []);

  const selectedItem = useMemo(() => 
    solicitations.find(s => s.idSolicitacao === selectedId), 
  [solicitations, selectedId]);

  useEffect(() => {
    if (selectedItem) {
      setApprovalForm({
        status: selectedItem.status || 'Aguardando Aprovação',
        dataEntrega: selectedItem.dataEntrega || '',
        responsavel: selectedItem.responsavel || user?.displayName || '',
        dataInicio: selectedItem.dataInicio || '',
        experiencia: selectedItem.experiencia || '',
        dataFim: selectedItem.dataFim || '',
        houveReprogramacao: selectedItem.houveReprogramacao || 'Não',
        motivoReprogramacao: selectedItem.motivoReprogramacao || ''
      });
    }
  }, [selectedItem, user]);

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

  const handleSalvarAprovacao = async () => {
    if (!canManage) return;
    setIsSaving(true);
    const agora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    const payload = { ...approvalForm, dataMovimentacao: agora };

    const response = await apiRequest('/solicitacoes/update', 'POST', { id: selectedItem.idSolicitacao, dados: payload });
    
    if (response.success) {
      const statusGeradores = ['Programado', 'Em Andamento', 'Concluída'];
      if (approvalForm.experiencia && statusGeradores.includes(approvalForm.status)) {
         const limsPayload = {
           idSolicitacao: selectedItem.idSolicitacao,
           experiencia: approvalForm.experiencia,
           previsaoFinal: approvalForm.dataFim,
           dadosSolicitacao: selectedItem
         };
         await apiRequest('/experiencias/gerar', 'POST', limsPayload);
      }
      setToast?.({ message: `Dados de aprovação salvos!`, type: 'success' });
      fetchSolicitations();
    } else {
      setToast?.({ message: 'Erro ao salvar dados.', type: 'error' });
    }
    setIsSaving(false);
  };

  const handleActionClick = (actionName) => {
    switch (actionName) {
      case 'Salvar Aprovação': handleSalvarAprovacao(); break;
      case 'Imprimir': window.print(); break;
      case 'Comentários': document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' }); break;
      default: setToast?.({ message: `${actionName} em desenvolvimento`, type: 'info' }); break;
    }
  };

  const filteredList = solicitations.filter(s => {
    const matchId = s.idSolicitacao.toLowerCase().includes(searchId.toLowerCase());
    const matchModel = (s.modeloAmostras || s.nomeProduto || '').toLowerCase().includes(searchModel.toLowerCase());
    const matchStatus = filterStatus === 'Todos' || s.status === filterStatus;
    const matchMessages = !hasNewMessages || (s.mensagens && s.mensagens.length > 0);
    return matchId && matchModel && matchStatus && matchMessages;
  });

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-blue-600 bg-slate-50 dark:bg-slate-950">
         <Loader2 size={48} className="animate-spin mb-4" />
         <span className="font-bold text-slate-500 text-sm uppercase tracking-widest">Carregando portal...</span>
      </div>
    );
  }

  const actionButtons = [
    { label: 'Editar Solicitação', icon: Edit, color: 'bg-slate-800 hover:bg-slate-700' },
    { label: 'Salvar Aprovação', icon: Save, color: 'bg-blue-600 hover:bg-blue-700', isPrimary: true },
    { label: 'Marcar como Visualizada', icon: Check, color: 'bg-slate-800 hover:bg-slate-700' },
    { label: 'Envio de Anexos', icon: ArrowDownToLine, color: 'bg-slate-800 hover:bg-slate-700' },
    { label: 'Imprimir', icon: Printer, color: 'bg-slate-800 hover:bg-slate-700' },
    { label: 'Comentários', icon: MessageSquare, color: 'bg-slate-800 hover:bg-slate-700' },
    { label: 'Anexos', icon: Paperclip, color: 'bg-slate-800 hover:bg-slate-700' },
  ];

  return (
    <div className="h-full flex flex-col lg:flex-row w-full bg-slate-50 dark:bg-[#0f1115] font-sans">
      
      {/* LISTA LATERAL */}
      <div className="w-full lg:w-[400px] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 h-full no-print shadow-sm z-10">
        <div className="p-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
            <Inbox className="text-blue-600" /> Ensaios Solicitados
          </h2>
          <div className="space-y-4">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer">
              <option value="Todos">Todos os Status</option>
              {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Pesquisar ID" value={searchId} onChange={(e) => setSearchId(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" />
              </div>
              <button onClick={() => setHasNewMessages(!hasNewMessages)} className={`w-12 h-6 rounded-full relative transition-all ${hasNewMessages ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${hasNewMessages ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
            <div className="relative">
              <Battery className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Pesquisar modelo" value={searchModel} onChange={(e) => setSearchModel(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30">
          {filteredList.map(solic => (
            <div key={solic.idSolicitacao} onClick={() => setSelectedId(solic.idSolicitacao)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col gap-3 ${selectedId === solic.idSolicitacao ? 'border-blue-500 bg-white dark:bg-slate-800 shadow-md scale-[1.02]' : 'border-transparent bg-white dark:bg-slate-800/40 hover:border-blue-200 shadow-sm'}`}>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-base font-black text-slate-800 dark:text-white">{solic.idSolicitacao}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{solic.laboratorio}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200"><UserCircle2 size={24} className="text-slate-300" /></div>
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">Mod: {solic.modeloAmostras || solic.nomeProduto}</span>
              <div className={`mt-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit border ${solic.status === 'Concluída' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{solic.status || 'Pendente'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden h-full">
        {selectedItem ? (
          <>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap gap-2.5 no-print shadow-sm z-20">
              {actionButtons.map((btn, idx) => (
                <button key={idx} onClick={() => handleActionClick(btn.label)} className={`px-5 py-3 min-w-[120px] flex flex-col items-center gap-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-white ${btn.color} ${btn.isPrimary ? 'shadow-lg shadow-blue-500/20 active:scale-95' : 'shadow-sm active:scale-95'}`}>
                  {btn.label === 'Salvar Aprovação' && isSaving ? <Loader2 size={16} className="animate-spin" /> : <btn.icon size={16} />}
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 custom-scrollbar">
              
              <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 rounded-l-full"></div>
                <div className="w-full bg-slate-50 dark:bg-slate-800/50 py-3 flex justify-center rounded-xl mb-10 border border-slate-100 dark:border-slate-700">
                  <h3 className="text-lg font-black text-blue-700 dark:text-blue-400 uppercase tracking-[0.2em]">Aprovação de Teste</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Status da Solicitação</label>
                      <div className="flex gap-2">
                        <select name="status" value={approvalForm.status} onChange={handleApprovalChange} className="flex-1 p-3.5 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all">
                          {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <button onClick={() => setIsAddingStatus(!isAddingStatus)} className="p-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"><Plus size={22}/></button>
                      </div>
                      {isAddingStatus && <div className="flex gap-2 mt-2 animate-in slide-in-from-top-2"><input type="text" value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} placeholder="Novo status..." className="flex-1 p-3 border-2 border-blue-100 rounded-xl text-sm font-bold" /><button onClick={handleAddCustomStatus} className="p-3 bg-blue-600 text-white rounded-xl shadow-md"><Check size={20}/></button></div>}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Responsável pela Programação</label>
                      <input type="text" name="responsavel" value={approvalForm.responsavel} onChange={handleApprovalChange} className="w-full p-3.5 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all" />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Vínculo de Experiência (LIMS)</label>
                      <input type="text" name="experiencia" value={approvalForm.experiencia} onChange={handleApprovalChange} placeholder="Digite o código. Ex: E166/2026" className="w-full p-4 border-2 border-blue-100 dark:border-blue-900/50 rounded-xl text-base font-black text-blue-700 dark:text-blue-300 bg-blue-50/30 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col gap-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Previsão de Entrega</label><input type="datetime-local" name="dataEntrega" value={approvalForm.dataEntrega} onChange={handleApprovalChange} className="w-full p-3.5 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all" /></div>
                    <div className="flex flex-col gap-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Início Real do Ensaio</label><input type="datetime-local" name="dataInicio" value={approvalForm.dataInicio} onChange={handleApprovalChange} className="w-full p-3.5 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all" /></div>
                    <div className="flex flex-col gap-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Finalização Estimada</label><input type="datetime-local" name="dataFim" value={approvalForm.dataFim} onChange={handleApprovalChange} className="w-full p-3.5 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all" /></div>
                  </div>
                </div>
              </section>

              <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-8 border-b border-slate-100 dark:border-slate-800 pb-4 uppercase tracking-widest">Ficha Técnica do Solicitante</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   <DataField label="Projeto" value={selectedItem.tituloProjeto} />
                   <DataField label="Solicitante" value={selectedItem.nomeSolicitante} />
                   <DataField label="Modelo" value={selectedItem.modeloAmostras || selectedItem.nomeProduto} />
                   <DataField label="Quantidade" value={selectedItem.qtdAmostras ? `${selectedItem.qtdAmostras} unidades` : '-'} />
                   <DataField label="Norma/Método" value={selectedItem.tituloNorma || selectedItem.nomeProcedimento} />
                   <div className="col-span-full bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Descrição do Escopo</span>
                     <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">{selectedItem.descricao}</p>
                   </div>
                </div>
              </section>

              <section id="chat-section" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden no-print shadow-sm">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center"><h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-blue-400 flex items-center gap-2"><MessageSquare size={18} className="text-blue-500" /> Histórico de Comentários</h3></div>
                <div className="p-8 max-h-[350px] overflow-y-auto space-y-4 bg-white dark:bg-slate-900">
                   {(!selectedItem.mensagens || selectedItem.mensagens.length === 0) ? <div className="text-center py-10 text-slate-300 font-bold text-xs uppercase tracking-widest">Sem interações registradas</div> : selectedItem.mensagens.map((msg) => (
                       <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.role === 'admin' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                         <span className="text-[9px] font-black text-slate-400 uppercase mb-1">{msg.autor} • {msg.data}</span>
                         <div className={`px-5 py-2.5 rounded-2xl text-sm font-bold shadow-sm ${msg.role === 'admin' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>{msg.texto}</div>
                       </div>
                   ))}
                </div>
                {canManage && <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex gap-3"><input type="text" value={novaMensagem} onChange={(e) => setNovaMensagem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Enviar nota técnica para o solicitante..." className="flex-1 px-5 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 outline-none focus:border-blue-600 bg-white dark:bg-slate-800 text-sm font-bold" /><button onClick={handleSendMessage} disabled={!novaMensagem.trim()} className="px-8 py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-md transition-all active:scale-95">Enviar</button></div>}
              </section>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300"><Inbox size={80} className="opacity-10 mb-4" /><h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Selecione uma solicitação na lista</h3></div>
        )}
      </div>
    </div>
  );
};

export default SolicitationsManagementView; 