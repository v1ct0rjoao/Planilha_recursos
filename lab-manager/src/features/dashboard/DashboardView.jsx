import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Grid, Maximize2, Thermometer, Search, ArrowLeft, Plus, PieChart, Users, Filter
} from 'lucide-react'; 

import BathCardMicro from "../../components/business/BathCardMicro";
import BathContainer from "../../components/business/BathContainer";
import AllCircuitsView from "../../components/business/AllCircuitsView";

import UsageStatsModal from "../../components/ui/UsageStatsModal";
import TemperatureStatsModal from "../../components/ui/TemperatureStatsModal";
import ExperienceOwnerModal from "../../components/ui/ExperienceOwnerModal"; 

const DashboardView = ({ 
  baths = [], 
  experienceOwners = {}, 
  onRefreshData,         
  onAddCircuit, 
  onDeleteCircuit, 
  onToggleMaintenance, 
  onDeleteBath, 
  onUpdateTemp, 
  onViewHistory, 
  onMoveCircuit, 
  onLinkCircuit, 
  onEditBath,
  onOpenAddBathModal,
  onToggleBathFull,          // <-- RECEBE AQUI DO APP.JSX
  onToggleCircuitNoSpace     // <-- RECEBE AQUI DO APP.JSX
}) => {
  const [dashViewMode, setDashViewMode] = useState('baths');
  const [expandedBathId, setExpandedBathId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeCategory, setActiveCategory] = useState('Todos');
  
  const [isTempStatsOpen, setIsTempStatsOpen] = useState(false);
  const [isUsageStatsOpen, setIsUsageStatsOpen] = useState(false); 
  const [isExpOwnerOpen, setIsExpOwnerOpen] = useState(false); 

  const safeBaths = useMemo(() => baths || [], [baths]);

  useEffect(() => {
    if (searchTerm.length >= 4) {
      for (const bath of safeBaths) {
        const hasExactMatch = bath.circuits && bath.circuits.some(c =>
          (c.batteryId && c.batteryId.toUpperCase() === searchTerm.toUpperCase()) ||
          (c.id && c.id.toUpperCase() === searchTerm.toUpperCase()) ||
          (c.id && c.id.toUpperCase() === `C-${searchTerm.toUpperCase()}`)
        );
        if (hasExactMatch && dashViewMode !== 'all_circuits') {
          setExpandedBathId(bath.id);
          setDashViewMode('baths');
          break;
        }
      }
    }
  }, [searchTerm, safeBaths, dashViewMode]);

  const handleNavigateToCircuits = useCallback((expCode) => {
    setSearchTerm(expCode); 
    setExpandedBathId(null); 
    setDashViewMode('all_circuits'); 
    setIsExpOwnerOpen(false); 
  }, []);

  const stats = useMemo(() => {
    let running = 0;
    let free = 0;
    let maint = 0;

    safeBaths.forEach(bath => {
      if (!bath.circuits) return;
      bath.circuits.forEach(c => {
        const s = c.status ? c.status.toLowerCase().trim() : 'free';
        // Note que aqui a gente não subtrai os sem espaço. Ele continua "free" para a estatística global.
        if (s === 'maintenance') {
          maint++;
        } else if (s === 'running' && c.progress < 100) {
          running++;
        } else if (s === 'free' || s === 'finished' || c.progress >= 100) {
          free++;
        }
      });
    });

    return { totalRunning: running, totalFree: free, totalMaint: maint };
  }, [safeBaths]);

  const { filteredBaths, leftBaths, rightBaths } = useMemo(() => {
    const term = searchTerm.toUpperCase();
    
    const filtered = safeBaths.filter(b => {
      if (activeCategory !== 'Todos') {
        const upperId = String(b.id).toUpperCase();
        let isMatch = false;
        
        if (activeCategory === 'Salas' && upperId.includes('SALA')) isMatch = true;
        else if (activeCategory === 'Thermotrons' && upperId.includes('THERMO')) isMatch = true;
        else if (activeCategory === 'Banhos' && !upperId.includes('SALA') && !upperId.includes('THERMO')) isMatch = true;
        
        if (!isMatch) return false;
      }

      if (term) {
        const textMatch = b.id.toUpperCase().includes(term) ||
          (b.circuits || []).some(c => 
            (c.id && c.id.toUpperCase().includes(term)) || 
            (c.batteryId && c.batteryId.toUpperCase().includes(term))
          );
        if (!textMatch) return false;
      }

      return true;
    });
    
    const half = Math.ceil(filtered.length / 2);
    return {
      filteredBaths: filtered,
      leftBaths: filtered.slice(0, half),
      rightBaths: filtered.slice(half)
    };
  }, [safeBaths, searchTerm, activeCategory]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8 flex flex-col lg:flex-row gap-y-5 gap-x-6 justify-between items-start lg:items-center shrink-0">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full lg:w-auto">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Visão Geral</h2>
          
          <div className="flex items-center bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button 
              onClick={() => { setDashViewMode('baths'); setExpandedBathId(null); }} 
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${dashViewMode === 'baths' && !expandedBathId ? 'bg-white text-blue-700 shadow-[0_2px_10px_rgb(0,0,0,0.08)] scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
            >
              <Grid size={16} /> Painel
            </button>
            <button 
              onClick={() => { setDashViewMode('all_circuits'); setExpandedBathId(null); }} 
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${dashViewMode === 'all_circuits' ? 'bg-white text-blue-700 shadow-[0_2px_10px_rgb(0,0,0,0.08)] scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
            >
              <Maximize2 size={16} /> Circuitos
            </button>
            
            <div className="w-[1.5px] h-6 bg-slate-300 mx-2 rounded-full"></div>

            <button onClick={() => setIsTempStatsOpen(true)} className="p-2.5 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-white hover:shadow-sm transition-all group" title="Distribuição Térmica">
              <Thermometer size={18} className="group-hover:scale-110 transition-transform" />
            </button>
            
            <button onClick={() => setIsUsageStatsOpen(true)} className="p-2.5 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-white hover:shadow-sm transition-all ml-0.5 group" title="Gráfico de Ocupação Geral">
              <PieChart size={18} className="group-hover:scale-110 transition-transform" />
            </button>

            <button onClick={() => setIsExpOwnerOpen(true)} className="p-2.5 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-white hover:shadow-sm transition-all ml-0.5 group" title="Gerenciar Solicitantes">
              <Users size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>

          <div className="hidden xl:flex gap-3 pl-6 border-l-2 border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200/60 shadow-sm transition-transform hover:-translate-y-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              {stats.totalRunning} Em Uso
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200/60 shadow-sm transition-transform hover:-translate-y-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {stats.totalFree} Livres
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-50 px-3.5 py-2 rounded-xl border border-rose-200/60 shadow-sm transition-transform hover:-translate-y-0.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {stats.totalMaint} Manut.
            </div>
          </div>
        </div>

        <div className="flex-1 w-full lg:w-auto relative group flex justify-end">
          <div className="relative w-full lg:w-80 xl:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar circuito ou local..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium shadow-[0_2px_15px_rgb(0,0,0,0.04)] focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all placeholder:text-slate-400 placeholder:font-normal" 
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {dashViewMode === 'all_circuits' && (
          <AllCircuitsView 
            baths={filteredBaths} 
            searchTerm={searchTerm} 
            onDeleteCircuit={onDeleteCircuit} 
            onToggleMaintenance={onToggleMaintenance} 
            onViewHistory={onViewHistory} 
            onToggleNoSpace={onToggleCircuitNoSpace} // <-- PASSA PARA O COMPONENTE ALL_CIRCUITS
          />
        )}

        {dashViewMode === 'baths' && !expandedBathId && (
          <div className="flex flex-col h-full animate-in fade-in duration-300">
            <div className="mb-6 flex gap-2 overflow-x-auto custom-scrollbar pb-2 items-center">
              <Filter size={16} className="text-slate-400 mr-2 shrink-0" />
              {['Todos', 'Banhos', 'Salas', 'Thermotrons'].map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${
                    activeCategory === category
                      ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {category}
                  {activeCategory === category && category !== 'Todos' && (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px]">
                      {filteredBaths.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-8 overflow-y-auto pr-2 custom-scrollbar pb-6 flex-1">
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-5 content-start">
                {leftBaths.map(bath => (
                  <BathCardMicro 
                    key={bath.id} 
                    bath={bath} 
                    onClick={() => setExpandedBathId(bath.id)} 
                    onDelete={onDeleteBath} 
                    onToggleFull={onToggleBathFull} // <-- PASSA PARA O CARD DO BANHO
                  />
                ))}
              </div>
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-5 content-start">
                {rightBaths.map(bath => (
                  <BathCardMicro 
                    key={bath.id} 
                    bath={bath} 
                    onClick={() => setExpandedBathId(bath.id)} 
                    onDelete={onDeleteBath} 
                    onToggleFull={onToggleBathFull} // <-- PASSA PARA O CARD DO BANHO
                  />
                ))}
                
                {!searchTerm && activeCategory === 'Todos' && (
                  <button 
                    onClick={onOpenAddBathModal} 
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 hover:shadow-md transition-all gap-3 group h-[112px]"
                  >
                    <div className="bg-slate-100 p-2.5 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all group-hover:scale-110">
                      <Plus size={22} className="group-hover:text-blue-600" />
                    </div>
                    <span className="font-bold text-xs tracking-wide">NOVA UNIDADE / LOCAL</span>
                  </button>
                )}
              </div>
            </div>
            
            {filteredBaths.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Grid size={48} className="mb-4 text-slate-200" />
                <p>Nenhuma unidade encontrada para esta categoria ou busca.</p>
              </div>
            )}
          </div>
        )}

        {expandedBathId && (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300 h-full overflow-y-auto custom-scrollbar pb-6">
            
            <button 
              onClick={() => setExpandedBathId(null)} 
              className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] px-4 py-2 rounded-xl transition-all w-fit group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
              Voltar para painel
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
                onToggleNoSpace={onToggleCircuitNoSpace} // <-- PASSA PARA O CONTAINER (QUE MANDA PRO CIRCUIT CARD)
              />
            ))}
          </div>
        )}
      </div>

      <TemperatureStatsModal isOpen={isTempStatsOpen} onClose={() => setIsTempStatsOpen(false)} baths={safeBaths} />
      <UsageStatsModal isOpen={isUsageStatsOpen} onClose={() => setIsUsageStatsOpen(false)} baths={safeBaths} />
      
      <ExperienceOwnerModal 
        isOpen={isExpOwnerOpen} 
        onClose={() => setIsExpOwnerOpen(false)} 
        baths={safeBaths} 
        experienceOwners={experienceOwners} 
        onRefreshData={onRefreshData}
        onNavigateToCircuits={handleNavigateToCircuits}
      />
      
    </div>
  );
};

export default DashboardView;