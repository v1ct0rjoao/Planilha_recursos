import React, { useState } from 'react';
import LimsDashboard from './LimsDashboard';
import LimsAtividades from './LimsAtividades';
import LimsAnalises from './LimsAnalises'; 

const GerenciadorLims = () => {
  const [currentView, setCurrentView] = useState('home'); 

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 font-sans animate-in fade-in duration-300">
      
      <header className="px-8 h-[72px] bg-white border-b border-slate-200 flex items-center gap-8 shrink-0 z-20">
         <div className="flex items-center gap-4 shrink-0 border-r border-slate-200 pr-8 mr-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <i className="fa-solid fa-flask-vial text-xl"></i>
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">myLIMS</span>
         </div>
         
         <nav className="flex gap-8 overflow-x-auto custom-scrollbar h-full items-end">
            <button 
              onClick={() => setCurrentView('home')} 
              className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors relative ${currentView === 'home' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Início
              {currentView === 'home' && <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-md"></span>}
            </button>
            <button 
              onClick={() => setCurrentView('atividades')} 
              className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors relative ${currentView === 'atividades' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Atividades
              {currentView === 'atividades' && <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-md"></span>}
            </button>
            <button 
              onClick={() => setCurrentView('analises')} 
              className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors relative ${currentView === 'analises' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Análises
              {currentView === 'analises' && <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-md"></span>}
            </button>
            <button 
              onClick={() => setCurrentView('sistema')} 
              className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors relative ${currentView === 'sistema' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Sistema
              {currentView === 'sistema' && <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-md"></span>}
            </button>
         </nav>
      </header>

      <main className="flex-1 overflow-y-auto relative w-full p-6 lg:p-8">
         {currentView === 'home' && <LimsDashboard navigateTo={setCurrentView} />}
         {currentView === 'atividades' && <LimsAtividades />}
         
         {currentView === 'analises' && (
           <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in">
             <h1 className="text-3xl font-black text-slate-400 uppercase tracking-widest">Página de Análises em Construção</h1>
           </div>
         )}
         
         {currentView === 'sistema' && (
           <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in">
             <h1 className="text-3xl font-black text-slate-400 uppercase tracking-widest">Página de Sistema em Construção</h1>
           </div>
         )}
      </main>

    </div>
  );
};

export default GerenciadorLims;