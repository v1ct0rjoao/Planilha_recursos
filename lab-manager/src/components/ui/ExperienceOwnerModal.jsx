import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label, Sector 
} from 'recharts';
import { Users, X, User, Tag, Save, Layers, PieChart as PieIcon, Search, ArrowRight, Activity, Edit2, ChevronLeft } from 'lucide-react';
import { bathService } from "../../services/bathService";

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#64748b'];

const ExperienceListItem = React.memo(({ item, onSave, onNavigate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localName, setLocalName] = useState(item.ownerName !== "Sem Dono" ? item.ownerName : "");

  useEffect(() => {
    setLocalName(item.ownerName !== "Sem Dono" ? item.ownerName : "");
  }, [item.ownerName]);

  const handleSave = () => {
    onSave(item.code, localName);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setLocalName(item.ownerName !== "Sem Dono" ? item.ownerName : "");
    }
  };

  return (
    <div 
      className="group bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden outline-none focus:outline-none"
      onClick={() => !isEditing && onNavigate && onNavigate(item.code)}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between items-center ml-1">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 text-slate-600 p-2 rounded-xl group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
            <Tag size={18} />
          </div>
          <span className="font-black text-lg text-slate-800 tracking-tight">{item.code}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-slate-800 text-white px-3 py-1.5 rounded-lg shadow-sm">
            {item.count} unids
          </span>
          <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors ml-1" />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1 ml-1" onClick={(e) => e.stopPropagation()}>
        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
          <User size={12} className="text-slate-500" />
        </div>
        
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input 
              type="text" 
              autoFocus
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="flex-1 text-sm px-3 py-1.5 border border-blue-400 rounded-lg outline-none ring-2 ring-blue-100 bg-white shadow-sm font-semibold text-slate-700"
              onKeyDown={handleKeyDown}
            />
            <button 
              onClick={handleSave}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm outline-none focus:outline-none"
            >
              <Save size={16} />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex justify-between items-center cursor-pointer py-1 outline-none" onClick={() => setIsEditing(true)}>
            <span className={`text-sm font-bold ${item.ownerName === "Sem Dono" ? "text-rose-500 italic" : "text-slate-700 group-hover:text-blue-700"}`}>
              {item.ownerName}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">
              <Edit2 size={10} /> Editar
            </span>
          </div>
        )}
      </div>

      {item.tests && item.tests.length > 0 && (
        <div className="mt-2 pt-4 border-t border-slate-100 flex flex-col gap-2.5" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
            <Activity size={12} /> Testes Inclusos
          </span>
          
          <div className="grid grid-cols-2 gap-2">
            {item.tests.map((t, idx) => (
              <div key={idx} className="flex items-stretch bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden group-hover:border-slate-300 transition-colors">
                <div className="bg-slate-100 text-slate-700 font-black px-2.5 py-1.5 text-xs border-r border-slate-200 flex items-center justify-center min-w-[36px]">
                  {t.qtd}x
                </div>
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-600 flex items-center truncate" title={t.name}>
                  {t.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const ExperienceOwnerModal = ({ isOpen, onClose, baths = [], experienceOwners = {}, onNavigateToCircuits, onRefreshData }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);

  const saveOwner = useCallback(async (expCode, name) => {
    const updatedName = name || "Sem Dono";
    
    try {
      const response = await bathService.updateExperienceOwner(expCode, updatedName);
      if (!response.success) throw new Error("Falha ao salvar");
      
      if (onRefreshData) onRefreshData();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar no banco de dados.");
    }
  }, [onRefreshData]);

  const { chartData, experienceList, totalCircuits } = useMemo(() => {
    if (!isOpen) return { chartData: [], experienceList: [], totalCircuits: 0 };

    const expCounts = {}; 
    let total = 0;

    baths.forEach(bath => {
      if (!bath.circuits) return;
      bath.circuits.forEach(c => {
        const idToParse = c.batteryId || c.id || "";
        const parts = idToParse.split('-');
        
        let expCode = "Outros";
        if (parts.length >= 2 && parts[1].toUpperCase().startsWith('E')) {
          expCode = parts[1].toUpperCase();
        }

        const testName = c.protocol || c.testName || c.testType || c.test || "Sem Protocolo";

        if (!expCounts[expCode]) {
          expCounts[expCode] = { count: 0, tests: {} };
        }

        expCounts[expCode].count++;

        if (!expCounts[expCode].tests[testName]) {
          expCounts[expCode].tests[testName] = 0;
        }
        expCounts[expCode].tests[testName]++;
        
        total++;
      });
    });

    const ownersFromDb = experienceOwners || {};

    const expList = Object.keys(expCounts).sort().map(code => {
      const testsArray = Object.entries(expCounts[code].tests)
        .map(([name, qtd]) => ({ name, qtd }))
        .sort((a, b) => b.qtd - a.qtd);

      return {
        code,
        count: expCounts[code].count,
        tests: testsArray,
        ownerName: ownersFromDb[code] || (code === "Outros" ? "Não Identificado" : "Sem Dono")
      };
    });

    const ownerCounts = {};
    expList.forEach(item => {
      const name = item.ownerName;
      if (!ownerCounts[name]) ownerCounts[name] = 0;
      ownerCounts[name] += item.count;
    });

    const pieData = Object.keys(ownerCounts)
      .sort((a, b) => ownerCounts[b] - ownerCounts[a]) 
      .map((name, index) => ({
        name,
        value: ownerCounts[name],
        color: PIE_COLORS[index % PIE_COLORS.length] 
      }));

    return { chartData: pieData, experienceList: expList, totalCircuits: total };
  }, [baths, experienceOwners, isOpen]);

  const filteredExperienceList = useMemo(() => {
    let list = experienceList;
    if (selectedOwner) list = list.filter(item => item.ownerName === selectedOwner);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(item => 
        item.code.toLowerCase().includes(term) || 
        item.ownerName.toLowerCase().includes(term) ||
        item.tests.some(t => t.name.toLowerCase().includes(term))
      );
    }
    return list;
  }, [experienceList, searchTerm, selectedOwner]);

  const filteredTotalCircuits = useMemo(() => {
    return filteredExperienceList.reduce((acc, curr) => acc + curr.count, 0);
  }, [filteredExperienceList]);

  const testChartData = useMemo(() => {
    if (!selectedOwner) return [];
    
    const testCounts = {};
    filteredExperienceList.forEach(exp => {
      exp.tests.forEach(t => {
        if (!testCounts[t.name]) testCounts[t.name] = 0;
        testCounts[t.name] += t.qtd;
      });
    });

    return Object.keys(testCounts)
      .sort((a, b) => testCounts[b] - testCounts[a])
      .map((name, index) => ({
        name,
        value: testCounts[name],
        color: PIE_COLORS[index % PIE_COLORS.length]
      }));
  }, [filteredExperienceList, selectedOwner]);

  const displayData = selectedOwner ? testChartData : chartData;
  const displayTotal = selectedOwner ? filteredTotalCircuits : totalCircuits;
  const displayTitle = selectedOwner ? `Testes de ${selectedOwner}` : "Solicitantes (Clique para filtrar)";

  const RenderCustomLabel = useCallback(({ viewBox }) => {
    if (!viewBox || !viewBox.cx || !viewBox.cy) return null;
    const { cx, cy } = viewBox;
    return (
      <g>
        <text x={cx} y={cy - 12} textAnchor="middle" dominantBaseline="central" className="text-6xl font-extrabold fill-slate-800 font-sans pointer-events-none">
          {displayTotal}
        </text>
        <text x={cx} y={cy + 30} textAnchor="middle" dominantBaseline="central" className="text-xs font-bold uppercase fill-slate-400 tracking-widest font-sans pointer-events-none">
          Total
        </text>
      </g>
    );
  }, [displayTotal]);

  const renderActiveShape = useCallback((props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8} 
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          cornerRadius={8}
          style={{ 
            outline: 'none', 
            filter: 'url(#pieShadow)', 
            cursor: selectedOwner ? 'default' : 'pointer'
          }}
        />
      </g>
    );
  }, [selectedOwner]);

  const CustomTooltip = useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percent = displayTotal > 0 ? ((item.value / displayTotal) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-800/95 backdrop-blur-sm text-white p-4 rounded-2xl shadow-2xl border border-slate-700/50 min-w-[160px] animate-in fade-in zoom-in-95 duration-100">
          <div className="font-bold text-sm mb-3 pb-3 border-b border-slate-700/50 flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
            <span className="truncate">{item.name}</span>
          </div>
          <div className="flex justify-between items-end gap-4">
            <div>
              <span className="block text-[11px] font-medium text-slate-400 mb-0.5 uppercase tracking-wider">Circuitos</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold tracking-tight" style={{ color: item.color }}>{item.value}</span>
                <span className="text-xs font-bold text-slate-300">unids</span>
              </div>
            </div>
            <span className="text-sm font-black text-white bg-slate-700/80 px-2.5 py-1 rounded-lg shadow-inner">
              {percent}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  }, [displayTotal]);

  const renderedRightList = useMemo(() => {
    if (filteredExperienceList.length === 0) {
      return (
        <p className="text-sm text-slate-400 text-center mt-10">
          Nenhum resultado encontrado.
        </p>
      );
    }

    return filteredExperienceList.map((item) => (
      <ExperienceListItem 
        key={item.code} 
        item={item} 
        onSave={saveOwner} 
        onNavigate={onNavigateToCircuits}
      />
    ));
  }, [filteredExperienceList, saveOwner, onNavigateToCircuits]); 

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 flex flex-col md:flex-row max-h-[90vh]">
        
        <div className="w-full md:w-1/2 p-8 bg-slate-50 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 relative min-h-[450px]">
            
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
              <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider flex items-center gap-2 max-w-[70%] mt-1">
                  {selectedOwner ? <Activity size={14} /> : <PieIcon size={14} />} 
                  <span className="truncate">{displayTitle}</span>
              </h3>
              
              {selectedOwner && (
                <button 
                  onClick={() => {
                    setSelectedOwner(null);
                    setActiveIndex(null);
                  }} 
                  className="flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 animate-in fade-in outline-none focus:outline-none"
                >
                  <ChevronLeft size={16} /> Voltar
                </button>
              )}
            </div>
            
            <div className="h-80 w-80 relative mt-8 outline-none focus:outline-none" style={{ outline: 'none' }}>
                {displayTotal > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none">
                    <PieChart style={{ outline: 'none' }} className="outline-none focus:outline-none">
                      <defs>
                        <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.15" />
                        </filter>
                      </defs>

                      <Pie
                        data={displayData}
                        cx="50%"
                        cy="50%"
                        innerRadius={100} 
                        outerRadius={145}
                        paddingAngle={4}
                        dataKey="value"
                        cornerRadius={8}
                        stroke="none"
                        isAnimationActive={true}
                        animationDuration={800}
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape} 
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                        onClick={(data) => {
                          if (!selectedOwner) {
                            setSelectedOwner(data.name);
                            setActiveIndex(null);
                          }
                        }}
                        style={{ filter: 'url(#pieShadow)', cursor: selectedOwner ? 'default' : 'pointer', outline: 'none' }}
                      >
                        {displayData.map((entry, index) => {
                          const isDimmed = activeIndex !== null && activeIndex !== index;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color} 
                              opacity={isDimmed ? 0.35 : 1}
                              style={{ transition: 'opacity 0.25s ease', outline: 'none' }} 
                            />
                          )
                        })}
                        <Label content={<RenderCustomLabel />} position="center" />
                      </Pie>
                      
                      <Tooltip 
                        content={<CustomTooltip />} 
                        cursor={false} 
                        isAnimationActive={false}
                        wrapperStyle={{ outline: 'none', border: 'none', backgroundColor: 'transparent', boxShadow: 'none' }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Users size={48} className="opacity-20 mb-2" />
                    <span className="text-xs">Sem dados</span>
                  </div>
                )}
            </div>

            <div className="mt-6 w-full px-4 max-h-40 overflow-y-auto custom-scrollbar pb-2 relative z-10">
              <div className="grid grid-cols-2 gap-2.5">
                {displayData.map((entry, index) => {
                    const isHovered = activeIndex === index;
                    return (
                      <div 
                        key={index} 
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                        onClick={() => {
                          if (!selectedOwner) {
                            setSelectedOwner(entry.name);
                            setActiveIndex(null);
                          }
                        }}
                        className={`flex items-center gap-2 border px-3 py-2 rounded-lg shadow-sm transition-all w-full overflow-hidden ${
                          !selectedOwner ? 'cursor-pointer' : ''
                        } ${
                          isHovered 
                            ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 scale-[1.02]' 
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-[11px] font-bold text-slate-700 truncate w-full" title={entry.name}>
                          {entry.name}
                        </span>
                      </div>
                    )
                })}
              </div>
            </div>
        </div>

        <div className="w-full md:w-1/2 p-8 flex flex-col bg-white relative">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                      Experiências Ativas
                    </h2>
                    <p className="text-sm text-slate-500">Selecione para ver detalhes ou edite os nomes.</p>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 -mt-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 outline-none focus:outline-none">
                    <X size={20} />
                </button>
            </div>

            <div className="relative mb-6 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input  
                type="text" 
                placeholder={selectedOwner ? `Buscar nas experiências de ${selectedOwner}...` : "Buscar código ou nome do teste..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
              />
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-3">
                {renderedRightList}
            </div>

            <div className="mt-4 pt-5 border-t-2 border-slate-100 border-dashed shrink-0">
                <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Layers size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest">
                          {selectedOwner ? `Total: ${selectedOwner}` : "Total da Lista"}
                        </span>
                    </div>
                    <span className="text-4xl font-extrabold text-blue-600 tracking-tighter">
                      {filteredTotalCircuits}
                    </span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceOwnerModal;