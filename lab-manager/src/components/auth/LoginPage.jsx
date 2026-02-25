import React, { useState, useEffect } from 'react';
import { 
  Zap, User, Lock, ArrowRight, Loader2, AlertCircle, 
  BatteryCharging, Microscope, Award, Users, CheckCircle2, 
  Building2, ChevronLeft, ChevronRight, Zap as ZapIcon,
  FileCheck, Globe, Shield, GitGraph, Network
} from 'lucide-react';

// Avatar Component
const UserAvatar = ({ name, role, imgUrl, highlight, small }) => (
  <div className={`flex items-center gap-3 bg-white/10 ${small ? 'p-1.5 pr-3' : 'p-2 pr-4'} rounded-full border ${highlight ? 'border-yellow-400/50 bg-white/20' : 'border-white/10'} hover:bg-white/20 hover:scale-105 transition-all cursor-default shadow-sm backdrop-blur-sm group`}>
    <div className={`${small ? 'w-8 h-8' : 'w-10 h-10'} rounded-full border-2 ${highlight ? 'border-yellow-400' : 'border-white/20'} overflow-hidden shrink-0 transition-colors`}>
      <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
    </div>
    <div className="flex flex-col">
      <span className={`${small ? 'text-[10px]' : 'text-xs'} font-bold text-white leading-none`}>{name}</span>
      <span className={`${small ? 'text-[8px]' : 'text-[10px]'} ${highlight ? 'text-yellow-400' : 'text-blue-200'} mt-0.5`}>{role}</span>
    </div>
  </div>
);

// Accreditation Card
const AccreditationCard = ({ title, sub, icon: Icon, color }) => (
  <div className="flex-1 bg-[#003870]/80 backdrop-blur-sm border border-white/10 p-3 rounded-xl flex flex-col items-center justify-center text-center gap-2 hover:bg-white/10 hover:scale-105 transition-all cursor-default shadow-lg group">
    <div className={`p-2 rounded-full bg-white/5 group-hover:bg-white/20 transition-colors ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <span className="block text-xs font-black text-white uppercase tracking-wider">{title}</span>
      <span className="block text-[9px] font-medium text-blue-200 mt-0.5">{sub}</span>
    </div>
  </div>
);

const LoginPage = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0); 
  const [isPaused, setIsPaused] = useState(false);
  const totalTabs = 3; // Aumentado para incluir o organograma

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % totalTabs);
    }, 10000); // 10 segundos para dar tempo de ver o organograma
    return () => clearInterval(interval);
  }, [isPaused]);

  const nextSlide = () => setActiveTab((prev) => (prev + 1) % totalTabs);
  const prevSlide = () => setActiveTab((prev) => (prev - 1 + totalTabs) % totalTabs);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      if (credentials.username && credentials.password) {
        onLogin(true);
      } else {
        setError('Credenciais inválidas.');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans text-slate-900">
      <div 
        className="hidden lg:flex w-7/12 bg-[#004D90] relative overflow-hidden flex-col justify-between p-16 text-white"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-blue-500/20 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-20%] w-[600px] h-[600px] rounded-full bg-[#002a5c] blur-[100px]"></div>
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-lg">
            <Zap size={32} className="text-yellow-400" fill="currentColor" /> 
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold tracking-tight text-white leading-none">LabFísico</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-0.5 w-4 bg-yellow-400"></span>
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.2em]">Baterias Moura • Engenharia</span>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 flex-1 flex items-center w-full">
            <button onClick={prevSlide} className="absolute -left-8 p-2 rounded-full bg-white/5 hover:bg-white/20 text-white/50 hover:text-white transition-all z-20 backdrop-blur-sm">
              <ChevronLeft size={24} />
            </button>

            <div className="relative w-full h-[550px] flex flex-col justify-center max-w-2xl mx-auto">
                
                {/* SLIDE 0: INSTITUCIONAL & ACREDITAÇÃO */}
                <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-in-out ${activeTab === 0 ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-4 w-fit border border-blue-400/30">
                      <Building2 size={12} /> Engenharia de Produtos
                    </div>
                    <h1 className="text-4xl font-black leading-tight mb-4 tracking-tight">
                      Excelência Técnica e<br />
                      <span className="text-yellow-400">Inovação Contínua.</span>
                    </h1>
                    <p className="text-blue-100 text-base leading-relaxed font-light mb-8 max-w-xl">
                      Nosso laboratório é referência nacional em metrologia e ensaios, garantindo a confiabilidade das baterias que movem o futuro.
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <Award size={16} className="text-yellow-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">Acreditações do Laboratório</h4>
                    </div>

                    {/* modificação: adicionado cards de acreditação */}
                    <div className="flex gap-3 w-full">
                      <AccreditationCard title="ISO/IEC 17025" sub="Gestão Laboratorial" icon={FileCheck} color="text-emerald-400" />
                      <AccreditationCard title="IATF 16949" sub="Qualidade Automotiva" icon={CheckCircle2} color="text-blue-400" />
                      <AccreditationCard title="INMETRO" sub="Certificação Oficial" icon={Globe} color="text-yellow-400" />
                    </div>
                </div>

                {/* SLIDE 1: ORGANOGRAMA (Novo) */}
                <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-in-out ${activeTab === 1 ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-[10px] font-bold uppercase tracking-wider mb-6 w-fit border border-yellow-400/20">
                      <Network size={12} /> Estrutura Organizacional
                    </div>

                    <div className="space-y-8 relative">
                      {/* Nível 1: Supervisor */}
                      <div className="flex flex-col items-center">
                        <UserAvatar name="Carlos Supervisor" role="Supervisor Geral" imgUrl="https://randomuser.me/api/portraits/men/32.jpg" highlight={true} />
                        <div className="w-px h-6 bg-yellow-400/30 my-1"></div>
                        <div className="flex gap-4">
                          <UserAvatar name="Apoio 01" role="Engenheiro" imgUrl="https://randomuser.me/api/portraits/women/65.jpg" small={true} />
                          <UserAvatar name="Apoio 02" role="Analista" imgUrl="https://randomuser.me/api/portraits/men/45.jpg" small={true} />
                        </div>
                      </div>

                      {/* Divisor */}
                      <div className="flex justify-center -my-2 opacity-20"><GitGraph size={24} className="rotate-90" /></div>

                      {/* Nível 2: Líder e Time */}
                      <div className="flex flex-col items-center">
                        <UserAvatar name="Líder Operação" role="Liderança Técnica" imgUrl="https://randomuser.me/api/portraits/men/86.jpg" highlight={true} />
                        <div className="w-px h-6 bg-yellow-400/30 my-1"></div>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                           {[...Array(8)].map((_, i) => (
                             <UserAvatar 
                               key={i} 
                               small={true}
                               name={`Operador ${i + 1}`} 
                               role="Técnico" 
                               imgUrl={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${40 + i}.jpg`} 
                             />
                           ))}
                        </div>
                      </div>
                    </div>
                </div>

                {/* SLIDE 2: SISTEMA */}
                <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-in-out ${activeTab === 2 ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
                    <h1 className="text-5xl font-black leading-[1.1] mb-6 tracking-tight">
                      Validação e<br />
                      Ensaios de Alta<br />
                      <span className="text-yellow-400">Performance.</span>
                    </h1>
                    <p className="text-blue-100 text-lg leading-relaxed font-light mb-10 max-w-lg border-l-4 border-yellow-400 pl-4">
                      Gestão integrada de circuitos de ciclagem e monitoramento em tempo real de ensaios laboratoriais.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#003870]/60 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-start gap-3 hover:bg-[#003870] transition-colors group">
                          <div className="bg-blue-600/30 p-2 rounded-lg group-hover:bg-yellow-400 group-hover:text-blue-900 transition-colors text-blue-400"><BatteryCharging size={20} /></div>
                          <div><h3 className="font-bold text-sm text-white">Gestão de Circuitos</h3><p className="text-[11px] text-blue-200 mt-0.5">Cargas, descargas e OEE.</p></div>
                      </div>
                      <div className="bg-[#003870]/60 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-start gap-3 hover:bg-[#003870] transition-colors group">
                          <div className="bg-blue-600/30 p-2 rounded-lg group-hover:bg-yellow-400 group-hover:text-blue-900 transition-colors text-blue-400"><Microscope size={20} /></div>
                          <div><h3 className="font-bold text-sm text-white">Análise de Falhas</h3><p className="text-[11px] text-blue-200 mt-0.5">Rastreabilidade completa.</p></div>
                      </div>
                    </div>
                </div>
            </div>

            <button onClick={nextSlide} className="absolute -right-8 p-2 rounded-full bg-white/5 hover:bg-white/20 text-white/50 hover:text-white transition-all z-20 backdrop-blur-sm">
              <ChevronRight size={24} />
            </button>
        </div>

        <div className="relative z-10 flex items-center justify-between pt-8 border-t border-white/10 mt-auto text-xs font-medium text-blue-200/60">
       
           <div className="flex gap-2">
             {[0, 1, 2].map((index) => (
                <button key={index} onClick={() => setActiveTab(index)} className={`h-1.5 rounded-full transition-all duration-300 ${activeTab === index ? 'w-8 bg-yellow-400' : 'w-2 bg-white/30'}`} />
             ))}
           </div>
        </div>
      </div>

      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 md:p-12 relative bg-white">
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
           <div className="bg-[#004D90] text-white p-1.5 rounded-lg shadow-sm"><Zap size={20} fill="currentColor" className="text-yellow-400" /></div>
           <span className="text-xl font-bold text-slate-900">LabFísico</span>
        </div>

        <div className="w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-4 border border-blue-100">
              <ZapIcon size={12} fill="currentColor" /> Acesso Restrito
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Login</h2>
            <p className="text-slate-500 text-sm">Portal de Engenharia Moura</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Matrícula / Usuário</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#004D90] transition-colors duration-300"><User size={18} /></div>
                <input type="text" name="username" value={credentials.username} onChange={handleChange} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-[2px] focus:ring-blue-500/20 focus:border-[#004D90] transition-all duration-200" placeholder="Usuario" autoComplete="off" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1"><label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Senha</label></div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#004D90] transition-colors duration-300"><Lock size={18} /></div>
                <input type="password" name="password" value={credentials.password} onChange={handleChange} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-[2px] focus:ring-blue-500/20 focus:border-[#004D90] transition-all duration-200" placeholder="••••••••" />
              </div>
            </div>

            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2"><AlertCircle size={16} className="shrink-0" />{error}</div>}

            <button type="submit" disabled={isLoading} className="w-full bg-[#004D90] hover:bg-[#003870] active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/10 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group mt-2">
              {isLoading ? <><Loader2 size={18} className="animate-spin text-white/80" /><span className="text-white/90">Autenticando...</span></> : <>Acessar Plataforma<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>
          
          <div className="mt-10 border-t border-slate-100 pt-6 text-center">
             <p className="text-xs text-slate-400">Desenvolvido por <strong>João Victor</strong><br/>LabFísico Sistema v2.2 &copy; 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;