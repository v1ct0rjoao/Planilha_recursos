import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import {
  UploadCloud, AlertTriangle, CheckCircle, XCircle, Thermometer, Activity, Clock, Search, BatteryCharging,
  Zap, Plus, Edit2, Save, Trash2, Clipboard, Wrench, CheckSquare, Settings, Factory, TrendingUp,
  TrendingDown, CheckCircle2, ArrowRight, ArrowLeft, FileSpreadsheet, Filter, Info, Download, BarChart2, List, RefreshCw, Calendar, Calculator, Copy, Grid, Maximize2, Hash, ArrowRightLeft, ChevronDown, Check, Link2
} from 'lucide-react';

const API_URL = 'https://planilha-recursos.onrender.com/api';

const formatDataCurta = (dataStr) => {
  if (!dataStr || dataStr === '-' || dataStr === 'A calcular') return '--/-- --:--';
  try {
    const [data, hora] = dataStr.split(' ');
    const [dia, mes] = data.split('/');
    return `${dia}/${mes} ${hora}`;
  } catch { return dataStr; }
};

const Toast = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    requestAnimationFrame(() => setProgress(0));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-600', bar: 'bg-emerald-500' },
    error: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', icon: 'text-rose-600', bar: 'bg-rose-500' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600', bar: 'bg-blue-500' }
  };

  const style = styles[type] || styles.info;

  return (
    <div className={`fixed top-6 right-6 z-[60] flex flex-col overflow-hidden w-80 rounded-xl border shadow-2xl shadow-slate-200/50 backdrop-blur-md transition-all duration-300 transform ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${style.bg} ${style.border}`}>
      <div className="flex items-center gap-3 p-4">
        <div className={`p-2 bg-white rounded-full shadow-sm ${style.icon}`}>
          {type === 'success' && <CheckCircle size={20} />}
          {type === 'error' && <AlertTriangle size={20} />}
          {type === 'info' && <Info size={20} />}
        </div>
        <p className={`text-sm font-bold ${style.text}`}>{message}</p>
        <button onClick={() => setVisible(false)} className="ml-auto text-slate-400 hover:text-slate-600"><XCircle size={18} /></button>
      </div>
      <div className="h-1 w-full bg-slate-200/50">
        <div className={`h-full ${style.bar} transition-all duration-[3000ms] ease-linear`} style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, color, suffix = '%' }) => {
  const colorClasses = { blue: 'text-blue-600 bg-blue-50', green: 'text-green-600 bg-green-50', purple: 'text-purple-600 bg-purple-50', orange: 'text-orange-600 bg-orange-50', red: 'text-red-600 bg-red-50' };
  const theme = colorClasses[color] || colorClasses.blue;
  const numValue = parseFloat(value) || 0;
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
        <div className={`p-2 rounded-lg ${theme}`}><Icon size={18} /></div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold text-slate-800">{numValue}{suffix}</span>
          <div className="flex items-center mt-1 space-x-1">
            {numValue >= 85 ? <TrendingUp size={14} className="text-green-500" /> : <TrendingDown size={14} className="text-red-500" />}
            <span className={`text-[10px] font-bold uppercase tracking-wide ${numValue >= 85 ? 'text-green-500' : 'text-red-500'}`}>{numValue >= 85 ? 'Meta Atingida' : 'Abaixo da Meta'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ValidationCard = ({ medias }) => {
  if (!medias) return null;
  const getPct = (val) => medias.total_dias > 0 ? ((val / medias.total_dias) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm mb-6 border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
        <Calculator size={16} className="text-blue-600"/> Conferência de Cálculo (Médias Globais)
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Circuitos Ativos</span>
          <span className="font-mono font-bold text-xl text-slate-700">{medias.circuitos_considerados}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Média UP (Dias)</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono font-bold text-xl text-emerald-700">{medias.up_dias}</span>
            <span className="text-xs font-bold text-emerald-500">({getPct(medias.up_dias)}%)</span>
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1">Média PQ (Dias)</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono font-bold text-xl text-rose-700">{medias.pq_dias}</span>
            <span className="text-xs font-bold text-rose-500">({getPct(medias.pq_dias)}%)</span>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block mb-1">Média PP (Dias)</span>
          <div className="flex items-baseline gap-2">
             <span className="font-mono font-bold text-xl text-purple-700">{medias.pp_dias}</span>
             <span className="text-xs font-bold text-purple-500">({getPct(medias.pp_dias)}%)</span>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1">Média SD (Dias)</span>
          <div className="flex items-baseline gap-2">
             <span className="font-mono font-bold text-xl text-amber-700">{medias.sd_dias}</span>
             <span className="text-xs font-bold text-amber-500">({getPct(medias.sd_dias)}%)</span>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium flex justify-between items-center">
        <span>* Fórmula da Média: (Soma dos Dias de todos os circuitos) ÷ {medias.circuitos_considerados}</span>
        <span>Total Dias Mês: {medias.total_dias}</span>
      </div>
    </div>
  );
};

const StatusLegend = () => (
  <div className="flex flex-wrap gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-xs font-bold uppercase text-slate-600 shadow-sm">
    <span className="text-slate-400 mr-2 flex items-center gap-1"><Info size={14} /> Legenda Visual:</span>
    <div className="flex items-center gap-1"><div className="w-4 h-4 bg-emerald-500 rounded shadow-sm flex items-center justify-center text-[8px] text-white">UP</div> Uso Prog.</div>
    <div className="flex items-center gap-1"><div className="w-4 h-4 bg-rose-500 rounded shadow-sm flex items-center justify-center text-[8px] text-white">PQ</div> Quebra</div>
    <div className="flex items-center gap-1"><div className="w-4 h-4 bg-purple-600 rounded shadow-sm flex items-center justify-center text-[8px] text-white">PP</div> Planejada</div>
    <div className="flex items-center gap-1"><div className="w-4 h-4 bg-amber-400 rounded shadow-sm flex items-center justify-center text-[8px] text-white">SD</div> Sem Demanda</div>
  </div>
);

const GridRow = ({ row, daysInMonth, onDelete, onRestore, onPreset, setToast }) => {
  const getColor = (status) => {
    switch (status) {
      case 'UP': return 'bg-emerald-500';
      case 'PQ': return 'bg-rose-500';
      case 'PP': return 'bg-purple-600';
      case 'SD': return 'bg-amber-400';
      default: return 'bg-slate-200';
    }
  };

  const stats = row.stats || { pct_up: 0, pct_pq: 0, pct_pp: 0, pct_sd: 0, tempo_disponivel: 0, tempo_real: 0, disponibilidade: 0 };
  const isEmpty = (row.is_zero_up && !row.is_ignored) || row.is_ignored;

  const handleCopyRow = () => {
    const dayString = row.day_data ? row.day_data.join('\t') : Array(daysInMonth).fill('').join('\t');
    const textToCopy = `${row.id}\t${dayString}\t${row.UP}\t${row.PQ}\t${row.PP}\t${row.SD}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      if(setToast) setToast({ message: `Linha ${row.id} copiada!`, type: 'success' });
    });
  };

  return (
    <tr className={`transition-colors ${row.is_ignored ? 'bg-slate-50 opacity-40' : 'hover:bg-blue-50/20'}`}>
      <td className="px-3 py-2 font-mono font-bold text-slate-700 border-r border-slate-200 w-32 sticky left-0 bg-white z-10 shadow-sm group relative">
        <div className="flex flex-col cursor-help">
          <span className={`flex items-center gap-1 ${isEmpty ? 'text-slate-400' : 'text-blue-600 underline decoration-dotted decoration-blue-300'}`}>
            {row.id}
          </span>
          {!isEmpty && (
            <div className="absolute left-full top-0 ml-2 w-48 bg-slate-800 text-white text-[10px] p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
              <h4 className="font-bold border-b border-slate-600 pb-1 mb-2 text-emerald-400">Indicadores do Circuito</h4>
              <div className="space-y-1">
                 <div className="flex justify-between"><span>Disponibilidade:</span> <span className="font-bold">{stats.disponibilidade}%</span></div>
                 <div className="flex justify-between text-slate-300"><span>Tempo Disponível:</span> <span>{stats.tempo_disponivel} dias</span></div>
                 <div className="flex justify-between text-slate-300"><span>Tempo Real (UP):</span> <span>{stats.tempo_real} dias</span></div>
              </div>
            </div>
          )}
          {row.is_zero_up && !row.is_ignored && <span className="text-[9px] text-slate-300 italic font-normal mt-1">Inativo</span>}
          {row.is_ignored && <span className="text-[9px] text-rose-400 font-bold border border-rose-100 px-1 rounded w-fit bg-rose-50 mt-1">EXCLUÍDO</span>}
        </div>
      </td>
      <td className="p-1 border-r border-slate-200 overflow-hidden">
        <div className="flex gap-[2px]">
          {isEmpty ? (
             Array.from({ length: daysInMonth }).map((_, i) => (
                <div key={i} className="w-5 h-6 border border-slate-100 bg-white rounded-[2px]" title="Sem atividade neste mês"></div>
             ))
          ) : (
            row.day_data && row.day_data.map((status, i) => (
              <div key={i} className={`w-5 h-6 flex items-center justify-center text-[9px] font-bold text-white rounded-[2px] cursor-default transition-transform hover:scale-125 hover:z-20 ${getColor(status)}`} title={`Dia ${i + 1}: ${status}`}>
                {status}
              </div>
            ))
          )}
        </div>
      </td>
      <td className="px-1 py-2 text-center border-r border-emerald-100 bg-emerald-50/30">
        {!isEmpty ? (<div className="flex flex-col"><span className="text-xs font-bold text-emerald-700">{row.UP}</span><span className="text-[9px] text-emerald-600/70">{stats.pct_up}%</span></div>) : <span className="text-slate-200">-</span>}
      </td>
      <td className="px-1 py-2 text-center border-r border-rose-100 bg-rose-50/30">
        {!isEmpty ? (<div className="flex flex-col"><span className="text-xs font-bold text-rose-700">{row.PQ}</span><span className="text-[9px] text-rose-600/70">{stats.pct_pq}%</span></div>) : <span className="text-slate-200">-</span>}
      </td>
      <td className="px-1 py-2 text-center border-r border-purple-100 bg-purple-50/30">
        {!isEmpty ? (<div className="flex flex-col"><span className="text-xs font-bold text-purple-700">{row.PP}</span><span className="text-[9px] text-purple-600/70">{stats.pct_pp}%</span></div>) : <span className="text-slate-200">-</span>}
      </td>
      <td className="px-1 py-2 text-center border-r border-slate-200 bg-amber-50/30">
        {!isEmpty ? (<div className="flex flex-col"><span className="text-xs font-bold text-amber-700">{row.SD}</span><span className="text-[9px] text-amber-600/70">{stats.pct_sd}%</span></div>) : <span className="text-slate-200">-</span>}
      </td>
      <td className="px-2 py-2 text-right w-40">
        {!row.is_ignored ? (
          <div className="flex justify-end gap-1">
             {isEmpty ? (
               <>
                <button onClick={handleCopyRow} title="Copiar linha" className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors mr-1"><Copy size={14} /></button>
                <button onClick={() => onPreset(row.raw_id, 'force_up')} title="Forçar Ativação" className="px-3 py-1 text-[10px] font-bold text-slate-400 bg-white hover:bg-emerald-50 hover:text-emerald-600 rounded border border-slate-200 transition-all">Ativar</button>
                <button onClick={() => onDelete(row.raw_id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"><Trash2 size={14} /></button>
               </>
             ) : (
               <>
                   <button onClick={handleCopyRow} title="Copiar linha" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors mr-1"><Copy size={14} /></button>
                   <button onClick={() => onPreset(row.raw_id, 'force_std')} title="Semana Padrão" className="px-2 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 shadow-sm transition-all">STD</button>
                   <button onClick={() => onPreset(row.raw_id, 'force_up')} title="Tudo UP" className="px-2 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 shadow-sm transition-all">UP</button>
                   <button onClick={() => onRestore(row.raw_id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded ml-1 transition-colors" title="Restaurar"><RefreshCw size={14} /></button>
                   <button onClick={() => onDelete(row.raw_id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors" title="Excluir"><Trash2 size={14} /></button>
               </>
             )}
          </div>
        ) : (
          <button onClick={() => onRestore(row.raw_id)} className="ml-auto px-2 py-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded font-bold text-[10px] flex items-center gap-1 border border-emerald-200 shadow-sm transition-all"><RefreshCw size={10} /> Restaurar</button>
        )}
      </td>
    </tr>
  );
};

const OEEDashboardView = ({ setToast }) => {
  const [step, setStep] = useState('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [circuitosList, setCircuitosList] = useState([]);

  const [config, setConfig] = useState({
    ano: new Date().getFullYear(), mes: new Date().getMonth() + 1, capacidade_total: 450,
    ensaios_executados: 0, ensaios_solicitados: 0, relatorios_emitidos: 0, relatorios_no_prazo: 0,
    force_up: [], force_pq: [], force_pp: [], force_std: [], ignored_list: [], overrides: {}
  });

  const [results, setResults] = useState({
    kpi: { oee: 0, availability: 0, performance: 0, quality: 0 },
    trendData: [], details: [], meta: { dias_no_mes: 30 }, medias: null
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/oee/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.sucesso) {
        setUploadedFile(data.filename);
        setCircuitosList(data.circuitos || []);
        setToast({ message: 'Arquivo carregado!', type: 'success' });
        setStep('config');
      } else setToast({ message: data.erro, type: 'error' });
    } catch (err) { setToast({ message: "Erro de conexão.", type: 'error' }); }
    setIsLoading(false);
  };

  const calculate = useCallback(async (currentConfig = config) => {
    setIsLoading(true);
    try {
      const payload = { filename: uploadedFile, ...currentConfig };
      const res = await fetch(`${API_URL}/oee/calculate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.sucesso) {
        setResults({ 
            kpi: data.kpi, trendData: data.trendData, details: data.details || [], meta: data.meta || { dias_no_mes: 30 }, medias: data.medias || null
        });
        if (step === 'config') setStep('dashboard');
      } else setToast({ message: "Erro: " + data.erro, type: 'error' });
    } catch (err) { setToast({ message: "Erro ao calcular.", type: 'error' }); }
    setIsLoading(false);
  }, [uploadedFile, config, step, setToast]);

  const handleExclude = (id) => { const newConfig = { ...config, ignored_list: [...config.ignored_list, id] }; setConfig(newConfig); calculate(newConfig); };

  const handleRestore = (id) => {
    const newConfig = { ...config };
    ['ignored_list', 'force_up', 'force_pq', 'force_pp', 'force_std'].forEach(list => {
      newConfig[list] = newConfig[list].filter(x => x !== id);
    });
    const cidFormatted = `C-${id.toString().padStart(3, '0')}`;
    if (newConfig.overrides && newConfig.overrides[cidFormatted]) {
      const newOverrides = { ...newConfig.overrides };
      delete newOverrides[cidFormatted];
      newConfig.overrides = newOverrides;
    }
    setConfig(newConfig);
    calculate(newConfig);
  };

  const handlePreset = (id, type) => {
    const newConfig = { ...config };
    ['force_up', 'force_pq', 'force_pp', 'force_std'].forEach(list => newConfig[list] = newConfig[list].filter(x => x !== id));
    newConfig[type] = [...newConfig[type], id];
    const cidFormatted = `C-${id.toString().padStart(3, '0')}`;
    if (newConfig.overrides[cidFormatted]) delete newConfig.overrides[cidFormatted];
    setConfig(newConfig); calculate(newConfig);
  };
  
  const toggleSelection = (listName, id) => {
    setConfig(prev => {
      const list = prev[listName];
      const newList = list.includes(id) ? list.filter(item => item !== id) : [...list, id];
      return { ...prev, [listName]: newList };
    });
  };

  const handleSaveHistory = async () => {
    if (!confirm("Salvar fechamento?")) return;
    try { await fetch(`${API_URL}/oee/save_history`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kpi: results.kpi, mes: config.mes, ano: config.ano }) }); setToast({ message: "Salvo!", type: 'success' }); } catch (e) { }
  };

  const handleCopyGridOnly = () => {
    if (!results.details || results.details.length === 0) return;
    const rows = results.details.map(row => {
        return row.day_data && row.day_data.length > 0 
            ? row.day_data.join('\t') 
            : Array(results.meta.dias_no_mes).fill('').join('\t');
    }).join('\n');
    navigator.clipboard.writeText(rows).then(() => {
      setToast({ message: "Grid (Status) copiado para a área de transferência!", type: 'success' });
    });
  };

  if (step === 'upload') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in zoom-in duration-300">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-200 text-center max-w-lg w-full">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileSpreadsheet size={40} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload de Planilha OEE</h2>
          <p className="text-slate-500 mb-8">Envie o arquivo Excel com os registros de circuitos para iniciar a análise.</p>
          <label className="block w-full cursor-pointer">
            <div className={`border-2 border-dashed border-blue-300 rounded-xl p-8 bg-blue-50 hover:bg-blue-100 transition-colors flex flex-col items-center justify-center group`}>
              {isLoading ? (<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>) : (<UploadCloud size={32} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />)}
              <span className="text-sm font-bold text-blue-700">{isLoading ? "Processando..." : "Clique para selecionar arquivo"}</span>
              <span className="text-xs text-blue-400 mt-1">Formatos .xlsx ou .xls</span>
            </div>
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isLoading} />
          </label>
        </div>
      </div>
    );
  }

  if (step === 'config') {
    return (
      <div className="animate-in slide-in-from-right duration-300 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Settings className="text-slate-400" /> Configuração da Análise</h2>
          <button onClick={() => setStep('upload')} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1"><ArrowLeft size={16} /> Voltar</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Mês</label><select className="w-full p-2 border rounded-md text-sm" value={config.mes} onChange={e => setConfig({ ...config, mes: parseInt(e.target.value) })}>{['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Ano</label><input type="number" className="w-full p-2 border rounded-md text-sm" value={config.ano} onChange={e => setConfig({ ...config, ano: parseInt(e.target.value) })} /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Capacidade Total</label><input type="number" className="w-full p-2 border rounded-md text-sm font-bold text-blue-600" value={config.capacidade_total} onChange={e => setConfig({ ...config, capacidade_total: parseInt(e.target.value) })} /></div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider flex items-center gap-2"><Activity size={16} /> Dados de Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Ensaios Solicitados</span><input type="number" className="w-24 p-1 border rounded text-right" value={config.ensaios_solicitados} onChange={e => setConfig({ ...config, ensaios_solicitados: e.target.value })} /></div>
                <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Ensaios Executados</span><input type="number" className="w-24 p-1 border rounded text-right" value={config.ensaios_executados} onChange={e => setConfig({ ...config, ensaios_executados: e.target.value })} /></div>
              </div>
              <h3 className="font-bold text-slate-700 mt-6 mb-4 uppercase text-xs tracking-wider flex items-center gap-2"><CheckCircle2 size={16} /> Dados de Qualidade</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Relatórios Emitidos</span><input type="number" className="w-24 p-1 border rounded text-right" value={config.relatorios_emitidos} onChange={e => setConfig({ ...config, relatorios_emitidos: e.target.value })} /></div>
                <div className="flex justify-between items-center"><span className="text-sm text-slate-600">No Prazo</span><input type="number" className="w-24 p-1 border rounded text-right" value={config.relatorios_no_prazo} onChange={e => setConfig({ ...config, relatorios_no_prazo: e.target.value })} /></div>
              </div>
            </div>
            <div className="border-l border-slate-100 pl-8">
              <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider flex items-center gap-2"><Filter size={16} /> Ajuste Fino (Force UP/PQ)</h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-64 overflow-y-auto">
                {circuitosList.length === 0 ? <p className="text-xs text-slate-400 italic">Nenhum circuito detectado.</p> : circuitosList.map(circ => (
                  <div key={circ} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                    <span className="text-sm font-mono font-medium text-slate-700">{circ}</span>
                    <div className="flex gap-2">
                      <button onClick={() => toggleSelection('force_up', circ)} className={`px-2 py-0.5 text-[10px] font-bold rounded ${config.force_up.includes(circ) ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>UP</button>
                      <button onClick={() => toggleSelection('force_pq', circ)} className={`px-2 py-0.5 text-[10px] font-bold rounded ${config.force_pq.includes(circ) ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>PQ</button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">* UP: Força o circuito a contar como "Disponível/Ativo".<br />* PQ: Força o circuito a ser ignorado (Quebrado/Parado).</p>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button onClick={() => calculate()} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2">{isLoading ? 'Calculando...' : 'Gerar Dashboard'} <ArrowRight size={18} /></button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'dashboard') {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-8">
          <div><h2 className="text-2xl font-bold text-slate-800">Painel OEE Interativo</h2><p className="text-slate-500 text-sm">Competência: {config.mes}/{config.ano}</p></div>
          <div className="flex gap-2">
            <button onClick={handleSaveHistory} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"><Save size={16} /> Salvar Fechamento</button>
            <button onClick={() => setStep('config')} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Novo</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard title="OEE Mensal" value={results.kpi.oee} icon={Activity} color="blue" />
          <KPICard title="Disponibilidade" value={results.kpi.availability} icon={Clock} color="orange" />
          <KPICard title="Performance" value={results.kpi.performance} icon={Zap} color="purple" />
          <KPICard title="Qualidade" value={results.kpi.quality} icon={CheckCircle2} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Tendência Histórica (Evolução)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={results.trendData}>
                  <defs>
                    <linearGradient id="colorOee" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="oee" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOee)" />
                  <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Exportar / Copiar</h3>
            <div className="space-y-3">
               <button 
                onClick={handleCopyGridOnly}
                className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                title="Copia apenas as colunas de dias (UP, SD, PP...) de todas as linhas"
              >
                <div className="flex items-center gap-1"><Copy size={18} /> <span className="text-xs ml-1 bg-blue-200 px-1 rounded">SÓ O GRID</span></div>
                Copiar Status
              </button>
              <button className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
                <FileSpreadsheet size={18} /> Baixar Excel Completo
              </button>
              <div className="h-px bg-slate-100 my-2"></div>
              <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                <Download size={18} /> Baixar Gráficos (PDF)
              </button>
            </div>
          </div>
        </div>

        <ValidationCard medias={results.medias} />

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2"><Calendar size={16} /> Mapa de Ocupação</h3>
            <div className="text-xs text-slate-500"><strong>Ativos:</strong> {results.meta.circuitos_ativos}</div>
          </div>
          <div className="p-4 bg-slate-50 border-b border-slate-200"><StatusLegend /></div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-3 py-3 border-r border-slate-200 w-32 sticky left-0 bg-slate-100 z-30">Circuito</th>
                  <th className="px-1 py-3 border-r border-slate-200 min-w-[600px]">
                    <div className="flex justify-between px-2">
                      {Array.from({ length: results.meta.dias_no_mes }, (_, i) => (<span key={i} className="w-5 text-center text-[9px] text-slate-400">{i + 1}</span>))}
                    </div>
                  </th>
                  <th className="px-2 py-3 border-r border-slate-200 text-center w-12 text-emerald-700">UP</th>
                  <th className="px-2 py-3 border-r border-slate-200 text-center w-12 text-rose-700">PQ</th>
                  <th className="px-2 py-3 border-r border-slate-200 text-center w-12 text-purple-700">PP</th>
                  <th className="px-2 py-3 border-r border-slate-200 text-center w-12 text-amber-700">SD</th>
                  <th className="px-2 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {results.details.length > 0 ? (
                  results.details.map((row) => (
                    <GridRow
                      key={row.id}
                      row={row}
                      daysInMonth={results.meta.dias_no_mes}
                      onDelete={handleExclude}
                      onRestore={handleRestore}
                      onPreset={handlePreset}
                      setToast={setToast}
                    />
                  ))
                ) : <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400">Nenhum dado.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CircuitCard = ({ circuit, onDelete, onToggleMaintenance, onViewHistory, onMove, onLink }) => {
  const rawStatus = circuit.status ? circuit.status.toString().toLowerCase().trim() : 'free';
  const isFinished = rawStatus === 'finished' || (circuit.progress >= 100);
  const isRunning = rawStatus === 'running' && !isFinished;
  const isMaint = rawStatus === 'maintenance';
  const isFree = rawStatus === 'free' && !isFinished && !isRunning && !isMaint;
  const isParallel = circuit.isParallel; 

  const theme = {
    running: { 
      borderLeft: 'border-l-amber-400', 
      textStatus: 'text-amber-500',
      bar: 'bg-amber-400',
      bg: 'bg-white',
      badge: 'text-amber-600',
      iconColor: 'text-amber-500',
      statusText: 'EM ANDAMENTO'
    },
    finished: { 
      borderLeft: 'border-l-blue-500', 
      textStatus: 'text-blue-500',
      bar: 'bg-blue-500',
      bg: 'bg-white',
      badge: 'text-blue-600',
      iconColor: 'text-blue-500',
      statusText: 'CONCLUÍDO'
    },
    maintenance: { 
      borderLeft: 'border-l-rose-500', 
      textStatus: 'text-rose-500',
      bar: 'bg-rose-500',
      bg: 'bg-white',
      badge: 'text-rose-600',
      iconColor: 'text-rose-500',
      statusText: 'MANUTENÇÃO'
    },
    free: { 
      borderLeft: 'border-l-emerald-400', 
      textStatus: 'text-emerald-500',
      bar: 'bg-emerald-400',
      bg: 'bg-white',
      badge: 'text-emerald-600',
      iconColor: 'text-emerald-500',
      statusText: 'DISPONÍVEL'
    }
  };

  const statusKey = isFinished ? 'finished' : isRunning ? 'running' : isMaint ? 'maintenance' : 'free';
  const style = theme[statusKey];

  return (
    <div className={`
      relative flex flex-col justify-between p-3 rounded-lg bg-white shadow-sm border border-slate-200
      border-l-[6px] transition-all hover:shadow-md h-full min-h-[140px]
      ${style.borderLeft}
    `}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold text-slate-700 leading-none flex items-center gap-1">
            CIRC. {circuit.id}
            {isParallel && <Link2 size={12} className="text-purple-500" title="Em paralelo" />}
        </h3>
        <div className="flex gap-1">
          <button onClick={() => onViewHistory(circuit)} className="text-slate-300 hover:text-blue-500"><Clock size={16} /></button>
          
          <button onClick={() => onLink(circuit)} title="Criar Paralelo" className="text-slate-300 hover:text-purple-500">
             <Link2 size={16} />
          </button>

          {(isRunning || isFinished) && <button onClick={() => onToggleMaintenance(circuit.id, true)} className="text-slate-300 hover:text-emerald-500"><CheckSquare size={16} /></button>}
          
          {(isFree || isMaint) && (
            <>
               <button onClick={() => onMove(circuit.id)} title="Mover para outro banho" className="text-slate-300 hover:text-blue-600">
                  <ArrowRightLeft size={16} />
               </button>
               <button onClick={() => onToggleMaintenance(circuit.id, isMaint)} className={`text-slate-300 ${isMaint ? 'text-rose-500' : 'hover:text-amber-500'}`}><Wrench size={16} /></button>
            </>
          )}
          {isFree && <button onClick={() => onDelete(circuit.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>}
        </div>
      </div>

      {(isRunning || isFinished) ? (
        <div className="flex-1 flex flex-col justify-end">
           <div className="flex items-center gap-1 mb-1">
             <BatteryCharging size={16} className={style.iconColor} />
             <span className="font-bold text-sm text-slate-800 truncate" title={circuit.batteryId}>
               {circuit.batteryId && circuit.batteryId !== "Desconhecido" ? circuit.batteryId : "---"}
             </span>
           </div>
           
           <div className="mb-2 pl-5">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block truncate">
                {circuit.protocol || "N/A"}
             </span>
           </div>

           <div className="mb-2">
             <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-bold text-slate-600">{isFinished ? '100%' : `${circuit.progress}%`}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider ${style.textStatus}`}>{style.statusText}</span>
             </div>
             <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
               <div className={`h-full rounded-full transition-all duration-500 ${style.bar}`} style={{ width: isFinished ? '100%' : `${circuit.progress}%` }}></div>
             </div>
           </div>

           <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400 border-t border-slate-100 pt-2 mt-auto">
             <span>I: {formatDataCurta(circuit.startTime)}</span>
             <span>P: {formatDataCurta(circuit.previsao)}</span>
           </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center opacity-70">
           {isMaint ? (
             <>
               <span className="text-sm font-black text-rose-400 uppercase tracking-widest mb-1">MANUTENÇÃO</span>
               <AlertTriangle size={24} className="text-rose-300" />
             </>
           ) : (
             <>
               <span className="text-sm font-black text-emerald-500 uppercase tracking-widest mb-1">DISPONÍVEL</span>
               <CheckCircle2 size={24} className="text-emerald-300" />
             </>
           )}
        </div>
      )}
    </div>
  );
};

const BathCardMicro = ({ bath, onClick, onDelete }) => {
  const running = bath.circuits ? bath.circuits.filter(c => {
    const s = c.status ? c.status.toLowerCase().trim() : '';
    return s === 'running' || s === 'finished'; 
  }).length : 0;
  
  const free = bath.circuits ? bath.circuits.filter(c => (!c.status || c.status === 'free')).length : 0;
  const maint = bath.circuits ? bath.circuits.filter(c => c.status === 'maintenance').length : 0;

  let statusColor = 'bg-slate-100 text-slate-600';
  if (maint > 0 && maint >= running && maint >= free) statusColor = 'bg-rose-100 text-rose-700';
  else if (running > free) statusColor = 'bg-amber-100 text-amber-700';
  else statusColor = 'bg-emerald-100 text-emerald-700';

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group p-3 flex flex-col h-24 justify-between relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 pointer-events-none ${statusColor.replace('text', 'bg').replace('100', '500')}`}></div>

      <div className="flex justify-between items-start z-10">
        <div className="flex flex-col">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Banho</span>
           <span className="text-xl font-black text-slate-800 leading-none">{bath.id.replace('BANHO - ', '')}</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(bath.id); }} 
          className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-end justify-between z-10 mt-2">
         <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
            <Thermometer size={12} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-600">{bath.temp}ºC</span>
         </div>

         <div className="flex gap-3">
            <div className="flex flex-col items-center">
               <span className="text-[9px] font-bold text-amber-600 uppercase">Uso</span>
               <span className="text-sm font-black text-slate-700">{running}</span>
            </div>
            <div className="flex flex-col items-center">
               <span className="text-[9px] font-bold text-emerald-600 uppercase">Livre</span>
               <span className="text-sm font-black text-slate-700">{free}</span>
            </div>
         </div>
      </div>
    </div>
  );
};

const AllCircuitsView = ({ baths, onToggleMaintenance, onDeleteCircuit, onViewHistory }) => {
  const allCircuits = baths.flatMap(b => 
    b.circuits ? b.circuits.map(c => ({ ...c, parentBathId: b.id })) : []
  );

  allCircuits.sort((a, b) => {
     const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
     const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
     return numA - numB;
  });

  const [filter, setFilter] = useState('ALL'); 
  const filtered = allCircuits.filter(c => {
      const s = c.status ? c.status.toLowerCase().trim() : 'free';
      const isFinished = s === 'finished' || (c.progress >= 100);
      if (filter === 'RUNNING') return (s === 'running' || isFinished);
      if (filter === 'FREE') return (s === 'free' && !isFinished);
      if (filter === 'MAINT') return s === 'maintenance';
      return true;
  });

  return (
    <div className="animate-in fade-in zoom-in duration-300 p-2">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Visão Geral de Circuitos</h2>
           <p className="text-sm text-slate-500 mt-1">Monitoramento em tempo real de {allCircuits.length} circuitos.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
           {['ALL', 'RUNNING', 'FREE', 'MAINT'].map(f => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${filter === f ? 'bg-white text-blue-600 shadow ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50 shadow-none'}`}
             >
               {f === 'ALL' ? 'Todos' : f === 'RUNNING' ? 'Em Uso' : f === 'FREE' ? 'Livres' : 'Manutenção'}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
         {filtered.map(c => (
           <div key={`${c.parentBathId}-${c.id}`} className="relative group">
             <div className="absolute -top-2.5 left-4 z-20 bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
                 {c.parentBathId}
             </div>
             <CircuitCard 
               circuit={c} 
               onDelete={(cid) => onDeleteCircuit(c.parentBathId, cid)} 
               onToggleMaintenance={(cid, isMaint) => onToggleMaintenance(c.parentBathId, cid, isMaint)} 
               onViewHistory={onViewHistory}
               onMove={() => {}} 
             />
           </div>
         ))}
         {filtered.length === 0 && (
           <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
             <Search size={48} className="mb-4 opacity-20" />
             <p className="font-medium">Nenhum circuito encontrado neste filtro.</p>
           </div>
         )}
      </div>
    </div>
  );
};

const BathContainer = ({ bath, onAddCircuit, onUpdateTemp, onDeleteCircuit, onToggleMaintenance, onDeleteBath, onViewHistory, onMoveCircuit, onLinkCircuit }) => {
  const [isEditingTemp, setIsEditingTemp] = useState(false);
  const [tempValue, setTempValue] = useState(bath.temp);

  useEffect(() => { setTempValue(bath.temp); }, [bath.temp]);

  const runningCount = bath.circuits ? bath.circuits.filter(c => {
    const s = c.status ? c.status.toLowerCase().trim() : '';
    return s === 'running' || s === 'finished'; 
  }).length : 0;
  
  const freeCount = bath.circuits ? bath.circuits.filter(c => (!c.status || c.status.toLowerCase().trim() === 'free')).length : 0;
  const maintCount = bath.circuits ? bath.circuits.filter(c => c.status === 'maintenance').length : 0;

  const handleSaveTemp = () => { onUpdateTemp(bath.id, tempValue); setIsEditingTemp(false); };

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-6 transition-all hover:border-blue-300 hover:shadow-sm">
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-700 p-2 rounded-md"><Thermometer size={20} /></div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-lg">{bath.id}</h3>
              <button onClick={() => onDeleteBath(bath.id)} className="text-slate-300 hover:text-rose-500 transition-opacity p-1"><Trash2 size={14} /></button>
            </div>
            <div className="flex items-center gap-2 mt-1 h-6">
              {isEditingTemp ? (
                <div className="flex items-center gap-1 animate-in fade-in duration-200">
                  <input type="number" value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="w-12 px-1 py-0.5 text-xs border border-blue-400 rounded focus:outline-none" autoFocus />
                  <span className="text-xs font-medium text-slate-500">ºC</span>
                  <button onClick={handleSaveTemp} className="text-emerald-600 hover:bg-emerald-50 p-0.5 rounded"><Save size={14}/></button>
                  <button onClick={() => setIsEditingTemp(false)} className="text-rose-500 hover:bg-rose-50 p-0.5 rounded"><XCircle size={14}/></button>
                </div>
              ) : (
                <div className="group flex items-center gap-2 cursor-pointer" onClick={() => setIsEditingTemp(true)}>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-transparent group-hover:border-blue-200 group-hover:text-blue-600 transition-all">SET: {bath.temp}ºC</span>
                  <Edit2 size={10} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-[10px] font-bold">
            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100"><Activity size={10} /> {runningCount}</span>
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100"><CheckCircle size={10} /> {freeCount}</span>
            {maintCount > 0 && <span className="flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-1 rounded border border-rose-100"><Wrench size={10} /> {maintCount}</span>}
          </div>
          <button onClick={() => onAddCircuit(bath.id)} className="flex items-center gap-1 text-xs font-bold text-blue-600 border border-blue-200 bg-white px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors shadow-sm"><Plus size={14} /> Add</button>
        </div>
      </div>
       
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {bath.circuits && bath.circuits.map(circuit => (
          <CircuitCard 
            key={circuit.id} 
            circuit={circuit} 
            onDelete={(cid) => onDeleteCircuit(bath.id, cid)} 
            onToggleMaintenance={(cid, isMaint) => onToggleMaintenance(bath.id, cid, isMaint)} 
            onViewHistory={onViewHistory} 
            onMove={(cid) => onMoveCircuit(bath.id, cid)}
            onLink={(c) => onLinkCircuit(bath, c.id)}
          />
        ))}
        {(!bath.circuits || bath.circuits.length === 0) && (<div className="col-span-full py-6 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg text-xs italic">Nenhum circuito neste banho.</div>)}
      </div>
    </div>
  );
};

const HistoryView = ({ logs }) => {
  const [viewMode, setViewMode] = useState('logs'); 
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    if (viewMode === 'chart') {
      fetch(`${API_URL}/oee/history`).then(r => r.json()).then(setHistoryData).catch(console.error);
    }
  }, [viewMode]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div className="flex gap-4">
          <button onClick={() => setViewMode('logs')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'logs' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
            <List size={16} /> Logs Operacionais
          </button>
          <button onClick={() => setViewMode('chart')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'chart' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
            <BarChart2 size={16} /> Evolução OEE
          </button>
        </div>
        <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
          Exportar Excel <UploadCloud size={14} />
        </button>
      </div>

      {viewMode === 'logs' ? (
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs tracking-wider border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-6 py-3 border-r border-slate-200">Data/Hora</th>
                <th className="px-6 py-3 border-r border-slate-200">Banho</th>
                <th className="px-6 py-3 border-r border-slate-200">Ação</th>
                <th className="px-6 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs && logs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-3 font-mono text-slate-500 border-r border-slate-100">{log.date}</td>
                  <td className="px-6 py-3 font-bold text-slate-700 border-r border-slate-100">{log.bath}</td>
                  <td className="px-6 py-3 border-r border-slate-100">
                    <span className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
                        ${log.action.includes('Remoção') || log.action.includes('Manutenção') ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'}
                      `}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 h-96 w-full">
          <h3 className="font-bold text-slate-700 mb-6 uppercase text-xs tracking-wider">Histórico de Indicadores Mensais</h3>
          {historyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="OEE" fill="#2563eb" name="OEE %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Disponibilidade" fill="#f97316" name="Disp. %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Performance" fill="#8b5cf6" name="Perf. %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Qualidade" fill="#10b981" name="Qual. %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
              <BarChart2 size={48} className="mb-2 opacity-20" />
              <p>Nenhum histórico salvo ainda.</p>
              <p className="text-xs mt-1">Gere um relatório OEE e clique em "Salvar Fechamento".</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TestManagerModal = ({ isOpen, onClose, protocols, onAddProtocol, onDeleteProtocol }) => {
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState('');

  const handleAdd = () => {
    if (!newName || !newDuration) return;
    onAddProtocol(newName.toUpperCase(), newDuration);
    setNewName(''); setNewDuration('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in">
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="font-bold uppercase text-xs tracking-widest flex items-center gap-2"><Settings size={16} /> Configurar Testes</h2>
          <button onClick={onClose}><XCircle size={20} /></button>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <input type="text" placeholder="Nome (ex: SAEJ2801)" className="flex-1 p-2 text-xs font-bold border rounded uppercase" value={newName} onChange={e => setNewName(e.target.value)} />
            <input type="number" placeholder="Horas" className="w-20 p-2 text-xs font-bold border rounded" value={newDuration} onChange={e => setNewDuration(e.target.value)} />
            <button onClick={handleAdd} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={16} /></button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {protocols && protocols.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                <div>
                  <span className="font-bold text-slate-700 text-sm block">{p.name}</span>
                  <span className="text-xs text-slate-400 font-bold">{p.duration} Horas ({Math.round(p.duration / 24)} dias)</span>
                </div>
                <button onClick={() => onDeleteProtocol(p.id)} className="text-rose-400 hover:text-rose-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CircuitHistoryModal = ({ isOpen, onClose, circuit, logs }) => {
  if (!isOpen || !circuit) return null;
  const circuitLogs = logs.filter(l => (l.details && l.details.includes(`C-${circuit.id}`)) || (circuit.batteryId && l.details && l.details.includes(circuit.batteryId)));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-4">
        <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-xl text-slate-800">Histórico {circuit.id}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Rastreabilidade Individual</p>
          </div>
          <button onClick={onClose} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><XCircle size={20} /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest sticky top-0">
              <tr><th className="px-6 py-3">Data</th><th className="px-6 py-3">Evento</th><th className="px-6 py-3">Detalhes</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {circuitLogs.map(log => (
                <tr key={log.id} className="hover:bg-blue-50/30">
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-500">{log.date}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{log.action}</td>
                  <td className="px-6 py-4 text-slate-600 text-xs italic">{log.details}</td>
                </tr>
              ))}
              {circuitLogs.length === 0 && <tr><td colSpan="3" className="text-center py-8 text-slate-400 text-xs">Sem registros específicos.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!text) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.sucesso) {
        onImportSuccess(data.db_atualizado);
        setText('');
        onClose();
        alert(`${data.atualizados.length} circuitos atualizados!`);
      }
    } catch (e) { alert("Erro de conexão."); }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-emerald-800 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2"><Clipboard size={20} /> Sincronizar Digatron</h2>
          <button onClick={onClose} className="hover:bg-emerald-700 p-1 rounded transition"><XCircle size={20} /></button>
        </div>
        <div className="p-6">
          <textarea
            className="w-full h-48 p-3 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none font-mono text-[10px] bg-slate-50"
            placeholder="Cole as linhas do Digatron aqui..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 px-4 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50">Cancelar</button>
            <button onClick={handleImport} disabled={loading} className="flex-1 py-3 px-4 bg-emerald-600 rounded-lg text-white font-bold hover:bg-emerald-700">
              {loading ? "Processando..." : "Sincronizar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddCircuitModal = ({ isOpen, onClose, onConfirm, bathId }) => {
  const [startNum, setStartNum] = useState('');
  const [endNum, setEndNum] = useState('');
  const [isRange, setIsRange] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onConfirm(bathId, startNum, isRange ? endNum : null);
    setStartNum('');
    setEndNum('');
    setIsRange(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in">
        <div className="bg-blue-900 text-white px-4 py-3 flex justify-between items-center"><h2 className="font-bold">Adicionar Circuito(s)</h2></div>
        <div className="p-4 text-center">
           
          <div className="flex justify-center mb-4">
            <button 
              onClick={() => setIsRange(!isRange)} 
              className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${isRange ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
            >
              {isRange ? 'Modo Faixa (Range) Ativo' : 'Ativar Modo Faixa'}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex flex-col items-center">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isRange ? 'De' : 'Circuito'}</span>
               <div className="flex items-center">
                  <span className="font-bold text-xl text-slate-300 mr-1"></span>
                  <input type="number" className="w-20 border-b-2 p-1 text-2xl font-black text-slate-800 focus:border-blue-500 outline-none text-center" value={startNum} onChange={(e) => setStartNum(e.target.value)} autoFocus placeholder="000" />
               </div>
            </div>

            {isRange && (
              <>
                <span className="text-slate-300 mt-4"><ArrowRight size={20} /></span>
                <div className="flex flex-col items-center">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Até</span>
                   <div className="flex items-center">
                      <span className="font-bold text-xl text-slate-300 mr-1"></span>
                      <input type="number" className="w-20 border-b-2 p-1 text-2xl font-black text-slate-800 focus:border-blue-500 outline-none text-center" value={endNum} onChange={(e) => setEndNum(e.target.value)} placeholder="000" />
                   </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-slate-500 font-bold text-sm">Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md text-sm">Adicionar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddBathModal = ({ isOpen, onClose, onConfirm }) => {
  const [name, setName] = useState('');
  const [temp, setTemp] = useState('25');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in">
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center"><h2 className="font-bold uppercase text-xs tracking-widest">Nova Unidade / Banho</h2></div>
        <div className="p-6">
          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Identificação (Sufixo)</label>
          <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-200 pb-1">
            <span className="font-black text-slate-400">BANHO - </span>
            <input type="text" className="flex-1 font-black uppercase outline-none text-slate-800" placeholder="XX" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} autoFocus />
          </div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Setpoint Inicial (ºC)</label>
          <input type="number" className="w-full border-2 p-2 rounded-lg mb-6 font-bold" value={temp} onChange={(e) => setTemp(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-xs font-bold uppercase text-slate-500">Cancelar</button>
            <button onClick={() => { onConfirm(name, temp); setName(''); }} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase shadow-lg">Criar Unidade</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MoveCircuitModal = ({ isOpen, onClose, onConfirm, baths, sourceBathId, circuitId }) => {
  const [targetBath, setTargetBath] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 

  useEffect(() => { if (!isOpen) setIsDropdownOpen(false); }, [isOpen]);

  if (!isOpen) return null;

  const availableBaths = baths.filter(b => b.id !== sourceBathId);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-[101]" 
          onClick={() => setIsDropdownOpen(false)} 
        />
      )}

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-slate-100 relative z-[102]">
        
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <ArrowRightLeft size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Mover Circuito</h2>
              <p className="text-blue-100 text-xs font-medium">Transferência de recursos</p>
            </div>
          </div>
          <ArrowRightLeft size={80} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <div className="flex flex-col items-center w-1/3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Origem</span>
              <div className="bg-white px-3 py-2 rounded border border-slate-200 font-bold text-slate-700 text-sm w-full text-center shadow-sm">
                {sourceBathId ? sourceBathId.replace('BANHO - ', '') : '---'}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center text-blue-500">
              <div className="bg-blue-100 p-1.5 rounded-full mb-1"><ArrowRight size={16} /></div>
            </div>
            <div className="flex flex-col items-center w-1/3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Circuito</span>
              <div className="bg-blue-600 px-3 py-2 rounded border border-blue-700 font-bold text-white text-sm w-full text-center shadow-md">
                {circuitId}
              </div>
            </div>
          </div>
          
          <label className="block text-sm font-bold text-slate-700 mb-2">Selecione o Destino:</label>
          
          <div className="relative mb-8">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full p-3 pl-4 pr-10 bg-white border-2 rounded-xl text-sm font-bold text-left flex items-center justify-between transition-all ${isDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span className={targetBath ? 'text-slate-800' : 'text-slate-400'}>
                {targetBath || "Selecione um banho..."}
              </span>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto z-[110] animate-in slide-in-from-top-2 fade-in duration-200 custom-scrollbar">
                {availableBaths.length > 0 ? (
                  availableBaths.map(b => (
                    <div 
                      key={b.id}
                      onClick={() => { setTargetBath(b.id); setIsDropdownOpen(false); }}
                      className={`p-3 px-4 cursor-pointer flex items-center justify-between group transition-colors ${targetBath === b.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                      <span className="font-bold text-sm">{b.id}</span>
                      {targetBath === b.id && <Check size={16} className="text-blue-600" />}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs italic">Nenhum outro banho disponível.</div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="flex-1 py-3 border-2 border-slate-100 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => { if(targetBath) onConfirm(sourceBathId, targetBath, circuitId); }} 
              disabled={!targetBath}
              className={`flex-1 py-3 rounded-xl font-bold text-sm shadow-lg text-white flex items-center justify-center gap-2 transition-all active:scale-95 ${!targetBath ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30'}`}
            >
              Confirmar <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LinkCircuitModal = ({ isOpen, onClose, onConfirm, bath, sourceCircuitId }) => {
  const [targetCircuit, setTargetCircuit] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => { if (!isOpen) { setIsDropdownOpen(false); setTargetCircuit(''); } }, [isOpen]);

  if (!isOpen || !bath) return null;

  const availableCircuits = bath.circuits.filter(c => c.id !== sourceCircuitId);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {isDropdownOpen && <div className="fixed inset-0 z-[101]" onClick={() => setIsDropdownOpen(false)} />}
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 relative z-[102]">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-5 flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Link2 size={20} className="text-white" /></div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Criar Paralelo</h2>
              <p className="text-purple-100 text-xs font-medium">Vincular circuitos na mesma bateria</p>
            </div>
          </div>
          <Link2 size={80} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 mb-6 bg-purple-50 p-3 rounded-lg border border-purple-100">
            Você está vinculando o circuito <strong>{sourceCircuitId}</strong> (Mestre).<br/>
            Selecione o circuito vizinho para replicar os dados:
          </p>

          <div className="relative mb-8">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full p-3 pl-4 pr-10 bg-white border-2 rounded-xl text-sm font-bold text-left flex items-center justify-between transition-all ${isDropdownOpen ? 'border-purple-500 ring-4 ring-purple-500/10' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span className={targetCircuit ? 'text-slate-800' : 'text-slate-400'}>{targetCircuit || "Selecione o circuito Escravo..."}</span>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180 text-purple-500' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto z-[110] animate-in slide-in-from-top-2 fade-in duration-200 custom-scrollbar">
                {availableCircuits.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => { setTargetCircuit(c.id); setIsDropdownOpen(false); }}
                    className={`p-3 px-4 cursor-pointer flex items-center justify-between group transition-colors ${targetCircuit === c.id ? 'bg-purple-50 text-purple-700' : 'hover:bg-slate-50 text-slate-600'}`}
                  >
                    <span className="font-bold text-sm">{c.id} - <span className="text-[10px] font-normal uppercase opacity-70">{c.status || 'Livre'}</span></span>
                    {targetCircuit === c.id && <Check size={16} className="text-purple-600" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border-2 border-slate-100 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50">Cancelar</button>
            <button 
              onClick={() => { if(targetCircuit) onConfirm(bath.id, sourceCircuitId, targetCircuit); }} 
              disabled={!targetCircuit}
              className={`flex-1 py-3 rounded-xl font-bold text-sm shadow-lg text-white flex items-center justify-center gap-2 transition-all active:scale-95 ${!targetCircuit ? 'bg-slate-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 hover:shadow-purple-500/30'}`}
            >
              Vincular <Link2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LabManagerApp() {
  const [baths, setBaths] = useState([]);
  const [logs, setLogs] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [toast, setToast] = useState(null);
   
  const [dashViewMode, setDashViewMode] = useState('baths'); 
  const [expandedBathId, setExpandedBathId] = useState(null); 

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddBathOpen, setIsAddBathOpen] = useState(false);
  const [isProtocolsOpen, setIsProtocolsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [moveData, setMoveData] = useState({ sourceBathId: null, circuitId: null });

  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkData, setLinkData] = useState({ bath: null, sourceId: null });

  const [targetBath, setTargetBath] = useState(null);
  const [targetCircuit, setTargetCircuit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 10000); return () => clearInterval(interval); }, []);

  const fetchData = async () => { try { const response = await fetch(`${API_URL}/data`); const data = await response.json(); setBaths(data.baths || []); setLogs(data.logs || []); setProtocols(data.protocols || []); } catch (e) { console.error("Falha ao carregar."); } };

  const addCircuit = async (bathId, start, end) => {
    const startNum = parseInt(start);
    if (isNaN(startNum)) return;
    const endNum = end ? parseInt(end) : startNum;
    if (endNum - startNum > 50) {
       if (!confirm(`Você está prestes a adicionar ${endNum - startNum + 1} circuitos. Confirmar?`)) return;
    }
    try {
      for (let i = startNum; i <= endNum; i++) {
        await fetch(`${API_URL}/circuits/add`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ bathId, circuitId: i }) 
        });
      }
      fetchData();
      setIsAddOpen(false);
      setToast({ message: `Circuitos adicionados com sucesso!`, type: 'success' });
    } catch (e) { 
      setToast({ message: "Erro ao adicionar circuitos.", type: 'error' }); 
    } 
  };

  const deleteCircuit = async (bathId, circuitId) => { if (!window.confirm(`Excluir circuito ${circuitId}?`)) return; try { const res = await fetch(`${API_URL}/circuits/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bathId, circuitId }) }); const d = await res.json(); setBaths(d.baths); setLogs(d.logs); } catch (e) { setToast({ message: "Erro ao deletar.", type: 'error' }); } };
  const updateTemp = async (bathId, temp) => { try { const res = await fetch(`${API_URL}/baths/temp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bathId, temp: Number(temp) }) }); const d = await res.json(); setBaths(d.baths); setLogs(d.logs); } catch (e) { setToast({ message: "Erro ao salvar temperatura.", type: 'error' }); } };
  const toggleMaintenance = async (bathId, circuitId, isMaint) => { const newStatus = isMaint ? 'free' : 'maintenance'; try { const res = await fetch(`${API_URL}/circuits/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bathId, circuitId, status: newStatus }) }); const d = await res.json(); setBaths(d.baths); setLogs(d.logs); } catch (e) { setToast({ message: "Erro ao atualizar status.", type: 'error' }); } };
  const addBath = async (id, temp) => { if (!id) return; try { const fullId = `BANHO - ${id.toUpperCase()}`; const res = await fetch(`${API_URL}/baths/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bathId: fullId, temp: Number(temp) }) }); const d = await res.json(); if (d.error) setToast({ message: d.error, type: 'error' }); else { setBaths(d.baths); setLogs(d.logs); setIsAddBathOpen(false); } } catch (e) { setToast({ message: "Erro ao criar banho.", type: 'error' }); } };
  const deleteBath = async (bathId) => { if (!window.confirm(`Excluir permanentemente o ${bathId}?`)) return; try { const res = await fetch(`${API_URL}/baths/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bathId }) }); const d = await res.json(); setBaths(d.baths); setLogs(d.logs); } catch (e) { setToast({ message: "Erro ao excluir banho.", type: 'error' }); } };
  const handleAddProtocol = async (name, duration) => { try { const res = await fetch(`${API_URL}/protocols/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, duration }) }); const d = await res.json(); setProtocols(d.protocols); } catch (e) { setToast({ message: "Erro protocolos", type: 'error' }); } };
  const handleDeleteProtocol = async (id) => { if (!confirm("Apagar?")) return; try { const res = await fetch(`${API_URL}/protocols/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); const d = await res.json(); setProtocols(d.protocols); } catch (e) { setToast({ message: "Erro ao apagar", type: 'error' }); } };

  const handleMoveCircuit = async (sourceBathId, targetBathId, circuitId) => {
    if (!circuitId) {
        setToast({ message: "Erro: ID do circuito inválido.", type: 'error' });
        return;
    }

    try {
      const res = await fetch(`${API_URL}/circuits/move`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
            sourceBathId: sourceBathId, 
            targetBathId: targetBathId, 
            circuitId: circuitId 
        }) 
      });

      const data = await res.json();
      
      if (res.ok) {
          setBaths(data.baths); 
          setLogs(data.logs);
          setIsMoveOpen(false);
          setToast({ message: `Circuito movido com sucesso!`, type: 'success' });
      } else {
          setToast({ message: `Erro: ${data.error}`, type: 'error' });
      }

    } catch (e) {
      setToast({ message: "Erro de conexão ao mover.", type: 'error' });
    }
  };

  const handleLinkCircuit = async (bathId, sourceId, targetId) => {
    try {
        const res = await fetch(`${API_URL}/circuits/link`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ bathId, sourceId, targetId }) 
        });
        const data = await res.json();
        if (res.ok) {
            setBaths(data.baths);
            setLogs(data.logs);
            setIsLinkOpen(false);
            setToast({ message: "Circuitos vinculados em paralelo!", type: 'success' });
        } else {
            setToast({ message: `Erro: ${data.error}`, type: 'error' });
        }
    } catch(e) { setToast({ message: "Erro de conexão", type: 'error' }); }
  };

  const openMoveModal = (bathId, circuitId) => {
    setMoveData({ sourceBathId: bathId, circuitId });
    setIsMoveOpen(true);
  };

  const openLinkModal = (bath, circuitId) => {
    setLinkData({ bath, sourceId: circuitId });
    setIsLinkOpen(true);
  };

  const totalRunning = baths.reduce((acc, bath) => acc + (bath.circuits ? bath.circuits.filter(c => { const s = c.status ? c.status.toLowerCase().trim() : ''; return s === 'running' || s === 'finished'; }).length : 0), 0);
  const totalFree = baths.reduce((acc, bath) => acc + (bath.circuits ? bath.circuits.filter(c => (!c.status || c.status.toLowerCase().trim() === 'free')).length : 0), 0);
  const totalMaint = baths.reduce((acc, bath) => acc + (bath.circuits ? bath.circuits.filter(c => c.status && c.status.toLowerCase().trim() === 'maintenance').length : 0), 0);

  const filteredBaths = baths.filter(b => 
    b.id.includes(searchTerm) || 
    b.circuits.some(c => c.id.includes(searchTerm) || (c.batteryId && c.batteryId.includes(searchTerm)))
  );

  const half = Math.ceil(filteredBaths.length / 2);
  const leftBaths = filteredBaths.slice(0, half);
  const rightBaths = filteredBaths.slice(half);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-10">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3"><div className="bg-blue-900 text-white p-1.5 rounded-md"><Zap size={24} fill="currentColor" /></div><div><h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">LabFísico</h1><span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Controle de Recursos</span></div></div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-slate-100 p-1 rounded-lg mr-4"><button onClick={() => setCurrentView('dashboard')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${currentView === 'dashboard' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Banhos</button><button onClick={() => setCurrentView('oee')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'oee' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Factory size={14} />OEE</button><button onClick={() => setCurrentView('history')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${currentView === 'history' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Histórico</button></div>
            <div className="h-6 w-[1px] bg-slate-200"></div><button onClick={() => setIsProtocolsOpen(true)} className="text-slate-400 hover:text-slate-600 transition-colors" title="Configurar Testes"><Settings size={20} /></button><button onClick={() => setIsImportOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"><Clipboard size={18} /><span className="hidden sm:inline">Importar Digatron</span></button>
          </div>
        </div>
      </header>
       
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] overflow-hidden">
        
        {currentView === 'oee' && <div className="h-full overflow-y-auto pr-2"><OEEDashboardView setToast={setToast} /></div>}
        {currentView === 'history' && <div className="h-full overflow-y-auto pr-2"><HistoryView logs={logs} /></div>}
        
        {currentView === 'dashboard' && (
          <div className="h-full flex flex-col">
            <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
              <div className="flex gap-4 items-center w-full sm:w-auto">
                <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
                
                <div className="flex bg-slate-200 p-1 rounded-lg">
                    <button 
                      onClick={() => { setDashViewMode('baths'); setExpandedBathId(null); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${dashViewMode === 'baths' && !expandedBathId ? 'bg-white text-blue-700 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Grid size={14} /> Banhos
                    </button>
                    <button 
                      onClick={() => { setDashViewMode('all_circuits'); setExpandedBathId(null); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${dashViewMode === 'all_circuits' ? 'bg-white text-blue-700 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Maximize2 size={14} /> Circuitos
                    </button>
                </div>

                <div className="hidden md:flex gap-3 ml-4 pl-4 border-l border-slate-300">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100">{totalRunning} Em Uso</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">{totalFree} Livres</span>
                </div>
              </div>

              <div className="relative w-full sm:w-96 group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                 <input type="text" placeholder="Buscar circuito ou bateria..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toUpperCase())} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-4">
              
              {dashViewMode === 'all_circuits' && (
                 <AllCircuitsView 
                   baths={filteredBaths} 
                   onDeleteCircuit={deleteCircuit} 
                   onToggleMaintenance={toggleMaintenance} 
                   onViewHistory={(c) => { setTargetCircuit(c); setIsHistoryOpen(true); }}
                 />
              )}

              {dashViewMode === 'baths' && !expandedBathId && (
                <div className="flex gap-8 h-full">
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3 content-start">
                        {leftBaths.map(bath => (
                            <BathCardMicro 
                                key={bath.id} 
                                bath={bath} 
                                onClick={() => setExpandedBathId(bath.id)} 
                                onDelete={deleteBath}
                            />
                        ))}
                    </div>

                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3 content-start">
                        {rightBaths.map(bath => (
                            <BathCardMicro 
                                key={bath.id} 
                                bath={bath} 
                                onClick={() => setExpandedBathId(bath.id)} 
                                onDelete={deleteBath}
                            />
                        ))}
                         <button onClick={() => setIsAddBathOpen(true)} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-slate-50 transition-all gap-1 group h-[88px]">
                            <div className="bg-slate-100 p-2 rounded-full group-hover:bg-blue-100 transition-colors"><Plus size={20} /></div>
                            <span className="font-bold text-xs">Novo Banho</span>
                        </button>
                    </div>
                </div>
              )}

              {expandedBathId && (
                 <div className="animate-in zoom-in duration-200">
                    <button 
                      onClick={() => setExpandedBathId(null)} 
                      className="mb-4 text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      <ArrowLeft size={16} /> Voltar para lista
                    </button>
                    
                    {baths.filter(b => b.id === expandedBathId).map(bath => (
                      <BathContainer 
                          key={bath.id} 
                          bath={bath} 
                          onAddCircuit={(bid) => { setTargetBath(bid); setIsAddOpen(true); }} 
                          onUpdateTemp={updateTemp} 
                          onDeleteCircuit={deleteCircuit} 
                          onToggleMaintenance={toggleMaintenance} 
                          onDeleteBath={deleteBath} 
                          onViewHistory={(c) => { setTargetCircuit(c); setIsHistoryOpen(true); }} 
                          onMoveCircuit={openMoveModal}
                          onLinkCircuit={openLinkModal}
                      />
                    ))}
                 </div>
              )}
            </div>
          </div>
        )}
      </main>

        <footer className="w-full text-center py-6 border-t border-slate-200 mt-8">
        <p className="text-xs text-slate-400 font-medium">Desenvolvido por <span className="font-bold text-slate-600">João Victor</span> © 2026<br />LabFísico Sistema v2.0</p>
      </footer>
       
      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImportSuccess={(db) => { setBaths(db.baths); setLogs(db.logs); }} />
      <AddCircuitModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onConfirm={addCircuit} bathId={targetBath} />
      <AddBathModal isOpen={isAddBathOpen} onClose={() => setIsAddBathOpen(false)} onConfirm={addBath} />
      <TestManagerModal isOpen={isProtocolsOpen} onClose={() => setIsProtocolsOpen(false)} protocols={protocols} onAddProtocol={handleAddProtocol} onDeleteProtocol={handleDeleteProtocol} />
      <CircuitHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} circuit={targetCircuit} logs={logs} />
      <MoveCircuitModal 
         isOpen={isMoveOpen} 
         onClose={() => setIsMoveOpen(false)} 
         onConfirm={handleMoveCircuit} 
         baths={baths} 
         sourceBathId={moveData.sourceBathId} 
         circuitId={moveData.circuitId} 
      />
      <LinkCircuitModal 
        isOpen={isLinkOpen}
        onClose={() => setIsLinkOpen(false)}
        onConfirm={handleLinkCircuit}
        bath={linkData.bath}
        sourceCircuitId={linkData.sourceId}
      />
    </div>
  );
}