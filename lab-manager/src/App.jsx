import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Thermometer, 
  Activity, 
  Clock, 
  Search, 
  Menu, 
  MoreVertical, 
  BatteryCharging, 
  Zap, 
  Plus, 
  FileText, 
  History, 
  Edit2, 
  Save, 
  Trash2, 
  Clipboard, 
  Wrench, 
  CheckSquare, 
  Settings
} from 'lucide-react';

const API_URL = 'http://127.0.0.1:5000/api';

// --- FUNÇÃO AUXILIAR DE TEMPO ---
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

// --- COMPONENTS ---

// 1. Circuito (Individual Slot)
const CircuitCard = ({ circuit, onDelete, onToggleMaintenance, onViewHistory }) => {
  // Normaliza o status para evitar erros
  const normalizedStatus = circuit.status ? circuit.status.toString().toLowerCase().trim() : 'free';
  
  // O teste acabou se o backend disser 'finished' OU se for 'running' e o tempo já passou
  const isFinished = normalizedStatus === 'finished' || (normalizedStatus === 'running' && verificarFimTeste(circuit.previsao));
  
  // Define se deve mostrar o card "Ativo" (com bateria) ou os outros estados
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
          
          <button 
            onClick={() => onViewHistory(circuit)}
            className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-blue-500"
            title="Ver Histórico"
          >
            <Clock size={14} />
          </button>

          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
            {(showActiveCard) && (
               <button 
                // Se já estiver finished, o clique serve para liberar (status vira free)
                onClick={() => onToggleMaintenance(circuit.id, true)} 
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-500"
                title="Finalizar e Liberar"
               >
                 {isFinished ? <CheckSquare size={14} className="text-blue-500" /> : <Wrench size={14} />}
               </button>
            )}

            {/* Botão de Manutenção só aparece se NÃO estiver rodando/finalizado, ou no modo Manutenção */}
            {(!showActiveCard) && (
                <button
                    onClick={() => onToggleMaintenance(circuit.id, normalizedStatus === 'maintenance')}
                    className={`p-1 rounded hover:bg-slate-100 ${normalizedStatus === 'maintenance' ? 'text-emerald-500' : 'text-slate-400'}`}
                    title={normalizedStatus === 'maintenance' ? "Liberar" : "Colocar em Manutenção"}
                >
                    <Wrench size={14} />
                </button>
            )}
            
            {normalizedStatus === 'free' && (
              <button 
                onClick={() => onDelete(circuit.id)}
                className="text-slate-300 hover:text-rose-500 p-1 rounded"
              >
                <Trash2 size={14} />
              </button>
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
          
          {isFinished ? (
             <div className="text-[10px] text-blue-600 font-bold mb-2 flex items-center gap-1">
                <CheckCircle size={10} /> TESTE CONCLUÍDO
             </div>
          ) : (
             <div className="text-[10px] text-amber-600 font-bold mb-2 flex items-center gap-1">
                <Activity size={10} className="animate-pulse" /> EM ANDAMENTO
             </div>
          )}
          
          <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
            <div 
              className={`${isFinished ? 'bg-blue-500' : 'bg-amber-500'} h-2 rounded-full transition-all duration-1000`} 
              style={{ width: isFinished ? '100%' : `${circuit.progress || 5}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Fim estimado:</span>
            <span className={`font-bold ${isFinished ? 'text-blue-600' : 'text-slate-600'}`}>
                {circuit.previsao || '-'}
            </span>
          </div>
        </div>
      ) : normalizedStatus === 'free' ? (
        <div className="flex flex-col items-center justify-center py-4 text-emerald-600/50">
          <span className="text-xs font-medium uppercase tracking-widest">Disponível</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1 py-1">
          <span className="text-xs font-bold text-rose-700 flex items-center gap-1 uppercase tracking-tight">
            <AlertTriangle size={12} /> Manutenção
          </span>
          <span className="text-[10px] text-rose-600/80 italic">{circuit.error || 'Aguardando reparo'}</span>
        </div>
      )}
    </div>
  );
};

// 2. Bath Container (Group of Circuits)
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
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <FileText size={20} className="text-slate-500" />
            Planilha de Controle Online
          </h3>
          <p className="text-sm text-slate-500">Registro automático de uso dos banhos e circuitos.</p>
        </div>
        <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
          Exportar Excel <UploadCloud size={14} />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs tracking-wider border-b border-slate-200">
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
    </div>
  );
};

// 4. Modais

// NOVO: Gerenciador de Testes (Dicionário)
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

// NOVO: Histórico do Circuito
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
  const [currentView, setCurrentView] = useState('dashboard');
  
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
      if(d.error) alert(d.error);
      else { setBaths(d.baths); setLogs(d.logs); setIsAddOpen(false); }
    } catch (e) { alert("Falha no servidor."); }
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
    } catch (e) { alert("Erro ao deletar."); }
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
    } catch (e) { alert("Erro ao salvar temperatura."); }
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
    } catch (e) { alert("Erro ao atualizar status."); }
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
      if(d.error) alert(d.error);
      else { setBaths(d.baths); setLogs(d.logs); setIsAddBathOpen(false); }
    } catch (e) { alert("Erro ao criar banho."); }
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
    } catch (e) { alert("Erro ao excluir banho."); }
  };

  const handleAddProtocol = async (name, duration) => {
    try {
      const res = await fetch(`${API_URL}/protocols/add`, {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ name, duration })
      });
      const d = await res.json();
      setProtocols(d.protocols);
    } catch(e) { alert("Erro protocolos"); }
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
      } catch(e) { alert("Erro ao apagar"); }
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
              <button onClick={() => setCurrentView('dashboard')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${currentView === 'dashboard' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Dashboard</button>
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
        {currentView === 'dashboard' ? (
          <>
            <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex gap-4 items-center w-full sm:w-auto">
                <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
                <div className="hidden md:flex gap-3 ml-4 pl-4 border-l border-slate-300">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100">{totalRunning} Em Uso</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">{totalFree} Livres</span>
                  
                  {/* INDICADOR DE MANUTENÇÃO NA VISÃO GERAL */}
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
        ) : (
          <HistoryView logs={logs} />
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
          LabManager System v1.0
        </p>
      </footer>
    </div>
  );
}