import React, { useState, useEffect, useMemo, useCallback } from 'react';

import BathCardMicro from "../../components/business/BanhoCardMicro";
import BathContainer from "../../components/business/BanhoContainer";
import AllCircuitsView from "../../components/business/VisualCircuitosGeral";

import UsageStatsModal from "../../components/ui/StatusCircuitos";
import TemperatureStatsModal from "../../components/ui/BanhosPorTemperatura";
import ExperienceOwnerModal from "../../components/ui/GerenciadorDeSolicitantes"; 

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
  onToggleBathFull,          
  onToggleCircuitNoSpace     
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
        else if (activeCategory === 'Shakers' && upperId.includes('SHAKER')) isMatch = true;
        else if (activeCategory === 'Banhos' && !upperId.includes('SALA') && !upperId.includes('THERMO') && !upperId.includes('SHAKER')) isMatch = true;
        
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
    <div className="h-full flex flex-col transition-colors duration-300">
      
      <div className="mb-8 flex flex-col gap-4 shrink-0">
         
         <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight shrink-0 flex items-center gap-3 transition-colors">
               Visão Geral
            </h2>
            
            <div className="w-full md:w-80 lg:w-96 relative group">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors"></i>
              <input 
                type="text" 
                placeholder="Buscar circuito ou local..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium shadow-sm" 
              />
            </div>
         </div>

         <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            
            <div className="flex flex-wrap items-center gap-3">
               
               <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner transition-colors">
                 <button 
                   onClick={() => { setDashViewMode('baths'); setExpandedBathId(null); }} 
                   className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${dashViewMode === 'baths' && !expandedBathId ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                 >
                   <i className="fa-solid fa-border-all"></i> Painel
                 </button>
                 <button 
                   onClick={() => { setDashViewMode('all_circuits'); setExpandedBathId(null); }} 
                   className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${dashViewMode === 'all_circuits' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                 >
                   <i className="fa-solid fa-expand"></i> Circuitos
                 </button>
               </div>
               
               <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block transition-colors"></div>

               <div className="flex gap-1">
                 <button onClick={() => setIsTempStatsOpen(true)} className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all" title="Distribuição Térmica">
                   <i className="fa-solid fa-temperature-half text-lg"></i>
                 </button>
                 <button onClick={() => setIsUsageStatsOpen(true)} className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all" title="Gráfico de Ocupação Geral">
                   <i className="fa-solid fa-chart-simple text-lg"></i>
                 </button>
                 <button onClick={() => setIsExpOwnerOpen(true)} className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all" title="Gerenciar Solicitantes">
                   <i className="fa-solid fa-users text-lg"></i>
                 </button>
               </div>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
               <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm min-w-[120px] justify-center transition-colors">
                 <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                 <span className="text-sm font-bold text-amber-800 dark:text-amber-400">{stats.totalRunning} Em Uso</span>
               </div>
               <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm min-w-[120px] justify-center transition-colors">
                 <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                 <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">{stats.totalFree} Livres</span>
               </div>
               <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm min-w-[120px] justify-center transition-colors">
                 <span className="w-2.5 h-2.5 rounded-full bg-rose-500 dark:bg-rose-400"></span>
                 <span className="text-sm font-bold text-rose-800 dark:text-rose-400">{stats.totalMaint} Manut.</span>
               </div>
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
            onToggleNoSpace={onToggleCircuitNoSpace}
          />
        )}

        {dashViewMode === 'baths' && !expandedBathId && (
          <div className="flex flex-col h-full animate-in fade-in duration-300">
            <div className="mb-6 flex gap-3 overflow-x-auto custom-scrollbar pb-2 items-center">
              <i className="fa-solid fa-filter text-slate-400 dark:text-slate-500 mr-1 shrink-0"></i>
              {['Todos', 'Banhos', 'Salas', 'Thermotrons', 'Shakers'].map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border-b-4 ${
                    activeCategory === category
                      ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-600 dark:border-blue-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {category}
                  {activeCategory === category && category !== 'Todos' && (
                    <span className="ml-2 bg-blue-200/50 dark:bg-blue-500/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md text-[10px] transition-colors">
                      {filteredBaths.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-8 overflow-y-auto pr-2 custom-scrollbar pb-6 flex-1">
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-6 content-start">
                {leftBaths.map(bath => (
                  <BathCardMicro 
                    key={bath.id} bath={bath} onClick={() => setExpandedBathId(bath.id)} 
                    onDelete={onDeleteBath} onToggleFull={onToggleBathFull}
                  />
                ))}
              </div>
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-6 content-start">
                {rightBaths.map(bath => (
                  <BathCardMicro 
                    key={bath.id} bath={bath} onClick={() => setExpandedBathId(bath.id)} 
                    onDelete={onDeleteBath} onToggleFull={onToggleBathFull}
                  />
                ))}
                
                {!searchTerm && activeCategory === 'Todos' && (
                  <button 
                    onClick={onOpenAddBathModal} 
                    className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border-t-4 border-blue-500 dark:border-blue-500/80 rounded-xl shadow-md hover:shadow-lg transition-all group min-h-[140px] dark:shadow-none dark:hover:bg-slate-800"
                  >
                    <i className="fa-solid fa-plus text-blue-500 dark:text-blue-400 text-3xl mb-3 group-hover:scale-110 transition-transform"></i>
                    <span className="font-bold text-sm text-slate-600 dark:text-slate-300 tracking-wide transition-colors">NOVA UNIDADE</span>
                  </button>
                )}
              </div>
            </div>
            
            {filteredBaths.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 mt-4 transition-colors">
                <i className="fa-solid fa-border-all text-4xl mb-4 text-slate-300 dark:text-slate-600"></i>
                <p className="font-medium">Nenhuma unidade encontrada para esta categoria ou busca.</p>
              </div>
            )}
          </div>
        )}

        {expandedBathId && (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300 h-full overflow-y-auto custom-scrollbar pb-6">
            <button 
              onClick={() => setExpandedBathId(null)} 
              className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:shadow-md px-5 py-2.5 rounded-xl transition-all w-fit group"
            >
              <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> 
              Voltar para painel
            </button>

            {safeBaths.filter(b => b.id === expandedBathId).map(bath => (
              <BathContainer 
                key={bath.id} bath={bath} searchTerm={searchTerm} 
                onAddCircuit={onAddCircuit} onUpdateTemp={onUpdateTemp} 
                onDeleteCircuit={onDeleteCircuit} onToggleMaintenance={onToggleMaintenance} 
                onDeleteBath={onDeleteBath} onViewHistory={onViewHistory} 
                onMoveCircuit={onMoveCircuit} onLinkCircuit={onLinkCircuit} 
                onEditBath={onEditBath} onToggleNoSpace={onToggleCircuitNoSpace}
              />
            ))}
          </div>
        )}
      </div>

      <TemperatureStatsModal isOpen={isTempStatsOpen} onClose={() => setIsTempStatsOpen(false)} baths={safeBaths} />
      <UsageStatsModal isOpen={isUsageStatsOpen} onClose={() => setIsUsageStatsOpen(false)} baths={safeBaths} />
      
      <ExperienceOwnerModal 
        isOpen={isExpOwnerOpen} onClose={() => setIsExpOwnerOpen(false)} 
        baths={safeBaths} experienceOwners={experienceOwners} 
        onRefreshData={onRefreshData} onNavigateToCircuits={handleNavigateToCircuits}
      />
      
    </div>
  );
};

export default DashboardView;