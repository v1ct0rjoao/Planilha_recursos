import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid 
} from 'recharts';
import { Thermometer, X, Layers, Snowflake, Flame, Sun } from 'lucide-react';

const TemperatureStatsModal = ({ isOpen, onClose, baths = [] }) => {
  if (!isOpen) return null;

  // 1. Processamento de Dados
  const { chartData, totalCircuits } = useMemo(() => {
    const safeBaths = baths || [];
    const acc = {};
    let total = 0;

    safeBaths.forEach(b => {
      // Normaliza a temperatura
      const rawTemp = b.temp !== undefined && b.temp !== null ? b.temp : 'N/A';
      const tempVal = parseFloat(rawTemp);
      const label = isNaN(tempVal) ? 'N/A' : `${tempVal}ºC`;
      
      if (!acc[label]) {
        // Define cores e ícones baseados na temperatura
        let color = '#94a3b8'; // Slate (N/A)
        let bg = 'bg-slate-100';
        let textColor = 'text-slate-600';
        let Icon = Thermometer;

        if (!isNaN(tempVal)) {
            if (tempVal < 25) {
                color = '#3b82f6'; // Blue
                bg = 'bg-blue-100';
                textColor = 'text-blue-700';
                Icon = Snowflake;
            } else if (tempVal === 25) {
                color = '#10b981'; // Green
                bg = 'bg-emerald-100';
                textColor = 'text-emerald-700';
                Icon = Sun;
            } else if (tempVal <= 40) {
                color = '#f59e0b'; // Amber
                bg = 'bg-amber-100';
                textColor = 'text-amber-700';
                Icon = Flame;
            } else {
                color = '#ef4444'; // Red
                bg = 'bg-rose-100';
                textColor = 'text-rose-700';
                Icon = Flame;
            }
        }

        acc[label] = { 
            name: label, 
            temp: isNaN(tempVal) ? -999 : tempVal, // Para ordenação
            value: 0, 
            color, 
            bg, 
            textColor,
            Icon 
        };
      }

      const circuitsCount = (b.circuits || []).length;
      acc[label].value += circuitsCount;
      total += circuitsCount;
    });

    const sortedData = Object.values(acc)
        .sort((a, b) => a.temp - b.temp)
        .filter(item => item.value > 0); // Remove vazios

    return { chartData: sortedData, totalCircuits: total };
  }, [baths]);

  // Tooltip Customizado (Igual ao do PieChart)
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700">
          <p className="font-bold text-sm mb-1">{item.name}</p>
          <div className="flex items-baseline gap-1">
             <span className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</span>
             <span className="text-xs text-slate-400">circuitos</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {totalCircuits > 0 ? ((item.value / totalCircuits) * 100).toFixed(1) : 0}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* LADO ESQUERDO: GRÁFICO */}
        <div className="w-full md:w-1/2 p-8 bg-slate-50 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-200 relative min-h-[350px]">
            <h3 className="absolute top-6 left-6 font-bold text-slate-400 text-xs uppercase tracking-wider flex items-center gap-2">
                <Thermometer size={14} /> Distribuição Térmica
            </h3>
            
            <div className="h-64 w-full mt-8">
                {totalCircuits > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
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
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                      </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Thermometer size={48} className="opacity-20 mb-2" />
                    <span className="text-xs">Sem dados</span>
                  </div>
                )}
            </div>
        </div>

        {/* LADO DIREITO: DETALHES */}
        <div className="w-full md:w-1/2 p-8 flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Temperaturas</h2>
                    <p className="text-sm text-slate-500">Capacidade por faixa térmica.</p>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 -mt-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {chartData.map((item) => {
                    const percent = totalCircuits > 0 ? ((item.value / totalCircuits) * 100).toFixed(1) : 0;
                    return (
                        <div key={item.name} className="group">
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${item.bg} ${item.textColor}`}>
                                        <item.Icon size={18} />
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
                            {/* Barra de Progresso */}
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

            {/* --- ÁREA DO TOTAL --- */}
            <div className="mt-6 pt-4 border-t-2 border-slate-100 border-dashed">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Layers size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Total de Circuitos</span>
                    </div>
                    <span className="text-3xl font-extrabold text-slate-800">{totalCircuits}</span>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};

export default TemperatureStatsModal;