import React, { useState, useEffect } from 'react';
import {
  BarChart, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';
import { 
  List, BarChart2, Calendar, ArrowLeft, FileText, 
  CheckCircle2, Clock, Zap, Activity, Printer, Download,
  TrendingUp, Timer, MousePointerClick, Info, Trash2
} from 'lucide-react';
import { API_URL } from '../../utils/constants';
import { oeeService } from '../../services/oeeService';
// Importamos o Modal Visual
import ConfirmModal from "../../components/ui/ConfirmModal"; 

const ReportKPICard = ({ title, value, icon: Icon, color }) => {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    orange: 'text-orange-600 bg-orange-50 border-orange-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    green: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  };
  
  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}%</h3>
        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
           <Activity size={10} /> REGISTRO FINALIZADO
        </div>
      </div>
      <div className={`p-3 rounded-xl ${theme}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

const ReadOnlyGrid = ({ gridData, daysInMonth }) => {
  const getColor = (status) => {
    switch (status) {
      case 'UP': return 'bg-emerald-500 border border-emerald-600';
      case 'PQ': return 'bg-rose-500 border border-rose-600';
      case 'PP': return 'bg-purple-600 border border-purple-700';
      case 'SD': return 'bg-amber-400 border border-amber-500';
      case 'IGNORE': return 'bg-slate-100 border border-slate-200';
      default: return 'bg-white border border-slate-200'; 
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-6">
         <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Info size={14} /> Legenda Visual:
         </div>
         <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5"><span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm border border-emerald-600">UP</span><span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Uso Prog.</span></div>
             <div className="flex items-center gap-1.5"><span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm border border-rose-600">PQ</span><span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Quebra</span></div>
             <div className="flex items-center gap-1.5"><span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm border border-purple-700">PP</span><span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Planejada</span></div>
             <div className="flex items-center gap-1.5"><span className="bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm border border-amber-500">SD</span><span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Sem Demanda</span></div>
         </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-100 text-slate-600 font-semibold text-xs uppercase sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 border-r border-slate-200 w-32 sticky left-0 bg-slate-100 z-20 shadow-sm">Circuito</th>
              <th className="px-1 py-3">
                <div className="flex gap-[2px]"> 
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <span key={i} className="w-5 text-center text-[9px] text-slate-400 block">{i + 1}</span>
                  ))}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {gridData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-3 py-2 font-mono font-bold text-slate-700 border-r border-slate-200 sticky left-0 bg-white z-10">
                  {row.id === 'iDevice' ? (
                     <span className="text-blue-600 underline decoration-dotted decoration-blue-300">iDevice</span>
                  ) : (
                     <span className="text-slate-600">Circuit{row.id.padStart(3, '0')}</span>
                  )}
                </td>
                <td className="p-1">
                  <div className="flex gap-[2px] px-1">
                    {row.days && row.days.map((status, i) => (
                      <div 
                        key={i}
                        className={`w-5 h-6 flex items-center justify-center text-[8px] font-bold text-white rounded-[2px] shrink-0 ${getColor(status)}`}
                        title={`Dia ${i+1}: ${status || 'Vazio'}`}
                      >
                        {status}
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, daysInMonth - (row.days?.length || 0)) }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-5 h-6 border border-slate-100 bg-white rounded-[2px]" />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Adicionei setToast aos props caso você queira passar do pai para exibir mensagens de sucesso
const HistoryView = ({ logs, setToast }) => {
  const [viewMode, setViewMode] = useState('chart'); 
  const [historyList, setHistoryList] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- NOVOS ESTADOS PARA O MODAL DE EXCLUSÃO ---
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchHistory = () => {
      setIsLoading(true);
      fetch(`${API_URL}/oee/history`)
        .then(r => r.json())
        .then(data => {
            if (data.sucesso && Array.isArray(data.historico)) {
                const sorted = data.historico.sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at));
                setHistoryList(sorted);
            } else {
                setHistoryList([]);
            }
        })
        .catch(err => {
            console.error("Erro ao buscar histórico:", err);
            setHistoryList([]);
        })
        .finally(() => setIsLoading(false));
  };

  useEffect(() => { 
    if (viewMode === 'chart') {
        fetchHistory();
    }
  }, [viewMode]);

  const handleOpenDetail = (item) => {
    setSelectedMonth(item);
    setViewMode('detail');
  };

  const handleBack = () => {
    setSelectedMonth(null);
    setViewMode('chart');
  };

  // 1. Função chamada ao clicar no botão de lixeira (Abre o Modal)
  const handleRequestDelete = (item) => {
    setItemToDelete(item);
    setModalDeleteOpen(true);
  };

  // 2. Função chamada ao confirmar no Modal (Executa a ação)
  const executeDelete = async () => {
    if (!itemToDelete) return;
    setModalDeleteOpen(false); // Fecha o modal

    const { success } = await oeeService.deleteHistory(itemToDelete.mes, itemToDelete.ano);
    
    if (success) {
        // Remove da lista localmente
        setHistoryList(prev => prev.filter(h => !(h.mes === itemToDelete.mes && h.ano === itemToDelete.ano)));
        
        // Se estava na tela de detalhe desse item, volta para a lista
        if(selectedMonth && selectedMonth.mes === itemToDelete.mes && selectedMonth.ano === itemToDelete.ano) {
            handleBack(); 
        }
        
        // Se tiver setToast, usa. Se não, apenas atualiza a tela (o modal fechando já é feedback)
        if (setToast) setToast({ message: "Registro excluído com sucesso.", type: 'success' });
    } else {
        alert("Erro ao excluir histórico.");
    }
    setItemToDelete(null);
  };

  // --- RENDERIZAÇÃO ---

  if (viewMode === 'detail' && selectedMonth) {
    return (
      <div className="bg-slate-50/50 min-h-screen animate-in slide-in-from-right duration-300 pb-20">
        
        {/* MODAL DE CONFIRMAÇÃO (Visualização Detalhada) */}
        <ConfirmModal 
          isOpen={modalDeleteOpen}
          title="Excluir Histórico"
          message={`Tem certeza que deseja apagar o histórico de ${itemToDelete?.mes}/${itemToDelete?.ano}? Esta ação é irreversível.`}
          confirmText="Sim, Excluir"
          cancelText="Cancelar"
          type="danger"
          onClose={() => setModalDeleteOpen(false)}
          onCancel={() => setModalDeleteOpen(false)}
          onConfirm={executeDelete}
        />

        <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-6">
            <button onClick={handleBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft size={22} />
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Relatório Mensal de OEE
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">FECHADO</span>
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Referência: <strong className="text-slate-700">{selectedMonth.mes}/{selectedMonth.ano}</strong> • Gerado em: {new Date(selectedMonth.saved_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleRequestDelete(selectedMonth)} className="flex items-center gap-2 text-rose-600 hover:text-white hover:bg-rose-600 font-bold text-xs bg-white border border-rose-200 px-4 py-2 rounded-lg shadow-sm transition-all">
                <Trash2 size={14} /> EXCLUIR
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold text-xs bg-white border border-slate-200 hover:border-blue-300 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all">
              <Printer size={14} /> IMPRIMIR
            </button>
            {/* <button className="flex items-center gap-2 text-white font-bold text-xs bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all">
              <Download size={14} /> EXPORTAR PDF
            </button> */}
          </div>
        </div>
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                 <Activity size={16} /> Indicadores Consolidados
               </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ReportKPICard title="OEE Global" value={selectedMonth.kpi.oee} color="blue" icon={Activity} />
              <ReportKPICard title="Disponibilidade" value={selectedMonth.kpi.availability} color="orange" icon={Clock} />
              <ReportKPICard title="Performance" value={selectedMonth.kpi.performance} color="purple" icon={Zap} />
              <ReportKPICard title="Qualidade" value={selectedMonth.kpi.quality} color="green" icon={CheckCircle2} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText size={16} /> Detalhamento por Circuito
            </h3>
            {selectedMonth.grid ? (
               <ReadOnlyGrid gridData={selectedMonth.grid} daysInMonth={30} /> 
            ) : (
               <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                 <div className="text-slate-400 mb-2">Sem dados detalhados</div>
                 <p className="text-xs text-slate-400">Este fechamento não possui grid salvo.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300 min-h-[600px]">
      
      {/* MODAL DE CONFIRMAÇÃO (Visualização Lista) */}
      <ConfirmModal 
          isOpen={modalDeleteOpen}
          title="Excluir Histórico"
          message={`Tem certeza que deseja apagar o histórico de ${itemToDelete?.mes}/${itemToDelete?.ano}? Esta ação é irreversível.`}
          confirmText="Sim, Excluir"
          cancelText="Cancelar"
          type="danger"
          onClose={() => setModalDeleteOpen(false)}
          onCancel={() => setModalDeleteOpen(false)}
          onConfirm={executeDelete}
      />

      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setViewMode('logs')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'logs' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
            <List size={14} /> LOGS
          </button>
          <button onClick={() => setViewMode('chart')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'chart' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
            <BarChart2 size={14} /> EVOLUÇÃO
          </button>
        </div>
      </div>

      {viewMode === 'logs' ? (
        <div className="overflow-x-auto max-h-[70vh] custom-scrollbar p-0">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-200 sticky top-0">
              <tr><th className="px-6 py-3 border-r border-slate-200">Data/Hora</th><th className="px-6 py-3 border-r border-slate-200">Evento</th><th className="px-6 py-3">Descrição</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs && logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-500 border-r border-slate-100">{log.date}</td>
                  <td className="px-6 py-3 border-r border-slate-100"><span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border bg-blue-50 text-blue-600 border-blue-100">{log.action}</span></td>
                  <td className="px-6 py-3 text-slate-600 text-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-3 h-80 bg-slate-50 rounded-2xl border border-slate-200 p-6 relative">
            <h3 className="font-bold text-slate-700 mb-6 uppercase text-xs tracking-wider flex items-center gap-2 absolute top-6 left-6">
              <TrendingUp size={16} /> Tendência de OEE
            </h3>
            {isLoading ? (
                <div className="h-full flex items-center justify-center text-blue-600 font-bold animate-pulse">Carregando dados...</div>
            ) : historyList.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyList.map(h => ({ name: `${h.mes}/${h.ano}`, ...h.kpi }))} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="oee" stroke="#2563eb" strokeWidth={3} name="OEE %" dot={{r: 4, fill: '#2563eb', strokeWidth: 2, stroke:'#fff'}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="availability" stroke="#f97316" strokeWidth={2} name="Disponibilidade %" strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <BarChart2 size={32} className="mb-2 opacity-30" />
                    <span className="text-xs">Sem dados históricos no banco.</span>
                </div>
            )}
          </div>

          <div className="lg:col-span-3">
             <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider flex items-center gap-2">
               <Calendar size={16} /> Fechamentos Mensais
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {historyList.map((item, idx) => (
                    <div 
                        key={idx} 
                        className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                  {item.mes}/{item.ano}
                                </h4>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mt-1">
                                  {new Date(item.saved_at).toLocaleDateString()}
                                </p>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleRequestDelete(item); }} 
                                className="text-slate-300 hover:text-rose-500 p-2 rounded-full transition-colors"
                                title="Excluir Histórico"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        
                        <div onClick={() => handleOpenDetail(item)} className="cursor-pointer">
                            <div className="mb-6 flex items-center gap-3">
                                 <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                    <Activity size={24} />
                                 </div>
                                 <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase">OEE Global</span>
                                    <span className="text-3xl font-extrabold text-blue-600">{item.kpi.oee}%</span>
                                 </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-100 grid grid-cols-3 gap-2">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1 mb-1">
                                      <Timer size={12} className="text-orange-500" />
                                      <span className="text-[9px] font-bold text-slate-400 uppercase">Disp.</span>
                                    </div>
                                    <span className="text-sm font-bold text-orange-600">{item.kpi.availability}%</span>
                                </div>
                                <div className="flex flex-col items-center border-l border-r border-slate-100">
                                    <div className="flex items-center gap-1 mb-1">
                                      <Zap size={12} className="text-purple-500" />
                                      <span className="text-[9px] font-bold text-slate-400 uppercase">Perf.</span>
                                    </div>
                                    <span className="text-sm font-bold text-purple-600">{item.kpi.performance}%</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1 mb-1">
                                      <CheckCircle2 size={12} className="text-emerald-500" />
                                      <span className="text-[9px] font-bold text-slate-400 uppercase">Qual.</span>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-600">{item.kpi.quality}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;