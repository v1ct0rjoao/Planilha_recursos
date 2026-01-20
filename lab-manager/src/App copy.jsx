import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend 
} from 'recharts';
import { 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Thermometer, 
  Activity, 
  Clock, 
  Search, 
  BatteryCharging, 
  Zap, 
  Plus, 
  FileText, 
  Edit2, 
  Save, 
  Trash2, 
  Clipboard, 
  Wrench, 
  CheckSquare, 
  Settings,
  Factory,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  Filter,
  Info,
  Download,
  BarChart2,
  List
} from 'lucide-react';

const API_URL = 'http://127.0.0.1:5000/api';

// --- COMPONENTES AUXILIARES ---

// Notificação Simples (Substituindo alert)
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-blue-600'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 animate-in slide-in-from-right ${bgColors[type] || bgColors.info}`}>
      {type === 'success' && <CheckCircle size={20} />}
      {type === 'error' && <AlertTriangle size={20} />}
      {type === 'info' && <Info size={20} />}
      {message}
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, color, suffix = '%' }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
  };
  const theme = colorClasses[color] || colorClasses.blue;
  const numValue = parseFloat(value) || 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
        <div className={`p-2 rounded-lg ${theme}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold text-slate-800">{numValue}{suffix}</span>
          <div className="flex items-center mt-1 space-x-1">
            {numValue >= 85 ? (
              <TrendingUp size={14} className="text-green-500" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wide ${numValue >= 85 ? 'text-green-500' : 'text-red-500'}`}>
              {numValue >= 85 ? 'Meta Atingida' : 'Abaixo da Meta'}
            </span>
          </div>
        </div>
        <div className="relative w-10 h-10 flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90">
                <circle cx="20" cy="20" r="16" stroke="#e2e8f0" strokeWidth="3" fill="none" />
                <circle 
                  cx="20" cy="20" r="16" 
                  stroke={color === 'red' ? '#ef4444' : color === 'green' ? '#10b981' : color === 'purple' ? '#8b5cf6' : '#3b82f6'} 
                  strokeWidth="3" 
                  fill="none" 
                  strokeDasharray="100" 
                  strokeDashoffset={100 - (100 * numValue) / 100} 
                  className="transition-all duration-1000 ease-out"
                />
            </svg>
        </div>
      </div>
    </div>
  );
};

// --- VIEW PRINCIPAL OEE COM WIZARD ---
const OEEDashboardView = ({ setToast }) => {
  const [step, setStep] = useState('upload'); // 'upload', 'config', 'dashboard'
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null); // Nome do arquivo temp no backend
  const [circuitosList, setCircuitosList] = useState([]); // Lista para dropdown
  
  // Parâmetros de Configuração
  const [config, setConfig] = useState({
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    capacidade_total: 375,
    ensaios_executados: 0,
    ensaios_solicitados: 0,
    relatorios_emitidos: 0,
    relatorios_no_prazo: 0,
    force_up: [], // Array de IDs
    force_pq: []  // Array de IDs
  });

  // Resultados
  const [results, setResults] = useState({
    kpi: { oee: 0, availability: 0, performance: 0, quality: 0 },
    trendData: [],
    details: [] // Dados para a tabela
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
        setToast({ message: 'Arquivo carregado com sucesso!', type: 'success' });
        setStep('config');
      } else {
        setToast({ message: "Erro no upload: " + data.erro, type: 'error' });
      }
    } catch (err) {
      setToast({ message: "Erro de conexão com o servidor.", type: 'error' });
    }
    setIsLoading(false);
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const payload = {
        filename: uploadedFile,
        ...config
      };
      
      const res = await fetch(`${API_URL}/oee/calculate`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.sucesso) {
        setResults({
          kpi: data.kpi,
          trendData: data.trendData,
          details: data.details || [] // Garante que details existe
        });
        setToast({ message: 'Dashboard gerado!', type: 'success' });
        setStep('dashboard');
      } else {
        setToast({ message: "Erro no cálculo: " + data.erro, type: 'error' });
      }
    } catch (err) {
      setToast({ message: "Erro ao calcular indicadores.", type: 'error' });
    }
    setIsLoading(false);
  };

  const handleSaveHistory = async () => {
    if(!confirm("Deseja salvar este fechamento no histórico mensal?")) return;
    try {
        const res = await fetch(`${API_URL}/oee/save_history`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ kpi: results.kpi, mes: config.mes, ano: config.ano })
        });
        const d = await res.json();
        if(d.sucesso) setToast({message: "Fechamento salvo com sucesso!", type: 'success'});
        else setToast({message: "Erro ao salvar", type: 'error'});
    } catch (e) { setToast({message: "Erro de conexão", type: 'error'}); }
  };

  const toggleSelection = (listName, id) => {
    setConfig(prev => {
      const list = prev[listName];
      if (list.includes(id)) {
        return { ...prev, [listName]: list.filter(item => item !== id) };
      } else {
        return { ...prev, [listName]: [...list, id] };
      }
    });
  };

  // --- RENDERIZAÇÃO DOS PASSOS ---

  // 1. UPLOAD
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
            <div className={`
              border-2 border-dashed border-blue-300 rounded-xl p-8 bg-blue-50 hover:bg-blue-100 transition-colors
              flex flex-col items-center justify-center group
            `}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              ) : (
                <UploadCloud size={32} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
              )}
              <span className="text-sm font-bold text-blue-700">
                {isLoading ? "Processando..." : "Clique para selecionar arquivo"}
              </span>
              <span className="text-xs text-blue-400 mt-1">Formatos .xlsx ou .xls</span>
            </div>
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isLoading} />
          </label>
        </div>
      </div>
    );
  }

  // 2. CONFIGURAÇÃO
  if (step === 'config') {
    return (
      <div className="animate-in slide-in-from-right duration-300 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="text-slate-400" /> Configuração da Análise
          </h2>
          <button onClick={() => setStep('upload')} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider">Parâmetros Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Mês</label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                  value={config.mes} onChange={e => setConfig({...config, mes: parseInt(e.target.value)})}
                >
                  {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => (
                    <option key={i} value={i+1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Ano</label>
                <input 
                  type="number" className="w-full p-2 border border-slate-300 rounded-md text-sm"
                  value={config.ano} onChange={e => setConfig({...config, ano: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Capacidade Total</label>
                <input 
                  type="number" className="w-full p-2 border border-slate-300 rounded-md text-sm font-bold text-blue-600"
                  value={config.capacidade_total} onChange={e => setConfig({...config, capacidade_total: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Inputs de OEE */}
            <div>
              <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider flex items-center gap-2">
                <Activity size={16} /> Dados de Performance
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Ensaios Solicitados</span>
                  <input type="number" className="w-24 p-1 border rounded text-right" value={config.ensaios_solicitados} onChange={e => setConfig({...config, ensaios_solicitados: e.target.value})} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Ensaios Executados</span>
                  <input type="number" className="w-24 p-1 border rounded text-right" value={config.ensaios_executados} onChange={e => setConfig({...config, ensaios_executados: e.target.value})} />
                </div>
              </div>

              <h3 className="font-bold text-slate-700 mt-6 mb-4 uppercase text-xs tracking-wider flex items-center gap-2">
                <CheckCircle2 size={16} /> Dados de Qualidade
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Relatórios Emitidos</span>
                  <input type="number" className="w-24 p-1 border rounded text-right" value={config.relatorios_emitidos} onChange={e => setConfig({...config, relatorios_emitidos: e.target.value})} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">No Prazo</span>
                  <input type="number" className="w-24 p-1 border rounded text-right" value={config.relatorios_no_prazo} onChange={e => setConfig({...config, relatorios_no_prazo: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Ajuste Fino */}
            <div className="border-l border-slate-100 pl-8">
               <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider flex items-center gap-2">
                <Filter size={16} /> Ajuste Fino (Force UP/PQ)
              </h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-64 overflow-y-auto">
                 {circuitosList.length === 0 ? (
                   <p className="text-xs text-slate-400 italic">Nenhum circuito detectado no Excel.</p>
                 ) : (
                   circuitosList.map(circ => (
                     <div key={circ} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                       <span className="text-sm font-mono font-medium text-slate-700">{circ}</span>
                       <div className="flex gap-2">
                         <button 
                            onClick={() => toggleSelection('force_up', circ)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${config.force_up.includes(circ) ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                         >UP</button>
                         <button 
                            onClick={() => toggleSelection('force_pq', circ)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${config.force_pq.includes(circ) ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                         >PQ</button>
                       </div>
                     </div>
                   ))
                 )}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                * UP: Força o circuito a contar como "Disponível/Ativo".<br/>
                * PQ: Força o circuito a ser ignorado (Quebrado/Parado).
              </p>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button 
              onClick={handleCalculate} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all active:scale-95"
            >
              {isLoading ? 'Calculando...' : 'Gerar Dashboard'} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. DASHBOARD (RESULTADO)
  if (step === 'dashboard') {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-8">
           <div>
              <h2 className="text-2xl font-bold text-slate-800">Resultado da Análise</h2>
              <p className="text-slate-500 text-sm">Competência: {config.mes}/{config.ano}</p>
           </div>
           <div className="flex gap-2">
                <button onClick={handleSaveHistory} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"><Save size={16}/> Salvar Fechamento</button>
                <button onClick={() => setStep('config')} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Nova Análise
                </button>
           </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard title="OEE Global" value={results.kpi.oee} icon={Activity} color="blue" />
          <KPICard title="Disponibilidade" value={results.kpi.availability} icon={Clock} color="orange" />
          <KPICard title="Performance" value={results.kpi.performance} icon={Zap} color="purple" />
          <KPICard title="Qualidade" value={results.kpi.quality} icon={CheckCircle2} color="green" />
        </div>

        {/* Gráfico de Tendência e Botões */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tendência Diária Estimada</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> OEE</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Meta (85%)</span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={results.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOee" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="oee" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOee)" activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Exportar Relatório</h3>
             <div className="space-y-4">
               <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                 <FileSpreadsheet size={18}/> Baixar Excel Completo
               </button>
               <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                 <Download size={18}/> Baixar Gráficos (PDF)
               </button>
             </div>
          </div>
        </div>

        {/* TABELA DE DETALHES (Estilo Excel) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Detalhamento por Circuito (Dias)</h3>
            <span className="text-xs text-slate-500">{results.details.length} registros encontrados</span>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 border-b border-slate-200">Circuito / ID</th>
                  <th className="px-6 py-3 border-b border-slate-200 text-right">Uso Prog. (UP)</th>
                  <th className="px-6 py-3 border-b border-slate-200 text-right">Sem Demanda (SD)</th>
                  <th className="px-6 py-3 border-b border-slate-200 text-right">Quebra (PQ)</th>
                  <th className="px-6 py-3 border-b border-slate-200 text-right">Planejada (PP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.details.length > 0 ? (
                  results.details.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono font-bold text-slate-700">{row.id}</td>
                      <td className="px-6 py-3 text-right text-slate-600 font-medium bg-green-50/30">{row.UP}</td>
                      <td className="px-6 py-3 text-right text-slate-600 bg-yellow-50/30">{row.SD}</td>
                      <td className="px-6 py-3 text-right text-rose-600 font-bold bg-red-50/30">{row.PQ}</td>
                      <td className="px-6 py-3 text-right text-blue-600 bg-blue-50/30">{row.PP}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">Nenhum dado detalhado disponível.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// --- COMPONENTES DO LAB MANAGER ORIGINAL (MANTIDOS) ---

// Função auxiliar de tempo que faltava no código original
const verificarFimTeste = (previsao) => {
  if (!previsao || previsao === '-' || previsao === 'A calcular') return false;
  try {
    const [dataPart, horaPart] = previsao.split(' ');
    const [dia, mes, ano] = dataPart.split('/');
    const [hora, min] = horaPart.split(':');
    const dataFim = new Date(ano, mes - 1, dia, hora, min);
    return new Date() > dataFim;
  } catch (e) { return false; }
};

const CircuitCard = ({ circuit, onDelete, onToggleMaintenance, onViewHistory }) => {
  const normalizedStatus = circuit.status ? circuit.status.toString().toLowerCase().trim() : 'free';
  const isFinished = normalizedStatus === 'finished' || (normalizedStatus === 'running' && verificarFimTeste(circuit.previsao));
  const showActiveCard = normalizedStatus === 'running' || normalizedStatus === 'finished';

  return (
    <div className={`
      relative p-3 rounded-md border-l-4 shadow-sm bg-white transition-all hover:shadow-md group
      ${isFinished ? 'border-blue-500' : 
        normalizedStatus === 'running' ? 'border-amber-400' : 
        normalizedStatus === 'free' ? 'border-emerald-400' : 'border-rose-500'}
    `}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-slate-500 tracking-wider">CIRC. {circuit.id}</span>
        <div className="flex items-center gap-1">
          {showActiveCard && (
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-1 rounded">
              {circuit.startTime ? (circuit.startTime.split(' ')[1] || circuit.startTime) : '--:--'}
            </span>
          )}
          <button onClick={() => onViewHistory(circuit)} className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-blue-500">
            <Clock size={14} />
          </button>
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
             {showActiveCard && (
               <button onClick={() => onToggleMaintenance(circuit.id, true)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-500">
                 <CheckSquare size={14} />
               </button>
            )}
            {!showActiveCard && (
                <button onClick={() => onToggleMaintenance(circuit.id, normalizedStatus === 'maintenance')} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                    <Wrench size={14} />
                </button>
            )}
            {normalizedStatus === 'free' && (
              <button onClick={() => onDelete(circuit.id)} className="text-slate-300 hover:text-rose-500 p-1 rounded"><Trash2 size={14} /></button>
            )}
          </div>
        </div>
      </div>

      {showActiveCard ? (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BatteryCharging size={16} className={isFinished ? "text-blue-500" : "text-amber-600"} />
            <span className="font-mono text-sm font-bold text-slate-800 truncate block">{circuit.batteryId}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
            <div className={`${isFinished ? 'bg-blue-500' : 'bg-amber-500'} h-2 rounded-full`} style={{ width: isFinished ? '100%' : `${circuit.progress || 5}%` }}></div>
          </div>
        </div>
      ) : normalizedStatus === 'free' ? (
        <div className="flex flex-col items-center justify-center py-4 text-emerald-600/50">
          <span className="text-xs font-medium uppercase tracking-widest">Disponível</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1 py-1">
          <span className="text-xs font-bold text-rose-700 flex items-center gap-1 uppercase tracking-tight"><AlertTriangle size={12} /> Manutenção</span>
        </div>
      )}
    </div>
  );
};

const BathContainer = ({ bath, onAddCircuit, onUpdateTemp, onDeleteCircuit, onToggleMaintenance, onDeleteBath, onViewHistory }) => {
  const [isEditingTemp, setIsEditingTemp] = useState(false);
  const [tempValue, setTempValue] = useState(bath.temp);

  useEffect(() => {
    setTempValue(bath.temp);
  }, [bath.temp]);

  const runningCount = bath.circuits ? bath.circuits.filter(c => {
      const s = c.status ? c.status.toLowerCase().trim() : '';
      return s === 'running' || s === 'finished'; // Conta finalizados como "Ocupados"
  }).length : 0;
  
  const freeCount = bath.circuits ? bath.circuits.filter(c => (!c.status || c.status.toLowerCase().trim() === 'free')).length : 0;
  const maintCount = bath.circuits ? bath.circuits.filter(c => c.status && c.status.toLowerCase().trim() === 'maintenance').length : 0;

  const handleSaveTemp = () => {
    onUpdateTemp(bath.id, tempValue);
    setIsEditingTemp(false);
  };

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-6 transition-all hover:border-blue-200">
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-700 p-2 rounded-md">
            <Thermometer size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-lg">{bath.id}</h3>
              <button 
                onClick={() => onDeleteBath(bath.id)}
                className="text-slate-300 hover:text-rose-500 transition-opacity p-1"
                title="Excluir Banho"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isEditingTemp ? (
                <div className="flex items-center gap-1 animate-in fade-in duration-200">
                  <input 
                    type="number" 
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-16 px-1 py-0.5 text-sm border border-blue-400 rounded focus:outline-none"
                    autoFocus
                  />
                  <span className="text-sm font-medium">ºC</span>
                  <button onClick={handleSaveTemp} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded">
                    <Save size={14} />
                  </button>
                  <button onClick={() => {setIsEditingTemp(false); setTempValue(bath.temp);}} className="p-1 hover:bg-rose-100 text-rose-600 rounded">
                    <XCircle size={14} />
                  </button>
                </div>
              ) : (
                <div className="group flex items-center gap-2 cursor-pointer" onClick={() => setIsEditingTemp(true)}>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    SETPOINT: {bath.temp}ºC
                  </span>
                  <Edit2 size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-2 text-xs mr-2">
            <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded">
              <Activity size={12} /> {runningCount}
            </div>
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              <CheckCircle size={12} /> {freeCount}
            </div>
            {maintCount > 0 && (
                <div className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-1 rounded animate-pulse">
                    <Wrench size={12} /> {maintCount}
                </div>
            )}
          </div>

          <button 
            onClick={() => onAddCircuit(bath.id)}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
          >
            <Plus size={14} />
            Add Circuito
          </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {bath.circuits && bath.circuits.map(circuit => (
          <CircuitCard 
            key={circuit.id} 
            circuit={circuit} 
            onDelete={(cid) => onDeleteCircuit(bath.id, cid)}
            onToggleMaintenance={(cid, isMaint) => onToggleMaintenance(bath.id, cid, isMaint)}
            onViewHistory={onViewHistory}
          />
        ))}
        {(!bath.circuits || bath.circuits.length === 0) && (
          <div className="col-span-full py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
            <p className="text-sm">Vazio.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 3. History View
const HistoryView = ({ logs }) => {
  const [viewMode, setViewMode] = useState('logs'); // 'logs' or 'chart'
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
      if(viewMode === 'chart') {
          fetch(`${API_URL}/oee/history`).then(r=>r.json()).then(setHistoryData).catch(console.error);
      }
  }, [viewMode]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div className="flex gap-4">
            <button onClick={()=>setViewMode('logs')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${viewMode==='logs'?'bg-white shadow text-blue-600':'text-slate-500 hover:text-slate-700'}`}>
                <List size={16} /> Logs Operacionais
            </button>
            <button onClick={()=>setViewMode('chart')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${viewMode==='chart'?'bg-white shadow text-blue-600':'text-slate-500 hover:text-slate-700'}`}>
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
                        <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
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

// 4. Modais

// Gerenciador de Testes (Dicionário)
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
                    <h2 className="font-bold uppercase text-xs tracking-widest flex items-center gap-2"><Settings size={16}/> Configurar Testes</h2>
                    <button onClick={onClose}><XCircle size={20}/></button>
                </div>
                <div className="p-6">
                    <div className="flex gap-2 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <input type="text" placeholder="Nome (ex: SAEJ2801)" className="flex-1 p-2 text-xs font-bold border rounded uppercase" value={newName} onChange={e => setNewName(e.target.value)} />
                        <input type="number" placeholder="Horas" className="w-20 p-2 text-xs font-bold border rounded" value={newDuration} onChange={e => setNewDuration(e.target.value)} />
                        <button onClick={handleAdd} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={16}/></button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {protocols && protocols.map(p => (
                            <div key={p.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                                <div>
                                    <span className="font-bold text-slate-700 text-sm block">{p.name}</span>
                                    <span className="text-xs text-slate-400 font-bold">{p.duration} Horas ({Math.round(p.duration/24)} dias)</span>
                                </div>
                                <button onClick={() => onDeleteProtocol(p.id)} className="text-rose-400 hover:text-rose-600"><Trash2 size={14}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Histórico do Circuito
const CircuitHistoryModal = ({ isOpen, onClose, circuit, logs }) => {
    if (!isOpen || !circuit) return null;
    const circuitLogs = logs.filter(l => (l.details && l.details.includes(`C-${circuit.id}`)) || (circuit.batteryId && l.details && l.details.includes(circuit.batteryId)));

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-xl text-slate-800">Histórico C-{circuit.id}</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Rastreabilidade Individual</p>
                    </div>
                    <button onClick={onClose} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><XCircle size={20}/></button>
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
    if(!text) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if(data.sucesso) {
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
  const [num, setNum] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in">
        <div className="bg-blue-900 text-white px-4 py-3 flex justify-between items-center"><h2 className="font-bold">Novo Circuito</h2></div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-bold text-2xl text-slate-300">C-</span>
            <input type="number" className="w-24 border-b-2 p-1 text-3xl font-black text-slate-800 focus:border-blue-500 outline-none text-center" value={num} onChange={(e) => setNum(e.target.value)} autoFocus placeholder="000" />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-slate-500">Cancelar</button>
            <button onClick={() => {onConfirm(bathId, num); setNum('');}} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md">Salvar</button>
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
            <button onClick={() => {onConfirm(name, temp); setName('');}} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase shadow-lg">Criar Unidade</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function LabManagerApp() {
  const [baths, setBaths] = useState([]);
  const [logs, setLogs] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'history', 'oee'
  const [toast, setToast] = useState(null); // { message, type }
  
  // Modais States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddBathOpen, setIsAddBathOpen] = useState(false);
  const [isProtocolsOpen, setIsProtocolsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [targetBath, setTargetBath] = useState(null);
  const [targetCircuit, setTargetCircuit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. CARREGAR DADOS DO PYTHON E ATUALIZAR TEMPO REAL
  useEffect(() => { 
    fetchData(); 
    // Atualiza a cada 10 segundos para ver se o tempo do teste acabou
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/data`);
      const data = await response.json();
      setBaths(data.baths || []);
      setLogs(data.logs || []);
      setProtocols(data.protocols || []);
    } catch (e) { console.error("Falha ao carregar."); }
  };

  // --- HANDLERS ---

  const addCircuit = async (bathId, num) => {
    if(!num) return;
    try {
      const res = await fetch(`${API_URL}/circuits/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bathId, circuitId: num })
      });
      const d = await res.json();
      if(d.error) setToast({ message: d.error, type: 'error' });
      else { setBaths(d.baths); setLogs(d.logs); setIsAddOpen(false); }
    } catch (e) { setToast({ message: "Falha no servidor.", type: 'error' }); }
  };

  const deleteCircuit = async (bathId, circuitId) => {
    if(!window.confirm(`Excluir circuito ${circuitId}?`)) return;
    try {
      const res = await fetch(`${API_URL}/circuits/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bathId, circuitId })
      });
      const d = await res.json();
      setBaths(d.baths);
      setLogs(d.logs);
    } catch (e) { setToast({ message: "Erro ao deletar.", type: 'error' }); }
  };

  const updateTemp = async (bathId, temp) => {
    try {
      const res = await fetch(`${API_URL}/baths/temp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bathId, temp: Number(temp) })
      });
      const d = await res.json();
      setBaths(d.baths);
      setLogs(d.logs);
    } catch (e) { setToast({ message: "Erro ao salvar temperatura.", type: 'error' }); }
  };

  const toggleMaintenance = async (bathId, circuitId, isMaint) => {
    // Se for maintenance, vira 'free'. Se for free/running, vira 'maintenance'
    // Se for 'finished', o isMaint é 'true' no parâmetro para liberar também.
    const newStatus = isMaint ? 'free' : 'maintenance';
    try {
      const res = await fetch(`${API_URL}/circuits/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bathId, circuitId, status: newStatus })
      });
      const d = await res.json();
      setBaths(d.baths);
      setLogs(d.logs);
    } catch (e) { setToast({ message: "Erro ao atualizar status.", type: 'error' }); }
  };

  const addBath = async (id, temp) => {
    if(!id) return;
    try {
      const fullId = `BANHO - ${id.toUpperCase()}`; // Aplica o prefixo aqui
      const res = await fetch(`${API_URL}/baths/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bathId: fullId, temp: Number(temp) })
      });
      const d = await res.json();
      if(d.error) setToast({ message: d.error, type: 'error' });
      else { setBaths(d.baths); setLogs(d.logs); setIsAddBathOpen(false); }
    } catch (e) { setToast({ message: "Erro ao criar banho.", type: 'error' }); }
  };

  const deleteBath = async (bathId) => {
    if(!window.confirm(`Excluir permanentemente o ${bathId}?`)) return;
    try {
      const res = await fetch(`${API_URL}/baths/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bathId })
      });
      const d = await res.json();
      setBaths(d.baths);
      setLogs(d.logs);
    } catch (e) { setToast({ message: "Erro ao excluir banho.", type: 'error' }); }
  };

  const handleAddProtocol = async (name, duration) => {
    try {
      const res = await fetch(`${API_URL}/protocols/add`, {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ name, duration })
      });
      const d = await res.json();
      setProtocols(d.protocols);
    } catch(e) { setToast({ message: "Erro protocolos", type: 'error' }); }
  };

  const handleDeleteProtocol = async (id) => {
      if(!confirm("Apagar?")) return;
      try {
        const res = await fetch(`${API_URL}/protocols/delete`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id })
        });
        const d = await res.json();
        setProtocols(d.protocols);
      } catch(e) { setToast({ message: "Erro ao apagar", type: 'error' }); }
  };

  // Contadores Totais para a Visão Geral
  // Ajustado para contar finished como 'Em uso'
  const totalRunning = baths.reduce((acc, bath) => acc + (bath.circuits ? bath.circuits.filter(c => {
      const s = c.status ? c.status.toLowerCase().trim() : '';
      return s === 'running' || s === 'finished';
  }).length : 0), 0);
  
  const totalFree = baths.reduce((acc, bath) => acc + (bath.circuits ? bath.circuits.filter(c => (!c.status || c.status.toLowerCase().trim() === 'free')).length : 0), 0);
  
  const totalMaint = baths.reduce((acc, bath) => acc + (bath.circuits ? bath.circuits.filter(c => c.status && c.status.toLowerCase().trim() === 'maintenance').length : 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-10">
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900 text-white p-1.5 rounded-md"><Zap size={24} fill="currentColor" /></div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">LabManager</h1>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Controle de Recursos</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-slate-100 p-1 rounded-lg mr-4">
              <button onClick={() => setCurrentView('dashboard')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${currentView === 'dashboard' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Banhos</button>
              <button onClick={() => setCurrentView('oee')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'oee' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                 <Factory size={14} /> OEE
              </button>
              <button onClick={() => setCurrentView('history')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${currentView === 'history' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Histórico</button>
            </div>
            
            <div className="h-6 w-[1px] bg-slate-200"></div>

            <button onClick={() => setIsProtocolsOpen(true)} className="text-slate-400 hover:text-slate-600 transition-colors" title="Configurar Testes">
               <Settings size={20} />
             </button>

            <button onClick={() => setIsImportOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95">
              <Clipboard size={18} /><span className="hidden sm:inline">Importar Digatron</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* RENDERIZAÇÃO CONDICIONAL DAS VIEWS */}
        
        {currentView === 'oee' && <OEEDashboardView setToast={setToast} />}
        
        {currentView === 'history' && <HistoryView logs={logs} />}

        {currentView === 'dashboard' && (
          <>
            <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex gap-4 items-center w-full sm:w-auto">
                <h2 className="text-2xl font-bold text-slate-800">Visão Geral dos Banhos</h2>
                <div className="hidden md:flex gap-3 ml-4 pl-4 border-l border-slate-300">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100">{totalRunning} Em Uso</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">{totalFree} Livres</span>
                  
                  {totalMaint > 0 && (
                     <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-100 animate-pulse flex items-center gap-1">
                        <Wrench size={12} /> {totalMaint} Manutenção
                     </span>
                  )}
                </div>
              </div>
              <div className="relative w-full sm:w-96 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar circuito ou bateria..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
            </div>

            <div>
              {baths
                .filter(b => b.id.includes(searchTerm) || b.circuits.some(c => c.id.includes(searchTerm) || (c.batteryId && c.batteryId.includes(searchTerm))))
                .map(bath => (
                <BathContainer 
                  key={bath.id} 
                  bath={bath} 
                  onAddCircuit={(bid) => {setTargetBath(bid); setIsAddOpen(true);}}
                  onUpdateTemp={updateTemp}
                  onDeleteCircuit={deleteCircuit}
                  onToggleMaintenance={toggleMaintenance}
                  onDeleteBath={deleteBath}
                  onViewHistory={(c) => { setTargetCircuit(c); setIsHistoryOpen(true); }}
                />
              ))}

              <button 
                onClick={() => setIsAddBathOpen(true)}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <Plus size={20} /> Adicionar Nova Unidade / Banho
              </button>
            </div>
          </>
        )}
      </main>

      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImportSuccess={(db) => {setBaths(db.baths); setLogs(db.logs);}} />
      <AddCircuitModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onConfirm={addCircuit} bathId={targetBath} />
      <AddBathModal isOpen={isAddBathOpen} onClose={() => setIsAddBathOpen(false)} onConfirm={addBath} />
      <TestManagerModal isOpen={isProtocolsOpen} onClose={() => setIsProtocolsOpen(false)} protocols={protocols} onAddProtocol={handleAddProtocol} onDeleteProtocol={handleDeleteProtocol} />
      <CircuitHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} circuit={targetCircuit} logs={logs} />

      <footer className="w-full text-center py-6 border-t border-slate-200 mt-8">
        <p className="text-xs text-slate-400 font-medium">
          Desenvolvido por <span className="font-bold text-slate-600">João Victor</span> © 2026
          <br />
          LabManager System v2.0 (Integrated OEE)
        </p>
      </footer>
    </div>
  );
}