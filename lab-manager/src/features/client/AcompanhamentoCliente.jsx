import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Clock, CheckCircle2, XCircle, Flag, MessageSquare, Route, Bell, 
  User, Battery, Copy, Share2, Info, Microscope, Inbox, CalendarDays, 
  ClipboardCheck, X, Send, UserPlus
} from 'lucide-react';

const getStatusConfig = (status) => {
  switch(status) {
    case 'pendente': return { label: 'Aguardando', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', icon: Clock, baseStep: 1 };
    case 'analise': return { label: 'Em Análise', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', icon: Search, baseStep: 2 };
    case 'finalizado': return { label: 'Finalizado', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2, baseStep: 4 };
    case 'reprovado': return { label: 'Reprovado', bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', icon: XCircle, baseStep: 0 };
    default: return { label: status, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', icon: Info, baseStep: 1 };
  }
};

const DataField = ({ label, value, colSpan = "col-span-1" }) => {
  if (!value) return null;
  return (
    <div className={colSpan}>
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5 ml-1 transition-colors">{label}</span>
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-2.5 rounded-xl break-words shadow-sm transition-colors">
        {value}
      </div>
    </div>
  );
};

const ClientTrackingView = ({ user, baths = [], setToast, onReuse }) => {
  const [solicitations, setSolicitations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
   const fetchSolicitations = async () => {
  setLoading(true);
  try {
   
    const { success, data } = await apiRequest('/solicitacoes'); 
    
    if (success && data) {
    
      const listaReal = Array.isArray(data) ? data : (data.solicitacoes || []);
      
      const filtered = listaReal.filter(s => s.emailSolicitante === user.email);
      setSolicitations(filtered);
    }
  } catch (error) {
    console.error("Erro ao carregar solicitações:", error);
  } finally {
    setLoading(false);
  }
};

    if (user?.email) {
      fetchSolicitations();
      const interval = setInterval(fetchSolicitations, 10000);
      return () => clearInterval(interval);
    }
  }, [user, selectedId]);

  const selectedItem = useMemo(() => 
    solicitations.find(s => s.idSolicitacao === selectedId), 
  [solicitations, selectedId]);

  const checkIsRunningInDigatron = (experiencia) => {
    if (!experiencia) return false;
    const expLimpa = experiencia.toUpperCase().trim();
    return baths.some(bath => 
      bath.circuits?.some(c => 
        c.status === 'running' && c.batteryId?.toUpperCase().includes(expLimpa)
      )
    );
  };

  const handleShareSubmit = async () => {
    if (!shareEmail) return;
    setIsSharing(true);
    try {
      await fetch('/api/solicitacoes/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId, email: shareEmail })
      });
      setToast({ message: `Solicitação compartilhada com ${shareEmail}!`, type: 'success' });
      setIsShareModalOpen(false);
      setShareEmail('');
    } catch (e) {
      setToast({ message: "Erro ao compartilhar", type: 'error' });
    } finally { setIsSharing(false); }
  };

  const filteredList = solicitations.filter(s => 
    s.idSolicitacao.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.modeloAmostras && s.modeloAmostras.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="h-full flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 p-0 transition-colors">
        <div className="w-full lg:w-[400px] flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden shrink-0 h-full p-6 transition-colors">
           <div className="w-48 h-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg mb-6"></div>
           <div className="w-full h-12 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-2xl mb-8"></div>
           <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                 <div key={i} className="p-5 rounded-[1.5rem] border-2 border-transparent bg-slate-50 dark:bg-slate-800/30 animate-pulse flex flex-col gap-3">
                   <div className="flex justify-between"><div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div><div className="w-16 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div></div>
                   <div className="w-32 h-5 bg-slate-200 dark:bg-slate-700 rounded"></div>
                   <div className="w-40 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                 </div>
              ))}
           </div>
        </div>
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden h-full p-10 transition-colors">
           <div className="flex items-center gap-6 mb-12">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
              <div className="flex flex-col gap-2"><div className="w-48 h-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div><div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div></div>
           </div>
           <div className="w-full h-40 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-3xl mb-8"></div>
           <div className="grid grid-cols-3 gap-6"><div className="h-20 bg-slate-50 dark:bg-slate-800/30 animate-pulse rounded-xl"></div><div className="h-20 bg-slate-50 dark:bg-slate-800/30 animate-pulse rounded-xl"></div><div className="h-20 bg-slate-50 dark:bg-slate-800/30 animate-pulse rounded-xl"></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 p-0 transition-colors">
      
      <div className="w-full lg:w-[400px] flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden shrink-0 h-full transition-colors">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 transition-colors">
           <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 transition-colors">
              <Inbox className="text-blue-600 dark:text-blue-400" size={28} /> Meus Ensaios
           </h2>
           <div className="mt-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors" size={18} />
              <input 
                type="text" placeholder="Buscar ID ou Modelo..." 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50/30 dark:bg-slate-900/30 transition-colors">
          {filteredList.map(solic => {
            const isSelected = selectedId === solic.idSolicitacao;
            const isShared = solic.emailContato !== user?.email && solic.emailProprietario !== user?.email;
            let statusCfg = getStatusConfig(solic.status);
            if (solic.status === 'analise' && checkIsRunningInDigatron(solic.experiencia)) {
              statusCfg = { label: 'Em Teste (Equip.)', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', icon: Microscope, baseStep: 3 };
            }
            const StatusIcon = statusCfg.icon;

            return (
              <div 
                key={solic.idSolicitacao} onClick={() => setSelectedId(solic.idSolicitacao)}
                className={`p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all relative group ${isSelected ? 'border-blue-500 dark:border-blue-500/50 bg-white dark:bg-slate-800 shadow-lg' : 'border-transparent bg-white/60 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-500/30'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 transition-colors">{solic.dataCriacao?.split(' ')[0]}</span>
                  {isShared && (
                    <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors">
                      <Share2 size={10} /> COMPARTILHADO
                    </span>
                  )}
                </div>
                <h4 className="font-black text-slate-800 dark:text-white text-base transition-colors">{solic.idSolicitacao}</h4>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 transition-colors">{solic.modeloAmostras || solic.nomeProduto}</p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 transition-colors">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1 transition-colors ${statusCfg.bg} ${statusCfg.text}`}>
                    <StatusIcon size={10} /> {statusCfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden h-full transition-colors">
        {selectedItem ? (
          <>
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6 shrink-0 bg-white dark:bg-slate-900 transition-colors">
              <div className="flex items-center gap-5">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${selectedItem.tipo === 'eletrico' ? 'bg-amber-500 shadow-amber-200 dark:shadow-none' : 'bg-slate-700 shadow-slate-200 dark:shadow-none'}`}>
                    <ClipboardCheck className="text-white" size={28} />
                 </div>
                 <div>
                   <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">{selectedItem.idSolicitacao}</h2>
                   <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">{selectedItem.laboratorio} • ENSAIO {selectedItem.tipo}</p>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <button 
                   onClick={() => onReuse(selectedItem)}
                   className="px-5 py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-black rounded-2xl transition-all shadow-md flex items-center gap-2 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                 >
                    <Copy size={16} className="text-blue-400" /> REUTILIZAR DADOS
                 </button>
                 {(selectedItem.emailContato === user?.email || selectedItem.emailProprietario === user?.email) && (
                   <button 
                     onClick={() => setIsShareModalOpen(true)}
                     className="px-5 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600 dark:hover:border-blue-500 text-xs font-black rounded-2xl transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                   >
                      <Share2 size={16} /> COMPARTILHAR
                   </button>
                 )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50/30 dark:bg-slate-900/30 space-y-8 transition-colors">
              
              <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-8 shadow-sm relative overflow-hidden transition-colors">
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-8 flex items-center gap-2 transition-colors">
                   <Route className="text-blue-500 dark:text-blue-400" size={18} /> Rastreamento do Processo
                </h3>
                
                <div className="relative flex justify-between items-center max-w-3xl mx-auto">
                   <div className="absolute left-0 right-0 top-1/2 h-1.5 bg-slate-100 dark:bg-slate-700 -z-0 -translate-y-1/2 rounded-full overflow-hidden transition-colors">
                      <div className={`h-full bg-blue-600 dark:bg-blue-500 transition-all duration-1000`} style={{ width: `${(Math.max(1, Math.min(4, getStatusConfig(selectedItem.status).baseStep)) - 1) / 3 * 100}%` }}></div>
                   </div>
                   
                   {[
                     { step: 1, label: 'Solicitado', icon: Clock },
                     { step: 2, label: 'Em Análise', icon: Search },
                     { step: 3, label: 'Em Teste', icon: Microscope },
                     { step: 4, label: 'Concluído', icon: Flag }
                   ].map(item => {
                     let currentStep = getStatusConfig(selectedItem.status).baseStep;
                     if (currentStep === 2 && checkIsRunningInDigatron(selectedItem.experiencia)) currentStep = 3;
                     
                     const isActive = currentStep >= item.step;
                     const isCurrent = currentStep === item.step;
                     const Icon = item.icon;

                     return (
                       <div key={item.step} className="flex flex-col items-center gap-3 bg-white dark:bg-slate-800 px-4 relative z-10 transition-colors">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${isActive ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-300 dark:text-slate-500'} ${isCurrent ? 'ring-4 ring-blue-100 dark:ring-blue-900/50 scale-110' : ''}`}>
                            <Icon size={20} className={isCurrent && item.step === 3 ? 'animate-pulse' : ''} />
                          </div>
                          <span className={`text-[10px] uppercase font-black tracking-widest transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>{item.label}</span>
                       </div>
                     );
                   })}
                </div>
              </div>

              {selectedItem.status !== 'pendente' && (selectedItem.experiencia || selectedItem.previsaoFinal) && (
                <div className="bg-blue-600 dark:bg-blue-900/40 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200 dark:shadow-none relative overflow-hidden group transition-colors border border-transparent dark:border-blue-800/50">
                   <Bell className="absolute -bottom-4 -right-4 text-9xl opacity-10 group-hover:scale-110 transition-transform duration-700" />
                   <h4 className="text-base font-black mb-6 flex items-center gap-2 border-b border-white/20 pb-4">
                      <Bell size={20} /> Retorno do Laboratório
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <span className="text-[10px] font-bold text-blue-200 dark:text-blue-300 uppercase tracking-[0.2em] block mb-2 transition-colors">Protocolo de Experiência</span>
                        <div className="text-2xl font-black">{selectedItem.experiencia || 'Aguardando...'}</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-blue-200 dark:text-blue-300 uppercase tracking-[0.2em] block mb-2 transition-colors">Previsão de Finalização</span>
                        <div className="text-2xl font-black">{selectedItem.previsaoFinal ? new Date(selectedItem.previsaoFinal).toLocaleDateString() : 'Não informada'}</div>
                      </div>
                      {selectedItem.observacoes && (
                        <div className="col-span-full bg-white/10 dark:bg-black/20 p-4 rounded-xl border border-white/10 dark:border-white/5 transition-colors">
                           <span className="text-[10px] font-bold text-blue-100 dark:text-blue-200 uppercase tracking-widest block mb-2">Notas Técnicas</span>
                           <p className="text-sm font-medium leading-relaxed text-blue-50 dark:text-blue-100">{selectedItem.observacoes}</p>
                        </div>
                      )}
                   </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-8 shadow-sm transition-colors">
                 <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-2 transition-colors">
                    <User size={18} className="text-slate-400 dark:text-slate-500" /> Dados Originais da Requisição
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DataField label="Emissor da Solicitação" value={selectedItem.nomeSolicitante} />
                    <DataField label="Dono do Projeto" value={selectedItem.nomeProprietario !== selectedItem.nomeSolicitante ? selectedItem.nomeProprietario : 'O Mesmo (Emissor)'} />
                    <DataField label="Modelo das Amostras" value={selectedItem.modeloAmostras || selectedItem.nomeProduto} />
                    <DataField label="Projeto / Título" value={selectedItem.tituloProjeto} />
                    <DataField label="Quantidade" value={selectedItem.qtdAmostras ? `${selectedItem.qtdAmostras} unidades` : null} />
                    <DataField label="Objetivo do Ensaio" value={selectedItem.objetivoEnsaio} />
                    <DataField label="Descrição Detalhada" value={selectedItem.descricao} colSpan="lg:col-span-full" />
                 </div>
              </div>

            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 transition-colors">
            <CalendarDays size={64} className="opacity-10 mb-4" />
            <h3 className="text-xl font-black uppercase tracking-widest">Nenhum ensaio selecionado</h3>
          </div>
        )}
      </div>

      {isShareModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
              <div className="p-8 bg-slate-900 dark:bg-slate-950 text-white flex justify-between items-center transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-colors">
                       <UserPlus size={24} />
                    </div>
                    <div>
                       <h3 className="text-lg font-black">Compartilhar Ensaio</h3>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Acompanhamento em Equipe</p>
                    </div>
                 </div>
                 <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded"><X size={24} /></button>
              </div>
              <div className="p-8">
                 <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-6 leading-relaxed transition-colors">
                   O convidado receberá uma notificação no Portal e poderá acompanhar o status e o chat deste ensaio em tempo real.
                 </p>
                 <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1 transition-colors">E-mail do Convidado</label>
                 <div className="relative mb-8">
                    <Send className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 transition-colors" size={18} />
                    <input 
                      type="email" 
                      placeholder="email@moura.com.br"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none transition-all"
                    />
                 </div>
                 <button 
                   onClick={handleShareSubmit}
                   disabled={isSharing || !shareEmail}
                   className="w-full py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                 >
                    {isSharing ? "COMPARTILHANDO..." : "ENVIAR ACESSO AGORA"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ClientTrackingView;