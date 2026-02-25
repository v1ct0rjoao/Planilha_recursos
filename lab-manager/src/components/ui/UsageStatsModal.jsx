import React, { useMemo } from 'react';
import { X, PieChart as PieIcon, Activity, CheckCircle2, AlertOctagon, Layers } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';

const RenderCustomLabel = ({ viewBox, totalCircuits }) => {
  if (!viewBox || !viewBox.cx || !viewBox.cy) return null;
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="central" className="text-5xl font-extrabold fill-slate-800 font-sans">
        {totalCircuits}
      </text>
      <text x={cx} y={cy + 25} textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold uppercase fill-slate-400 tracking-widest font-sans">
        Total
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const total = item.totalRef || 1;
    return (
      <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700 z-50">
        <p className="font-bold text-sm mb-1">{item.name}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</span>
          <span className="text-xs text-slate-400">unidades</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          {((item.value / total) * 100).toFixed(1)}% do total
        </p>
      </div>
    );
  }
  return null;
};

const UsageStatsModal = ({ isOpen, onClose, baths = [] }) => {
  const stats = useMemo(() => {
    const safeBaths = baths || [];
    
    const running = safeBaths.reduce((acc, bath) => acc + ((bath.circuits || []).filter(c => { 
      const s = c.status ? c.status.toLowerCase().trim() : ''; 
      return s === 'running' && c.progress < 100; 
    }).length), 0);

    const free = safeBaths.reduce((acc, bath) => acc + ((bath.circuits || []).filter(c => { 
      const s = c.status ? c.status.toLowerCase().trim() : 'free'; 
      return (s === 'free' || s === 'finished' || c.progress >= 100) && s !== 'maintenance'; 
    }).length), 0);

    const maint = safeBaths.reduce((acc, bath) => acc + ((bath.circuits || []).filter(c => 
      c.status === 'maintenance'
    ).length), 0);

    const total = running + free + maint;

    const data = [
      { name: 'Em Uso', value: running, color: '#d97706', icon: Activity, bg: 'bg-amber-100', text: 'text-amber-700', totalRef: total }, 
      { name: 'Livres', value: free, color: '#059669', icon: CheckCircle2, bg: 'bg-emerald-100', text: 'text-emerald-700', totalRef: total },    
      { name: 'Manutenção', value: maint, color: '#be123c', icon: AlertOctagon, bg: 'bg-rose-100', text: 'text-rose-700', totalRef: total } 
    ];

    return {
      total,
      chartData: data.filter(item => item.value > 0),
      displayData: data
    };
  }, [baths]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        <div className="w-full md:w-1/2 p-8 bg-slate-50 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 relative min-h-[300px]">
            <h3 className="absolute top-6 left-6 font-bold text-slate-400 text-xs uppercase tracking-wider flex items-center gap-2">
                <PieIcon size={14} /> Distribuição
            </h3>
            
            <div className="h-64 w-64 relative mt-4">
                {stats.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={stats.chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={80} 
                              outerRadius={110} 
                              paddingAngle={5}
                              dataKey="value"
                              cornerRadius={6} 
                              stroke="none"
                              animationBegin={0}
                              animationDuration={800}
                          >
                              {stats.chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                              <Label 
                                content={(props) => <RenderCustomLabel {...props} totalCircuits={stats.total} />} 
                                position="center" 
                              />
                          </Pie>
                          <Tooltip content={<CustomTooltip />} cursor={false} />
                      </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <PieIcon size={48} className="opacity-20 mb-2" />
                    <span className="text-xs">Sem dados</span>
                  </div>
                )}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/5 blur-xl rounded-full"></div>
            </div>
        </div>

        <div className="w-full md:w-1/2 p-8 flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Status Geral</h2>
                    <p className="text-sm text-slate-500">Ocupação em tempo real.</p>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 -mt-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {stats.displayData.map((item) => {
                    const percent = stats.total > 0 ? ((item.value / stats.total) * 100).toFixed(1) : 0;
                    return (
                        <div key={item.name} className="group">
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${item.bg} ${item.text}`}>
                                        <item.icon size={18} />
                                    </div>
                                    <div>
                                        <span className="block text-sm font-bold text-slate-700">{item.name}</span>
                                        <span className="text-xs text-slate-400 font-mono">{percent}%</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-2xl font-bold text-slate-800">{item.value}</span>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ 
                                        width: `${percent}%`, 
                                        backgroundColor: item.color 
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t-2 border-slate-100 border-dashed">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Layers size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Total de Circuitos</span>
                    </div>
                    <span className="text-3xl font-extrabold text-slate-800">{stats.total}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UsageStatsModal;