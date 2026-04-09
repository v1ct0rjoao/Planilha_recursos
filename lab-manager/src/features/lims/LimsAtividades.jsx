import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronDown, Check, FlaskConical, FileText, Activity, Layers, Play, Settings2, Copy, Plus, BookOpen, Link2, Trash2, Edit3, Save, MessageSquare, Database, FileBox, CalendarClock, History, Target, Truck, AlertTriangle, UserCheck, MapPin, ClipboardList, CalendarDays, Clock, Factory, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '../../context/Authenticador'; 

const LimsAtividades = () => {
  const { user } = useAuth(); 
  
  const canEditCoreData = ['admin', 'gestor', 'lider', 'programacao_adm'].includes(user?.role);
  const canEditResults = ['admin', 'gestor', 'lider', 'programacao_adm', 'tecnico'].includes(user?.role);

  const [experiencias, setExperiencias] = useState([]);
  const [selectedRowId, setSelectedRowId] = useState(null); 
  const [openedExp, setOpenedExp] = useState(null); 
  
  const [activeTab, setActiveTab] = useState('amostras');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCompact, setIsCompact] = useState(false);
  
  const [isEditingInfoLote, setIsEditingInfoLote] = useState(false);
  const [editedInfoList, setEditedInfoList] = useState([]);

  const [selectedAmostra, setSelectedAmostra] = useState(null);
  const [activeAmostraTab, setActiveAmostraTab] = useState('dadosBrutos'); 
  const [activeSubTabInfo, setActiveSubTabInfo] = useState('amostra');
  
  const [isEditingAnalises, setIsEditingAnalises] = useState(false);
  const [selectedAnaliseRow, setSelectedAnaliseRow] = useState(null); 

  useEffect(() => {
    const mockData = [
      {
        idLims: 2265,
        idExperiencia: 'E120/2025',
        idSolicitacao: 'REQ-1029',
        tipoAtividade: 'Experiência',
        etapa: 'Montagem da Programação',
        dataGeracao: '26/03/2026 10:30',
        dataExecucao: '',
        dataConclusao: '',
        dataFinalizada: '',
        aprovadoPor: 'Maria Luciana',
        proprietario: 'Maria Luciana',
        conta: 'Lucas Tavares',
        contaRelacionada: '',
        areaServico: 'Unidade 01 - Laboratório Físico',
        centroServico: 'Unidade 01 - Laboratório Físico',
        prioridade: 'Normal',
        parecer: '',
        classe: '',
        subclasse: '',
        situacaoInicial: 'Recebida',
        status: 'em_teste',
        flags: { ativo: true, executando: false, confidencial: false, offline: false, disponivelColeta: false },
        
        informacoes: [
          { id: 1, info: 'Bateria / Modelo', valor: 'ME650RD', und: '-', herda: 'Sim', alt: 'Não', ent: 'Não', sai: 'Sim', herdado: 'Sim', grupo: 'Custódia' },
          { id: 2, info: 'Projeto / Objetivo', valor: 'PROJETO LATAM GR24', und: '-', herda: 'Sim', alt: 'Não', ent: 'Não', sai: 'Sim', herdado: 'Sim', grupo: 'Custódia' },
          { id: 3, info: 'Capacidade Nominal', valor: '60', und: '(Ah)', herda: 'Sim', alt: 'Não', ent: 'Não', sai: 'Sim', herdado: 'Sim', grupo: 'Custódia' },
          { id: 4, info: 'RC', valor: '90', und: '(Min)', herda: 'Sim', alt: 'Não', ent: 'Não', sai: 'Sim', herdado: 'Sim', grupo: 'Custódia' },
          { id: 5, info: 'CCA', valor: '450', und: '(A)', herda: 'Sim', alt: 'Não', ent: 'Não', sai: 'Sim', herdado: 'Sim', grupo: 'Custódia' }
        ],
        tempos: [
          { id: 1, etapa: 'Envio da Programação', est: '', real: '' },
          { id: 2, etapa: 'Finalizada', est: '', real: '' },
          { id: 3, etapa: 'Inicio dos Testes', est: '', real: '' },
          { id: 4, etapa: 'Montagem da Programação', est: '', real: '' }
        ],
        historicoLote: [
          { id: 1, etapa: 'Montagem da Programação', dataIni: '28/02/2025 16:19', respIni: 'Maria Luciana', dataExec: '', respExec: '', respEtapa: 'Maria Luciana', area: 'Unidade 01 - Laboratório Físico', obs: '' }
        ],
        atividadesVinculadas: [],
        lotesProducao: [],
        agendaParticipantes: [
          { id: 1, nome: 'Administrador Labsoft', cor: 'bg-slate-800' },
          { id: 2, nome: 'João Victor Gomes', cor: 'bg-rose-500', checked: true },
          { id: 3, nome: 'Renato Oliveira', cor: 'bg-blue-600' },
          { id: 4, nome: 'Vadson Araujo', cor: 'bg-emerald-500' }
        ],
        
        amostras: [
          { 
            idFisico: 17270, nAmostra: '723-1/2025.0', identificacao: 'Amostra 01 - LATAM (C20 e CCA)', 
            tipoProduto: 'Bateria - SLI', conta: 'Lucas Tavares', contaRelacionada: '', status: 'finalizado', atividade: 'E120/2025', 
            dataColeta: '', dataPrevista: '', dataConclusao: '05/03/2025 16:23', motivo: 'Rotina', pontoColeta: '', latitude: '', longitude: '', altitude: '',
            prazoConclusao: '72', centroServico: 'Unidade 01 - Laboratório Físico', parecer: 'Não Conforme', amostraModeloId: '',
            flags: { ativo: true, prazoManual: false, sincronizaPortal: true, sincronizada: false, offline: false, disponivelColeta: false },
            metodosAnalise: [
              { id: 1, ordem: 1, metodo: '1º Repouso @25ºC - ABNT 15940', info: 'Carga', valor: '30', und: '(Ah)', leitura: 'Sim' },
              { id: 2, ordem: 2, metodo: '1º Repouso @25ºC - ABNT 15940', info: 'Descarga', valor: '30', und: '(Ah)', leitura: 'Sim' }
            ],
            analises: [
              { id: 1, ordem: 1, analise: 'Peso', valor: '18,092', und: '(kg)', parecer: '', metodo: 'Inspeção Visual - Inmetro', etapa: 'Finalizada', grupo: 'Amostra 01 e 02' },
              { id: 2, ordem: 4, analise: 'CCA', valor: '607', und: '(A)', parecer: '', metodo: 'Medir o CCA (Midtronics)', etapa: 'Finalizada', grupo: 'Amostra 01 e 02' },
              { id: 3, ordem: 6, analise: 'Ah Step DCH 10,5V', valor: '73,29', und: '(Ah)', parecer: 'Conforme', metodo: 'Subseção 8.2 - 1º C20 @25ºC', etapa: 'Finalizada', grupo: 'Amostra 01 e 02' },
              { id: 4, ordem: 11, analise: 'Ah Step 30Sec', valor: '0,000', und: '(V)', parecer: 'Não Conforme', metodo: 'Subseção 8.4 - 1º CCA @-18ºC', etapa: 'Finalizada', grupo: 'Amostra 01 e 02' }
            ],
            dadosBrutos: [
              { id: 1, metodo: 'Medir o CCA', dado: 'CCA', valor: '607', und: '(A)', equip: 'Midtronics 01', resp: 'Vadson Araujo', data: '14/03/2025 09:59', etapa: 'Execução dos Ensaios' },
              { id: 2, metodo: 'Subseção 8.2 - 1º C20', dado: 'Ah Step DCH', valor: '73,29', und: '(Ah)', equip: 'Circuito 202 - DIG 12', resp: 'Maria Luciana', data: '18/03/2025 10:40', etapa: 'Coleta de Dados' }
            ],
            mensagens: [
              { id: 1, de: '---', para: '---', data: '27/03/2025 15:24', msg: 'Amostra #17270 - ABNT 15940: 2019 - SLI - Não Conforme. Resultados fora dos limites de especificação Ah Step 30Sec.', tipo: 'Interpretação dos Resultados', status: 'Enviada', isAlert: true }
            ],
            arquivos: [], 
            atividadesAmostra: [
              { id: 2265, num: 'E120/2025', tipo: 'Experiência', etapa: 'Montagem da Programação', conta: 'Lucas Tavares', ident: 'E120/2025 (ME650RD)', resp: 'Maria Luciana', area: 'Unidade 01 - Laboratório Físico' }
            ],
            especificacoes: [
              { id: 1, spec: 'ABNT 15940: 2019 - SLI', desc: 'ABNT 15940: 2019', metodo: 'Subseção 8.2 - 1º C20', analise: 'Ah Step DCH 10,5V', valor: '73,29', und: '(Ah)', parecer: 'Conforme', lie: '49,4', lse: '-' }
            ],
            logistica: [
              { id: 1, metodo: 'Subseção 8.2 - 1º C20 @25ºC', area: 'Unid. 01 - Físico', centro: 'Unid. 01 - Físico', prazo: '72', conclusao: '05/03/2025 16:23', dist: '28/02/2025 16:23', resp: 'Maria Luciana', obs: 'Auto' }
            ],
            historicoSituacao: [
              { id: 1, situacao: 'Registrada', resp: 'Maria Luciana', data: '28/02/2025 16:23' }
            ],
            historicoMetodos: [
              { id: 1, metodo: '3º Recarga 16h', etapa: 'Execução', respIni: 'Maria Luciana', dataIni: '26/03/2025 09:00', respFim: 'Kleberson Victor', dataFim: '26/03/2025 15:04' }
            ]
          }
        ]
      }
    ];
    setExperiencias(mockData);
  }, []);

  const filteredList = useMemo(() => {
    if (searchTerm.trim() === '') return []; 
    const term = searchTerm.toLowerCase();
    return experiencias.filter(e => 
      e.idExperiencia.toLowerCase().includes(term) || String(e.idLims).includes(term) ||
      e.informacoes.some(i => i.valor.toLowerCase().includes(term))
    );
  }, [experiencias, searchTerm]);

  useEffect(() => { if (searchTerm.trim() === '') setSelectedRowId(null); }, [searchTerm]);

  const handleOpenExperience = (exp) => {
    setOpenedExp(exp); setIsEditingInfoLote(false); setSelectedAmostra(null); setActiveTab('amostras'); 
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab); setIsEditingInfoLote(false); setSelectedAmostra(null); 
  };

  const handleOpenAmostra = (amostra) => {
    setSelectedAmostra(amostra); setActiveAmostraTab('detalhes'); setIsEditingAnalises(false); setSelectedAnaliseRow(null);
  };

  const handleEditClick = () => { 
    if(!canEditCoreData) return;
    setEditedInfoList([...openedExp.informacoes]); 
    setIsEditingInfoLote(true); 
  };

  const handleInfoChange = (id, field, value) => { 
    setEditedInfoList(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item)); 
  };

  const handleAddInfoRow = () => {
    setEditedInfoList(prev => [...prev, {
      id: Date.now(), info: '', valor: '', und: '-', herda: 'Sim', alt: 'Sim', ent: 'Não', sai: 'Não', herdado: 'Não', grupo: 'Geral'
    }]);
  };

  const handleRemoveInfoRow = (id) => {
    setEditedInfoList(prev => prev.filter(item => item.id !== id));
  };
  
  const handleSaveClick = () => {
    const updatedExperiencias = experiencias.map(exp => exp.idExperiencia === openedExp.idExperiencia ? { ...exp, informacoes: editedInfoList } : exp);
    setExperiencias(updatedExperiencias);
    setOpenedExp({ ...openedExp, informacoes: editedInfoList });
    setIsEditingInfoLote(false);
  };

  const getInfoValue = (exp, keyName) => {
    const field = exp?.informacoes?.find(i => i.info.toLowerCase().includes(keyName.toLowerCase()));
    return field ? field.valor : '-';
  };

  const renderStatusBadge = (status, text) => {
    switch(status) {
      case 'pendente':
      case 'em_analise': return <span className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 uppercase tracking-widest">{text || 'Em Análise'}</span>;
      case 'executando':
      case 'em_teste': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 uppercase tracking-widest"><span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>{text || 'Em Teste'}</span>;
      case 'finalizado': return <span className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 uppercase tracking-widest">{text || 'Finalizado'}</span>;
      default: return <span className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-bold bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20 uppercase tracking-widest">{text || status}</span>;
    }
  };

  const ActionDropdown = ({ label, children, icon: Icon, variant="default" }) => (
    <div className="relative group inline-block">
      <button className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${variant === 'primary' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
        {Icon && <Icon size={16} className={variant === 'primary' ? "text-blue-600" : "text-slate-500"} />} {label} <ChevronDown size={14} className="opacity-50" />
      </button>
      <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-white rounded-xl shadow-xl border border-slate-200 min-w-[220px] z-50 overflow-hidden py-1">
        {children}
      </div>
    </div>
  );

  const FormField = ({ label, value, readOnly = false, type = "text", colSpan = "col-span-1" }) => (
    <div className={`flex flex-col gap-2 ${colSpan}`}>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <input type={type} defaultValue={value} readOnly={readOnly} className={`w-full px-4 py-2.5 rounded-lg text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${readOnly ? 'bg-slate-50 border border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 shadow-sm'}`} />
    </div>
  );

  const FormSelect = ({ label, value, options = [], readOnly = false, colSpan = "col-span-1" }) => (
    <div className={`flex flex-col gap-2 ${colSpan}`}>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <select defaultValue={value} disabled={readOnly} className={`w-full px-4 py-2.5 rounded-lg text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${readOnly ? 'bg-slate-50 border border-slate-200 text-slate-500 cursor-not-allowed appearance-none' : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 shadow-sm cursor-pointer'}`}>
        <option value={value}>{value || 'Selecione...'}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  const FormCheckbox = ({ label, checked }) => (
    <label className="flex items-center gap-3 cursor-pointer mt-7">
      <input type="checkbox" defaultChecked={checked} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer" />
      <span className="text-sm font-bold text-slate-700">{label}</span>
    </label>
  );

  const TabButton = ({ id, label, activeTabState, setActiveTabFn, hasCount }) => (
    <button onClick={() => setActiveTabFn(id)} className={`pb-4 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors relative ${activeTabState === id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
      {label} {hasCount !== undefined && <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2.5 rounded-full text-xs">{hasCount}</span>}
      {activeTabState === id && <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-md"></span>}
    </button>
  );

  const thPadding = isCompact ? "px-3 py-2 text-[9px]" : "px-6 py-2 text-[11px]";
  const tdPadding = isCompact ? "px-3 py-2.5" : "px-6 py-5";
  const textTitle = isCompact ? "text-sm" : "text-base";
  const textSub = isCompact ? "text-[10px]" : "text-xs";
  const iconSize = isCompact ? 14 : 16;

  return (
    <div className="h-full flex flex-col w-full font-sans animate-in fade-in duration-300">
      
      {!openedExp && (
        <div className="bg-transparent flex flex-col flex-1 overflow-hidden w-full min-w-0">
          <div className="p-6 md:p-8 bg-white rounded-3xl shadow-sm border border-slate-200 shrink-0 mb-6 mx-2 flex justify-between items-start">
            <div className="flex-1 w-full max-w-3xl">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Buscar Atividades</h2>
              <p className="text-base font-medium text-slate-500 mt-1 mb-6">Pesquise por Lotes, Experiências ou Amostras.</p>
              <div className="relative w-full flex gap-3 items-center">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                  <input 
                    type="text" autoFocus placeholder="Digite o ID (E120), modelo ou projeto..." 
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-lg font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                  />
                </div>
                <button 
                  onClick={() => setIsCompact(!isCompact)}
                  className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                  title={isCompact ? "Visão Confortável" : "Visão Compacta"}
                >
                  {isCompact ? <Maximize2 size={24} /> : <Minimize2 size={24} />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col bg-transparent mx-2 min-w-0">
             {searchTerm === '' ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                  <div className="w-24 h-24 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center mb-6">
                     <Search size={40} className="text-blue-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-600">Pesquise para iniciar</h3>
                  <p className="text-base font-medium mt-2">Os resultados aparecerão aqui.</p>
                </div>
             ) : filteredList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                  <h3 className="text-lg font-bold text-slate-600">Nenhum resultado</h3>
                </div>
             ) : (
                <div className="flex flex-col h-full w-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-w-0">
                  {selectedRowId && (
                    <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex flex-wrap items-center gap-3 animate-in slide-in-from-top-4 z-40 shrink-0 w-full shadow-md">
                      <span className="text-xs font-black text-blue-300 bg-blue-900/50 px-3 py-1.5 rounded uppercase tracking-widest border border-blue-700/50 mr-2">1 Selecionado</span>
                      <button onClick={() => handleOpenExperience(experiencias.find(e => e.idExperiencia === selectedRowId))} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-900 flex items-center gap-2 transition-all"><Search size={16}/> Abrir Experiência</button>
                    </div>
                  )}
                  <div className="flex-1 overflow-auto custom-scrollbar w-full relative">
                    <table className="w-full text-left border-separate border-spacing-y-0 min-w-[1100px]">
                      <thead className="sticky top-0 z-30">
                        <tr className={`${isCompact ? 'text-[9px]' : 'text-[11px]'} uppercase tracking-widest text-slate-400 font-black`}>
                          <th className={`${thPadding} w-32 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40 border-b border-slate-200`}>ID / LIMS</th>
                          <th className={`${thPadding} border-b border-slate-200 bg-white`}>Identificação & Projeto</th>
                          <th className={`${thPadding} w-64 border-b border-slate-200 bg-white`}>Logística / Local</th>
                          <th className={`${thPadding} w-56 border-b border-slate-200 bg-white`}>Datas</th>
                          <th className={`${thPadding} w-40 text-center sticky right-0 bg-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40 border-b border-slate-200`}>Status / Etapa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredList.map((exp) => {
                          const isSelected = selectedRowId === exp.idExperiencia;
                          const rowBg = isSelected ? 'bg-blue-50/50' : 'bg-white';
                          const hoverBg = isSelected ? 'hover:bg-blue-50/50' : 'hover:bg-slate-50';
                          return (
                            <tr key={exp.idExperiencia} onClick={() => setSelectedRowId(exp.idExperiencia)} onDoubleClick={() => handleOpenExperience(exp)} 
                                className={`cursor-pointer transition-all duration-200 group ${rowBg} ${hoverBg}`}>
                              
                              <td className={`${tdPadding} align-top sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] ${rowBg} group-hover:bg-slate-50 ${isSelected ? 'group-hover:bg-blue-50/50' : ''}`}>
                                <span className={`${isCompact ? 'text-lg' : 'text-xl'} font-black text-slate-900 block group-hover:text-blue-700 transition-colors`}>{exp.idExperiencia}</span>
                                <span className={`text-[11px] font-bold text-slate-400 block mt-1 tracking-widest`}>LIMS: {exp.idLims}</span>
                              </td>
                              <td className={`${tdPadding} align-top`}>
                                <span className={`${textTitle} font-black text-slate-800 block mb-1 group-hover:text-blue-900 transition-colors`}>{exp.idExperiencia} ({getInfoValue(exp, 'modelo')} - {getInfoValue(exp, 'projeto')})</span>
                                <div className={`flex items-center gap-4 ${textSub} font-bold text-slate-500 mt-2`}>
                                   <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md"><UserCheck size={iconSize} className="text-blue-500"/> Sol: João Victor</span>
                                   <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md"><Layers size={iconSize} className="text-amber-500"/> {exp.amostras.length} Amostras</span>
                                </div>
                              </td>
                              <td className={`${tdPadding} align-top`}>
                                <span className={`${textTitle === 'text-sm' ? 'text-xs' : 'text-sm'} font-bold text-slate-700 flex items-center gap-2 mb-2 truncate`}><MapPin size={iconSize} className="text-slate-400"/> {exp.areaServico}</span>
                                <span className={`text-[11px] font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest`}><ClipboardList size={iconSize} className="text-emerald-500"/> Prog: {exp.aprovadoPor}</span>
                              </td>
                              <td className={`${tdPadding} align-top`}>
                                 <div className={`flex flex-col gap-2 ${textSub} font-bold tracking-widest`}>
                                    <span className="text-slate-500 uppercase flex items-center gap-2"><CalendarClock size={iconSize} className="text-slate-400"/> Criado: <span className="text-slate-700">{exp.dataGeracao.split(' ')[0]}</span></span>
                                    {exp.dataConclusao ? <span className="text-emerald-600 uppercase flex items-center gap-2"><Check size={iconSize}/> Fim: <span className="text-emerald-700">{exp.dataConclusao.split(' ')[0]}</span></span> : <span className="text-amber-500 uppercase flex items-center gap-2"><Activity size={iconSize}/> Fim: Pendente</span>}
                                 </div>
                              </td>
                              <td className={`${tdPadding} align-top text-center sticky right-0 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] ${rowBg} group-hover:bg-slate-50 ${isSelected ? 'group-hover:bg-blue-50/50' : ''}`}>
                                {renderStatusBadge(exp.status)}
                                <span className={`text-[10px] font-bold text-slate-400 block mt-2 uppercase tracking-widest`}>{exp.etapa}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
             )}
          </div>
        </div>
      )}

      {openedExp && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden w-full min-w-0">
          
          <div className="px-6 md:px-10 pt-8 pb-0 border-b border-slate-200 bg-white shrink-0 z-10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10 w-full">
              <button onClick={() => setOpenedExp(null)} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors w-fit">
                <ChevronLeft size={16} /> Voltar para Pesquisa
              </button>
              <button onClick={() => setIsCompact(!isCompact)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-colors" title={isCompact ? "Visão Normal" : "Visão Compacta"}>
                {isCompact ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
              </button>
            </div>

            {!selectedAmostra ? (
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 uppercase tracking-widest">{openedExp.status === 'em_teste' ? 'Em Teste' : openedExp.status}</span>
                    <span className="text-sm text-slate-500 font-bold tracking-widest uppercase">ID: {openedExp.idLims} • {openedExp.tipoAtividade}</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {openedExp.idExperiencia} <span className="text-slate-400 font-medium">({getInfoValue(openedExp, 'modelo')})</span>
                  </h2>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-sm">
                  {canEditCoreData && (
                    <>
                      <button className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white rounded-lg transition-colors">Editar</button>
                      <ActionDropdown label="Criar" icon={Plus}><button className="w-full text-left px-5 py-3 text-sm hover:bg-slate-50 text-slate-700 font-medium">Nova Atividade</button></ActionDropdown>
                    </>
                  )}
                  <button className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white rounded-lg flex items-center gap-1.5 transition-colors"><Copy size={16}/> Copiar</button>
                  <ActionDropdown label="Documentos"><button className="w-full text-left px-5 py-3 text-sm hover:bg-slate-50 text-slate-700 font-medium">Relatório de Ensaios</button></ActionDropdown>
                  <button className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white rounded-lg flex items-center gap-1.5 transition-colors"><BookOpen size={16}/> Instrução da Etapa</button>
                  
                  {canEditResults && (
                    <>
                      <ActionDropdown label="Realizar Etapa" icon={Play} variant="primary"><button className="w-full text-left px-5 py-3 text-sm hover:bg-slate-50 font-medium">Envio da Prog.</button></ActionDropdown>
                      <ActionDropdown label="Tempo"><button className="w-full text-left px-5 py-3 text-sm hover:bg-slate-50 text-slate-700 font-medium">Iniciado</button></ActionDropdown>
                    </>
                  )}
                  <button className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white rounded-lg transition-colors">Tarefas</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col mb-4 relative z-10">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-200">
                      <FlaskConical size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">{selectedAmostra.nAmostra}</h3>
                      <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">ID: {selectedAmostra.idFisico} • {selectedAmostra.identificacao} • Origem: Lote {openedExp.idExperiencia}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-sm">
                    {canEditCoreData && <button className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white rounded-lg transition-colors">Editar Amostra</button>}
                    <ActionDropdown label="Documentos"><button className="w-full text-left px-5 py-3 text-sm hover:bg-slate-50">Anexos</button></ActionDropdown>
                    <button className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white rounded-lg transition-colors">Ver Tarefas</button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-8 border-b border-transparent mt-4 overflow-x-auto custom-scrollbar relative z-10">
              {!selectedAmostra ? (
                <>
                  <TabButton id="detalhes" label="Detalhes Lote" activeTabState={activeTab} setActiveTabFn={handleTabChange} />
                  <TabButton id="informacoes" label="Ficha Técnica" activeTabState={activeTab} setActiveTabFn={handleTabChange} />
                  <TabButton id="agenda" label="Agenda" activeTabState={activeTab} setActiveTabFn={handleTabChange} />
                  <TabButton id="atividades" label="Atividades" activeTabState={activeTab} setActiveTabFn={handleTabChange} />
                  <TabButton id="amostras" label="Amostras" activeTabState={activeTab} setActiveTabFn={handleTabChange} hasCount={openedExp.amostras.length} />
                  <TabButton id="tempos" label="Tempos" activeTabState={activeTab} setActiveTabFn={handleTabChange} />
                  <TabButton id="historico" label="Histórico" activeTabState={activeTab} setActiveTabFn={handleTabChange} />
                  <TabButton id="loteProducao" label="Lote de Produção" activeTabState={activeTab} setActiveTabFn={handleTabChange} />
                </>
              ) : (
                <>
                  <TabButton id="detalhes" label="Detalhes" activeTabState={activeAmostraTab} setActiveTabFn={setActiveAmostraTab} />
                  <TabButton id="informacoes" label="Informações" activeTabState={activeAmostraTab} setActiveTabFn={setActiveAmostraTab} />
                  <TabButton id="analises" label="Análises" activeTabState={activeAmostraTab} setActiveTabFn={setActiveAmostraTab} />
                  <TabButton id="dadosBrutos" label="Dados Brutos" activeTabState={activeAmostraTab} setActiveTabFn={setActiveAmostraTab} />
                  <TabButton id="mensagens" label="Mensagens" activeTabState={activeAmostraTab} setActiveTabFn={setActiveAmostraTab} />
                  <TabButton id="arquivos" label="Arquivos" activeTabState={activeAmostraTab} setActiveTabFn={setActiveAmostraTab} />
                  <TabButton id="atividadesAmostra" label="Atividades" activeTabState={activeAmostraTab} setActiveTabFn={setActiveAmostraTab} />
                  <TabButton id="especificacoes" label="Especificações" activeTabState={activeAmostraTab} setActiveTabFn={setActiveAmostraTab} />
                  <TabButton id="logistica" label="Logística" activeTabState={activeAmostraTab} setActiveTabFn={setActiveAmostraTab} />
                  <TabButton id="historicoAmostra" label="Histórico" activeTabState={activeAmostraTab} setActiveTabFn={setActiveAmostraTab} />
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/50 w-full relative">
            
            {activeTab === 'detalhes' && !selectedAmostra && (
              <div className="p-6 md:p-10 w-full animate-in fade-in">
                 <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-8 gap-y-6 mb-6 items-end w-full">
                       <FormField label="Id" value={openedExp.idLims} readOnly colSpan="col-span-1" />
                       <FormField label="Nº Atividade" value={openedExp.idExperiencia} readOnly colSpan="col-span-1 md:col-span-2" />
                       <FormField label="Identificação" value={`${openedExp.idExperiencia} (${getInfoValue(openedExp, 'modelo')} - ${getInfoValue(openedExp, 'projeto')})`} readOnly colSpan="col-span-1 md:col-span-3 lg:col-span-4" />
                       <div className="col-span-1 flex justify-end"><FormCheckbox label="Ativo?" checked={openedExp.flags.ativo} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-6 mb-6 w-full">
                       <FormSelect label="Responsável" value={openedExp.aprovadoPor} readOnly />
                       <FormSelect label="Área de Serviço" value={openedExp.areaServico} readOnly colSpan="col-span-1 md:col-span-2" />
                       <FormField label="Execução" value={openedExp.dataExecucao} type="datetime-local" readOnly={!canEditCoreData} />
                       <FormSelect label="Conta" value={openedExp.conta} readOnly />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-6 mb-6 w-full">
                       <FormSelect label="Proprietário" value={openedExp.proprietario} readOnly />
                       <FormSelect label="Prioridade" value={openedExp.prioridade} options={['Baixa', 'Normal', 'Alta', 'Urgente']} readOnly={!canEditCoreData} />
                       <FormField label="Conclusão" value={openedExp.dataConclusao} type="datetime-local" readOnly={!canEditCoreData} />
                       <FormSelect label="Tipo de Atividade" value={openedExp.tipoAtividade} readOnly />
                       <FormSelect label="Etapa Atual" value={openedExp.etapa} readOnly />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-6 mb-8 w-full">
                       <FormSelect label="Centro de Serviço" value={openedExp.centroServico} readOnly colSpan="col-span-1 md:col-span-2 lg:col-span-1" />
                       <FormSelect label="Parecer" value={openedExp.parecer} options={['Conforme', 'Não Conforme', 'Inconclusivo']} readOnly={!canEditCoreData} />
                       <FormField label="Finalizada" value={openedExp.dataFinalizada} type="datetime-local" readOnly={!canEditCoreData} />
                       <FormSelect label="Classe" value={openedExp.classe} options={['Pesquisa', 'Qualidade', 'Processo']} readOnly={!canEditCoreData} />
                       <FormSelect label="Subclasse" value={openedExp.subclasse} options={['Mecânico', 'Elétrico', 'Químico']} readOnly={!canEditCoreData} />
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'informacoes' && !selectedAmostra && (
              <div className="p-6 md:p-10 w-full animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold text-slate-900">Ficha Técnica Base</h3>
                   {isEditingInfoLote ? (
                     <div className="flex items-center gap-3">
                       <button onClick={() => setIsEditingInfoLote(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
                       <button onClick={handleSaveClick} className="px-5 py-2.5 bg-emerald-600 text-white shadow-sm rounded-lg text-sm font-bold hover:bg-emerald-700 flex items-center gap-2"><Check size={16} /> Salvar Alterações</button>
                     </div>
                   ) : (
                     canEditCoreData && <button onClick={handleEditClick} className="px-5 py-2.5 bg-white border border-slate-300 shadow-sm hover:bg-slate-50 rounded-lg text-sm font-bold text-slate-700">Editar Valores</button>
                   )}
                </div>
                
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full">
                  <div className="overflow-x-auto custom-scrollbar relative">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1400px]">
                      <thead className="sticky top-0 z-30">
                        <tr className={`bg-slate-50 border-b border-slate-200 ${isCompact ? 'text-[9px]' : 'text-[10px]'} uppercase tracking-wider text-slate-500 font-bold`}>
                          <th className={`${thPadding} text-center w-20`}>Ord</th>
                          <th className={`${thPadding} sticky left-0 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Informação</th>
                          <th className={`${thPadding} w-64`}>Valor</th>
                          <th className={`${thPadding} w-32`}>U.M.</th>
                          <th className={`${thPadding} text-center`}>Amostra Herda?</th>
                          <th className={`${thPadding} text-center`}>Permite Alterar?</th>
                          <th className={`${thPadding} text-center`}>Obrig. Entrar?</th>
                          <th className={`${thPadding} text-center`}>Obrig. Sair?</th>
                          <th className={`${thPadding} text-center`}>Herdado</th>
                          <th className={thPadding}>Grupo</th>
                          {isEditingInfoLote && <th className={`${thPadding} text-center w-20 sticky right-0 bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Ações</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(isEditingInfoLote ? editedInfoList : openedExp.informacoes).map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                            <td className={`${tdPadding} text-xs font-bold text-amber-500 text-center`}>{idx + 1}</td>
                            <td className={`${tdPadding} sticky left-0 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}>
                               {isEditingInfoLote ? (
                                 <input type="text" value={row.info} onChange={(e) => handleInfoChange(row.id, 'info', e.target.value)} placeholder="Nome da Info..." className="w-full bg-white border-2 border-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500" />
                               ) : <span className="text-sm font-semibold text-slate-700">{row.info}</span>}
                            </td>
                            <td className={tdPadding}>
                              {isEditingInfoLote ? (
                                <input type="text" value={row.valor} onChange={(e) => handleInfoChange(row.id, 'valor', e.target.value)} placeholder="Valor..." className="w-full bg-white border-2 border-blue-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500" />
                              ) : (
                                <span className="text-sm font-bold text-slate-900">{row.valor}</span>
                              )}
                            </td>
                            <td className={tdPadding}>
                               {isEditingInfoLote ? (
                                 <input type="text" value={row.und} onChange={(e) => handleInfoChange(row.id, 'und', e.target.value)} className="w-full bg-white border-2 border-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-500 focus:outline-none focus:border-blue-500" />
                               ) : <span className="text-xs text-slate-500">{row.und}</span>}
                            </td>
                            <td className={`${tdPadding} text-center text-xs font-semibold text-slate-600`}>{row.herda}</td>
                            <td className={`${tdPadding} text-center text-xs font-semibold text-slate-600`}>{row.alt}</td>
                            <td className={`${tdPadding} text-center text-xs font-semibold text-slate-600`}>{row.ent}</td>
                            <td className={`${tdPadding} text-center text-xs font-semibold text-slate-600`}>{row.sai}</td>
                            <td className={`${tdPadding} text-center text-xs font-semibold text-slate-600`}>{row.herdado}</td>
                            <td className={`${tdPadding} text-xs font-semibold text-slate-600`}>{row.grupo}</td>
                            {isEditingInfoLote && (
                              <td className={`${tdPadding} text-center sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}>
                                 <button onClick={() => handleRemoveInfoRow(row.id)} className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {isEditingInfoLote && (
                      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-center w-full sticky left-0 z-10">
                         <button onClick={handleAddInfoRow} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-dashed border-slate-300 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm">
                            <Plus size={16}/> Adicionar Nova Informação
                         </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'agenda' && !selectedAmostra && (
              <div className="p-6 md:p-10 w-full animate-in fade-in flex flex-col md:flex-row gap-6 h-[600px]">
                 <div className="w-full md:w-72 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col shrink-0">
                    <div className="flex bg-slate-50 border-b border-slate-200">
                      <button className="flex-1 py-4 text-xs font-bold text-slate-800 border-b-2 border-blue-500">Usuários</button>
                      <button className="flex-1 py-4 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">Recursos</button>
                    </div>
                    <div className="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                       {openedExp.agendaParticipantes.map(p => (
                         <label key={p.id} className="flex items-center gap-3 cursor-pointer">
                           <input type="checkbox" defaultChecked={p.checked} className="w-4 h-4 rounded text-blue-600 border-slate-300"/>
                           <div className={`w-3.5 h-3.5 ${p.cor} rounded-sm shadow-sm`}></div>
                           <span className="text-sm font-semibold text-slate-700">{p.nome}</span>
                         </label>
                       ))}
                    </div>
                 </div>
                 <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center">
                    <CalendarDays size={64} className="text-slate-200 mb-6"/>
                    <h3 className="text-xl font-bold text-slate-700">Agenda Livre</h3>
                    <p className="text-slate-500 font-medium mt-1">Nenhum evento agendado para este período.</p>
                 </div>
              </div>
            )}

            {activeTab === 'atividades' && !selectedAmostra && (
              <div className="p-6 md:p-10 w-full animate-in fade-in">
                {canEditCoreData && (
                  <div className="bg-white border border-slate-200 p-2 rounded-xl mb-6 flex items-center gap-2 w-fit shadow-sm">
                     <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold transition-colors">Voltar</button>
                     <button className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors">Editar</button>
                     <ActionDropdown label="Criar Subatividade"><button className="w-full text-left px-4 py-2 text-xs">Nova</button></ActionDropdown>
                     <ActionDropdown label="Vincular"><button className="w-full text-left px-4 py-2 text-xs">Existente</button></ActionDropdown>
                  </div>
                )}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full flex flex-col items-center justify-center py-32">
                   <Activity size={64} className="text-slate-200 mb-6"/>
                   <h3 className="text-xl font-bold text-slate-700">Sem Subatividades</h3>
                   <p className="text-slate-500 font-medium mt-1">Nenhuma subatividade vinculada a esta experiência.</p>
                </div>
              </div>
            )}

            {activeTab === 'amostras' && !selectedAmostra && (
              <div className="p-6 md:p-10 w-full animate-in fade-in">
                {canEditCoreData && (
                  <div className="bg-white border border-slate-200 p-2 rounded-xl mb-6 flex items-center gap-2 w-fit shadow-sm">
                     <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold transition-colors">Voltar</button>
                     <button className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"><Link2 size={16}/> Vincular Amostra</button>
                  </div>
                )}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full relative">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1600px]">
                      <thead className="sticky top-0 z-30">
                        <tr className={`bg-slate-50 border-b border-slate-200 ${isCompact ? 'text-[9px]' : 'text-[11px]'} uppercase tracking-wider text-slate-500 font-bold`}>
                          <th className={`${thPadding} w-20 text-center`}>Ord</th>
                          <th className={`${thPadding} w-24 sticky left-0 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Id Físico</th>
                          <th className={thPadding}>Nº Amostra</th>
                          <th className={thPadding}>Ponto Coleta</th>
                          <th className={thPadding}>Tipo Produto</th>
                          <th className={thPadding}>Conta</th>
                          <th className={thPadding}>Lote Produção</th>
                          <th className={thPadding}>Identificação</th>
                          <th className={`${thPadding} text-center`}>Qtde.</th>
                          <th className={`${thPadding} text-center`}>Situação</th>
                          <th className={thPadding}>Data Prevista</th>
                          <th className={thPadding}>Atividades</th>
                          <th className={`${thPadding} sticky right-0 bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Conclusão</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {openedExp.amostras.map((amostra, idx) => (
                          <tr key={amostra.idFisico} onClick={() => handleOpenAmostra(amostra)} className="hover:bg-blue-50/50 cursor-pointer group transition-colors">
                            <td className={`${tdPadding} text-xs font-bold text-amber-500 text-center`}>{idx + 1}</td>
                            <td className={`${tdPadding} text-sm font-bold text-slate-500 group-hover:text-blue-600 sticky left-0 bg-white group-hover:bg-blue-50/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}>{amostra.idFisico}</td>
                            <td className={`${tdPadding} text-base font-bold text-slate-900`}>{amostra.nAmostra}</td>
                            <td className={`${tdPadding} text-sm font-medium text-slate-600`}>{amostra.pontoColeta || '-'}</td>
                            <td className={`${tdPadding} text-xs font-bold text-rose-500`}>{amostra.tipoProduto}</td>
                            <td className={`${tdPadding} text-sm font-medium text-slate-600`}>{amostra.conta}</td>
                            <td className={`${tdPadding} text-sm font-medium text-slate-600`}>{amostra.loteProducao || '-'}</td>
                            <td className={`${tdPadding} text-sm font-bold text-blue-700`}>{amostra.identificacao}</td>
                            <td className={`${tdPadding} text-sm font-bold text-slate-600 text-center`}>1</td>
                            <td className={`${tdPadding} text-center`}>{renderStatusBadge(amostra.status)}</td>
                            <td className={`${tdPadding} text-sm font-medium text-slate-600`}>{amostra.dataPrevista || '-'}</td>
                            <td className={`${tdPadding} text-xs font-bold text-slate-600`}>{amostra.atividade}</td>
                            <td className={`${tdPadding} text-xs font-bold text-emerald-600 sticky right-0 bg-white group-hover:bg-blue-50/50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}>{amostra.dataConclusao || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tempos' && !selectedAmostra && (
              <div className="p-6 md:p-10 w-full animate-in fade-in flex flex-col xl:flex-row gap-6 h-auto xl:h-[600px]">
                 <div className="w-full xl:w-[450px] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col shrink-0">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        <tr><th className="px-5 py-4">Etapa</th><th className="px-5 py-4 text-center">Tempo Est.</th><th className="px-5 py-4 text-center">Tempo Real</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {openedExp.tempos.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                            <td className="px-5 py-4 text-sm font-semibold text-slate-800">{t.etapa}</td>
                            <td className="px-5 py-4 text-sm font-medium text-slate-500 text-center">{t.est || '-'}</td>
                            <td className="px-5 py-4 text-sm font-medium text-slate-500 text-center">{t.real || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
                 <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center py-20">
                    <Clock size={64} className="text-slate-200 mb-6"/>
                    <h3 className="text-xl font-bold text-slate-700">Detalhes do Tempo</h3>
                    <p className="text-slate-500 font-medium mt-1">Selecione uma etapa na lista ao lado.</p>
                 </div>
              </div>
            )}

            {activeTab === 'historico' && !selectedAmostra && (
              <div className="p-6 md:p-10 w-full animate-in fade-in">
                 <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                          <tr><th className="px-6 py-4">Etapa</th><th className="px-6 py-4">Data Início</th><th className="px-6 py-4">Responsável Início</th><th className="px-6 py-4">Data Execução</th><th className="px-6 py-4">Resp Execução</th><th className="px-6 py-4">Resp Etapa</th><th className="px-6 py-4">Área Serviço</th><th className="px-6 py-4">Observação</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {openedExp.historicoLote.map(h => (
                            <tr key={h.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 text-sm font-bold text-slate-800">{h.etapa}</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600">{h.dataIni}</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600">{h.respIni}</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600">{h.dataExec || '-'}</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600">{h.respExec || '-'}</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600">{h.respEtapa}</td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-500">{h.area}</td>
                              <td className="px-6 py-4 text-xs font-medium text-slate-400">{h.obs || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'loteProducao' && !selectedAmostra && (
              <div className="p-6 md:p-10 w-full animate-in fade-in flex flex-col items-center justify-center py-32 bg-white border border-slate-200 rounded-2xl shadow-sm">
                 <Factory size={64} className="text-slate-200 mb-6" />
                 <h3 className="text-xl font-bold text-slate-700">Nenhum lote de produção</h3>
                 <p className="text-base font-medium text-slate-500 mt-1">Esta atividade não possui lotes de produção vinculados.</p>
              </div>
            )}


            {selectedAmostra && activeAmostraTab === 'detalhes' && (
              <div className="p-6 md:p-10 w-full animate-in fade-in">
                 <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-8 gap-y-6 mb-6 items-end w-full">
                       <FormField label="Id" value={selectedAmostra.idFisico} readOnly colSpan="col-span-1" />
                       <FormField label="Nº Amostra" value={selectedAmostra.nAmostra} readOnly colSpan="col-span-1 md:col-span-2" />
                       <FormField label="Identificação" value={selectedAmostra.identificacao} readOnly colSpan="col-span-1 md:col-span-3 lg:col-span-4" />
                       <div className="col-span-1 flex justify-end"><FormCheckbox label="Ativo?" checked={selectedAmostra.flags?.ativo !== false} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-6 mb-6 w-full">
                       <FormSelect label="Responsável" value={openedExp.aprovadoPor} readOnly />
                       <FormSelect label="Área de Serviço" value={openedExp.areaServico} readOnly colSpan="col-span-1 md:col-span-2" />
                       <FormField label="Execução" value={selectedAmostra.dataPrevista || ''} type="datetime-local" readOnly={!canEditCoreData} />
                       <FormSelect label="Conta" value={selectedAmostra.conta} readOnly />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-6 mb-6 w-full">
                       <FormSelect label="Proprietário" value={openedExp.proprietario} readOnly />
                       <FormSelect label="Prioridade" value={openedExp.prioridade} options={['Baixa', 'Normal', 'Alta', 'Urgente']} readOnly={!canEditCoreData} />
                       <FormField label="Conclusão" value={selectedAmostra.dataConclusao || ''} type="datetime-local" readOnly={!canEditCoreData} />
                       <FormSelect label="Tipo de Produto" value={selectedAmostra.tipoProduto} readOnly />
                       <FormSelect label="Situação" value={selectedAmostra.status} readOnly />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-6 mb-8 w-full">
                       <FormSelect label="Centro de Serviço" value={selectedAmostra.centroServico} readOnly colSpan="col-span-1 md:col-span-2 lg:col-span-1" />
                       <FormSelect label="Parecer" value={selectedAmostra.parecer} options={['Conforme', 'Não Conforme', 'Inconclusivo']} readOnly={!canEditCoreData} />
                       <FormField label="Finalizada" value={selectedAmostra.dataConclusao || ''} type="datetime-local" readOnly={!canEditCoreData} />
                       <FormSelect label="Motivo" value={selectedAmostra.motivo} options={['Rotina', 'Desenvolvimento', 'Reclamação']} readOnly={!canEditCoreData} />
                       <FormSelect label="Subclasse" value={openedExp.subclasse} options={['Mecânico', 'Elétrico', 'Químico']} readOnly={!canEditCoreData} />
                    </div>
                 </div>
              </div>
            )}

            {selectedAmostra && activeAmostraTab === 'informacoes' && (
              <div className="p-6 md:p-10 w-full animate-in fade-in">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Ficha Técnica (Herdada da Experiência)</h3>
                 </div>
                 <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full relative">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1400px]">
                        <thead className="sticky top-0 z-30">
                          <tr className={`bg-slate-50 border-b border-slate-200 ${isCompact ? 'text-[9px]' : 'text-[10px]'} uppercase tracking-wider text-slate-500 font-bold`}>
                            <th className={`${thPadding} text-center w-20`}>Ord</th>
                            <th className={`${thPadding} sticky left-0 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Informação</th>
                            <th className={`${thPadding} w-64`}>Valor</th>
                            <th className={`${thPadding} w-32`}>U.M.</th>
                            <th className={`${thPadding} text-center`}>Amostra Herda?</th>
                            <th className={`${thPadding} text-center`}>Permite Alterar?</th>
                            <th className={`${thPadding} text-center`}>Obrig. Entrar?</th>
                            <th className={`${thPadding} text-center`}>Obrig. Sair?</th>
                            <th className={`${thPadding} text-center`}>Herdado</th>
                            <th className={thPadding}>Grupo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {openedExp.informacoes.map((row, idx) => (
                            <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                              <td className={`${tdPadding} text-xs font-bold text-amber-500 text-center`}>{idx + 1}</td>
                              <td className={`${tdPadding} text-sm font-semibold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}>{row.info}</td>
                              <td className={tdPadding}><span className="text-sm font-bold text-slate-900">{row.valor}</span></td>
                              <td className={`${tdPadding} text-xs text-slate-500`}>{row.und}</td>
                              <td className={`${tdPadding} text-center text-xs font-semibold text-slate-600`}>{row.herda}</td>
                              <td className={`${tdPadding} text-center text-xs font-semibold text-slate-600`}>{row.alt}</td>
                              <td className={`${tdPadding} text-center text-xs font-semibold text-slate-600`}>{row.ent}</td>
                              <td className={`${tdPadding} text-center text-xs font-semibold text-slate-600`}>{row.sai}</td>
                              <td className={`${tdPadding} text-center text-xs font-semibold text-emerald-600`}>Sim</td>
                              <td className={`${tdPadding} text-xs font-semibold text-slate-600`}>{row.grupo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            )}

            {selectedAmostra && activeAmostraTab === 'analises' && (
              <div className="p-6 md:p-10 w-full animate-in fade-in">
                 {isEditingAnalises ? (
                   <div className="flex flex-wrap items-center gap-2 bg-slate-200/50 p-2.5 rounded-xl border border-slate-300 w-full shadow-inner mb-6 animate-in slide-in-from-top-2">
                     <button onClick={() => {setIsEditingAnalises(false); setSelectedAnaliseRow(null);}} className="px-4 py-2 text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-lg shadow-sm">Cancelar</button>
                     <button onClick={() => {setIsEditingAnalises(false); setSelectedAnaliseRow(null);}} className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 flex items-center gap-2"><Save size={16}/> Salvar Resultados</button>
                     
                     {canEditCoreData && (
                       <>
                         <div className="w-px h-6 bg-slate-300 mx-2"></div>
                         <button className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg shadow-sm">Adic. por Análises</button>
                         <button className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg shadow-sm">Adic. por Método</button>
                       </>
                     )}
                     
                     {selectedAnaliseRow && canEditCoreData && (
                       <>
                         <div className="w-px h-6 bg-slate-300 mx-2"></div>
                         <button className="px-4 py-2 text-sm font-bold text-rose-600 bg-white hover:bg-rose-50 rounded-lg shadow-sm flex items-center gap-1.5"><Trash2 size={16}/> Remover</button>
                       </>
                     )}
                   </div>
                 ) : (
                   <div className="flex flex-wrap items-center gap-2 mb-6 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-fit">
                     {canEditResults && <button onClick={() => setIsEditingAnalises(true)} className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-100 flex items-center gap-2"><Edit3 size={16}/> Editar Grade</button>}
                     <button className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg">Últimos Registros</button>
                   </div>
                 )}

                 <div className={`bg-white shadow-sm rounded-2xl overflow-hidden w-full transition-colors relative ${isEditingAnalises ? 'border-2 border-blue-400 ring-4 ring-blue-500/10' : 'border border-slate-200'}`}>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
                        <thead className="sticky top-0 z-30">
                          <tr className={`bg-slate-50 border-b border-slate-200 ${isCompact ? 'text-[9px]' : 'text-[11px]'} uppercase tracking-wider text-slate-500 font-bold`}>
                            <th className={`${thPadding} w-20 text-center text-amber-600 sticky left-0 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Ordem</th>
                            <th className={`${thPadding} w-48 text-blue-600 sticky left-[80px] bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Análise</th>
                            <th className={`${thPadding} w-40`}>Valor</th>
                            <th className={`${thPadding} w-24`}>U.M.</th>
                            <th className={`${thPadding} w-40`}>Parecer</th>
                            <th className={thPadding}>Método de Análise</th>
                            <th className={`${thPadding} sticky right-0 bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Etapa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedAmostra.analises || []).map(row => {
                            const isRowSelected = selectedAnaliseRow === row.id;
                            const isNaoConforme = row.parecer === 'Não Conforme';
                            const isConforme = row.parecer === 'Conforme';
                            const rowBg = isRowSelected ? 'bg-blue-50/80' : isNaoConforme && !isEditingAnalises ? 'bg-rose-50/30' : 'bg-white';
                            const hoverBg = isRowSelected ? 'hover:bg-blue-50/80' : 'hover:bg-slate-50';
                            return (
                              <tr key={row.id} onClick={() => isEditingAnalises && setSelectedAnaliseRow(row.id)} className={`transition-colors group ${isEditingAnalises ? 'cursor-pointer' : ''} ${rowBg} ${hoverBg}`}>
                                <td className={`${tdPadding} text-sm font-bold text-center sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] ${rowBg} ${hoverBg} ${isRowSelected ? 'border-l-4 border-blue-500' : 'border-l-4 border-transparent'} ${isNaoConforme ? 'text-rose-500' : 'text-slate-400'}`}>{row.ordem}</td>
                                <td className={`${tdPadding} text-sm font-bold sticky left-[80px] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] ${rowBg} ${hoverBg} ${isNaoConforme ? 'text-rose-600' : 'text-slate-800'}`}>{row.analise}</td>
                                <td className={tdPadding}>
                                  {isEditingAnalises ? <input type="text" defaultValue={row.valor} className="w-full bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" /> : <span className={`text-base font-black ${isNaoConforme ? 'text-rose-600' : 'text-slate-900'}`}>{row.valor}</span>}
                                </td>
                                <td className={`${tdPadding} text-xs font-bold ${isNaoConforme ? 'text-rose-500' : 'text-slate-500'}`}>{row.und}</td>
                                <td className={tdPadding}>
                                  {isEditingAnalises ? (
                                    <select defaultValue={row.parecer} className="w-full bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-sm font-bold cursor-pointer focus:ring-2 focus:ring-blue-500"><option value="">-</option><option value="Conforme">Conforme</option><option value="Não Conforme">Não Conforme</option></select>
                                  ) : (
                                    <span className={`text-sm font-bold ${isConforme ? 'text-emerald-600' : isNaoConforme ? 'text-rose-600' : 'text-slate-400'}`}>{row.parecer}</span>
                                  )}
                                </td>
                                <td className={`${tdPadding} text-xs font-semibold ${isNaoConforme ? 'text-rose-600' : 'text-slate-600'}`}>{row.metodo}</td>
                                <td className={`${tdPadding} text-xs font-bold sticky right-0 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] ${rowBg} ${hoverBg} ${isNaoConforme ? 'text-rose-500' : 'text-slate-500 uppercase tracking-widest'}`}>{row.etapa}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            )}

            {selectedAmostra && activeAmostraTab === 'dadosBrutos' && (
              <div className="p-6 md:p-10 w-full animate-in fade-in">
                 <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full relative">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
                        <thead className="sticky top-0 z-30">
                          <tr className={`bg-slate-50 border-b border-slate-200 ${isCompact ? 'text-[9px]' : 'text-[11px]'} uppercase tracking-wider text-slate-500 font-bold`}>
                            <th className={`${thPadding} sticky left-0 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Método de Análise</th>
                            <th className={thPadding}>Dado Bruto</th>
                            <th className={thPadding}>Valor</th>
                            <th className={thPadding}>Unidade</th>
                            <th className={thPadding}>Equipamento</th>
                            <th className={thPadding}>Responsável</th>
                            <th className={thPadding}>Data e Hora</th>
                            <th className={`${thPadding} sticky right-0 bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Etapa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedAmostra.dadosBrutos || []).map(row => (
                            <tr key={row.id} className="hover:bg-slate-50 group transition-colors">
                              <td className={`${tdPadding} text-sm font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}>{row.metodo}</td>
                              <td className={`${tdPadding} text-sm font-semibold text-slate-800`}>{row.dado}</td>
                              <td className={`${tdPadding} text-base font-black text-slate-900`}>{row.valor}</td>
                              <td className={`${tdPadding} text-xs font-medium text-slate-500`}>{row.und}</td>
                              <td className={`${tdPadding} text-xs font-semibold text-slate-600`}>{row.equip}</td>
                              <td className={`${tdPadding} text-sm font-medium text-slate-600`}>{row.resp}</td>
                              <td className={`${tdPadding} text-xs font-medium text-slate-500`}>{row.data}</td>
                              <td className={`${tdPadding} text-xs font-medium text-slate-600 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}>{row.etapa}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            )}

            {selectedAmostra && activeAmostraTab === 'mensagens' && (
              <div className="p-6 md:p-10 w-full animate-in fade-in">
                 <div className="mb-6 relative w-full">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input type="text" placeholder="Filtro da mensagem..." className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm" />
                 </div>
                 <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full flex flex-col">
                   {(selectedAmostra.mensagens || []).map((msg) => (
                      <div key={msg.id} className={`p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-start gap-4 md:gap-8 hover:bg-slate-50 transition-colors ${msg.isAlert ? 'bg-amber-50/50 border-l-4 border-amber-500' : 'border-l-4 border-transparent'}`}>
                         <div className="flex flex-col gap-1 min-w-[150px] shrink-0">
                           <span className="text-xs font-bold text-slate-700">De: {msg.de}</span>
                           <span className="text-xs font-bold text-slate-700">Para: {msg.para}</span>
                           <span className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-1.5"><CalendarClock size={14}/>{msg.data}</span>
                         </div>
                         <div className="flex-1">
                           <p className={`text-base font-semibold mb-2 ${msg.isAlert ? 'text-amber-800' : 'text-slate-800'}`}>{msg.msg}</p>
                           <span className="text-xs font-bold text-slate-500 block">{msg.tipo}</span>
                         </div>
                         <div className="shrink-0 text-right"><span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">{msg.status}</span></div>
                      </div>
                   ))}
                 </div>
              </div>
            )}

            {selectedAmostra && activeAmostraTab === 'arquivos' && (
              <div className="p-6 md:p-10 w-full animate-in fade-in">
                <div className="flex flex-col items-center justify-center py-32 bg-white border border-slate-200 rounded-2xl shadow-sm">
                   <FileBox size={64} className="text-slate-200 mb-6" />
                   <h3 className="text-xl font-bold text-slate-600">Nenhum arquivo anexado</h3>
                   <p className="text-base font-medium text-slate-500 mt-2">Utilize a barra superior para vincular documentos a esta amostra.</p>
                </div>
              </div>
            )}

            {selectedAmostra && activeAmostraTab === 'atividadesAmostra' && (
              <div className="p-6 md:p-10 w-full animate-in fade-in">
                 <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full relative">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
                        <thead className="sticky top-0 z-30">
                          <tr className={`bg-slate-50 border-b border-slate-200 ${isCompact ? 'text-[9px]' : 'text-[11px]'} uppercase tracking-wider text-slate-500 font-bold`}>
                            <th className={`${thPadding} sticky left-0 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>ID</th>
                            <th className={thPadding}>Nº Atividade</th>
                            <th className={thPadding}>Tipo</th>
                            <th className={thPadding}>Etapa Atual</th>
                            <th className={thPadding}>Conta</th>
                            <th className={thPadding}>Identificação</th>
                            <th className={thPadding}>Responsável</th>
                            <th className={`${thPadding} sticky right-0 bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Área de Serviço</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedAmostra.atividadesAmostra || []).map(row => (
                            <tr key={row.id} className="hover:bg-slate-50 group transition-colors">
                              <td className={`${tdPadding} text-sm font-bold text-slate-500 sticky left-0 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}>{row.id}</td>
                              <td className={`${tdPadding} text-base font-bold text-slate-900`}>{row.num}</td>
                              <td className={`${tdPadding} text-xs font-semibold text-slate-600`}>{row.tipo}</td>
                              <td className={`${tdPadding} text-xs font-semibold text-slate-600`}>{row.etapa}</td>
                              <td className={`${tdPadding} text-sm font-semibold text-slate-700`}>{row.conta}</td>
                              <td className={`${tdPadding} text-sm font-bold text-blue-700`}>{row.ident}</td>
                              <td className={`${tdPadding} text-sm font-semibold text-slate-700`}>{row.resp}</td>
                              <td className={`${tdPadding} text-xs font-medium text-slate-500 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}>{row.area}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            )}

            {selectedAmostra && activeAmostraTab === 'especificacoes' && (
              <div className="p-6 md:p-10 w-full animate-in fade-in flex flex-col md:flex-row gap-6">
                 <div className="w-full md:w-80 shrink-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-fit">
                    <div className="p-4 border-b border-slate-100 bg-slate-50"><h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Especificação Selecionada</h4></div>
                    <div className="p-4">
                       <button className="w-full text-left p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm font-bold text-amber-700 shadow-sm transition-colors">ABNT 15940: 2019 - SLI</button>
                    </div>
                 </div>
                 <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
                        <thead className="sticky top-0 z-30">
                          <tr className={`bg-slate-50 border-b border-slate-200 ${isCompact ? 'text-[9px]' : 'text-[11px]'} uppercase tracking-wider text-slate-500 font-bold`}>
                            <th className={`${thPadding} text-blue-600 sticky left-0 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Método Origem</th>
                            <th className={`${thPadding} text-amber-600`}>Análise</th>
                            <th className={thPadding}>Valor</th>
                            <th className={thPadding}>U.M.</th>
                            <th className={thPadding}>Parecer</th>
                            <th className={`${thPadding} sticky right-0 bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>LIE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedAmostra.especificacoes || []).map(row => {
                            const isNC = row.parecer === 'Não Conforme';
                            return (
                              <tr key={row.id} className="hover:bg-slate-50 group transition-colors">
                                <td className={`${tdPadding} text-xs font-semibold ${isNC ? 'text-rose-600' : 'text-slate-700'} sticky left-0 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}>{row.metodo}</td>
                                <td className={`${tdPadding} text-sm font-bold ${isNC ? 'text-rose-600' : 'text-slate-800'}`}>{row.analise}</td>
                                <td className={`${tdPadding} text-lg font-black ${isNC ? 'text-rose-600' : 'text-slate-900'}`}>{row.valor}</td>
                                <td className={`${tdPadding} text-sm font-medium ${isNC ? 'text-rose-500' : 'text-slate-500'}`}>{row.und}</td>
                                <td className={`${tdPadding} text-sm font-bold ${isNC ? 'text-rose-600' : 'text-emerald-600'}`}>{row.parecer}</td>
                                <td className={`${tdPadding} text-sm font-bold text-slate-500 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}>{row.lie}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            )}

            {selectedAmostra && activeAmostraTab === 'logistica' && (
              <div className="p-6 md:p-10 w-full animate-in fade-in">
                 <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full relative">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
                        <thead className="sticky top-0 z-30">
                          <tr className={`bg-slate-50 border-b border-slate-200 ${isCompact ? 'text-[9px]' : 'text-[11px]'} uppercase tracking-wider text-slate-500 font-bold`}>
                            <th className={`${thPadding} sticky left-0 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Método de Análise</th>
                            <th className={thPadding}>Área Serviço</th>
                            <th className={`${thPadding} text-center`}>Prazo(h)</th>
                            <th className={thPadding}>Conclusão</th>
                            <th className={thPadding}>Distribuído</th>
                            <th className={thPadding}>Responsável</th>
                            <th className={`${thPadding} sticky right-0 bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Obs</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedAmostra.logistica || []).map(row => (
                            <tr key={row.id} className="hover:bg-slate-50 group transition-colors">
                              <td className={`${tdPadding} text-sm font-bold text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}>{row.metodo}</td>
                              <td className={`${tdPadding} text-xs font-semibold text-slate-600`}>{row.area}</td>
                              <td className={`${tdPadding} text-base font-bold text-slate-700 text-center`}>{row.prazo}</td>
                              <td className={`${tdPadding} text-sm font-medium text-emerald-600`}>{row.conclusao}</td>
                              <td className={`${tdPadding} text-xs font-medium text-slate-500`}>{row.dist}</td>
                              <td className={`${tdPadding} text-sm font-medium text-slate-700`}>{row.resp}</td>
                              <td className={`${tdPadding} text-xs font-medium text-slate-400 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}>{row.obs}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            )}

            {selectedAmostra && activeAmostraTab === 'historicoAmostra' && (
              <div className="p-6 md:p-10 w-full animate-in fade-in grid grid-cols-1 xl:grid-cols-2 gap-8">
                 <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-fit">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3"><History size={20} className="text-slate-500"/><h4 className="text-base font-bold text-slate-700">Situação da Amostra</h4></div>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-slate-50/50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                          <tr><th className="px-6 py-4">Situação</th><th className="px-6 py-4">Responsável</th><th className="px-6 py-4">Data e Hora</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedAmostra.historicoSituacao || []).map(row => (
                            <tr key={row.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 text-sm font-bold text-slate-800">{row.situacao}</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600">{row.resp}</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-500">{row.data}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
                 <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-fit">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3"><Target size={20} className="text-slate-500"/><h4 className="text-base font-bold text-slate-700">Execução de Métodos</h4></div>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-slate-50/50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                          <tr><th className="px-6 py-4">Método</th><th className="px-6 py-4">Etapa</th><th className="px-6 py-4">Início</th><th className="px-6 py-4">Fim</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedAmostra.historicoMetodos || []).map(row => (
                            <tr key={row.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 text-sm font-bold text-slate-800">{row.metodo}</td>
                              <td className="px-6 py-4 text-xs font-medium text-slate-600">{row.etapa}</td>
                              <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-500 block">{row.respIni}</span><span className="text-xs font-medium text-slate-500 block">{row.dataIni}</span></td>
                              <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-500 block">{row.respFim}</span><span className="text-xs font-medium text-slate-500 block">{row.dataFim}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
};

export default LimsAtividades;