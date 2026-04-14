import React, { useState, useEffect, useMemo } from 'react';
import { XCircle, Loader2, Wrench, CheckCircle, Play, ArrowRightLeft, Activity, History, Plus, Save, FileText, Link2, Trash2 } from 'lucide-react';
import { bathService } from '../../services/bathService';

const CircuitHistoryModal = ({ isOpen, onClose, circuit, onRefreshData }) => {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showLogForm, setShowLogForm] = useState(false);
  const [logType, setLogType] = useState('Falha no Equipamento');
  const [logDetails, setLogDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Todos');

  useEffect(() => {
    if (isOpen && circuit) {
      setIsLoading(true);
      setShowLogForm(false);
      setLogDetails('');
      setActiveFilter('Todos');
      bathService.getCircuitHistory(circuit.id).then(res => {
        if (res.success && res.data) {
          setHistoryLogs(res.data.logs || []);
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    } else {
      setHistoryLogs([]);
    }
  }, [isOpen, circuit]);

  const filterOptions = useMemo(() => {
    const uniqueActions = new Set(historyLogs.map(log => log.action));
    return ['Todos', ...Array.from(uniqueActions)];
  }, [historyLogs]);

  const filteredLogs = useMemo(() => {
    if (activeFilter === 'Todos') return historyLogs;
    return historyLogs.filter(log => log.action === activeFilter);
  }, [historyLogs, activeFilter]);

  const handleAddLog = async () => {
    setIsSubmitting(true);
    const isMaintenance = logType.includes('Falha') || logType.includes('Reparo');
    const batIdToSave = isMaintenance ? null : circuit.batteryId;

    const res = await bathService.addCircuitLog(circuit.id, logType, logDetails, batIdToSave);
    if (res.success && res.data && res.data.log) {
      setHistoryLogs(prev => [res.data.log, ...prev]);
      setShowLogForm(false);
      setLogDetails('');
      setActiveFilter('Todos');
      
      if (onRefreshData && isMaintenance) {
        onRefreshData();
      }
    }
    setIsSubmitting(false);
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Tem certeza que deseja apagar permanentemente este registro?')) return;
    
    setHistoryLogs(prev => prev.filter(log => log.id !== logId));
    
    const res = await bathService.deleteCircuitLog(logId);
    if (!res.success) {
       bathService.getCircuitHistory(circuit.id).then(r => {
         if (r.success && r.data) setHistoryLogs(r.data.logs || []);
       });
    }
  };

  if (!isOpen || !circuit) return null;

  const getIconForAction = (action) => {
    const act = action.toLowerCase();
    if (act.includes('falha') || act.includes('manutenção') || act.includes('reparo')) return <Wrench size={16} className="text-white" />;
    if (act.includes('concluído') || act.includes('liberado')) return <CheckCircle size={16} className="text-white" />;
    if (act.includes('início')) return <Play size={16} className="text-white ml-0.5" />;
    if (act.includes('mudança') || act.includes('movimentação')) return <ArrowRightLeft size={16} className="text-white" />;
    if (act.includes('paralelo')) return <Link2 size={16} className="text-white" />;
    if (act.includes('dado') || act.includes('anotação')) return <FileText size={16} className="text-white" />;
    return <Activity size={16} className="text-white" />;
  };

  const getColorForAction = (action) => {
    const act = action.toLowerCase();
    if (act.includes('falha') || act.includes('manutenção')) return 'bg-rose-500 border-rose-200';
    if (act.includes('concluído') || act.includes('liberado') || act.includes('reparo')) return 'bg-emerald-500 border-emerald-200';
    if (act.includes('início')) return 'bg-blue-600 border-blue-200';
    if (act.includes('mudança')) return 'bg-purple-500 border-purple-200';
    if (act.includes('paralelo')) return 'bg-fuchsia-600 border-fuchsia-200';
    if (act.includes('dado') || act.includes('anotação')) return 'bg-slate-700 border-slate-300';
    return 'bg-slate-700 border-slate-300';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-200">
      <div className="bg-slate-50 dark:bg-[#1a1d21] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[85vh] animate-in slide-in-from-bottom-4 border border-slate-200 dark:border-slate-800">
        
        <div className="bg-white dark:bg-[#202327] px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0 shadow-sm z-10">
          <div>
            <h2 className="font-black text-2xl text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
              Rastreamento {circuit.id}
            </h2>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
              <Activity size={14}/> Histórico de Eventos do Equipamento
            </p>
          </div>
          <button onClick={onClose} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-2.5 rounded-full hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 transition-colors focus:outline-none">
            <XCircle size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
          
          <div className="p-8 pb-2 shrink-0 bg-slate-50 dark:bg-[#1a1d21] sticky top-0 z-20">
            {!showLogForm ? (
              <button onClick={() => setShowLogForm(true)} className="w-full py-3.5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:bg-white dark:hover:bg-[#202327] hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2">
                <Plus size={18} /> Adicionar Registro Manual
              </button>
            ) : (
              <div className="bg-white dark:bg-[#202327] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <h4 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-3">Tipo de Registro</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                   {['Falha no Equipamento', 'Reparo Realizado'].map(type => (
                      <button 
                        key={type} 
                        onClick={() => setLogType(type)} 
                        className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-colors ${logType === type ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      >
                        {type}
                      </button>
                   ))}
                </div>
                <textarea
                  value={logDetails}
                  onChange={(e) => setLogDetails(e.target.value)}
                  placeholder="Descreva os detalhes e justificativas (Opcional, mas recomendado para histórico de manutenção)..."
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-[#1a1d21] border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none mb-4 resize-none h-24 transition-colors"
                />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowLogForm(false)} className="px-5 py-2.5 rounded-lg font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors">Cancelar</button>
                  <button onClick={handleAddLog} disabled={isSubmitting} className="px-6 py-2.5 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 text-xs flex items-center gap-2 shadow-sm transition-colors">
                    {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Salvar Registro
                  </button>
                </div>
              </div>
            )}
            
            {historyLogs.length > 0 && (
               <div className="mt-4 flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                 {filterOptions.map(f => (
                   <button
                     key={f}
                     onClick={() => setActiveFilter(f)}
                     className={`px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
                       activeFilter === f
                         ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50'
                         : 'bg-white dark:bg-[#202327] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                     }`}
                   >
                     {f}
                   </button>
                 ))}
               </div>
            )}
          </div>

          <div className="px-8 pb-8 flex-1">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 pt-10">
                 <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
                 <p className="font-medium text-sm">Carregando histórico...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 pt-10">
                 <History size={64} className="mb-4" />
                 <p className="font-bold text-lg text-slate-500">Sem registros encontrados.</p>
                 {activeFilter !== 'Todos' && <p className="text-sm mt-1">Nenhum evento do tipo "{activeFilter}".</p>}
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 md:ml-6 space-y-8">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="relative pl-8 md:pl-10 group">
                    
                    <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 shadow-sm flex items-center justify-center ${getColorForAction(log.action)} group-hover:scale-110 transition-transform z-10 dark:border-[#1a1d21]`}>
                       {getIconForAction(log.action)}
                    </div>
                    
                    <div className="bg-white dark:bg-[#202327] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm group-hover:border-blue-300 dark:group-hover:border-blue-500/50 transition-colors">
                       <div className="flex flex-wrap justify-between items-start gap-4 mb-3 border-b border-slate-100 dark:border-slate-800/50 pb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight">{log.action}</h3>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                              {log.date}
                            </span>
                          </div>
                          <button onClick={() => handleDeleteLog(log.id)} className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-1 rounded focus:outline-none" title="Apagar Registro">
                            <Trash2 size={16} />
                          </button>
                       </div>
                       
                       <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                          {log.details}
                       </p>

                       {log.batteryId && (
                         <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/30">
                           <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Bateria:</span>
                           <span className="text-xs font-bold text-blue-800 dark:text-blue-300">{log.batteryId}</span>
                         </div>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CircuitHistoryModal;