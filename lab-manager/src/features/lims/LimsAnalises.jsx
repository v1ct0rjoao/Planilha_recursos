import React, { useState } from 'react';
import { 
  Search, Barcode, Grid, Eye, FileText, Play, CheckCircle2, 
  ChevronDown, ListFilter, Calendar, MapPin, User, Hash, 
  ClipboardList, Layers, FilterX, Boxes, FileStack, Minimize2, Maximize2
} from 'lucide-react';

const LimsAnalises = () => {
  const [activeSubTab, setActiveSubTab] = useState('pos'); 
  const [selectedId, setSelectedId] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [isCompact, setIsCompact] = useState(false);

  const ActionButton = ({ icon: Icon, label, variant = "default", onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm border ${
      variant === "primary" ? "bg-blue-600 border-blue-700 text-white hover:bg-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
    }`}>
      <Icon size={16} className={variant === "primary" ? "text-white" : "text-blue-500"} />
      {label}
    </button>
  );

  const FilterField = ({ label, placeholder, icon: Icon, type = "text" }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={14} />}
        <input 
          type={type} 
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
        />
      </div>
    </div>
  );

  const DropdownButton = ({ icon: Icon, label, options }) => (
    <div className="relative group">
      <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
        <Icon size={16} className="text-blue-500" /> {label} <ChevronDown size={14} className="text-slate-400" />
      </button>
      <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 hidden group-hover:block z-50 animate-in fade-in zoom-in-95">
        {options.map((opt, i) => (
          <button key={i} className="w-full text-left px-5 py-2.5 text-[12px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors uppercase tracking-tight">
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  const thPadding = isCompact ? "px-4 py-3 text-[9px]" : "px-8 py-5 text-[10px]";
  const tdPadding = isCompact ? "px-4 py-2.5 text-xs" : "px-8 py-5 text-sm";

  return (
    <div className="flex h-full w-full gap-6 animate-in fade-in duration-500">
      
      {showFilters && (
        <aside className="w-[340px] shrink-0 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <ListFilter size={18} className="text-blue-600" /> Filtros Avançados
            </h2>
            <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase">Limpar Tudo</button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 bg-white">
            <FilterField label="Método de Análise" placeholder="Ex: C20, CCA..." icon={ClipboardList} />
            <FilterField label="Etapa" placeholder="Selecione a etapa..." icon={Play} />
            <FilterField label="Batelada CQ" placeholder="Nº da batelada..." icon={Boxes} />
            
            <div className="grid grid-cols-2 gap-3">
              <FilterField label="Data Prior. Início" type="date" icon={Calendar} />
              <FilterField label="Data Prior. Fim" type="date" icon={Calendar} />
            </div>

            <FilterField label="Área de Serviço" placeholder="Laboratório..." icon={MapPin} />
            <FilterField label="Responsável" placeholder="Nome..." icon={User} />
            <FilterField label="Lote de Produção" placeholder="Busca por lote..." icon={FileStack} />
            <FilterField label="Atividades" placeholder="Cód. Atividade..." icon={Hash} />
            <FilterField label="Ponto de Coleta" placeholder="Local de coleta..." icon={MapPin} />
            <FilterField label="Tipo de Amostra" placeholder="Ex: SLI, VRLA..." icon={Layers} />
            
            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="w-5 h-5 rounded-lg text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" />
                <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Realizando Etapa?</span>
              </label>
            </div>
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-w-0">
        
        <div className="p-6 border-b border-slate-100 flex flex-col gap-6 bg-white shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <ActionButton icon={Barcode} label="Código de Barras" />
              <ActionButton icon={Grid} label="Grid" />
              <ActionButton icon={Search} label="Pesquisar" />
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
              >
                <FilterX size={16} /> {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>
              
              <div className="w-px h-6 bg-slate-200 mx-2 hidden lg:block" />
              
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                 <button 
                  onClick={() => setActiveSubTab('pre')}
                  className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase transition-all ${activeSubTab === 'pre' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                 >Pré-Recebimento</button>
                 <button 
                  onClick={() => setActiveSubTab('pos')}
                  className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase transition-all ${activeSubTab === 'pos' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                 >Pós-Recebimento</button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ActionButton 
                icon={isCompact ? Maximize2 : Minimize2} 
                label={isCompact ? "Visão Normal" : "Visão Compacta"} 
                onClick={() => setIsCompact(!isCompact)} 
              />
              <div className="w-px h-6 bg-slate-200 mx-1 hidden lg:block" />
              <ActionButton icon={Play} label="Iniciar" variant="primary" />
              <ActionButton icon={CheckCircle2} label="Realizar" variant="primary" />
              <ActionButton icon={Boxes} label="Batelada CQ" />
              <DropdownButton icon={Eye} label="Visualizar" options={["Amostra", "Análises", "Especificações", "Batelada CQ", "Instrução"]} />
              <DropdownButton icon={FileText} label="Documentos" options={["Ficha de Análises", "Etiqueta de Amostra (Análises)"]} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar bg-white relative">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-md z-30 border-b border-slate-200">
              <tr className="uppercase tracking-[0.2em] text-slate-400 font-black">
                <th className={`${thPadding} w-24 sticky left-0 bg-slate-50/95 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Id</th>
                <th className={thPadding}>Método de Análise</th>
                <th className={thPadding}>Etapa</th>
                <th className={thPadding}>Coleta</th>
                <th className={thPadding}>Data Prioritária</th>
                <th className={`${thPadding} w-32 text-center sticky right-0 bg-slate-50/95 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-40`}>Validade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-amber-50 hover:bg-amber-100/80 transition-all cursor-pointer group">
                <td className={`${tdPadding} font-black text-rose-600 sticky left-0 bg-amber-50 group-hover:bg-amber-100/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}>10920</td>
                <td className={tdPadding}><span className="font-black text-amber-800">Encaminhar para teardown</span></td>
                <td className={tdPadding}><span className="inline-flex px-3 py-1 bg-amber-200/50 text-amber-800 text-[10px] font-black uppercase rounded-lg">Execução dos Ensaios</span></td>
                <td className={`${tdPadding} font-bold text-slate-500`}>-</td>
                <td className={`${tdPadding} font-black text-slate-700 uppercase`}>28/12/2023 15:51</td>
                <td className={`${tdPadding} text-center sticky right-0 bg-amber-50 group-hover:bg-amber-100/80 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20`}><span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block border border-slate-300"></span></td>
              </tr>
              {[10921, 10922, 11074, 11075, 11185].map((id) => {
                const isSelected = selectedId === id;
                const rowBg = isSelected ? 'bg-blue-50/50' : 'bg-white';
                const hoverBg = isSelected ? 'hover:bg-blue-50/50' : 'hover:bg-slate-50';
                return (
                  <tr key={id} onClick={() => setSelectedId(id)} className={`${rowBg} ${hoverBg} transition-all cursor-pointer group`}>
                    <td className={`${tdPadding} font-black text-blue-600 sticky left-0 ${rowBg} group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20 ${isSelected ? 'group-hover:bg-blue-50/50' : ''}`}>{id}</td>
                    <td className={`${tdPadding} font-bold text-slate-700`}>Subseção 6.2 - 4º C20 @25ºC - SCANIA CVS52 - SLI</td>
                    <td className={tdPadding}><span className="inline-flex px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-lg">Coleta de Dados</span></td>
                    <td className={`${tdPadding} font-bold text-slate-500`}>-</td>
                    <td className={`${tdPadding} font-bold text-slate-500 uppercase`}>02/01/2024 11:02</td>
                    <td className={`${tdPadding} text-center sticky right-0 ${rowBg} group-hover:bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20 ${isSelected ? 'group-hover:bg-blue-50/50' : ''}`}><span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block border border-slate-300"></span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white font-black text-sm shadow-lg shadow-blue-200">1</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">2</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">3</button>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Registros: 20</span>
             <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black text-slate-600 outline-none focus:border-blue-500 shadow-sm cursor-pointer">
                <option>20 por página</option>
                <option>50 por página</option>
                <option>100 por página</option>
             </select>
          </div>
        </div>

      </main>
    </div>
  );
};

export default LimsAnalises;