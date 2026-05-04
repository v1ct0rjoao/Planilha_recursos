import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Legend, Tooltip as RechartsTooltip, PieChart, Pie, Cell, LabelList      
} from 'recharts';
import {
  List, BarChart2, Calendar, ArrowLeft, FileText, CheckCircle2, Clock, Zap, 
  Activity, Printer, TrendingUp, Timer, Info, Trash2, ClipboardList, Plus, 
  X, Save, Filter, Database, ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';
import { oeeService } from '../../services/oeeService';
import { apiRequest } from '../../services/api';
import ConfirmModal from "../../components/ui/ConfirmModal";

const ReportKPICard = ({ title, value, icon: Icon, color }) => {
  const colorMap = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
    green: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between transition-colors">
      <div>
        <p className="text-[0.6875rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 transition-colors">{title}</p>
        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight transition-colors">{value}%</h3>
      </div>
      <div className={`p-3 rounded-lg border transition-colors ${theme}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

const DetailedStats = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8 transition-colors">
      <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 transition-colors">
        <ClipboardList size={18} className="text-blue-600 dark:text-blue-400" /> Detalhamento Técnico & Médias
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 flex items-center gap-2 transition-colors">
            <Clock size={14} /> Médias de Dias (Por Circuito)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-lg flex flex-col transition-colors">
              <span className="text-[0.625rem] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Média UP</span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1">{data.up_dias || '-'}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-lg flex flex-col transition-colors">
              <span className="text-[0.625rem] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Média PQ</span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1">{data.pq_dias || '-'}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-lg flex flex-col transition-colors">
              <span className="text-[0.625rem] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Média PP</span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1">{data.pp_dias || '-'}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-lg flex flex-col transition-colors">
              <span className="text-[0.625rem] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Média SD</span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1">{data.sd_dias || '-'}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row justify-between gap-2 text-[0.6875rem] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
            <span>Tempo Disp. Médio: <strong className="text-slate-800 dark:text-slate-200">{data.tempo_disp_calc || '-'}</strong></span>
            <span>Tempo Real Médio: <strong className="text-blue-600 dark:text-blue-400">{data.tempo_real_calc || '-'}</strong></span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 flex items-center gap-2 transition-colors">
            <FileText size={14} /> Dados de Produção
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
              <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Ensaios Solicitados</span>
              <span className="font-black text-slate-800 dark:text-slate-200">{data.ensaios_solic || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3.5 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/50 transition-colors">
              <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">Ensaios Executados</span>
              <span className="font-black text-blue-700 dark:text-blue-400">{data.ensaios_exec || 0}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                <span className="text-[0.625rem] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">Relatórios Emitidos</span>
                <span className="font-black text-slate-800 dark:text-slate-200">{data.relatorios_emit || 0}</span>
              </div>
              <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800/50 transition-colors">
                <span className="text-[0.625rem] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1">Relatórios no Prazo</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400">{data.relatorios_prazo || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ReadOnlyGrid = ({ gridData, daysInMonth }) => {
  const getColor = (status) => {
    switch (status) {
      case 'UP': return 'bg-emerald-500 border-emerald-600 text-white';
      case 'PQ': return 'bg-rose-500 border-rose-600 text-white';
      case 'PP': return 'bg-purple-600 border-purple-700 text-white';
      case 'SD': return 'bg-amber-400 border-amber-500 text-white';
      case 'IGNORE': return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
      default: return 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-6 sticky left-0 transition-colors">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[0.6875rem] font-bold uppercase tracking-widest">
          <Info size={14} /> Legenda Visual:
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5"><span className="bg-emerald-500 text-white text-[0.625rem] font-bold px-1.5 py-0.5 rounded shadow-sm border border-emerald-600">UP</span><span className="text-[0.625rem] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Uso Prog.</span></div>
          <div className="flex items-center gap-1.5"><span className="bg-rose-500 text-white text-[0.625rem] font-bold px-1.5 py-0.5 rounded shadow-sm border border-rose-600">PQ</span><span className="text-[0.625rem] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Quebra</span></div>
          <div className="flex items-center gap-1.5"><span className="bg-purple-600 text-white text-[0.625rem] font-bold px-1.5 py-0.5 rounded shadow-sm border border-purple-700">PP</span><span className="text-[0.625rem] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Planejada</span></div>
          <div className="flex items-center gap-1.5"><span className="bg-amber-400 text-white text-[0.625rem] font-bold px-1.5 py-0.5 rounded shadow-sm border border-amber-500">SD</span><span className="text-[0.625rem] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Sem Demanda</span></div>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[37.5rem] custom-scrollbar bg-white dark:bg-slate-900 transition-colors">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider sticky top-0 z-20 shadow-sm transition-colors">
            <tr>
              <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 w-32 sticky left-0 bg-slate-50 dark:bg-slate-800 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">Circuito</th>
              <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex gap-0.5">
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <span key={i} className="w-[1.375rem] text-center text-[0.625rem] font-bold text-slate-400 dark:text-slate-500 block">{i + 1}</span>
                  ))}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {gridData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-2 font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-[0.6875rem] transition-colors">
                  {row.id === 'iDevice' || row.raw_id === 'iDevice' ? (
                    <span className="text-blue-600 dark:text-blue-400">iDevice</span>
                  ) : (
                    <span>
                      Circuit{String(row.raw_id || row.id).replace('Circuit', '').padStart(3, '0')}
                    </span>
                  )}
                </td>
                <td className="p-1">
                  <div className="flex gap-0.5 px-1">
                    {row.days && row.days.map((status, i) => (
                      <div
                        key={i}
                        className={`w-[1.375rem] h-[1.375rem] flex items-center justify-center text-[0.5rem] font-bold border rounded shrink-0 cursor-default ${getColor(status)}`}
                        title={`Dia ${i + 1}: ${status || 'Vazio'}`}
                      >
                        {status}
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, daysInMonth - (row.days?.length || 0)) }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-[1.375rem] h-[1.375rem] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded transition-colors" />
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

const HistoryView = ({ setToast }) => {
  const [viewMode, setViewMode] = useState('chart');
  const [historyList, setHistoryList] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [inputMode, setInputMode] = useState('grid'); 
  const [showGrid, setShowGrid] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [manualForm, setManualForm] = useState({
    mes: '', ano: '', 
    ensaios_solic: '', ensaios_exec: '', relatorios_emit: '', relatorios_prazo: '',
    grid_text: '',
    availability: '', performance: '', quality: '',
    up_dias: '', pq_dias: '', pp_dias: '', sd_dias: '',
    tempo_disp_calc: '', tempo_real_calc: ''
  });

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await oeeService.getHistory();
      const dataList = Array.isArray(response.data) ? response.data : (response.data?.historico || []);
      const sorted = dataList.sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at));
      setHistoryList(sorted);
    } catch (err) {
      setHistoryList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'chart') {
      fetchHistory();
    }
  }, [viewMode]);

  const availableYears = useMemo(() => {
    const years = historyList.map(item => item.ano.toString());
    return [...new Set(years)].sort((a, b) => a - b); 
  }, [historyList]);

  useEffect(() => {
    if (availableYears.length > 0) {
      if (!selectedYear || (!availableYears.includes(selectedYear) && selectedYear !== 'Todos' && selectedYear !== 'Por Anos')) {
        setSelectedYear(availableYears[availableYears.length - 1]); 
      }
    }
  }, [availableYears, selectedYear]);

  const filteredHistoryList = useMemo(() => {
    if (selectedYear === 'Todos' || selectedYear === 'Por Anos' || !selectedYear) return historyList;
    return historyList.filter(item => item.ano.toString() === selectedYear);
  }, [historyList, selectedYear]);

  const handleOpenDetail = (item) => {
    setSelectedMonth(item);
    setJustificativa(item.justificativa || '');
    setShowGrid(false);
    setViewMode('detail');
  };

  const handleBack = () => {
    setSelectedMonth(null);
    setViewMode('chart');
  };

  const handleRequestDelete = (item) => {
    setItemToDelete(item);
    setModalDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setModalDeleteOpen(false);

    const { success } = await oeeService.deleteHistory(itemToDelete.mes, itemToDelete.ano);

    if (success) {
      setHistoryList(prev => prev.filter(h => !(h.mes === itemToDelete.mes && h.ano === itemToDelete.ano)));
      if (selectedMonth && selectedMonth.mes === itemToDelete.mes && selectedMonth.ano === itemToDelete.ano) {
        handleBack();
      }
      if (setToast) setToast({ message: "Registro excluído com sucesso.", type: 'success' });
    } else {
      if (setToast) setToast({ message: "Erro ao excluir histórico.", type: 'error' });
    }
    setItemToDelete(null);
  };

  const handleSaveJustificativa = async () => {
    try {
      const payload = {
        mes: selectedMonth.mes,
        ano: selectedMonth.ano,
        kpi: selectedMonth.kpi,
        justificativa: justificativa,
        medias: selectedMonth.medias || selectedMonth.kpi?.medias
      };
      
      const response = await apiRequest('/oee/salvar_historico', 'POST', payload);
      if (response.success) {
        if (setToast) setToast({ message: "Comentário atualizado com sucesso!", type: 'success' });
        fetchHistory(); 
      }
    } catch (error) {
      if (setToast) setToast({ message: "Erro ao salvar comentário.", type: 'error' });
    }
  };

  const handleManualFormChange = (e) => {
    const { name, value } = e.target;
    setManualForm(prev => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    let payload = {};

    if (inputMode === 'grid') {
      payload = {
        mes: manualForm.mes,
        ano: manualForm.ano,
        ensaios_solicitados: manualForm.ensaios_solic,
        ensaios_executados: manualForm.ensaios_exec,
        relatorios_emitidos: manualForm.relatorios_emit,
        relatorios_no_prazo: manualForm.relatorios_prazo,
        grid_text: manualForm.grid_text
      };
    } else {
      const oeeCalculado = ((Number(manualForm.availability) / 100) * (Number(manualForm.performance) / 100) * (Number(manualForm.quality) / 100) * 100).toFixed(2);
      payload = {
        mes: manualForm.mes,
        ano: manualForm.ano,
        ensaios_solicitados: manualForm.ensaios_solic,
        ensaios_executados: manualForm.ensaios_exec,
        relatorios_emitidos: manualForm.relatorios_emit,
        relatorios_no_prazo: manualForm.relatorios_prazo,
        grid_text: '',
        kpi: {
          oee: oeeCalculado,
          availability: manualForm.availability,
          performance: manualForm.performance,
          quality: manualForm.quality
        },
        medias: {
          up_dias: manualForm.up_dias,
          pq_dias: manualForm.pq_dias,
          pp_dias: manualForm.pp_dias,
          sd_dias: manualForm.sd_dias,
          tempo_disp_calc: manualForm.tempo_disp_calc,
          tempo_real_calc: manualForm.tempo_real_calc,
          ensaios_solic: manualForm.ensaios_solic,
          ensaios_exec: manualForm.ensaios_exec,
          relatorios_emit: manualForm.relatorios_emit,
          relatorios_prazo: manualForm.relatorios_prazo
        }
      };
    }

    try {
      const response = await apiRequest('/oee/history/manual', 'POST', payload);

      if (response.success) {
        if (setToast) setToast({ message: "Histórico inserido com sucesso!", type: 'success' });
        setIsManualModalOpen(false);
        setManualForm({
          mes: '', ano: '', availability: '', performance: '', quality: '',
          up_dias: '', pq_dias: '', pp_dias: '', sd_dias: '',
          tempo_disp_calc: '', tempo_real_calc: '',
          ensaios_solic: '', ensaios_exec: '', relatorios_emit: '', relatorios_prazo: '',
          grid_text: ''
        });
        fetchHistory(); 
      } else {
        if (setToast) setToast({ message: "Erro ao salvar: " + (response.error || "Problema no servidor."), type: 'error' });
      }
    } catch (error) {
      if (setToast) setToast({ message: "Falha na comunicação com o servidor.", type: 'error' });
    }
  };

  if (viewMode === 'detail' && selectedMonth) {
    return (
      <div className="bg-slate-50 dark:bg-[#0f1115] min-h-screen animate-in slide-in-from-right duration-300 pb-20 transition-colors w-full">
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

        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 lg:px-10 py-5 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors">
          <div className="flex items-center gap-6">
            <button onClick={handleBack} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <ArrowLeft size={20} />
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 transition-colors"></div>
            <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 transition-colors tracking-tight">
                Relatório Mensal de OEE
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[0.625rem] px-2.5 py-1 rounded-md font-bold transition-colors uppercase tracking-widest">FECHADO</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 transition-colors">
                Referência: <strong className="text-slate-700 dark:text-slate-300">{selectedMonth.mes}/{selectedMonth.ano}</strong> • Gerado em: {new Date(selectedMonth.saved_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-3 no-print">
            <button onClick={() => handleRequestDelete(selectedMonth)} className="flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-500 font-bold text-xs bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 px-4 py-2.5 rounded-lg transition-all focus:outline-none">
              <Trash2 size={16} /> EXCLUIR
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all focus:outline-none">
              <Printer size={16} /> IMPRIMIR
            </button>
          </div>
        </div>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2 transition-colors">
                <Activity size={18} className="text-blue-600 dark:text-blue-400" /> Indicadores Consolidados
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <ReportKPICard title="OEE Global" value={selectedMonth.kpi.oee} color="blue" icon={Activity} />
              <ReportKPICard title="Disponibilidade" value={selectedMonth.kpi.availability} color="orange" icon={Clock} />
              <ReportKPICard title="Performance" value={selectedMonth.kpi.performance} color="purple" icon={Zap} />
              <ReportKPICard title="Qualidade" value={selectedMonth.kpi.quality} color="green" icon={CheckCircle2} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-600" /> Justificativa e Observações
            </h3>
            <textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Digite observações sobre os resultados, motivos de paradas ou metas atingidas..."
              className="w-full h-28 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none font-medium"
            />
            <div className="mt-3 flex justify-end">
              <button 
                onClick={handleSaveJustificativa}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <Save size={14} /> SALVAR COMENTÁRIO
              </button>
            </div>
          </div>

          <DetailedStats data={selectedMonth.medias || selectedMonth.kpi?.medias} />

          <div className="space-y-4">
            <button 
              onClick={() => setShowGrid(!showGrid)}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-bold text-[0.6875rem] uppercase tracking-widest transition-colors px-2 py-1 outline-none"
            >
              {showGrid ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showGrid ? "Ocultar Matriz de Planejamento" : "Visualizar Matriz de Planejamento (Grid)" }
            </button>
            
            {showGrid && (
              <div className="animate-in slide-in-from-top duration-300">
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors">
                  <FileText size={18} className="text-slate-500" /> Matriz de Planejamento (Grid)
                </h3>
                {selectedMonth.grid ? (
                  <ReadOnlyGrid gridData={selectedMonth.grid} daysInMonth={30} />
                ) : (
                  <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 transition-colors">
                    <div className="text-slate-500 dark:text-slate-400 mb-2 font-bold text-sm">Sem dados detalhados</div>
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Este fechamento manual foi inserido através de valores macro (sem preenchimento da matriz).</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isCompareMode = selectedYear === 'Todos';
  const isYearlyMacroMode = selectedYear === 'Por Anos';
  
  const meses = [ 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const mesesAbreviados = [ 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  let chartData = [];
  let linesToRender = [];

  if (isYearlyMacroMode) {
    chartData = availableYears.map(year => {
      const recordsOfYear = historyList.filter(h => h.ano.toString() === year);
      let oeeMedioAnual = 0;
      if (recordsOfYear.length > 0) {
        const somaOee = recordsOfYear.reduce((acc, curr) => acc + Number(curr.kpi.oee), 0);
        oeeMedioAnual = (somaOee / recordsOfYear.length).toFixed(2);
      }
      return {
        name: year, 
        oee: Number(oeeMedioAnual)
      };
    });
    linesToRender = ['oee'];
  } else if (isCompareMode) {
    chartData = mesesAbreviados.map((nomeMes, index) => {
      const mesNum = index + 1;
      const mesObj = { name: nomeMes };
      
      availableYears.forEach(year => {
        const record = historyList.find(h => parseInt(h.mes) === mesNum && h.ano.toString() === year);
        if (record) {
          mesObj[year] = Number(record.kpi.oee);
        }
      });
      return mesObj;
    });
    linesToRender = availableYears;
  } else {
    chartData = filteredHistoryList
      .sort((a, b) => parseInt(a.mes) - parseInt(b.mes))
      .map(h => ({
        name: mesesAbreviados[parseInt(h.mes) - 1],
        oee: Number(h.kpi.oee)
      }));
    linesToRender = ['oee'];
  }

  const allOeeValues = historyList.map(item => Number(item.kpi.oee));
  const yMin = allOeeValues.length > 0 ? Math.max(0, Math.floor(Math.min(...allOeeValues)) - 25) : 0;
  const yMax = allOeeValues.length > 0 ? Math.min(100, Math.ceil(Math.max(...allOeeValues)) + 10) : 100;

  const kpimedio = filteredHistoryList.length > 0 ?
    filteredHistoryList.reduce((acc, item) => {
      acc.availability += Number(item.kpi.availability);
      acc.performance += Number(item.kpi.performance);
      acc.quality += Number(item.kpi.quality);
      return acc;
    },
      { availability: 0, performance: 0, quality: 0 }
    )
    : { availability: 0, performance: 0, quality: 0 };

  const totalMeses = filteredHistoryList.length || 1;
  const mediaDisp = kpimedio.availability / totalMeses;
  const mediaPerf = kpimedio.performance / totalMeses;
  const mediaQual = kpimedio.quality / totalMeses;
  const mediaOeeCalculada = (mediaDisp / 100) * (mediaPerf / 100) * (mediaQual / 100) * 100;

  const medias = {
    availability: mediaDisp.toFixed(2),
    performance: mediaPerf.toFixed(2),
    quality: mediaQual.toFixed(2),
    oee: mediaOeeCalculada.toFixed(2)
  };

  let tituloGrafico = `Tendência de OEE - ${selectedYear}`;
  if (isCompareMode) tituloGrafico = "Comparação Mensal de OEE (Todos os Anos)";
  if (isYearlyMacroMode) tituloGrafico = "Evolução Histórica do Laboratório (Média Anual)";

  return (
    <div className="bg-transparent w-full font-sans text-slate-800 dark:text-slate-200 animate-in fade-in duration-300">

      <ConfirmModal
        isOpen={modalDeleteOpen}
        title="Excluir Histórico"
        message={itemToDelete ? `Tem certeza que deseja apagar o histórico de ${itemToDelete.mes}/${itemToDelete.ano}? Esta ação é irreversível.` : ""}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        type="danger"
        onClose={() => setModalDeleteOpen(false)}
        onCancel={() => setModalDeleteOpen(false)}
        onConfirm={executeDelete}
      />

      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-5 flex justify-between items-center z-10 shrink-0 transition-colors">
              <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg"><Plus size={18} /></div>
                Inserção de Histórico
              </h2>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1.5 focus:outline-none hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleManualSubmit} className="p-8 flex flex-col gap-8">
              
              <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-700 transition-colors">
                <button 
                  type="button"
                  onClick={() => setInputMode('grid')}
                  className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all focus:outline-none ${inputMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Planilha Digatron (Grid)
                </button>
                <button 
                  type="button"
                  onClick={() => setInputMode('manual')}
                  className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all focus:outline-none ${inputMode === 'manual' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Valores Finais
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div>
                    <h3 className="text-[0.6875rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 transition-colors">Referência</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[0.6875rem] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Mês (1-12)</label>
                        <input required type="number" min="1" max="12" name="mes" value={manualForm.mes} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="text-[0.6875rem] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Ano</label>
                        <input required type="number" min="2000" name="ano" value={manualForm.ano} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 outline-none transition-colors" />
                      </div>
                    </div>
                 </div>

                 <div className="col-span-2">
                    <h3 className="text-[0.6875rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 transition-colors">Metas Operacionais</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[0.625rem] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-wide">Ens. Solicitados</label>
                        <input required={inputMode==='grid'} type="number" name="ensaios_solic" value={manualForm.ensaios_solic} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="text-[0.625rem] font-bold text-blue-600 dark:text-blue-400 mb-1.5 block uppercase tracking-wide">Ens. Executados</label>
                        <input required={inputMode==='grid'} type="number" name="ensaios_exec" value={manualForm.ensaios_exec} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="text-[0.625rem] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-wide">Rel. Emitidos</label>
                        <input required={inputMode==='grid'} type="number" name="relatorios_emit" value={manualForm.relatorios_emit} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="text-[0.625rem] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 block uppercase tracking-wide">Rel. no Prazo</label>
                        <input required={inputMode==='grid'} type="number" name="relatorios_prazo" value={manualForm.relatorios_prazo} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 outline-none transition-colors" />
                      </div>
                    </div>
                 </div>
              </div>

              {inputMode === 'grid' ? (
                <div className="flex-1 min-h-[15.625rem] flex flex-col animate-in fade-in duration-300">
                  <h3 className="text-[0.6875rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-2 transition-colors">Área de Transferência do Excel</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 transition-colors">Cole as linhas e colunas. Células em branco da semana recebem <strong>SD</strong>. Sáb/Dom recebem <strong>PP</strong>.</p>
                  <textarea
                      required
                      name="grid_text"
                      value={manualForm.grid_text}
                      onChange={handleManualFormChange}
                      placeholder="Ex: 418&#9;PP&#9;UP&#9;UP..."
                      className="w-full flex-1 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none font-mono text-[0.6875rem] text-slate-700 dark:text-slate-300 leading-relaxed custom-scrollbar whitespace-pre shadow-inner"
                  />
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div>
                    <h3 className="text-[0.6875rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 transition-colors">Indicadores Principais (%)</h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <label className="text-[0.6875rem] font-bold text-orange-600 dark:text-orange-400 mb-1.5 block uppercase tracking-wider">Disponibilidade</label>
                        <input required type="number" step="0.01" min="0" max="100" name="availability" value={manualForm.availability} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-orange-500 focus:ring-orange-500/20 outline-none transition-colors shadow-sm" />
                      </div>
                      <div>
                        <label className="text-[0.6875rem] font-bold text-purple-600 dark:text-purple-400 mb-1.5 block uppercase tracking-wider">Performance</label>
                        <input required type="number" step="0.01" min="0" max="100" name="performance" value={manualForm.performance} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-purple-500 focus:ring-purple-500/20 outline-none transition-colors shadow-sm" />
                      </div>
                      <div>
                        <label className="text-[0.6875rem] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 block uppercase tracking-wider">Qualidade</label>
                        <input required type="number" step="0.01" min="0" max="100" name="quality" value={manualForm.quality} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 outline-none transition-colors shadow-sm" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[0.6875rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 transition-colors">Médias de Dias e Tempos (Opcional)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="text-[0.625rem] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">Média UP</label>
                        <input type="number" step="0.1" name="up_dias" value={manualForm.up_dias} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-blue-500 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="text-[0.625rem] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">Média PQ</label>
                        <input type="number" step="0.1" name="pq_dias" value={manualForm.pq_dias} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-blue-500 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="text-[0.625rem] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">Média PP</label>
                        <input type="number" step="0.1" name="pp_dias" value={manualForm.pp_dias} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-blue-500 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="text-[0.625rem] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">Média SD</label>
                        <input type="number" step="0.1" name="sd_dias" value={manualForm.sd_dias} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-blue-500 outline-none transition-colors" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[0.625rem] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">Tempo Disp. (Ex: 240.5)</label>
                        <input type="number" step="0.1" name="tempo_disp_calc" value={manualForm.tempo_disp_calc} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-blue-500 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="text-[0.625rem] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">Tempo Real (Ex: 200)</label>
                        <input type="number" step="0.1" name="tempo_real_calc" value={manualForm.tempo_real_calc} onChange={handleManualFormChange} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:border-blue-500 outline-none transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0 transition-colors">
                <button type="button" onClick={() => setIsManualModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500/50 shadow-sm">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-95">
                  <Database size={16} />
                  Salvar Histórico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap justify-between items-center gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <button onClick={() => setViewMode('chart')} className={`px-5 py-2 rounded-md text-[0.8125rem] font-bold transition-all flex items-center gap-2 focus:outline-none ${viewMode === 'chart' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <BarChart2 size={16} /> Gráficos de Evolução
            </button>
          </div>

          {availableYears.length > 0 && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <Filter size={16} className="text-slate-400 dark:text-slate-500 ml-2" />
              <div className="flex gap-1 overflow-x-auto">
                <button 
                  onClick={() => setSelectedYear('Todos')} 
                  className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap focus:outline-none ${selectedYear === 'Todos' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  Comparar Anos
                </button>
                <button 
                  onClick={() => setSelectedYear('Por Anos')} 
                  className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap focus:outline-none ${selectedYear === 'Por Anos' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  Média Anual
                </button>
                <div className="w-px bg-slate-200 dark:bg-slate-700 mx-2 transition-colors"></div>
                {availableYears.map(year => (
                  <button 
                    key={year}
                    onClick={() => setSelectedYear(year)} 
                    className={`px-4 py-2 rounded-md text-xs font-bold transition-all focus:outline-none ${selectedYear === year ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => setIsManualModalOpen(true)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500/50 active:scale-95"
        >
          <Plus size={16} /> ADICIONAR HISTÓRICO
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 h-[30rem] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:p-8 relative transition-colors">
              <h3 className="font-black text-slate-800 dark:text-white mb-6 text-sm tracking-widest uppercase flex items-center gap-3 absolute top-6 left-6 z-10 transition-colors">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} /> 
                </div>
                {tituloGrafico}
              </h3>
              
              {isLoading ? (
                <div className="h-full w-full flex flex-col gap-4 animate-pulse pt-14">
                   <div className="flex-1 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl transition-colors"></div>
                   <div className="h-8 w-full bg-slate-50 dark:bg-slate-800/30 rounded-md mt-4 transition-colors"></div>
                </div>
              ) : filteredHistoryList.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" className="pt-10">
                  {isCompareMode ? (
                    <LineChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dy={10} />
                      <YAxis domain={[yMin, yMax]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff', color: '#1e293b' }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }} />
                      
                      {linesToRender.map((year, idx) => {
                        const colors = ['#2563eb', '#ea580c', '#059669', '#7c3aed', '#d97706'];
                        return (
                          <Line 
                            key={year} 
                            type="step" 
                            dataKey={year} 
                            stroke={colors[idx % colors.length]} 
                            strokeWidth={3} 
                            activeDot={{ r: 6 }} 
                            connectNulls={true}
                          />
                        )
                      })}
                    </LineChart>
                  ) : (
                    <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOee" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isYearlyMacroMode ? "#6366f1" : "#2563eb"} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={isYearlyMacroMode ? "#6366f1" : "#2563eb"} stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dy={10} />
                      <YAxis domain={[yMin, yMax]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                      
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff', color: '#1e293b' }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }} />
                      
                      <Area 
                        type="step" 
                        dataKey="oee" 
                        stroke={isYearlyMacroMode ? "#6366f1" : "#2563eb"} 
                        strokeWidth={3} 
                        fill="url(#colorOee)" 
                        name="OEE Médio %" 
                        activeDot={{ r: 6, strokeWidth: 0 }} 
                      >
                        <LabelList 
                          dataKey="oee" 
                          position="top" 
                          offset={15}
                          formatter={(value) => `${value}%`} 
                          style={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} 
                        />
                      </Area>
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 transition-colors">
                  <BarChart2 size={40} className="mb-4 opacity-20" />
                  <span className="text-sm font-bold">Nenhum dado encontrado para o período selecionado.</span>
                </div>
              )}
          </div>

          {filteredHistoryList.length > 0 && (
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center relative shadow-sm transition-colors flex-1">
                <span className="text-[0.6875rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 z-10 flex items-center gap-2 transition-colors">
                  Média OEE {selectedYear === 'Todos' ? '(Geral)' : ''}
                </span>
                <div className="w-full flex-1 relative min-h-[7.5rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ value: Number(medias.oee) }, { value: 100 - Number(medias.oee) }]}
                        cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius="75%" outerRadius="100%" stroke="none" dataKey="value"  cornerRadius={10}
                        paddingAngle={2}
                      >
                        <Cell fill="#2563eb" /> 
                        <Cell fill="#f1f5f9" className="dark:fill-slate-800" /> 
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-2 w-full text-center">
                    <span className="text-4xl font-black text-blue-600 dark:text-blue-400 transition-colors">{medias.oee}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 h-[7.5rem]">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm transition-colors text-center">
                  <Timer size={16} className="text-orange-500 mb-2"/>
                  <span className="text-xl font-black text-orange-600 dark:text-orange-400">{medias.availability}%</span>
                  <span className="text-[0.5625rem] font-bold text-slate-400 uppercase tracking-wider mt-1">Disp.</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm transition-colors text-center">
                  <Zap size={16} className="text-purple-500 mb-2"/>
                  <span className="text-xl font-black text-purple-600 dark:text-purple-400">{medias.performance}%</span>
                  <span className="text-[0.5625rem] font-bold text-slate-400 uppercase tracking-wider mt-1">Perf.</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm transition-colors text-center">
                  <CheckCircle2 size={16} className="text-emerald-500 mb-2"/>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{medias.quality}%</span>
                  <span className="text-[0.5625rem] font-bold text-slate-400 uppercase tracking-wider mt-1">Qual.</span>
                </div>
              </div>
            </div>
          )}

          {!isYearlyMacroMode && !isCompareMode && (
            <div className="lg:col-span-4 mt-4">
              <h3 className="font-black text-slate-800 dark:text-white mb-6 uppercase text-sm tracking-widest flex items-center gap-2 transition-colors border-b border-slate-200 dark:border-slate-800 pb-3">
                <Calendar size={18} className="text-slate-400" /> Fechamentos Mensais Documentados
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...filteredHistoryList]
                  .sort((a, b) => {
                    if (a.ano !== b.ano) return b.ano - a.ano; 
                    return a.mes - b.mes; 
                  })
                  .map((item, idx) => (
                  <div
                    key={idx}
                    className="group bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col cursor-pointer"
                    onClick={() => handleOpenDetail(item)}
                  >
                    <div className="flex justify-between items-start mb-6">
                     <div>
                        <h4 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-2 capitalize transition-colors tracking-tight">
                          {meses[parseInt(item.mes, 10) - 1]} / {item.ano}
                        </h4>
                        <p className="text-[0.625rem] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mt-1.5 transition-colors">
                          {item.saved_at ? new Date(item.saved_at).toLocaleDateString() : 'Registro Manual'}
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRequestDelete(item); }}
                        className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mb-8 flex items-center gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-blue-600 dark:text-blue-400 border border-slate-100 dark:border-slate-700/50 transition-colors">
                        <Activity size={28} />
                      </div>
                      <div>
                        <span className="block text-[0.625rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors mb-1">OEE Global</span>
                        <span className="text-3xl font-black text-slate-800 dark:text-white transition-colors tracking-tight">{item.kpi.oee}%</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-between px-2 transition-colors">
                      <div className="flex flex-col items-center">
                        <span className="text-[0.625rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors mb-1">Disp.</span>
                        <span className="text-sm font-black text-orange-600 dark:text-orange-400 transition-colors">{item.kpi.availability}%</span>
                      </div>
                      <div className="w-px bg-slate-100 dark:bg-slate-800"></div>
                      <div className="flex flex-col items-center transition-colors">
                        <span className="text-[0.625rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors mb-1">Perf.</span>
                        <span className="text-sm font-black text-purple-600 dark:text-purple-400 transition-colors">{item.kpi.performance}%</span>
                      </div>
                      <div className="w-px bg-slate-100 dark:bg-slate-800"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-[0.625rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors mb-1">Qual.</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 transition-colors">{item.kpi.quality}%</span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredHistoryList.length === 0 && (
                   <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 text-sm font-bold transition-colors">
                      Nenhum fechamento registrado para o período.
                   </div>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default HistoryView;