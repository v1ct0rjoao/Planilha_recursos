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
  Trash2
} from 'lucide-react';

// --- MOCK DATA (Dados Iniciais) ---
const INITIAL_DATA = [
  {
    id: 'BANHO-01',
    temp: 25,
    circuits: [
      { id: 'C-01', status: 'running', batteryId: 'BAT_1C20_A', protocol: 'J2801', startTime: '10:00', progress: 45 },
      { id: 'C-02', status: 'running', batteryId: 'BAT_1C20_B', protocol: 'J2801', startTime: '10:05', progress: 42 },
      { id: 'C-03', status: 'free', batteryId: null, protocol: null, startTime: null, progress: 0 },
      { id: 'C-04', status: 'maintenance', batteryId: null, protocol: null, startTime: null, progress: 0, error: 'Sensor falhando' },
    ]
  },
  {
    id: 'BANHO-06',
    temp: 75,
    circuits: [
      { id: 'C-05', status: 'running', batteryId: 'BAT_HV_99', protocol: 'ISO-12', startTime: '08:00', progress: 80 },
      { id: 'C-06', status: 'running', batteryId: 'BAT_HV_98', protocol: 'ISO-12', startTime: '08:00', progress: 78 },
      { id: 'C-07', status: 'free', batteryId: null, protocol: null, startTime: null, progress: 0 },
    ]
  }
];

const MOCK_LOGS = [
  { id: 1, date: '14/01/2026 08:00', action: 'Início de Teste', bath: 'BANHO-06', details: 'Bateria BAT_HV_99 (ISO-12)' },
  { id: 2, date: '14/01/2026 08:00', action: 'Início de Teste', bath: 'BANHO-06', details: 'Bateria BAT_HV_98 (ISO-12)' },
  { id: 3, date: '14/01/2026 09:15', action: 'Manutenção', bath: 'BANHO-01', details: 'Circuito C-04 reportou erro de sensor' },
  { id: 4, date: '14/01/2026 10:00', action: 'Início de Teste', bath: 'BANHO-01', details: 'Bateria BAT_1C20_A (J2801)' },
  { id: 5, date: '14/01/2026 14:30', action: 'Alerta', bath: 'BANHO-09', details: 'Temperatura fora da faixa (+2ºC)' },
];

// --- COMPONENTS ---

// 1. Circuit Card (Individual Slot)
const CircuitCard = ({ circuit }) => {
  return (
    <div className={`
      relative p-3 rounded-md border-l-4 shadow-sm bg-white transition-all hover:shadow-md
      ${circuit.status === 'running' ? 'border-amber-400' : 
        circuit.status === 'free' ? 'border-emerald-400' : 'border-rose-500'}
    `}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-slate-500 tracking-wider">CIRC. {circuit.id}</span>
        {circuit.status === 'running' && (
          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-1 rounded">
            {circuit.startTime}
          </span>
        )}
      </div>

      {circuit.status === 'running' ? (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BatteryCharging size={16} className="text-amber-600" />
            <span className="font-mono text-sm font-bold text-slate-800">{circuit.batteryId}</span>
          </div>
          <div className="text-xs text-slate-500 mb-2">Protocolo: <span className="font-medium">{circuit.protocol}</span></div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
            <div 
              className="bg-amber-500 h-2 rounded-full transition-all duration-1000" 
              style={{ width: `${circuit.progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Progresso</span>
            <span>{circuit.progress}%</span>
          </div>
        </div>
      ) : circuit.status === 'free' ? (
        <div className="flex flex-col items-center justify-center py-4 text-emerald-600/50">
          <span className="text-xs font-medium">LIVRE</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
            <AlertTriangle size={12} /> BLOQUEADO
          </span>
          <span className="text-[10px] text-rose-600/80">{circuit.error}</span>
        </div>
      )}
    </div>
  );
};

// 2. Bath Container (Group of Circuits)
const BathContainer = ({ bath, onAddCircuit, onUpdateTemp }) => {
  const [isEditingTemp, setIsEditingTemp] = useState(false);
  const [tempValue, setTempValue] = useState(bath.temp);

  const runningCount = bath.circuits.filter(c => c.status === 'running').length;
  const freeCount = bath.circuits.filter(c => c.status === 'free').length;

  const handleSaveTemp = () => {
    onUpdateTemp(bath.id, tempValue);
    setIsEditingTemp(false);
  };

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-6 transition-all hover:border-blue-200">
      {/* Bath Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-700 p-2 rounded-md">
            <Thermometer size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">{bath.id}</h3>
            
            {/* Editable Temperature */}
            <div className="flex items-center gap-2 mt-1">
              {isEditingTemp ? (
                <div className="flex items-center gap-1 animate-in fade-in duration-200">
                  <input 
                    type="number" 
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-16 px-1 py-0.5 text-sm border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <span className="text-sm font-medium">ºC</span>
                  <button onClick={handleSaveTemp} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded">
                    <Save size={14} />
                  </button>
                  <button onClick={() => setIsEditingTemp(false)} className="p-1 hover:bg-rose-100 text-rose-600 rounded">
                    <XCircle size={14} />
                  </button>
                </div>
              ) : (
                <div 
                  className="group flex items-center gap-2 cursor-pointer"
                  onClick={() => setIsEditingTemp(true)}
                  title="Clique para alterar temperatura"
                >
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    SETPOINT: {bath.temp}ºC
                  </span>
                  <Edit2 size={12} className="text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions & Stats */}
        <div className="flex items-center gap-4">
           {/* Mini Stats */}
          <div className="flex gap-2 text-xs mr-2">
            <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded">
              <Activity size={12} /> {runningCount}
            </div>
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              <CheckCircle size={12} /> {freeCount}
            </div>
          </div>

          <button 
            onClick={() => onAddCircuit(bath.id)}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors"
          >
            <Plus size={14} />
            Add Circuito
          </button>
        </div>
      </div>

      {/* Circuits Grid */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {bath.circuits.map(circuit => (
          <CircuitCard key={circuit.id} circuit={circuit} />
        ))}
        
        {/* Empty State / Add Suggestion if empty */}
        {bath.circuits.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
            <p className="text-sm">Nenhum circuito configurado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 3. History View (Spreadsheet Replacement)
const HistoryView = () => {
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
              <th className="px-6 py-3">Detalhes da Operação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_LOGS.map((log) => (
              <tr key={log.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="px-6 py-3 font-mono text-slate-500 border-r border-slate-100">{log.date}</td>
                <td className="px-6 py-3 font-bold text-slate-700 border-r border-slate-100">{log.bath}</td>
                <td className="px-6 py-3 border-r border-slate-100">
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
                    ${log.action === 'Manutenção' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                      log.action === 'Alerta' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}
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
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
        Mostrando os últimos 5 registros
      </div>
    </div>
  );
};

// 4. Upload/OCR Modal Simulation
const UploadModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('idle'); // idle, scanning, validating, error
  const [scannedData, setScannedData] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('idle');
      setScannedData(null);
    }
  }, [isOpen]);

  const handleSimulateScan = () => {
    setStep('scanning');
    setTimeout(() => {
      setScannedData({
        circuit: 'C-03',
        detectedId: 'BAT_HV_XP2',
        detectedProtocol: 'TEST_LOW_V',
        expectedFormat: 'HIGH_VOLT',
        status: 'warning' 
      });
      setStep('validating');
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2"><Camera size={20} /> Leitura Automatizada</h2>
          <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded transition"><XCircle size={20} /></button>
        </div>
        <div className="p-6">
          {step === 'idle' && (
            <div 
              className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-blue-500 transition-colors group"
              onClick={handleSimulateScan}
            >
              <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform"><Camera size={32} /></div>
              <h3 className="font-bold text-slate-700 mb-1">Capturar Tela do Equipamento</h3>
              <p className="text-sm text-slate-500 max-w-xs">Clique para abrir a câmera ou arraste a foto.</p>
            </div>
          )}
          {step === 'scanning' && (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 font-medium animate-pulse">Processando imagem (OCR)...</p>
            </div>
          )}
          {step === 'validating' && scannedData && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-amber-800 text-sm">Atenção Necessária</h4>
                  <p className="text-xs text-amber-700 mt-1">Inconsistência entre ID e protocolo.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Circuito</label>
                  <div className="bg-slate-100 p-2 rounded text-slate-800 font-mono font-bold">{scannedData.circuit}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Protocolo Lido</label>
                  <div className="bg-slate-100 p-2 rounded text-slate-800 font-mono">{scannedData.detectedProtocol}</div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('idle')} className="flex-1 py-3 px-4 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50">Descartar</button>
                <button onClick={onClose} className="flex-1 py-3 px-4 bg-blue-600 rounded-lg text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">Confirmar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function LabManagerApp() {
  const [baths, setBaths] = useState(INITIAL_DATA);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'history'
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Function to Add Circuit
  const addCircuit = (bathId) => {
    setBaths(prevBaths => prevBaths.map(bath => {
      if (bath.id === bathId) {
        const nextIdNumber = bath.circuits.length + 1; // Simple ID generation
        const newCircuit = {
          id: `C-NEW-${Math.floor(Math.random() * 1000)}`, // Temporary ID
          status: 'free',
          batteryId: null,
          protocol: null,
          startTime: null,
          progress: 0
        };
        return { ...bath, circuits: [...bath.circuits, newCircuit] };
      }
      return bath;
    }));
  };

  // Function to Update Temperature
  const updateTemp = (bathId, newTemp) => {
    setBaths(prevBaths => prevBaths.map(bath => 
      bath.id === bathId ? { ...bath, temp: newTemp } : bath
    ));
  };

  const totalRunning = baths.reduce((acc, bath) => acc + bath.circuits.filter(c => c.status === 'running').length, 0);
  const totalFree = baths.reduce((acc, bath) => acc + bath.circuits.filter(c => c.status === 'free').length, 0);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900 text-white p-1.5 rounded-md">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">LabManager</h1>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Controle de Recursos</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Switcher (Tabs) */}
            <div className="hidden sm:flex bg-slate-100 p-1 rounded-lg mr-4">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'dashboard' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setCurrentView('history')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'history' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Histórico
              </button>
            </div>

            <button 
              onClick={() => setIsUploadOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Camera size={18} />
              <span className="hidden sm:inline">Nova Leitura</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {currentView === 'dashboard' ? (
          <>
            {/* Search / Filter Bar */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex gap-4 items-center w-full sm:w-auto">
                <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
                <div className="hidden md:flex gap-3 ml-4 pl-4 border-l border-slate-300">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100">{totalRunning} Em Uso</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">{totalFree} Livres</span>
                </div>
              </div>
              <div className="relative w-full sm:w-96 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar circuito, ID de bateria..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
              </div>
            </div>

            {/* Baths Grid */}
            <div>
              {baths.map(bath => (
                <BathContainer 
                  key={bath.id} 
                  bath={bath} 
                  onAddCircuit={addCircuit}
                  onUpdateTemp={updateTemp}
                />
              ))}
              
              {/* Add Bath Button (Placeholder) */}
              <button className="w-full py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 font-medium">
                <Plus size={20} /> Adicionar Novo Banho
              </button>
            </div>
          </>
        ) : (
          <HistoryView />
        )}

      </main>

      {/* Upload Modal (Overlay) */}
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

    </div>
  );
}