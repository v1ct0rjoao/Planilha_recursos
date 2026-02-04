import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { List, BarChart2, UploadCloud } from 'lucide-react';
import { API_URL } from '../../utils/constants';

const HistoryView = ({ logs }) => {
  const [viewMode, setViewMode] = useState('logs');
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => { 
    if (viewMode === 'chart') {
      fetch(`${API_URL}/oee/history`)
        .then(r => r.json())
        .then(setHistoryData)
        .catch(console.error); 
    }
  }, [viewMode]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div className="flex gap-4">
          <button onClick={() => setViewMode('logs')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'logs' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
            <List size={16} /> Logs Operacionais
          </button>
          <button onClick={() => setViewMode('chart')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'chart' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
            <BarChart2 size={16} /> Evolução OEE
          </button>
        </div>
        <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
          Exportar Excel <UploadCloud size={14} />
        </button>
      </div>

      {viewMode === 'logs' ? (
        <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs tracking-wider border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-6 py-3 border-r border-slate-200">Data/Hora</th>
                <th className="px-6 py-3 border-r border-slate-200">Banho</th>
                <th className="px-6 py-3 border-r border-slate-200">Ação</th>
                <th className="px-6 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs && logs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-3 font-mono text-slate-500 border-r border-slate-100">{log.date}</td>
                  <td className="px-6 py-3 font-bold text-slate-700 border-r border-slate-100">{log.bath}</td>
                  <td className="px-6 py-3 border-r border-slate-100">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${log.action.includes('Remoção') || log.action.includes('Manutenção') ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 h-96 w-full">
          <h3 className="font-bold text-slate-700 mb-6 uppercase text-xs tracking-wider">Histórico de Indicadores Mensais</h3>
          {historyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="OEE" fill="#2563eb" name="OEE %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Disponibilidade" fill="#f97316" name="Disp. %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Performance" fill="#8b5cf6" name="Perf. %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Qualidade" fill="#10b981" name="Qual. %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
              <BarChart2 size={48} className="mb-2 opacity-20" />
              <p>Nenhum histórico salvo ainda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryView;