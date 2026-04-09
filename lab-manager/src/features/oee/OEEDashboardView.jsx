import React, { useState, useCallback } from 'react';
import {
  FileSpreadsheet, UploadCloud, Settings, ArrowLeft, Activity, 
  Filter, ArrowRight, Save, Clock, Zap, CheckCircle2, 
  Copy, X, Info, AlertTriangle
} from 'lucide-react';

// SUAS IMPORTAÇÕES ORIGINAIS (Corrigidas para o seu projeto)
import KPICard from '../../components/ui/KPICard';
import StatusLegend from '../../components/ui/LegendasOee';
import ValidationCard from './components/ValidationCard';
import GridRow from './components/GridRow'; 
import { oeeService } from '../../services/oeeService';
import ConfirmModal from "../../components/ui/ConfirmModal"; 

const OEEDashboardView = ({ setToast }) => {
  const [step, setStep] = useState('config');
  const [isLoading, setIsLoading] = useState(false);
  const [circuitosList, setCircuitosList] = useState([]); 
  const [isSelectionMode, setIsSelectionMode] = useState(false); 
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [modalConfirmSave, setModalConfirmSave] = useState(false); 

  // --- NOVOS ESTADOS PARA A ANÁLISE CRÍTICA E O GRID ---
  const [justificativa, setJustificativa] = useState('');
  const [mostrarGrid, setMostrarGrid] = useState(false); 
  const podeEditar = true; // Simulando permissão de edição

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

  const calculate = useCallback(async (currentConfig = config) => {
    setIsLoading(true);
    const { success, data } = await oeeService.calculate(currentConfig);
    
    if (success && data.sucesso) {
      setResults({
        kpi: data.kpi, 
        trendData: data.trendData || [], 
        details: data.details || [], 
        meta: data.meta || { dias_no_mes: 30 }, 
        medias: data.medias || null
      });
      if (step !== 'dashboard') {
        setStep('dashboard');
        setMostrarGrid(false); // Garante que o grid comece fechado ao entrar no dashboard
      }
    } else {
      setToast({ message: "Erro ao calcular dados.", type: 'error' });
    }
    setIsLoading(false);
  }, [config, step, setToast]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);
    
    const { success, data } = await oeeService.uploadFile(file, config.mes, config.ano);
    
    if (success && data.sucesso) {
      setCircuitosList(data.circuitos || []);
      setToast({ message: 'Mapa gerado com sucesso!', type: 'success' });
      await calculate(config);
      setStep('dashboard');
      setMostrarGrid(false); // Grid começa oculto
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
    if (type === 'force_std') action = 'force_std';
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
    // ATENÇÃO: Adicionamos a justificativa no momento de salvar
    const { success } = await oeeService.saveHistory(results.kpi, config.mes, config.ano, justificativa);
    if (success) setToast({ message: "Fechamento salvo no Histórico!", type: 'success' });
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

  // ==========================================
  // PASSO 1: TELA DE CONFIGURAÇÃO ORIGINAL
  // ==========================================
  if (step === 'config') {
    return (
      <div className="animate-in slide-in-from-right duration-300 max-w-4xl mx-auto w-full transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 transition-colors">
            <Settings className="text-slate-400 dark:text-slate-500" /> Passo 1: Configuração do Mês
          </h2>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 grid grid-cols-1 md:grid-cols-3 gap-6 transition-colors">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Mês Alvo</label>
              <select className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={config.mes} onChange={e => setConfig({ ...config, mes: parseInt(e.target.value) })}>{['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Ano Alvo</label>
              <input type="number" className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={config.ano} onChange={e => setConfig({ ...config, ano: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Capacidade</label>
              <input type="number" className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-md text-sm font-bold cursor-not-allowed transition-colors" value={config.capacidade_total} readOnly />
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase text-xs flex items-center gap-2 transition-colors"><Activity size={16} /> Performance (Metas)</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-sm text-slate-600 dark:text-slate-400 transition-colors">Ensaios Solicitados</span><input type="number" className="w-24 p-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={config.ensaios_solicitados} onChange={e => setConfig({ ...config, ensaios_solicitados: e.target.value })} /></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-slate-600 dark:text-slate-400 transition-colors">Ensaios Executados</span><input type="number" className="w-24 p-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={config.ensaios_executados} onChange={e => setConfig({ ...config, ensaios_executados: e.target.value })} /></div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 transition-colors">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase text-xs flex items-center gap-2 transition-colors"><CheckCircle2 size={16} /> Qualidade (Metas)</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-sm text-slate-600 dark:text-slate-400 transition-colors">Relatórios Emitidos</span><input type="number" className="w-24 p-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={config.relatorios_emitidos} onChange={e => setConfig({ ...config, relatorios_emitidos: e.target.value })} /></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-slate-600 dark:text-slate-400 transition-colors">Relatórios no Prazo</span><input type="number" className="w-24 p-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={config.relatorios_no_prazo} onChange={e => setConfig({ ...config, relatorios_no_prazo: e.target.value })} /></div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase text-xs flex items-center gap-2 transition-colors"><Filter size={16} /> Fluxo de Trabalho</h3>
              <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-4 transition-colors">
                <li>Defina o <strong>Mês e Ano</strong> que deseja apurar.</li>
                <li>Preencha os indicadores manuais de <strong>Performance</strong> e <strong>Qualidade</strong>.</li>
                <li>Avance para enviar a planilha; o sistema usará essas datas para calcular a disponibilidade automaticamente.</li>
              </ul>
            </div>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end transition-colors">
            <button onClick={goToUpload} className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg dark:shadow-none flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-95">
              Próximo: Upload <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // PASSO 2: TELA DE UPLOAD ORIGINAL
  // ==========================================
  if (step === 'upload') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in zoom-in duration-300 transition-colors">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800 text-center max-w-lg w-full relative transition-colors">
          <button onClick={() => setStep('config')} className="absolute top-4 left-4 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50">
            <ArrowLeft size={20} />
          </button>
          
          <div className="bg-blue-100 dark:bg-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors"><FileSpreadsheet size={40} className="text-blue-600 dark:text-blue-400" /></div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 transition-colors">Passo 2: Upload de Planilha</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 transition-colors">
            O sistema irá processar os dias referentes a: <br/>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-lg transition-colors">{config.mes}/{config.ano}</span>
          </p>
          <label className="block w-full cursor-pointer focus-within:ring-2 focus-within:ring-blue-500/50 rounded-xl">
            <div className="border-2 border-dashed border-blue-300 dark:border-blue-500/50 rounded-xl p-8 bg-blue-50 dark:bg-blue-500/5 hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors flex flex-col items-center justify-center group">
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-2"></div>
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">Processando Mapa...</span>
                </div>
              ) : (
                <>
                  <UploadCloud size={32} className="text-blue-500 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400 transition-colors">Clique para selecionar arquivo</span>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isLoading} />
          </label>
        </div>
      </div>
    );
  }

  // ==========================================
  // PASSO 3: DASHBOARD FINAL
  // ==========================================
  if (step === 'dashboard') {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-20 transition-colors">
        
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

        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 transition-colors">
          <div><h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Painel OEE</h2><p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">{config.mes}/{config.ano}</p></div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={handleCopyTable} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50">
               <Copy size={16} className="text-blue-500 dark:text-blue-400" /> Copiar
            </button>

            <button onClick={() => setModalConfirmSave(true)} className="bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-95"><Save size={16} /> Salvar</button>
            
            <button onClick={() => setStep('config')} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"><Settings size={14}/> Novo</button>
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
        </div>

        {/* NOVA SESSÃO: CAIXA DE ANÁLISE CRÍTICA / JUSTIFICATIVA */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 transition-colors">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Info size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase">Análise Crítica & Justificativas</h3>
          </div>
          <div className="p-4">
            <textarea 
              className={`w-full p-3 border rounded-lg text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors custom-scrollbar ${!podeEditar ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'}`}
              placeholder={podeEditar ? "Descreva os principais ofensores do mês, paradas em equipamentos, ou justificativas para a performance..." : "Nenhuma justificativa registrada para este mês."}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              disabled={!podeEditar}
            />
          </div>
        </div>
        
        {/* BOTÃO PARA MOSTRAR/OCULTAR O GRID */}
        <div className="flex justify-center mb-6">
          <button 
            onClick={() => setMostrarGrid(!mostrarGrid)}
            className="flex items-center gap-2 px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-bold text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {mostrarGrid ? <><X size={16}/> Ocultar Detalhamento por Circuito</> : <><FileSpreadsheet size={16}/> Mostrar Detalhamento por Circuito</>}
          </button>
        </div>

        {/* O GRID AGORA FICA CONDICIONADO A VARIÁVEL mostrarGrid */}
        {mostrarGrid && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 transition-colors animate-in fade-in slide-in-from-top-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 transition-colors"><StatusLegend /></div>
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar bg-white dark:bg-slate-900 transition-colors">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase sticky top-0 z-[40] transition-colors">
                  <tr>
                    <th className="px-3 py-3 border-r border-slate-200 dark:border-slate-700 w-32 sticky left-0 bg-slate-100 dark:bg-slate-800 z-[45] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">Circuito</th>
                    <th className="px-1 py-3 border-r border-slate-200 dark:border-slate-700 transition-colors">
                      <div className="flex gap-[2px]"> 
                        {Array.from({ length: results.meta.dias_no_mes }, (_, i) => (<span key={i} className="w-5 text-center text-[9px] text-slate-400 dark:text-slate-500 block transition-colors">{i + 1}</span>))}
                      </div>
                    </th>
                    <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-700 text-center w-12 text-emerald-700 dark:text-emerald-400 transition-colors">UP</th>
                    <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-700 text-center w-12 text-rose-700 dark:text-rose-400 transition-colors">PQ</th>
                    <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-700 text-center w-12 text-purple-700 dark:text-purple-400 transition-colors">PP</th>
                    <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-700 text-center w-12 text-amber-700 dark:text-amber-400 transition-colors">SD</th>
                    <th className="px-2 py-3 text-right w-48">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
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
        )}
      </div>
    );
  }
  return null;
};

export default OEEDashboardView;