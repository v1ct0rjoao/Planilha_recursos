import React, { useState, useEffect } from 'react';
import { 
  Grid, Maximize2, Thermometer, Search, ArrowLeft, Plus, PieChart 
} from 'lucide-react'; // <--- ADICIONEI PieChart AQUI

import BathCardMicro from "../../components/business/BathCardMicro";
import BathContainer from "../../components/business/BathContainer";
import AllCircuitsView from "../../components/business/AllCircuitsView";

// Importe o novo Modal
import UsageStatsModal from "../../components/ui/UsageStatsModal"
import TemperatureStatsModal from "../../components/ui/TemperatureStatsModal";

const DashboardView = ({ 
  baths = [], 
  onAddCircuit, 
  onDeleteCircuit, 
  onToggleMaintenance, 
  onDeleteBath, 
  onUpdateTemp, 
  onViewHistory, 
  onMoveCircuit, 
  onLinkCircuit, 
  onEditBath,
  onOpenAddBathModal 
}) => {
  const [dashViewMode, setDashViewMode] = useState('baths');
  const [expandedBathId, setExpandedBathId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados dos Modais
  const [isTempStatsOpen, setIsTempStatsOpen] = useState(false);
  const [isUsageStatsOpen, setIsUsageStatsOpen] = useState(false); // <--- NOVO ESTADO

  const safeBaths = baths || [];

  // Lógica de Busca Automática
  useEffect(() => {
    if (searchTerm.length >= 4) {
      for (const bath of safeBaths) {
        const hasExactMatch = bath.circuits && bath.circuits.some(c =>
          (c.batteryId && c.batteryId.toUpperCase() === searchTerm) ||
          (c.id && c.id.toUpperCase() === searchTerm) ||
          (c.id && c.id.toUpperCase() === `C-${searchTerm}`)
        );
        if (hasExactMatch) {
          setExpandedBathId(bath.id);
          setDashViewMode('baths');
          break;
        }
      }
    }
  }, [searchTerm, safeBaths]);

  const totalRunning = safeBaths.reduce((acc, bath) => acc + ((bath.circuits || []).filter(c => { const s = c.status ? c.status.toLowerCase().trim() : ''; return s === 'running' && c.progress < 100; }).length), 0);
  const totalFree = safeBaths.reduce((acc, bath) => acc + ((bath.circuits || []).filter(c => { const s = c.status ? c.status.toLowerCase().trim() : 'free'; return (s === 'free' || s === 'finished' || c.progress >= 100) && s !== 'maintenance'; }).length), 0);
  const totalMaint = safeBaths.reduce((acc, bath) => acc + ((bath.circuits || []).filter(c => c.status === 'maintenance').length), 0);

  const filteredBaths = safeBaths.filter(b =>
    b.id.toUpperCase().includes(searchTerm) ||
    (b.circuits || []).some(c => (c.id && c.id.toUpperCase().includes(searchTerm)) || (c.batteryId && c.batteryId.toUpperCase().includes(searchTerm)))
  );
  
  const half = Math.ceil(filteredBaths.length / 2);
  const leftBaths = filteredBaths.slice(0, half);
  const rightBaths = filteredBaths.slice(half);

  return (
    <div className="h-full flex flex-col">
      {/* Barra de Topo */}
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
            
            {/* --- SEPARAÇÃO --- */}
            <div className="w-[1px] bg-slate-300 mx-1 my-1"></div>

            <button 
              onClick={() => setIsTempStatsOpen(true)} 
              className="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 bg-white text-slate-500 hover:text-blue-700 hover:shadow shadow-sm" 
              title="Distribuição Térmica"
            >
              <Thermometer size={14} />
            </button>
            

            <button 
              onClick={() => setIsUsageStatsOpen(true)} 
              className="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 bg-white text-slate-500 hover:text-blue-700 hover:shadow shadow-sm ml-1" 
              title="Gráfico de Ocupação"
            >
              <PieChart size={14} />
            </button>
          </div>

          <div className="hidden md:flex gap-3 ml-4 pl-4 border-l border-slate-300">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100">{totalRunning} Em Uso</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">{totalFree} Livres</span>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-100">{totalMaint} Em Manutenção</span>
          </div>
        </div>

        <div className="relative w-full sm:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar circuito ou local..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())} 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" 
          />
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {dashViewMode === 'all_circuits' && (
          <AllCircuitsView 
            baths={filteredBaths} 
            searchTerm={searchTerm} 
            onDeleteCircuit={onDeleteCircuit} 
            onToggleMaintenance={onToggleMaintenance} 
            onViewHistory={onViewHistory} 
          />
        )}

        {dashViewMode === 'baths' && !expandedBathId && (
          <div className="flex gap-8 h-full overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3 content-start">
              {leftBaths.map(bath => (
                <BathCardMicro key={bath.id} bath={bath} onClick={() => setExpandedBathId(bath.id)} onDelete={onDeleteBath} />
              ))}
            </div>
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3 content-start">
              {rightBaths.map(bath => (
                <BathCardMicro key={bath.id} bath={bath} onClick={() => setExpandedBathId(bath.id)} onDelete={onDeleteBath} />
              ))}
              
              <button onClick={onOpenAddBathModal} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-slate-50 transition-all gap-1 group h-[112px]">
                <div className="bg-slate-100 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
                  <Plus size={20} />
                </div>
                <span className="font-bold text-xs">Nova Unidade / Local</span>
              </button>
            </div>
          </div>
        )}

        {expandedBathId && (
          <div className="animate-in zoom-in duration-200 h-full overflow-y-auto custom-scrollbar">
            <button onClick={() => setExpandedBathId(null)} className="mb-4 text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft size={16} /> Voltar para lista
            </button>
            {safeBaths.filter(b => b.id === expandedBathId).map(bath => (
              <BathContainer 
                key={bath.id} 
                bath={bath} 
                searchTerm={searchTerm} 
                onAddCircuit={onAddCircuit} 
                onUpdateTemp={onUpdateTemp} 
                onDeleteCircuit={onDeleteCircuit} 
                onToggleMaintenance={onToggleMaintenance} 
                onDeleteBath={onDeleteBath} 
                onViewHistory={onViewHistory} 
                onMoveCircuit={onMoveCircuit} 
                onLinkCircuit={onLinkCircuit} 
                onEditBath={onEditBath} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Modais */}
      <TemperatureStatsModal isOpen={isTempStatsOpen} onClose={() => setIsTempStatsOpen(false)} baths={safeBaths} />
      
      {/* --- O NOVO MODAL ESTÁ AQUI --- */}
      <UsageStatsModal isOpen={isUsageStatsOpen} onClose={() => setIsUsageStatsOpen(false)} baths={safeBaths} />
      
    </div>
  );
};

export default DashboardView;