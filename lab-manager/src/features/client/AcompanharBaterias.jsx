import React, { useState, useEffect, useMemo } from 'react';
import { Search, Boxes, Plug, Settings, Box, Clock, Hourglass, CheckCheck, Loader2, Flag } from 'lucide-react';

const HighlightText = ({ text, highlight, className }) => {
  if (!highlight || !text) return <span className={className}>{text}</span>;
  const parts = text.toString().split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 text-slate-900 px-0.5 rounded-[2px] shadow-sm">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

const MOCK_SOLICITACOES = [
  {
    idSolicitacao: 'REQ-102938', dataCriacao: '26/03/2026 09:15',
    experiencia: 'E105', modeloAmostras: 'Z60D', qtdAmostras: '4', tipo: 'eletrico', status: 'analise'
  },
  {
    idSolicitacao: 'REQ-592011', dataCriacao: '20/03/2026 14:30',
    experiencia: 'E099', modeloAmostras: 'M180', qtdAmostras: '2', tipo: 'mecanico', status: 'analise'
  }
];

const MOCK_BATHS = [
  {
    id: 'SALA 1',
    circuits: [
      { id: 'C-142', batteryId: '21467-E105-2026_REC', protocol: 'REC50', progress: 24.6, status: 'running', startTime: '26/03 16:20', previsao: '27/03 16:20' },
      { id: 'C-143', batteryId: '21465-E105-2026_2C20', protocol: 'RC20R50', progress: 9.3, status: 'running', startTime: '26/03 16:19', previsao: '29/03 08:19' },
      { id: 'C-201', batteryId: '11223-E099-2026_VIB', protocol: 'VIBRACAO', progress: 100, status: 'finished', startTime: '22/03 08:00', previsao: '24/03 08:00' }
    ]
  }
];

const ClientBatteryTracking = ({ user, baths = [] }) => {
  const [solicitations, setSolicitations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpId, setSelectedExpId] = useState(null);

  useEffect(() => {
    const fetchSolicitations = async () => {
      try {
        const response = await fetch('/api/solicitacoes');
        const data = await response.json();
        
        // CORREÇÃO CRÍTICA: Busca por Emitente, Dono do Projeto e Compartilhamentos
        const userSolicitations = data.filter(s => 
          s.emailContato === user?.email || 
          s.emailProprietario === user?.email ||
          (s.sharedWith && s.sharedWith.includes(user?.email))
        );
        
        setSolicitations(userSolicitations.length > 0 ? userSolicitations : MOCK_SOLICITACOES);
      } catch (error) {
        setSolicitations(MOCK_SOLICITACOES);
      }
    };
    fetchSolicitations();
  }, [user]);

  const currentBaths = baths && baths.length > 0 ? baths : MOCK_BATHS;

  const experiencesData = useMemo(() => {
    let validSolics = solicitations.filter(s => 
      s.experiencia && 
      s.status !== 'reprovado' && 
      s.status !== 'pendente'
    );

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      validSolics = validSolics.filter(s => 
        s.experiencia.toLowerCase().includes(term) || 
        (s.modeloAmostras && s.modeloAmostras.toLowerCase().includes(term)) ||
        (s.idSolicitacao.toLowerCase().includes(term))
      );
    }

    return validSolics.map(s => {
      const expLimpa = s.experiencia.toUpperCase().trim();
      const ano = s.dataCriacao ? s.dataCriacao.split('/')[2].split(' ')[0] : '2026';
      
      let runningCircuits = [];
      currentBaths.forEach(bath => {
        if (!bath.circuits) return;
        bath.circuits.forEach(c => {
          if ((c.status === 'running' || c.status === 'finished') && c.batteryId && c.batteryId.toUpperCase().includes(expLimpa)) {
            runningCircuits.push({ ...c, bathId: bath.id });
          }
        });
      });

      const qtdTotal = parseInt(s.qtdAmostras) || 0;
      const qtdRodando = runningCircuits.length;
      const qtdAguardando = Math.max(0, qtdTotal - qtdRodando);

      return {
        ...s,
        ano,
        runningCircuits,
        qtdTotal,
        qtdRodando,
        qtdAguardando
      };
    });
  }, [solicitations, currentBaths, searchTerm]);

  const selectedExp = useMemo(() => {
    if (!selectedExpId) return null;
    return experiencesData.find(e => e.idSolicitacao === selectedExpId);
  }, [selectedExpId, experiencesData]);

  return (
    <div className="h-full flex flex-col bg-transparent animate-in fade-in duration-500 transition-colors">
      
      {!selectedExp ? (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden w-full relative p-6 lg:p-10 transition-colors">
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0 border-b border-slate-100 dark:border-slate-800 pb-6 transition-colors">
            <div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
                  <Boxes size={24} />
                </div>
                Meus Lotes em Teste
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-2 flex items-center gap-2 transition-colors">
                Visualize seus testes agrupados por experiência e acompanhe o status de cada amostra.
              </p>
            </div>
            
            <div className="w-full md:w-[360px] relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Buscar Exp (Ex: E105) ou Modelo..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm" 
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
            {experiencesData.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 h-64 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 shadow-sm mt-8 transition-colors">
                 <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                   <Box size={40} className="text-slate-300 dark:text-slate-600" />
                 </div>
                 <h3 className="text-xl font-black text-slate-600 dark:text-slate-300 tracking-tight">Nenhum lote em andamento</h3>
                 <p className="text-sm font-semibold mt-2 text-slate-500 dark:text-slate-400">As requisições aprovadas aparecerão aqui.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 content-start">
                {experiencesData.map(exp => {
                  const isAllRunning = exp.qtdAguardando === 0 && exp.qtdTotal > 0;
                  const isActive = exp.qtdRodando > 0;
                  const Icon = exp.tipo === 'eletrico' ? Plug : Settings;
                  
                  return (
                    <div 
                      key={exp.idSolicitacao} 
                      onClick={() => setSelectedExpId(exp.idSolicitacao)}
                      className={`bg-white dark:bg-slate-900/50 rounded-[2rem] border overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group ${isActive ? 'border-blue-500 dark:border-blue-500/50 shadow-md' : 'border-slate-200 dark:border-slate-800 shadow-sm'}`}
                    >
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-white dark:bg-transparent group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 transition-colors">
                        <div className="flex gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${exp.tipo === 'eletrico' ? 'bg-amber-500 shadow-amber-200 dark:shadow-none' : 'bg-slate-700 shadow-slate-200 dark:shadow-none'}`}>
                            <Icon size={24} />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 dark:text-white text-2xl leading-tight flex items-center gap-2 tracking-tight transition-colors">
                               <HighlightText text={exp.experiencia} highlight={searchTerm} />
                               <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 uppercase tracking-widest mt-0.5 transition-colors">/ {exp.ano}</span>
                            </h4>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide mt-1.5 block transition-colors">
                              Modelo: <HighlightText text={exp.modeloAmostras || exp.nomeProduto} highlight={searchTerm} className="text-slate-700 dark:text-slate-300" />
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 flex flex-col gap-6 bg-slate-50/30 dark:bg-slate-900/30 transition-colors">
                        <div className="flex justify-between items-center bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                           <div className="text-center flex-1">
                              <span className="block text-3xl font-black text-slate-800 dark:text-white">{exp.qtdTotal}</span>
                              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 block">Amostras</span>
                           </div>
                           <div className="w-px h-10 bg-slate-100 dark:bg-slate-700 transition-colors"></div>
                           <div className="text-center flex-1">
                              <span className={`block text-3xl font-black ${exp.qtdRodando > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'} transition-colors`}>{exp.qtdRodando}</span>
                              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 block">Em Teste</span>
                           </div>
                           <div className="w-px h-10 bg-slate-100 dark:bg-slate-700 transition-colors"></div>
                           <div className="text-center flex-1">
                              <span className={`block text-3xl font-black ${exp.qtdAguardando > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'} transition-colors`}>{exp.qtdAguardando}</span>
                              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 block">Aguardando</span>
                           </div>
                        </div>

                        <div className="flex items-center justify-center">
                           {isAllRunning ? (
                             <span className="text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2.5 rounded-xl w-full justify-center border border-emerald-100/50 dark:border-emerald-500/20 transition-colors">
                               <CheckCheck size={16} /> Todas amostras rodando
                             </span>
                           ) : exp.qtdRodando > 0 ? (
                             <span className="text-blue-700 dark:text-blue-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 px-4 py-2.5 rounded-xl w-full justify-center border border-blue-100/50 dark:border-blue-500/20 transition-colors">
                               <Loader2 size={16} className="animate-spin" /> Lote parcialmente em teste
                             </span>
                           ) : (
                             <span className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl w-full justify-center border border-slate-200 dark:border-slate-700 transition-colors">
                               <Hourglass size={16} /> Aguardando disponibilidade
                             </span>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden w-full relative transition-colors">
          <div className="p-6 lg:p-10 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-transparent shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10 relative transition-colors">
            <div className="flex items-center gap-5">
              <button 
                onClick={() => setSelectedExpId(null)} 
                className="w-14 h-14 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-2xl transition-all shadow-sm group active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform text-xl"></i>
              </button>
              <div>
                <div className="flex items-center gap-4 mb-1">
                   <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Experiência {selectedExp.experiencia}/{selectedExp.ano}</h2>
                   <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-blue-100 dark:border-blue-500/20 shadow-sm transition-colors">{selectedExp.qtdTotal} Amostras</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold tracking-wide transition-colors">
                  Req: <span className="font-black text-slate-700 dark:text-slate-300">{selectedExp.idSolicitacao}</span> • Modelo: <span className="font-black text-slate-700 dark:text-slate-300">{selectedExp.modeloAmostras || selectedExp.nomeProduto}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 content-start">
                
                {selectedExp.runningCircuits.map(c => {
                  const isFinished = c.status === 'finished' || c.progress >= 100;
                  const barColor = isFinished ? 'bg-emerald-500' : 'bg-blue-500';
                  const borderColor = isFinished ? 'border-emerald-500 dark:border-emerald-500/50' : 'border-amber-500 dark:border-amber-500/50';
                  const indicatorColor = isFinished ? 'bg-emerald-500' : 'bg-amber-400';
                  const statusText = isFinished ? 'CONCLUÍDO' : 'EM ANDAMENTO';
                  const statusTextColor = isFinished ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400';
                  const statusBg = isFinished ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-blue-50 dark:bg-blue-500/10';

                  return (
                    <div key={`${c.bathId}-${c.id}`} className={`bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all p-6 flex flex-col min-h-[180px] relative overflow-hidden group`}>
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${indicatorColor} transition-colors`}></div>
                      
                      <div className="flex justify-between items-center mb-5 pl-2">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                          <Settings size={12} className="text-slate-300 dark:text-slate-600" /> CIRC. <span className="text-slate-700 dark:text-slate-300 text-xs">{c.id}</span>
                        </span>
                        <Clock size={14} className="text-slate-300 dark:text-slate-600 transition-colors" />
                      </div>

                      <div className="mb-1.5 pl-2">
                        <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2 truncate transition-colors" title={c.batteryId}>
                          <span className="text-amber-500 dark:text-amber-400 text-[10px] font-black bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded uppercase border border-amber-100 dark:border-amber-500/20 transition-colors">Lims</span> 
                          {c.batteryId}
                        </h4>
                      </div>
                      
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 block pl-2 truncate transition-colors" title={c.protocol}>
                        {c.protocol || 'DESCONHECIDO'}
                      </span>

                      <div className="mt-auto pl-2">
                        <div className="flex justify-between items-end mb-2.5">
                          <span className="text-sm font-black text-slate-800 dark:text-white transition-colors">{c.progress}%</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${statusTextColor} ${statusBg} px-2 py-0.5 rounded-md transition-colors`}>
                            {statusText}
                          </span>
                        </div>
                        
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-5 border border-slate-200/50 dark:border-slate-800 shadow-inner transition-colors">
                          <div className={`h-full ${barColor} transition-all duration-1000 relative`} style={{ width: `${c.progress}%` }}>
                              {!isFinished && <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>}
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                           <span className="flex items-center gap-1.5"><Clock size={10}/> {c.startTime?.replace('2026', '').trim() || '-'}</span>
                           <span className="flex items-center gap-1.5"><Flag size={10}/> {c.previsao?.replace('2026', '').trim() || '-'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {Array.from({ length: selectedExp.qtdAguardando }).map((_, index) => (
                   <div key={`ghost-${index}`} className="bg-slate-50/50 dark:bg-slate-900/50 rounded-[1.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 flex flex-col min-h-[180px] items-center justify-center text-center opacity-80 hover:opacity-100 transition-all">
                      <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                        <Hourglass size={24} className="text-slate-300 dark:text-slate-600" />
                      </div>
                      <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5 transition-colors">Amostra {selectedExp.qtdRodando + index + 1}</span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700 transition-colors">Aguardando Máquina</span>
                   </div>
                ))}

             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientBatteryTracking;