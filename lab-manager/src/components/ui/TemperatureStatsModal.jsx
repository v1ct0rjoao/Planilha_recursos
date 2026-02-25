import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid 
} from 'recharts';
import { Thermometer, X, Layers, Snowflake, Flame, Sun } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700 min-w-[140px] z-50">
        <p className="font-bold text-sm mb-2 pb-2 border-b border-slate-600">{item.name}</p>
        <div className="flex justify-between items-center mb-1">
           <span className="text-xs text-slate-400">Em Uso:</span>
           <span className="text-sm font-bold" style={{ color: item.color }}>{item.running}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
           <span className="text-xs text-slate-400">Livres:</span>
           <span className="text-sm font-bold text-slate-300">{item.free}</span>
        </div>
        <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-700">
           <span className="text-[10px] text-slate-500 font-bold uppercase">Total</span>
           <span className="text-sm font-black text-white">{item.total}</span>
        </div>
      </div>
    );
  }
  return null;
};

const TemperatureStatsModal = ({ isOpen, onClose, baths = [] }) => {
  const stats = useMemo(() => {
    const safeBaths = baths || [];
    const acc = {};
    let tCircuits = 0;
    let tRunning = 0;

    safeBaths.forEach(b => {
      const rawTemp = b.temp !== undefined && b.temp !== null ? b.temp : 'N/A';
      const tempVal = parseFloat(rawTemp);
      const label = isNaN(tempVal) ? 'N/A' : `${tempVal}ºC`;
      
      if (!acc[label]) {
        let color = '#94a3b8';
        let bg = 'bg-slate-100';
        let textColor = 'text-slate-600';
        let Icon = Thermometer;

        if (!isNaN(tempVal)) {
            if (tempVal < 25) {
                color = '#3b82f6';
                bg = 'bg-blue-100';
                textColor = 'text-blue-700';
                Icon = Snowflake;
            } else if (tempVal === 25) {
                color = '#10b981';
                bg = 'bg-emerald-100';
                textColor = 'text-emerald-700';
                Icon = Sun;
            } else if (tempVal <= 40) {
                color = '#f59e0b';
                bg = 'bg-amber-100';
                textColor = 'text-amber-700';
                Icon = Flame;
            } else {
                color = '#ef4444';
                bg = 'bg-rose-100';
                textColor = 'text-rose-700';
                Icon = Flame;
            }
        }

        acc[label] = { 
            name: label, 
            temp: isNaN(tempVal) ? -999 : tempVal, 
            total: 0, 
            running: 0, 
            free: 0, 
            color, 
            bg, 
            textColor,
            Icon 
        };
      }

      const circuitsCount = (b.circuits || []).length;
      const runningCount = (b.circuits || []).filter(c => {
        const s = c.status ? c.status.toLowerCase().trim() : '';
        return s === 'running' && c.progress < 100;
      }).length;

      acc[label].total += circuitsCount;
      acc[label].running += runningCount;
      acc[label].free += (circuitsCount - runningCount);
      
      tCircuits += circuitsCount;
      tRunning += runningCount;
    });

    const sortedData = Object.values(acc)
        .sort((a, b) => a.temp - b.temp)
        .filter(item => item.total > 0);

    return { chartData: sortedData, totalCircuits: tCircuits, totalRunning: tRunning };
  }, [baths]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        <div className="w-full md:w-1/2 p-6 md:p-8 bg-slate-50 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-200 relative min-h-[300px]">
            <h3 className="absolute top-6 left-6 font-bold text-slate-400 text-xs uppercase tracking-wider flex items-center gap-2">
                <Thermometer size={14} /> Distribuição Térmica
            </h3>
            
            <div className="h-56 w-full mt-6">
                {stats.totalCircuits > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10 }} 
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                        <Bar 
                          dataKey="total" 
                          radius={[4, 4, 0, 0]} 
                          barSize={32}
                          animationDuration={800}
                        >
                            {stats.chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                      </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Thermometer size={40} className="opacity-20 mb-2" />
                    <span className="text-xs">Sem dados</span>
                  </div>
                )}
            </div>
        </div>

        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Temperaturas</h2>
                    <p className="text-xs text-slate-500">Capacidade e ocupação atual.</p>
                </div>
                <button onClick={onClose} className="p-1.5 -mr-2 -mt-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {stats.chartData.map((item) => {
                    const occupationPercent = item.total > 0 ? ((item.running / item.total) * 100).toFixed(1) : 0;
                    
                    return (
                        <div key={item.name} className="group">
                            <div className="flex justify-between items-end mb-1.5">
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-1.5 rounded-lg ${item.bg} ${item.textColor}`}>
                                        <item.Icon size={16} />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-slate-700">{item.name}</span>
                                        <span className="text-[10px] text-slate-400 font-mono">{occupationPercent}%</span>
                                    </div>
                                </div>
                                
                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-baseline gap-1">
                                      <span className={`text-xl font-black ${item.textColor}`}>{item.running}</span>
                                      <span className="text-base font-bold text-slate-300">/</span>
                                      <span className="text-base font-bold text-slate-500">{item.total}</span>
                                    </div>
                                    {item.free > 0 && (
                                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm uppercase tracking-widest mt-0.5">
                                        {item.free} Livres
                                      </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ 
                                        width: `${occupationPercent}%`, 
                                        backgroundColor: item.color 
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-3 border-t-2 border-slate-100 border-dashed shrink-0">
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                        <Layers size={16} />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Capacidade Total</span>
                    </div>
                    <div className="text-right flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-blue-600">{stats.totalRunning}</span>
                      <span className="text-lg font-bold text-slate-300">/</span>
                      <span className="text-lg font-bold text-slate-600">{stats.totalCircuits}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TemperatureStatsModal;