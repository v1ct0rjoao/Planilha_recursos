import React, { useState } from 'react';
import { BarChart3, FlaskConical, Settings, FileWarning } from 'lucide-react';

const LimsDashboard = ({ navigateTo }) => {
  const [activeTab, setActiveTab] = useState('painel');

  return (
    <div className="flex-1 flex flex-col w-full h-full animate-in fade-in duration-300">
      <div className="bg-white border-b border-slate-200 px-10 pt-6 shrink-0 flex gap-10">
        <button onClick={() => setActiveTab('painel')} className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors relative ${activeTab === 'painel' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}>
          Painel de Controle
          {activeTab === 'painel' && <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-md"></span>}
        </button>
        <button onClick={() => setActiveTab('relatorios')} className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors relative ${activeTab === 'relatorios' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}>
          Relatórios Gerenciais
          {activeTab === 'relatorios' && <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-md"></span>}
        </button>
      </div>

      <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-transparent w-full">
        
        {/* CONTEÚDO: PAINEL DE CONTROLE (Acesso Rápido) */}
        {activeTab === 'painel' && (
          <div className="max-w-7xl mx-auto animate-in fade-in">
             <h2 className="text-3xl font-black text-slate-900 mb-10 tracking-tight">Acesso Rápido aos Módulos</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                <div onClick={() => navigateTo('atividades')} className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all cursor-pointer group">
                   <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                     <FlaskConical size={40} />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Atividades e Amostras</h3>
                   <p className="text-base font-medium text-slate-500 leading-relaxed">Gerencie Lotes de Produção, Experiências, rastreabilidade e amostras em teste.</p>
                </div>

                <div onClick={() => navigateTo('analises')} className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm hover:shadow-xl hover:border-emerald-400 hover:-translate-y-1 transition-all cursor-pointer group">
                   <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                     <BarChart3 size={40} />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Análises Físicas</h3>
                   <p className="text-base font-medium text-slate-500 leading-relaxed">Acesse diretamente os resultados, aprovações, laudos e pareceres técnicos.</p>
                </div>

                <div onClick={() => navigateTo('sistema')} className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm hover:shadow-xl hover:border-slate-400 hover:-translate-y-1 transition-all cursor-pointer group">
                   <div className="w-20 h-20 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                     <Settings size={40} />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Sistema Base</h3>
                   <p className="text-base font-medium text-slate-500 leading-relaxed">Configurações globais, métodos, especificações e regras de negócio do laboratório.</p>
                </div>

             </div>
          </div>
        )}

        {activeTab === 'relatorios' && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 animate-in fade-in">
             <FileWarning size={64} className="opacity-20 mb-6" />
             <h3 className="text-2xl font-black text-slate-600 tracking-tight">Relatórios em Desenvolvimento</h3>
             <p className="text-base font-medium mt-3 text-slate-500">Os dashboards gerenciais do LIMS estarão disponíveis em breve.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default LimsDashboard;