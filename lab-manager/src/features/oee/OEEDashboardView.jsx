import React, { useState, useCallback } from 'react';
import {
  FileSpreadsheet, UploadCloud, Settings, ArrowLeft, Activity, 
  Filter, ArrowRight, Save, Clock, Zap, CheckCircle2, 
  Copy, Star, X, Info, Eraser, AlertTriangle, ToggleLeft, ToggleRight
} from 'lucide-react';

import KPICard from '../../components/ui/KPICard';
import StatusLegend from '../../components/ui/StatusLegend';
import ValidationCard from './components/ValidationCard';
import GridRow from './components/GridRow'; 
import { oeeService } from '../../services/oeeService';
import ConfirmModal from "../../components/ui/ConfirmModal"; 
import InputModal from "../../components/modals/InputModal";

const OEEDashboardView = ({ setToast }) => {
  const [step, setStep] = useState('config');
  const [isLoading, setIsLoading] = useState(false);
  const [circuitosList, setCircuitosList] = useState([]); 
  const [isSelectionMode, setIsSelectionMode] = useState(false); 
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [useExtrasRule, setUseExtrasRule] = useState(false); 

  const [modalInputExtras, setModalInputExtras] = useState(false); 
  const [modalConfirmSave, setModalConfirmSave] = useState(false); 
  const [modalConfirmRestore, setModalConfirmRestore] = useState(false);
  
  const [optReport, setOptReport] = useState(null);

  const [config, setConfig] = useState({
    ano: new Date().getFullYear(), 
    mes: new Date().getMonth() + 1, 
    capacidade_total: 450,
    ensaios_executados: 0, 
    ensaios_solicitados: 0, 
    relatorios_emitidos: 0, 
    relatorios_no_prazo: 0
  });
  
  const [results, setResults] = useState({
    kpi: { oee: 0, availability: 0, performance: 0, quality: 0 },
    trendData: [], 
    details: [], 
    meta: { dias_no_mes: 30 }, 
    medias: null
  });

  const goToUpload = () => {
    setStep('upload');
  };

  const calculate = useCallback(async (currentConfig = config, ruleState = useExtrasRule) => {
    setIsLoading(true);
    const payload = { 
        ...currentConfig,
        usar_regra_extras: ruleState 
    };
    
    const { success, data } = await oeeService.calculate(payload);
    
    if (success && data.sucesso) {
      setResults({
        kpi: data.kpi, 
        trendData: data.trendData || [], 
        details: data.details || [], 
        meta: data.meta || { dias_no_mes: 30 }, 
        medias: data.medias || null
      });
      if (step !== 'dashboard') setStep('dashboard');
    } else {
      setToast({ message: "Erro ao calcular dados.", type: 'error' });
    }
    setIsLoading(false);
  }, [config, step, setToast, useExtrasRule]);

  const toggleExtrasRule = () => {
      const newState = !useExtrasRule;
      setUseExtrasRule(newState);
      calculate(config, newState);
      setToast({ message: newState ? "Regra 300 Aplicada!" : "Visualização Padrão (Todos)", type: 'info' });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);
    
    const { success, data } = await oeeService.uploadFile(file, config.mes, config.ano);
    
    if (success && data.sucesso) {
      setCircuitosList(data.circuitos || []);
      setToast({ message: 'Mapa gerado com sucesso!', type: 'success' });
      await calculate(config, useExtrasRule);
      setStep('dashboard');
    } else {
      setToast({ message: data?.erro || "Erro ao processar arquivo.", type: 'error' });
    }
    setIsLoading(false);
  };

  const updateCircuitOnDB = async (id, action) => {
    const { success } = await oeeService.updateCircuit(id, action);
    return success;
  };

  const handlePreset = async (id, type) => {
    let action = 'SET_UP';
    if (type === 'bonus_list') action = 'SET_BONUS';
    else if (type === 'force_std') action = 'force_std';
    else if (type === 'force_up') action = 'SET_UP';

    const ok = await updateCircuitOnDB(id, action);
    if (ok) await calculate(); 
  };

  const handleRestore = async (id) => {
    const ok = await updateCircuitOnDB(id, 'RESTORE');
    if (ok) await calculate();
  };

  const handleExclude = async (id) => {
    const ok = await updateCircuitOnDB(id, 'SET_IGNORE');
    if (ok) await calculate();
  };

  const toggleSelect = (id) => {
    const idStr = String(id);
    setSelectedIds(prev => prev.includes(idStr) ? prev.filter(x => x !== idStr) : [...prev, idStr]);
  };

  const executeSaveHistory = async () => {
    setModalConfirmSave(false); 
    const { success } = await oeeService.saveHistory(results.kpi, config.mes, config.ano);
    if (success) setToast({ message: "Fechamento salvo no Histórico!", type: 'success' });
  };

  const executeAutoExtras = async (inputValue) => {
    setModalInputExtras(false); 

    const limite = parseInt(inputValue);
    if (isNaN(limite) || limite < 0) {
      setToast({ message: "Valor inválido.", type: 'error' });
      return;
    }

    setIsLoading(true);
    const { success, data } = await oeeService.autoDefineExtras(limite);
    
    if (success && data.sucesso) {
      if (data.relatorio) {
        setOptReport(data.relatorio);
        setToast({ message: "Otimização aplicada! Veja o relatório.", type: 'success' });
      } else {
        setToast({ message: data.mensagem, type: 'info' });
      }
      setUseExtrasRule(true);
      await calculate(config, true); 
    } else {
      setToast({ message: data?.erro || "Erro ao definir extras.", type: 'error' });
    }
    setIsLoading(false);
  };

  const openRestoreConfirmation = () => {
    setModalInputExtras(false);
    setModalConfirmRestore(true);
  };

  const handleConfirmRestore = async () => {
    setModalConfirmRestore(false);
    setIsLoading(true);
    
    const { success, data } = await oeeService.clearExtras();
    
    if (success && data.sucesso) {
      setOptReport(null);
      setToast({ message: data.mensagem, type: 'success' });
      await calculate();
    } else {
      setToast({ message: "Erro ao restaurar.", type: 'error' });
    }
    setIsLoading(false);
  };

  const handleCopyTable = () => {
    if (!results.details || results.details.length === 0) return;
    let textToCopy = "";
    results.details.forEach(row => {
      const dayString = row.day_data ? row.day_data.join('\t') : '';
      textToCopy += `${dayString}\n`;
    });
    navigator.clipboard.writeText(textToCopy).then(() => {
      setToast({ message: "Dados copiados! (iDevice + Circuitos)", type: 'success' });
    }).catch(() => {
        setToast({ message: "Erro ao copiar.", type: 'error' });
    });
  };

  if (step === 'config') {
    return (
      <div className="animate-in slide-in-from-right duration-300 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="text-slate-400" /> Passo 1: Configuração do Mês
          </h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Mês Alvo</label>
              <select className="w-full p-2 border rounded-md text-sm" value={config.mes} onChange={e => setConfig({ ...config, mes: parseInt(e.target.value) })}>{['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Ano Alvo</label>
              <input type="number" className="w-full p-2 border rounded-md text-sm" value={config.ano} onChange={e => setConfig({ ...config, ano: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Capacidade</label>
              <input type="number" className="w-full p-2 border rounded-md text-sm font-bold text-blue-600" value={config.capacidade_total} readOnly />
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs flex items-center gap-2"><Activity size={16} /> Performance (Metas)</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Ensaios Solicitados</span><input type="number" className="w-24 p-1 border rounded text-right" value={config.ensaios_solicitados} onChange={e => setConfig({ ...config, ensaios_solicitados: e.target.value })} /></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Ensaios Executados</span><input type="number" className="w-24 p-1 border rounded text-right" value={config.ensaios_executados} onChange={e => setConfig({ ...config, ensaios_executados: e.target.value })} /></div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs flex items-center gap-2"><CheckCircle2 size={16} /> Qualidade (Metas)</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Relatórios Emitidos</span><input type="number" className="w-24 p-1 border rounded text-right" value={config.relatorios_emitidos} onChange={e => setConfig({ ...config, relatorios_emitidos: e.target.value })} /></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Relatórios no Prazo</span><input type="number" className="w-24 p-1 border rounded text-right" value={config.relatorios_no_prazo} onChange={e => setConfig({ ...config, relatorios_no_prazo: e.target.value })} /></div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-2 uppercase text-xs flex items-center gap-2"><Filter size={16} /> Fluxo de Trabalho</h3>
              <ul className="text-[11px] text-slate-500 space-y-2 list-disc pl-4">
                <li>Defina o <strong>Mês e Ano</strong> que deseja apurar.</li>
                <li>Preencha os indicadores manuais de <strong>Performance</strong> e <strong>Qualidade</strong>.</li>
                <li>Avance para enviar a planilha; o sistema usará essas datas para calcular a disponibilidade automaticamente.</li>
              </ul>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button onClick={goToUpload} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2">
              Próximo: Upload <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'upload') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in zoom-in duration-300">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-200 text-center max-w-lg w-full relative">
          <button onClick={() => setStep('config')} className="absolute top-4 left-4 text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} />
          </button>
          
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><FileSpreadsheet size={40} className="text-blue-600" /></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Passo 2: Upload de Planilha</h2>
          <p className="text-slate-500 mb-8">
            O sistema irá processar os dias referentes a: <br/>
            <span className="font-bold text-blue-600 text-lg">{config.mes}/{config.ano}</span>
          </p>
          <label className="block w-full cursor-pointer">
            <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 bg-blue-50 hover:bg-blue-100 transition-colors flex flex-col items-center justify-center group">
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <span className="text-sm font-bold text-blue-700">Processando Mapa...</span>
                </div>
              ) : (
                <>
                  <UploadCloud size={32} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-blue-700">Clique para selecionar arquivo</span>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isLoading} />
          </label>
        </div>
      </div>
    );
  }

  if (step === 'dashboard') {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-20">
        
        <InputModal 
          isOpen={modalInputExtras}
          title="Definir Limite de Extras"
          message="Qual o limite de circuitos FIXOS da equipe? (Ex: 300)"
          defaultValue="300"
          type="number"
          onClose={() => setModalInputExtras(false)}
          onConfirm={executeAutoExtras}
          extraLabel="Restaurar Originais"
          onExtraAction={openRestoreConfirmation}
        />

        <ConfirmModal 
          isOpen={modalConfirmRestore}
          title="Restaurar Originais?"
          message="Isso vai remover TODOS os circuitos marcados como 'Extra' e restaurar o status original deles (SD/PP). Deseja continuar?"
          confirmText="Sim, Restaurar"
          cancelText="Cancelar"
          type="danger" 
          onClose={() => setModalConfirmRestore(false)}
          onCancel={() => setModalConfirmRestore(false)}
          onConfirm={handleConfirmRestore}
        />

        <ConfirmModal 
          isOpen={modalConfirmSave}
          title="Salvar Fechamento"
          message={`Deseja salvar os dados de ${config.mes}/${config.ano} no histórico? Isso sobrescreverá dados anteriores deste mês.`}
          confirmText="Sim, Salvar"
          cancelText="Cancelar"
          type="success"
          onClose={() => setModalConfirmSave(false)}
          onCancel={() => setModalConfirmSave(false)}
          onConfirm={executeSaveHistory}
        />

        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div><h2 className="text-2xl font-bold text-slate-800">Painel OEE</h2><p className="text-slate-500 text-sm">{config.mes}/{config.ano}</p></div>
          <div className="flex gap-2 flex-wrap justify-end">
            
            {/* <button 
                onClick={toggleExtrasRule}
                title="Ativar para limpar o SD dos circuitos excedentes (>300)"
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border transition-all ${
                    useExtrasRule 
                    ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm ring-1 ring-amber-200' 
                    : 'bg-slate-50 border-slate-300 text-slate-500 hover:bg-slate-100'
                }`}
            >
                {useExtrasRule ? <ToggleRight size={24} className="text-amber-600"/> : <ToggleLeft size={24} />}
                {useExtrasRule ? "Regra 300 Ativada" : "Auto Extras"}
            </button> */}

            <button onClick={handleCopyTable} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
               <Copy size={16} className="text-blue-500" /> Copiar
            </button>

            <button onClick={() => setModalConfirmSave(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"><Save size={16} /> Salvar</button>
            
            <button onClick={() => setStep('config')} className="bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Settings size={14}/> Novo</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard title="OEE Mensal" value={results.kpi.oee} icon={Activity} color="blue" />
          <KPICard title="Disponibilidade" value={results.kpi.availability} icon={Clock} color="orange" />
          <KPICard title="Performance" value={results.kpi.performance} icon={Zap} color="purple" />
          <KPICard title="Qualidade" value={results.kpi.quality} icon={CheckCircle2} color="green" />
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <ValidationCard medias={results.medias} />
          </div>

          {optReport && (
            <div className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden flex flex-col animate-in slide-in-from-right-4">
              <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex justify-between items-center">
                <h4 className="text-amber-900 font-bold text-sm flex items-center gap-2">
                  <Star size={16} className="fill-amber-500 text-amber-600"/> 
                  Relatório de Otimização
                </h4>
                <button onClick={() => setOptReport(null)} className="text-amber-400 hover:text-amber-700 p-1 rounded hover:bg-amber-100 transition-colors"><X size={16}/></button>
              </div>
              
              <div className="p-4 flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg text-amber-700 font-bold text-xl min-w-[3rem] text-center shadow-inner">
                    {optReport.qtd}
                  </div>
                  <p className="text-xs text-slate-600 leading-tight">
                    Circuitos definidos como <strong className="text-amber-700">EXTRAS</strong> baseado em maior ociosidade.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">SD Removido</span>
                    <span className="text-sm font-black text-slate-700 flex items-center justify-center gap-1 mt-1">
                      <Eraser size={12} className="text-slate-400"/> {optReport.total_sd}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">PP Removido</span>
                    <span className="text-sm font-black text-slate-700 flex items-center justify-center gap-1 mt-1">
                      <AlertTriangle size={12} className="text-slate-400"/> {optReport.total_pp}
                    </span>
                  </div>
                </div>

                <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-100 flex-1 flex flex-col overflow-hidden">
                  <span className="text-[10px] font-bold text-amber-800/70 mb-2 flex items-center gap-1">
                    <Info size={12}/> IDs Afetados:
                  </span>
                  <div className="overflow-y-auto max-h-32 custom-scrollbar pr-1">
                    <p className="text-[10px] text-slate-600 font-mono break-words leading-relaxed">
                      {optReport.ids.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-4 bg-slate-50 border-b border-slate-200"><StatusLegend /></div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 font-semibold text-xs uppercase sticky top-0 z-[40]">
                <tr>
                  <th className="px-3 py-3 border-r border-slate-200 w-32 sticky left-0 bg-slate-100 z-[45]">Circuito</th>
                  <th className="px-1 py-3 border-r border-slate-200">
                    <div className="flex gap-[2px]"> 
                      {Array.from({ length: results.meta.dias_no_mes }, (_, i) => (<span key={i} className="w-5 text-center text-[9px] text-slate-400 block">{i + 1}</span>))}
                    </div>
                  </th>
                  <th className="px-2 py-3 border-r border-slate-200 text-center w-12 text-emerald-700">UP</th>
                  <th className="px-2 py-3 border-r border-slate-200 text-center w-12 text-rose-700">PQ</th>
                  <th className="px-2 py-3 border-r border-slate-200 text-center w-12 text-purple-700">PP</th>
                  <th className="px-2 py-3 border-r border-slate-200 text-center w-12 text-amber-700">SD</th>
                  <th className="px-2 py-3 text-right w-48">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {results.details.map((row) => (
                  <GridRow 
                    key={row.id} 
                    row={row} 
                    daysInMonth={results.meta.dias_no_mes} 
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedIds.includes(String(row.raw_id))} 
                    onToggleSelect={() => toggleSelect(row.raw_id)}
                    onDelete={handleExclude} 
                    onRestore={handleRestore} 
                    onPreset={handlePreset} 
                    setToast={setToast} 
                  />
                ))}
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