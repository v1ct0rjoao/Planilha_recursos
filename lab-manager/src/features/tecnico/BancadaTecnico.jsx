import React, { useState, useMemo } from 'react';
import { 
  Search, CheckCircle2, Clock, AlertCircle, 
  CalendarDays, User, Filter, Layers, 
  Maximize2, Minimize2, CheckSquare, Square, Inbox, 
  ChevronLeft, ChevronRight, MessageSquare, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/Authenticador';

const MOCK_LIMS_TASKS = [
  { id: '10920', responsavel: 'Vadson', experiencia: 'E120/2026', amostra: 'Amostra 01 - LATAM', metodoAnalise: 'J28', status: 'concluido', dataInicio: '26/03/2026 08:00', comentarios: 'Tensão inicial baixa', duracao: '2h 15m', dateStr: '2026-03-29' },
  { id: '10921', responsavel: 'João Victor', experiencia: 'E105/2026', amostra: 'Z60D - Amostra 04', metodoAnalise: 'Thermal', status: 'aguardando', dataInicio: '27/03/2026 09:30', comentarios: '', duracao: '4h', dateStr: '2026-03-29' },
  { id: '10922', responsavel: 'Kleberson', experiencia: 'E099/2026', amostra: 'AGM 80Ah - Amostra 02', metodoAnalise: 'Inspeção', status: 'reprogramar', dataInicio: '27/03/2026 10:00', comentarios: 'Equipamento em calibração', duracao: '30m', dateStr: '2026-03-29' },
  { id: '10923', responsavel: 'Felipe', experiencia: 'E150/2026', amostra: 'M180 - Amostra 01', metodoAnalise: 'Outros', status: 'reprogramado', dataInicio: '29/03/2026 14:00', comentarios: 'Movido para amanhã', duracao: '1h', dateStr: '2026-03-29' },
  { id: '10924', responsavel: 'Vadson', experiencia: 'E120/2026', amostra: 'Amostra 02 - LATAM', metodoAnalise: 'Frio', status: 'concluido', dataInicio: '28/03/2026 11:00', comentarios: '', duracao: '24h', dateStr: '2026-03-29' },
  { id: '10925', responsavel: 'Davi', experiencia: 'E105/2026', amostra: 'Z60D - Amostra 05', metodoAnalise: 'J28', status: 'aguardando', dataInicio: '26/03/2026 13:00', comentarios: '', duracao: '1h 45m', dateStr: '2026-03-29' },
  { id: '10926', responsavel: 'João Victor', experiencia: 'E160/2026', amostra: 'Amostra 03 - LATAM', metodoAnalise: 'Thermal', status: 'aguardando', dataInicio: '29/03/2026 08:00', comentarios: '', duracao: '3h', dateStr: '2026-03-28' },
];

const getTodayStr = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

const BancadaTecnicoView = () => {
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('todas'); 
  const [isCompact, setIsCompact] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  
  const [tasks, setTasks] = useState(MOCK_LIMS_TASKS);

  const handleToggleStatus = (id) => {
    setTasks(prev => prev.map(item => {
      if (item.id === id) {
        if (item.status === 'aguardando') return { ...item, status: 'concluido' };
        if (item.status === 'concluido') return { ...item, status: 'reprogramar' };
        if (item.status === 'reprogramar') return { ...item, status: 'aguardando' };
        if (item.status === 'reprogramado') return { ...item, status: 'aguardando' };
      }
      return item;
    }));
  };

  const handleCommentChange = (id, text) => {
    setTasks(prev => prev.map(item => item.id === id ? { ...item, comentarios: text } : item));
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const myFirstName = useMemo(() => {
    return user?.displayName?.split(' ')[0] || 'João'; 
  }, [user]);

  const tasksOfDay = useMemo(() => {
    return tasks.filter(t => t.dateStr === selectedDate);
  }, [tasks, selectedDate]);

  const metrics = useMemo(() => {
    const total = tasksOfDay.length;
    const concluidos = tasksOfDay.filter(t => t.status === 'concluido').length;
    const reprogramar = tasksOfDay.filter(t => t.status === 'reprogramar').length;
    const reprogramado = tasksOfDay.filter(t => t.status === 'reprogramado').length;
    const aguardando = tasksOfDay.filter(t => t.status === 'aguardando').length;

    const byTech = {};
    tasksOfDay.forEach(t => {
      if (!byTech[t.responsavel]) byTech[t.responsavel] = { total: 0, done: 0 };
      byTech[t.responsavel].total += 1;
      if (t.status === 'concluido') byTech[t.responsavel].done += 1;
    });

    return { total, concluidos, reprogramar, reprogramado, aguardando, byTech };
  }, [tasksOfDay]);

  const filteredPlanilha = useMemo(() => {
    let data = tasksOfDay;
    
    if (filterMode === 'minhas') {
      data = data.filter(item => item.responsavel.includes(myFirstName));
    } else if (filterMode === 'pendentes') {
      data = data.filter(item => item.status === 'aguardando' || item.status === 'reprogramar');
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(item => 
        item.experiencia.toLowerCase().includes(term) ||
        item.amostra.toLowerCase().includes(term) ||
        item.metodoAnalise.toLowerCase().includes(term) ||
        item.responsavel.toLowerCase().includes(term)
      );
    }

    return data;
  }, [tasksOfDay, filterMode, searchTerm, myFirstName]);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'concluido': 
        return { label: 'Executado', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/20', icon: CheckCircle2 };
      case 'reprogramar': 
        return { label: 'Reprogramar', bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-500/20', icon: AlertCircle };
      case 'reprogramado': 
        return { label: 'Reprogramado', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20', icon: RefreshCw };
      default: 
        return { label: 'Aguardando', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', icon: Clock };
    }
  };

  // AJUSTE DE ESPAÇAMENTOS (Mais respiro nas células)
  const thPadding = isCompact ? "px-4 py-3 text-xs" : "px-6 py-5 text-xs";
  const tdPadding = isCompact ? "px-4 py-3 text-sm" : "px-6 py-6 text-sm";

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 transition-colors">
      
      <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shrink-0">
         <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 transition-colors">
               <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
                 <Layers size={24} />
               </div>
               Planilha de Execução Diária
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-2 transition-colors">
              Gerencie a execução, status e comentários das análises agendadas para o dia.
            </p>
         </div>

         <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm transition-colors">
            <button onClick={() => changeDate(-1)} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"><ChevronLeft size={20}/></button>
            <div className="flex flex-col items-center justify-center px-4 min-w-[160px]">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-colors">Data Selecionada</span>
               <input 
                 type="date" 
                 value={selectedDate} 
                 onChange={(e) => setSelectedDate(e.target.value)} 
                 className="bg-transparent font-black text-slate-800 dark:text-white text-base outline-none cursor-pointer transition-colors text-center"
               />
            </div>
            <button onClick={() => changeDate(1)} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"><ChevronRight size={20}/></button>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6 shrink-0 transition-colors flex flex-col xl:flex-row gap-8">
        
        <div className="flex-1">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors">
            <CalendarDays size={16} /> Resumo do Dia
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col transition-colors">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Total Diário</span>
                <span className="text-4xl font-black text-slate-800 dark:text-slate-200">{metrics.total}</span>
             </div>
             <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 p-5 rounded-2xl flex flex-col transition-colors">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1.5">Executados</span>
                <span className="text-4xl font-black text-blue-700 dark:text-blue-300">{metrics.concluidos}</span>
             </div>
             <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col transition-colors">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Pendentes</span>
                <span className="text-4xl font-black text-slate-800 dark:text-slate-200">{metrics.aguardando}</span>
             </div>
             <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 p-5 rounded-2xl flex flex-col transition-colors">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-1.5">Reprogramar</span>
                <span className="text-4xl font-black text-rose-700 dark:text-rose-300">{metrics.reprogramar}</span>
             </div>
          </div>
        </div>

        <div className="w-full xl:w-[450px] shrink-0 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-slate-800 pt-6 xl:pt-0 xl:pl-8 transition-colors">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors">
            <User size={16} /> Produtividade por Técnico
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.keys(metrics.byTech).length === 0 ? (
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500">Sem atividades hoje.</span>
            ) : (
              Object.keys(metrics.byTech).map(tech => {
                const stat = metrics.byTech[tech];
                const isMe = tech === 'João Victor' || tech.includes(myFirstName);
                const percent = Math.round((stat.done / stat.total) * 100);
                const isComplete = stat.done === stat.total;
                return (
                  <div key={tech} className={`flex items-center justify-between gap-4 px-4 py-3 border rounded-xl transition-colors ${isMe ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 ring-1 ring-blue-500/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'} w-full sm:w-[calc(50%-0.75rem)]`}>
                     <div className="flex flex-col min-w-0">
                       <span className={`text-sm font-black truncate transition-colors ${isMe ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{tech} {isMe && '(Você)'}</span>
                       <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors mt-0.5">{stat.done} DE {stat.total}</span>
                     </div>
                     <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-full border ${isComplete ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'} transition-colors`}>
                       {isComplete ? <CheckCircle2 size={18} className="text-emerald-500" /> : <span className="text-[11px] font-black text-slate-600 dark:text-slate-400">{percent}%</span>}
                     </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden min-w-0 transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-transparent shrink-0 transition-colors">
          
          <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner transition-colors">
             <button 
              onClick={() => setFilterMode('todas')}
              className={`px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${filterMode === 'todas' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
             >Todas (Geral)</button>
             <button 
              onClick={() => setFilterMode('minhas')}
              className={`px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${filterMode === 'minhas' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
             >Minhas</button>
             <button 
              onClick={() => setFilterMode('pendentes')}
              className={`px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${filterMode === 'pendentes' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
             >Pendentes</button>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full lg:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Buscar amostra, experiência, método..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm" 
              />
            </div>
            <button 
              onClick={() => setIsCompact(!isCompact)}
              className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={isCompact ? "Visão Confortável" : "Visão Compacta"}
            >
              {isCompact ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-slate-900 relative transition-colors">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md z-30 border-b border-slate-200 dark:border-slate-700 transition-colors">
              <tr className="uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-black">
                <th className={`${thPadding} w-20 text-center sticky left-0 bg-slate-50/95 dark:bg-slate-800/95 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40 transition-colors`}>Ação</th>
                <th className={`${thPadding} w-44 sticky left-20 bg-slate-50/95 dark:bg-slate-800/95 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40 transition-colors`}>Executante</th>
                <th className={`${thPadding} w-44 text-center`}>Status</th>
                <th className={thPadding}>Experiência</th>
                <th className={thPadding}>Amostra</th>
                <th className={`${thPadding} text-blue-600 dark:text-blue-400`}>Método Analítico</th>
                <th className={thPadding}>Data de Início</th>
                <th className={`${thPadding} min-w-[300px]`}>Comentários da Análise</th>
                <th className={`${thPadding} w-32 text-center sticky right-0 bg-slate-50/95 dark:bg-slate-800/95 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40 transition-colors`}>Duração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPlanilha.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-16 text-center text-slate-400 dark:text-slate-500 font-bold transition-colors">
                    <div className="flex flex-col items-center gap-4"><Inbox size={40} className="opacity-20"/>Nenhuma atividade encontrada neste dia.</div>
                  </td>
                </tr>
              ) : (
                filteredPlanilha.map((row) => {
                  const isConcluido = row.status === 'concluido';
                  const isMyTask = row.responsavel === 'João Victor' || row.responsavel.includes(myFirstName);
                  const rowBg = isConcluido ? 'bg-blue-50/30 dark:bg-blue-500/5' : 'bg-white dark:bg-slate-900';
                  const hoverBg = isConcluido ? 'hover:bg-blue-50/80 dark:hover:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50';
                  
                  const statusStyle = getStatusStyle(row.status);
                  const StatusIcon = statusStyle.icon;

                  return (
                    <tr key={row.id} className={`${rowBg} ${hoverBg} transition-all group`}>
                      <td className={`${tdPadding} text-center sticky left-0 z-20 ${rowBg} group-hover:bg-slate-50 dark:group-hover:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors`}>
                        <button 
                          onClick={() => handleToggleStatus(row.id)}
                          className={`focus:outline-none transition-colors ${isConcluido ? 'text-blue-500 dark:text-blue-400 hover:text-rose-500' : row.status === 'reprogramar' ? 'text-rose-500 dark:text-rose-400 hover:text-slate-500' : 'text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400'}`}
                          title="Alternar Status (Aguardando -> Concluído -> Reprogramar)"
                        >
                          {isConcluido ? <CheckSquare size={24} /> : row.status === 'reprogramar' ? <AlertCircle size={24} /> : <Square size={24} />}
                        </button>
                      </td>
                      
                      <td className={`${tdPadding} sticky left-20 z-20 ${rowBg} group-hover:bg-slate-50 dark:group-hover:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors`}>
                        <span className={`font-black flex items-center gap-2 ${isMyTask ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          <User size={16} className="opacity-50" /> {row.responsavel}
                        </span>
                      </td>

                      <td className={`${tdPadding} text-center`}>
                         <span className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black border uppercase tracking-widest w-full transition-colors ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                           <StatusIcon size={14} className={row.status === 'concluido' ? 'fill-current' : ''} /> {statusStyle.label}
                         </span>
                      </td>

                      <td className={`${tdPadding} font-black text-slate-800 dark:text-slate-200 transition-colors`}>{row.experiencia}</td>
                      <td className={`${tdPadding} font-bold text-slate-600 dark:text-slate-400 transition-colors`}>{row.amostra}</td>
                      <td className={`${tdPadding} font-black text-blue-700 dark:text-blue-400 transition-colors`}>{row.metodoAnalise}</td>
                      
                      <td className={`${tdPadding} font-semibold text-slate-500 dark:text-slate-400 transition-colors`}>{row.dataInicio}</td>
                      
                      <td className={tdPadding}>
                        <div className="relative group/input">
                          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within/input:text-blue-500 transition-colors" size={16} />
                          <input 
                            type="text" 
                            value={row.comentarios} 
                            onChange={(e) => handleCommentChange(row.id, e.target.value)}
                            placeholder="Adicionar nota sobre a análise..."
                            className={`w-full pl-10 pr-4 py-2.5 text-sm font-semibold rounded-xl border outline-none transition-colors ${row.comentarios ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:border-blue-400 dark:focus:border-blue-500'} shadow-sm focus:ring-4 focus:ring-blue-500/10`}
                          />
                        </div>
                      </td>

                      <td className={`${tdPadding} text-center sticky right-0 z-20 ${rowBg} group-hover:bg-slate-50 dark:group-hover:bg-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors`}>
                        <span className="text-sm font-mono font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                          {row.duracao}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BancadaTecnicoView;