//Esses são os cards que mostram "OEE Mensal", "Disponibilidade", etc. Eles têm uma lógica visual legal de mudar a cor dependendo se a meta foi atingida.

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, color, suffix = '%' }) => {
  // Mapa de cores para facilitar o uso. Em vez de passar classes CSS, passamos 'blue', 'green', etc.
  const colorClasses = { 
    blue: 'text-blue-600 bg-blue-50', 
    green: 'text-green-600 bg-green-50', 
    purple: 'text-purple-600 bg-purple-50', 
    orange: 'text-orange-600 bg-orange-50', 
    red: 'text-red-600 bg-red-50' 
  };
  
  const theme = colorClasses[color] || colorClasses.blue;
  const numValue = parseFloat(value) || 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
        <div className={`p-2 rounded-lg ${theme}`}>
          
          <Icon size={18} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold text-slate-800">{numValue}{suffix}</span>
          <div className="flex items-center mt-1 space-x-1">
            {numValue >= 70 ? (
              <TrendingUp size={14} className="text-green-500" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wide ${numValue >= 70 ? 'text-green-500' : 'text-red-500'}`}>
              {numValue >= 70 ? 'Meta Atingida' : 'Abaixo da Meta'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPICard;