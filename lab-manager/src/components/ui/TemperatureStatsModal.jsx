import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Thermometer, XCircle } from 'lucide-react';

const TemperatureStatsModal = ({ isOpen, onClose, baths }) => {
  if (!isOpen) return null;
  
  const data = useMemo(() => {
    const acc = {};
    baths.forEach(b => {
      const t = b.temp !== undefined ? b.temp : 'N/A';
      const label = `${t}ºC`;
      if (!acc[label]) acc[label] = { name: label, temp: parseFloat(t) || 0, count: 0, active: 0 };
      const circuits = b.circuits || [];
      acc[label].count += circuits.length;
      acc[label].active += circuits.filter(c => c.status === 'running' || c.status === 'finished').length;
    });
    return Object.values(acc).sort((a, b) => a.temp - b.temp);
  }, [baths]);

  const getBarColor = (temp) => {
    if (temp < 25) return '#3b82f6';
    if (temp === 25) return '#10b981';
    if (temp <= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 relative z-[102]">
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg"><Thermometer size={24} /></div>
            <div>
              <h2 className="font-bold text-xl leading-tight">Distribuição Térmica</h2>
              <p className="text-slate-300 text-xs font-medium">Capacidade por Temperatura</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors"><XCircle size={24} /></button>
        </div>
        <div className="p-8">
          <div className="h-80 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" name="Total Circuitos" radius={[6, 6, 0, 0]} barSize={50}>
                  {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={getBarColor(entry.temp)} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {data.map((d) => (
              <div key={d.name} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{d.name}</span>
                <span className="text-2xl font-black text-slate-700">{d.count}</span>
                <span className="text-[10px] font-medium text-slate-400">{d.active} em uso</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemperatureStatsModal;