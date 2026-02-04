import React, { useState, useCallback } from 'react';
import {
  FileSpreadsheet, UploadCloud, Settings, ArrowLeft, Activity, 
  Filter, ArrowRight, Save, Clock, Zap, CheckCircle2
} from 'lucide-react';

// Imports dos nossos componentes
import KPICard from '../../components/ui/KPICard';
import StatusLegend from '../../components/ui/StatusLegend';
import ValidationCard from './components/ValidationCard';
import GridRow from './components/GridRow';

// Import do Serviço (A Camada de Dados)
import { oeeService } from '../../services/oeeService';

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

  // --- Refatorado para usar o oeeService ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsLoading(true);
    
    // Chamada limpa ao serviço
    const { success, data } = await oeeService.uploadFile(file);
    
    if (success && data.sucesso) {
      setUploadedFile(data.filename);
      setCircuitosList(data.circuitos || []);
      setToast({ message: 'Arquivo carregado!', type: 'success' });
      setStep('config');
    } else {
      setToast({ message: data?.erro || "Erro ao enviar arquivo.", type: 'error' });
    }
    
    setIsLoading(false);
  };

  // --- Refatorado para usar o oeeService ---
  const calculate = useCallback(async (currentConfig = config) => {
    setIsLoading(true);
    
    const payload = { filename: uploadedFile, ...currentConfig };
    const { success, data } = await oeeService.calculate(payload);

    if (success && data.sucesso) {
      setResults({
        kpi: data.kpi, 
        trendData: data.trendData, 
        details: data.details || [], 
        meta: data.meta || { dias_no_mes: 30 }, 
        medias: data.medias || null
      });
      if (step === 'config') setStep('dashboard');
    } else {
      setToast({ message: "Erro: " + (data?.erro || "Falha no cálculo"), type: 'error' });
    }
    
    setIsLoading(false);
  }, [uploadedFile, config, step, setToast]);

  // --- Funções de Manipulação Local (Não chamam API diretamente) ---
  const handleExclude = (id) => { 
      const newConfig = { ...config, ignored_list: [...config.ignored_list, id] }; 
      setConfig(newConfig); 
      calculate(newConfig); 
  };

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
    ['force_up', 'force_pq', 'force_pp', 'force_std'].forEach(list => 
        newConfig[list] = newConfig[list].filter(x => x !== id)
    );
    newConfig[type] = [...newConfig[type], id];
    const cidFormatted = `C-${id.toString().padStart(3, '0')}`;
    if (newConfig.overrides[cidFormatted]) delete newConfig.overrides[cidFormatted];
    setConfig(newConfig); 
    calculate(newConfig);
  };

  const toggleSelection = (listName, id) => {
    setConfig(prev => {
      const list = prev[listName];
      const newList = list.includes(id) ? list.filter(item => item !== id) : [...list, id];
      return { ...prev, [listName]: newList };
    });
  };

  // --- Refatorado para usar o oeeService ---
  const handleSaveHistory = async () => {
    if (!confirm("Salvar fechamento?")) return;
    
    const { success } = await oeeService.saveHistory(results.kpi, config.mes, config.ano);
    
    if (success) {
        setToast({ message: "Salvo!", type: 'success' }); 
    } else {
        setToast({ message: "Erro ao salvar histórico.", type: 'error' });
    }
  };

  if (step === 'upload') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in zoom-in duration-300">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-200 text-center max-w-lg w-full">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><FileSpreadsheet size={40} className="text-blue-600" /></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload de Planilha OEE</h2>
          <p className="text-slate-500 mb-8">Envie o arquivo Excel com os registros de circuitos para iniciar a análise.</p>
          <label className="block w-full cursor-pointer">
            <div className={`border-2 border-dashed border-blue-300 rounded-xl p-8 bg-blue-50 hover:bg-blue-100 transition-colors flex flex-col items-center justify-center group`}>
              {isLoading ? (<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>) : (<UploadCloud size={32} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />)}
              <span className="text-sm font-bold text-blue-700">{isLoading ? "Processando..." : "Clique para selecionar arquivo"}</span>
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
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Settings className="text-slate-400" /> Configuração</h2>
          <button onClick={() => setStep('upload')} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1"><ArrowLeft size={16} /> Voltar</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Mês</label><select className="w-full p-2 border rounded-md text-sm" value={config.mes} onChange={e => setConfig({ ...config, mes: parseInt(e.target.value) })}>{['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Ano</label><input type="number" className="w-full p-2 border rounded-md text-sm" value={config.ano} onChange={e => setConfig({ ...config, ano: parseInt(e.target.value) })} /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Capacidade</label><input type="number" className="w-full p-2 border rounded-md text-sm font-bold text-blue-600" value={config.capacidade_total} onChange={e => setConfig({ ...config, capacidade_total: parseInt(e.target.value) })} /></div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider flex items-center gap-2"><Activity size={16} /> Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Ensaios Solicitados</span><input type="number" className="w-24 p-1 border rounded text-right" value={config.ensaios_solicitados} onChange={e => setConfig({ ...config, ensaios_solicitados: e.target.value })} /></div>
                <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Ensaios Executados</span><input type="number" className="w-24 p-1 border rounded text-right" value={config.ensaios_executados} onChange={e => setConfig({ ...config, ensaios_executados: e.target.value })} /></div>
              </div>
            </div>
            <div className="border-l border-slate-100 pl-8">
              <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider flex items-center gap-2"><Filter size={16} /> Ajuste Fino</h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-64 overflow-y-auto">
                {circuitosList.map(circ => (
                  <div key={circ} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                    <span className="text-sm font-mono font-medium text-slate-700">{circ}</span>
                    <div className="flex gap-2">
                      <button onClick={() => toggleSelection('force_up', circ)} className={`px-2 py-0.5 text-[10px] font-bold rounded ${config.force_up.includes(circ) ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>UP</button>
                      <button onClick={() => toggleSelection('force_pq', circ)} className={`px-2 py-0.5 text-[10px] font-bold rounded ${config.force_pq.includes(circ) ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>PQ</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button onClick={() => calculate()} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2">{isLoading ? 'Calculando...' : 'Gerar Dashboard'} <ArrowRight size={18} /></button>
          </div>
        </div>
      </div>
    )
  }
  if (step === 'dashboard') {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-8">
          <div><h2 className="text-2xl font-bold text-slate-800">Painel OEE</h2><p className="text-slate-500 text-sm">{config.mes}/{config.ano}</p></div>
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
        <ValidationCard medias={results.medias} />
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-4 bg-slate-50 border-b border-slate-200"><StatusLegend /></div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-3 py-3 border-r border-slate-200 w-32 sticky left-0 bg-slate-100 z-30">Circuito</th>
                  <th className="px-1 py-3 border-r border-slate-200 min-w-[600px]">
                    <div className="flex justify-between px-2">{Array.from({ length: results.meta.dias_no_mes }, (_, i) => (<span key={i} className="w-5 text-center text-[9px] text-slate-400">{i + 1}</span>))}</div>
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
                    <GridRow key={row.id} row={row} daysInMonth={results.meta.dias_no_mes} onDelete={handleExclude} onRestore={handleRestore} onPreset={handlePreset} setToast={setToast} />
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

export default OEEDashboardView;