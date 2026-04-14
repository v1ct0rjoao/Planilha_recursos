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

  const OrgTreeStyles = () => (
  <style>{`
    .modal-tree-container { width: 100%; height: 100%; overflow: auto; display: flex; justify-content: center; align-items: flex-start; padding: 40px 20px; }
    .modal-tree-container::-webkit-scrollbar { height: 8px; width: 8px; }
    .modal-tree-container::-webkit-scrollbar-track { background: transparent; }
    .modal-tree-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    .modal-tree-container::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }

    .tree-wrapper { margin: 0 auto; padding-bottom: 60px; }
    .tree { display: inline-block; white-space: nowrap; }
    .tree ul { padding-top: 24px; position: relative; transition: all 0.5s; display: flex; justify-content: center; padding-left: 0; margin: 0; }
    .tree li { text-align: center; list-style-type: none; position: relative; padding: 24px 6px 0 6px; transition: all 0.5s; }
    
    .tree li::before, .tree li::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 2px solid rgba(255,255,255,0.15); width: 50%; height: 24px; }
    .tree li::after { right: auto; left: 50%; border-left: 2px solid rgba(255,255,255,0.15); }
    .tree li:only-child::after, .tree li:only-child::before { display: none; }
    .tree li:only-child { padding-top: 0; }
    .tree li:first-child::before, .tree li:last-child::after { border: 0 none; }
    .tree li:last-child::before { border-right: 2px solid rgba(255,255,255,0.15); border-radius: 0 8px 0 0; }
    .tree li:first-child::after { border-radius: 8px 0 0 0; }
    .tree ul ul::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid rgba(255,255,255,0.15); width: 0; height: 24px; transform: translateX(-1px); }
    
    .org-card { 
      display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(0, 32, 92, 0.6); 
      border: 1px solid rgba(0, 108, 176, 0.4); 
      backdrop-filter: blur(12px); border-radius: 12px; padding: 12px 14px; 
      min-width: 130px; max-width: 150px; transition: all 0.2s; position: relative; z-index: 10;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .org-card:hover { transform: translateY(-3px); background: rgba(0, 108, 176, 0.2); border-color: #FFBF3C; }
    .org-avatar { width: 44px; height: 44px; border-radius: 50%; border: 2px solid #FFBF3C; margin: 0 auto 8px auto; object-fit: cover; }
    .org-name { color: white; font-size: 12px; font-weight: 700; white-space: normal; line-height: 1.2; margin-bottom: 2px;}
    .org-role { color: #8EB1D8; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; white-space: normal; line-height: 1.1;}
  `}</style>
);

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
    let running = 0, free = 0, maint = 0;
    safeBaths.forEach(bath => {
      if (!bath.circuits) return;
      bath.circuits.forEach(c => {
        const s = c.status ? c.status.toLowerCase().trim() : 'free';
        if (s === 'maintenance') maint++;
        else if (s === 'running' && c.progress < 100) running++;
        else free++;
      });
    });
    return { totalRunning: running, totalFree: free, totalMaint: maint };
  }, [safeBaths]);

  const { filteredBaths } = useMemo(() => {
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
            (c.id && c.id.toUpperCase().includes(term)) || (c.batteryId && c.batteryId.toUpperCase().includes(term))
          );
        if (!textMatch) return false;
      }
      return true;
    });
    return { filteredBaths: filtered };
  }, [safeBaths, searchTerm, activeCategory]);

  return (
    <div className="h-full w-full flex flex-col transition-colors duration-300 overflow-hidden min-h-0">
      <OrgTreeStyles />
      <div className="mb-4 flex flex-col gap-3 shrink-0">
         <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
               Painel de Controle
            </h2>
            <div className="w-full md:w-80 relative group">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0ea5e9] text-sm"></i>
              <input 
                type="text" placeholder="Buscar circuito..." 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-white/[0.02] dark:backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#006CB0] shadow-sm" 
              />
            </div>
         </div>

         <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-3 bg-white dark:bg-white/[0.02] dark:backdrop-blur-md p-2 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
               <div className="flex items-center bg-slate-50 dark:bg-black/20 p-1 rounded-lg border border-slate-200 dark:border-white/5">
                 <button 
                   onClick={() => { setDashViewMode('baths'); setExpandedBathId(null); }} 
                   className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${dashViewMode === 'baths' && !expandedBathId ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                 >
                   <i className="fa-solid fa-border-all"></i> Banhos
                 </button>
                 <button 
                   onClick={() => { setDashViewMode('all_circuits'); setExpandedBathId(null); }} 
                   className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${dashViewMode === 'all_circuits' ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                 >
                   <i className="fa-solid fa-expand"></i> Circuitos
                 </button>
               </div>
               
               <div className="w-[1px] h-6 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>

               <div className="flex gap-0.5">
                 <button onClick={() => setIsTempStatsOpen(true)} className="p-2 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all"><i className="fa-solid fa-temperature-half text-sm"></i></button>
                 <button onClick={() => setIsUsageStatsOpen(true)} className="p-2 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all"><i className="fa-solid fa-chart-simple text-sm"></i></button>
                 <button onClick={() => setIsExpOwnerOpen(true)} className="p-2 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all"><i className="fa-solid fa-users text-sm"></i></button>
               </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
               <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-sm min-w-[100px] justify-center">
                 <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                 <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400">{stats.totalRunning} Em Uso</span>
               </div>
               <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-sm min-w-[100px] justify-center">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                 <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400">{stats.totalFree} Livres</span>
               </div>
               <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-sm min-w-[100px] justify-center">
                 <span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400"></span>
                 <span className="text-[11px] font-bold text-rose-800 dark:text-rose-400">{stats.totalMaint} Manut.</span>
               </div>
            </div>
         </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        
        {dashViewMode === 'baths' && !expandedBathId && (
          <div className="flex flex-col h-full min-h-0">
            <div className="mb-3 flex gap-2 shrink-0 items-center">
              {['Todos', 'Banhos', 'Salas', 'Thermotrons', 'Shakers'].map(category => (
                <button
                  key={category} onClick={() => setActiveCategory(category)}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap border-b-2 ${
                    activeCategory === category
                      ? 'bg-blue-50 dark:bg-[#006CB0]/20 text-blue-700 dark:text-white border-[#006CB0] dark:border-[#0ea5e9]'
                      : 'bg-white dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 min-h-0 overflow-y-auto no-scrollbar content-start pb-6">
              {filteredBaths.map(bath => (
                <BathCardMicro 
                  key={bath.id} bath={bath} onClick={() => setExpandedBathId(bath.id)} 
                  onDelete={onDeleteBath} onToggleFull={onToggleBathFull}
                />
              ))}
              
              {!searchTerm && activeCategory === 'Todos' && (
                <button 
                  onClick={onOpenAddBathModal} 
                  className="flex flex-col items-center justify-center p-3 bg-transparent border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl hover:border-[#006CB0] dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group h-full min-h-[90px]"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                     <i className="fa-solid fa-plus text-slate-400 group-hover:text-[#006CB0] dark:text-slate-300 dark:group-hover:text-white text-sm transition-colors"></i>
                  </div>
                  <span className="font-bold text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-[#006CB0] dark:group-hover:text-white tracking-widest transition-colors uppercase">Nova Unidade</span>
                </button>
              )}
            </div>
            
            {filteredBaths.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-slate-300 dark:border-white/10 min-h-0">
                <i className="fa-solid fa-border-all text-2xl mb-2 text-slate-300 dark:text-slate-600"></i>
                <p className="text-xs font-medium">Nenhum resultado.</p>
              </div>
            )}
          </div>
        )}

        {expandedBathId && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 animate-in fade-in slide-in-from-right-4">
            <button 
              onClick={() => setExpandedBathId(null)} 
              className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 hover:border-[#006CB0] dark:hover:border-[#0ea5e9] hover:text-[#006CB0] dark:hover:text-white hover:shadow-md px-4 py-2 rounded-lg transition-all w-fit shrink-0 group"
            >
              <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Voltar
            </button>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 pb-6">
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
          </div>
        )}

        {dashViewMode === 'all_circuits' && !expandedBathId && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 animate-in fade-in">
            <AllCircuitsView
              baths={safeBaths}
              searchTerm={searchTerm}
              onDeleteCircuit={onDeleteCircuit}
              onToggleMaintenance={onToggleMaintenance}
              onViewHistory={onViewHistory}
              onToggleNoSpace={onToggleCircuitNoSpace}
            />
          </div>
        )}

      </div>

      <TemperatureStatsModal isOpen={isTempStatsOpen} onClose={() => setIsTempStatsOpen(false)} baths={safeBaths} />
      <UsageStatsModal isOpen={isUsageStatsOpen} onClose={() => setIsUsageStatsOpen(false)} baths={safeBaths} />
      <ExperienceOwnerModal isOpen={isExpOwnerOpen} onClose={() => setIsExpOwnerOpen(false)} baths={safeBaths} experienceOwners={experienceOwners} onRefreshData={onRefreshData} onNavigateToCircuits={handleNavigateToCircuits} />
    </div>
  );
};

export default DashboardView;