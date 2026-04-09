import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authenticador'; 
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../../firebaseConfig';

const defaultLabConfig = {
  sobre: "Centro de excelência focado em testes físicos, elétricos e mecânicos.",
  principio: "Qualidade e inovação contínua.",
  acreditacoes: [],
  equipe: []
};

const LoginPage = () => {
  const { loginWithMicrosoft, loginWithGoogle, loginWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState(defaultLabConfig);
  const [isTechMode, setIsTechMode] = useState(false);
  const [techUsername, setTechUsername] = useState('');
  const [techPass, setTechPass] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchConfigFromDB = async () => {
      try {
        const db = getFirestore(app);
        const docSnap = await getDoc(docRef(db, 'lab_data', 'config_login'));
        if (docSnap.exists()) {
          setConfig(docSnap.data());
          localStorage.setItem('moura_lab_config', JSON.stringify(docSnap.data()));
        } else {
          const local = localStorage.getItem('moura_lab_config');
          if (local) setConfig(JSON.parse(local));
        }
      } catch (err) {
        const local = localStorage.getItem('moura_lab_config');
        if (local) setConfig(JSON.parse(local));
      }
    };
    fetchConfigFromDB();
  }, []);

  const handleAuth = async (providerFunc) => {
    setIsLoading(true); setError('');
    try { await providerFunc(); }
    catch (err) { setError('Falha na autenticação. Tente novamente.'); setIsLoading(false); }
  };

  const handleTechLogin = async (e) => {
    e.preventDefault();
    if (!techUsername || !techPass) { setError('Preencha os dados.'); return; }
    setIsLoading(true); setError('');
    try { 
      await loginWithEmail(`${techUsername.trim().toLowerCase()}@bancada.moura.com`, techPass); 
    } catch (err) { 
      setError('Credenciais inválidas.'); setIsLoading(false); 
    }
  };

  const renderTeamBlocks = () => {
    if (!config.equipe || config.equipe.length === 0) {
      return <div className="text-slate-500 text-center py-20">Estrutura não configurada.</div>;
    }

    const supervisor = config.equipe.find(m => !m.liderId) || config.equipe[0];
    if (!supervisor) return null;

    const leaders = config.equipe.filter(m => 
      m.id !== supervisor.id && config.equipe.some(child => child.liderId === m.id)
    );

    const cellMembersIds = new Set();
    const getDeepTeam = (leaderId) => {
      let team = [];
      const direct = config.equipe.filter(m => m.liderId === leaderId);
      team = [...direct];
      direct.forEach(d => { team = [...team, ...getDeepTeam(d.id)]; });
      return team;
    };

    leaders.forEach(l => {
      getDeepTeam(l.id).forEach(m => cellMembersIds.add(m.id));
    });

    const directStaff = config.equipe.filter(m => 
      m.id !== supervisor.id && 
      !leaders.find(l => l.id === m.id) && 
      !cellMembersIds.has(m.id)
    );

    return (
      <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20">
        
        <div className="flex flex-col items-center">
          <div className="bg-[#00205C]/40 border border-[#006CB0]/40 p-6 rounded-3xl backdrop-blur-md flex flex-col sm:flex-row items-center gap-6 w-full max-w-2xl shadow-[0_0_40px_rgba(0,32,92,0.3)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <img 
              src={supervisor.imgUrl} alt={supervisor.nome} 
              className="w-24 h-24 rounded-full border-4 border-[#FFBF3C] object-cover shadow-lg shrink-0" 
              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${supervisor.nome}&background=0f172a&color=fff` }} 
            />
            <div className="text-center sm:text-left">
              <span className="text-[#FFBF3C] text-[10px] font-bold uppercase tracking-widest mb-1 block">Gestão Geral</span>
              <h3 className="text-2xl font-bold text-white mb-1">{supervisor.nome}</h3>
              <p className="text-slate-300 text-sm">{supervisor.cargo}</p>
            </div>
          </div>
        </div>

        {directStaff.length > 0 && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl">
              {directStaff.map(staff => (
                <div key={staff.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 pr-5 flex items-center gap-4 hover:bg-white/10 transition-colors">
                  <img 
                    src={staff.imgUrl} alt={staff.nome} 
                    className="w-11 h-11 rounded-full border-2 border-slate-600 object-cover shrink-0" 
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${staff.nome}&background=0f172a&color=fff` }} 
                  />
                  <div>
                    <h4 className="text-white text-sm font-semibold leading-tight">{staff.nome}</h4>
                    <p className="text-slate-400 text-[10px] uppercase tracking-wider">{staff.cargo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {leaders.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-4">
            {leaders.map(leader => {
              const teamMembers = getDeepTeam(leader.id);
              return (
                <div key={leader.id} className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col shadow-xl hover:bg-white/[0.04] transition-colors">
                  
                  <div className="flex items-center gap-5 pb-5 border-b border-white/10 mb-5">
                    <img 
                      src={leader.imgUrl} alt={leader.nome} 
                      className="w-16 h-16 rounded-full border-2 border-[#006CB0] object-cover shadow-md shrink-0" 
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${leader.nome}&background=0f172a&color=fff` }} 
                    />
                    <div>
                      <span className="text-[#5D96C9] text-[9px] font-bold uppercase tracking-widest block mb-1">Liderança de Célula</span>
                      <h4 className="text-lg font-bold text-white leading-tight">{leader.nome}</h4>
                      <p className="text-slate-400 text-xs">{leader.cargo}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {teamMembers.map(member => (
                      <div key={member.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-2.5 hover:bg-white/10 transition-colors group">
                        <img 
                          src={member.imgUrl} alt={member.nome} 
                          className="w-8 h-8 rounded-full border border-slate-600 group-hover:border-[#FFBF3C] transition-colors object-cover shrink-0" 
                          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${member.nome}&background=0f172a&color=fff` }} 
                        />
                        <div className="overflow-hidden">
                          <h5 className="text-slate-200 text-xs font-semibold truncate">{member.nome}</h5>
                          <p className="text-slate-400 text-[9px] uppercase tracking-wider truncate">{member.cargo}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    /* Mudamos de h-screen para min-h-screen. O overflow-y fica livre para criar scroll se a tela for pequena */
    <div className="min-h-screen w-full bg-[#000a1a] text-white p-4 sm:p-8 flex items-center justify-center relative overflow-x-hidden font-sans selection:bg-[#006CB0]">
      
      {/* Efeitos de Fundo da Moura */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#00205C] rounded-full blur-[150px] opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#006CB0] rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

      {/* Grid Responsivo Inteligente: 1 coluna no celular, 12 colunas no desktop */}
      <div className="w-full max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 py-4">
  
        {/* LADO ESQUERDO: Dashboard Info (Ocupa 7 colunas no Desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          
          <div className="bg-white/[0.03] border border-white/10 backdrop-blur-md rounded-3xl p-8 xl:p-12 shadow-2xl h-full flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-[#00205C] to-[#006CB0] rounded-2xl flex items-center justify-center shadow-lg border border-[#006CB0]/40 shrink-0">
                <i className="fa-solid fa-bolt text-2xl text-[#FFBF3C]"></i>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">CLM Moura</h1>
                <p className="text-[#FFBF3C] text-xs font-bold uppercase tracking-widest mt-1">Laboratório Físico</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.15] mb-6">
                Plataforma de Gestão<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBF3C] to-[#FFE082]">LabManager.</span>
              </h2>
              <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
                {config.sobre}
              </p>
              {config.principio && (
                <div className="inline-flex items-center gap-2 bg-[#006CB0]/20 border border-[#006CB0]/30 text-[#8EB1D8] px-4 py-2 rounded-full text-sm font-medium">
                  <i className="fa-solid fa-leaf"></i> {config.principio}
                </div>
              )}
            </div>
          </div>

          {/* Os dois cards de baixo divididos lado a lado no desktop (Acreditações e Equipe) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="fa-solid fa-award"></i> Acreditações
              </h3>
              <div className="space-y-3">
                {config.acreditacoes?.slice(0, 3).map(cert => (
                  <div key={cert.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[#8EB1D8]">
                      <i className={`fa-solid ${cert.icon} text-sm`}></i>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{cert.nome}</p>
                      <p className="text-slate-400 text-xs truncate">{cert.desc}</p>
                    </div>
                  </div>
                ))}
                {(!config.acreditacoes || config.acreditacoes.length === 0) && <p className="text-slate-400 text-sm">Nenhum registro.</p>}
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-users"></i> Nossa Estrutura
                </h3>
                <div className="flex -space-x-3 mb-6">
                  {config.equipe?.slice(0, 5).map(member => (
                    <img key={member.id} src={member.imgUrl} alt={member.nome} className="w-10 h-10 rounded-full border-2 border-[#000a1a] object-cover shrink-0" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${member.nome}&background=0f172a&color=fff` }} />
                  ))}
                  {config.equipe?.length > 5 && (
                    <div className="w-10 h-10 rounded-full border-2 border-[#000a1a] bg-[#00205C] flex items-center justify-center text-xs font-bold text-[#FFBF3C] shrink-0">
                      +{config.equipe.length - 5}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors flex items-center justify-center gap-2">
                Ver Diretório da Equipe <i className="fa-solid fa-arrow-right text-xs"></i>
              </button>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: Autenticação (Ocupa 5 colunas no Desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-white/10 rounded-3xl p-8 xl:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00205C] to-[#FFBF3C]"></div>
          
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            {isTechMode ? 'Acesso Técnico' : 'Acessar Sistema'}
          </h3>
          <p className="text-slate-500 text-sm mb-8">
            {isTechMode ? 'Credenciais de bancada.' : 'Identidade corporativa.'}
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in">
              <i className="fa-solid fa-circle-exclamation text-red-500 mt-0.5"></i>
              <span className="text-sm font-medium text-red-800">{error}</span>
            </div>
          )}

          {!isTechMode ? (
            <div className="flex flex-col gap-4 animate-in fade-in">
              <button onClick={() => handleAuth(loginWithMicrosoft)} disabled={isLoading} className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-4 py-4 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg">
                {isLoading ? <i className="fa-solid fa-circle-notch fa-spin text-lg"></i> : (
                  <><svg className="w-5 h-5" viewBox="0 0 21 21"><path d="M0 0h10v10H0z" fill="#f25022"/><path d="M11 0h10v10H11z" fill="#7fba00"/><path d="M0 11h10v10H0z" fill="#00a4ef"/><path d="M11 11h10v10H11z" fill="#ffb900"/></svg> Entrar com Microsoft Moura</>
                )}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="mx-4 text-xs font-bold text-slate-300 uppercase">ou</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setIsTechMode(true)} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-slate-50 border-2 border-slate-200 hover:border-[#006CB0] hover:bg-white text-slate-700 px-3 py-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.98]">
                  <i className="fa-solid fa-terminal text-slate-400"></i> Acesso Local
                </button>
                <button onClick={() => handleAuth(loginWithGoogle)} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-slate-50 border-2 border-slate-200 hover:border-slate-300 hover:bg-white text-slate-700 px-3 py-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.98]">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-4 h-4" alt="Google" /> Google
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleTechLogin} className="flex flex-col gap-4 animate-in fade-in">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Usuário</label>
                <input 
                  type="text" value={techUsername} onChange={(e) => setTechUsername(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#006CB0] focus:ring-2 focus:ring-[#006CB0]/20 transition-all"
                  placeholder="ex: joao.victor"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Senha</label>
                <input 
                  type="password" value={techPass} onChange={(e) => setTechPass(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#006CB0] focus:ring-2 focus:ring-[#006CB0]/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
              
              <button type="submit" disabled={isLoading} className="mt-2 w-full flex items-center justify-center gap-2 bg-[#006CB0] hover:bg-[#00205C] text-white py-4 rounded-xl text-sm font-bold transition-all active:scale-[0.98]">
                {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Acessar'}
              </button>
              
              <button type="button" onClick={() => setIsTechMode(false)} className="mt-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                Voltar para Login Corporativo
              </button>
            </form>
          )}
          
          <div className="mt-8 flex items-center justify-center gap-2">
             <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sistema Operacional</span>
          </div>
        </div>

      </div>

      {/* MODAL FULL-SCREEN DO DIRETÓRIO (Scroll Ativo) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#000a1a]/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200 overflow-hidden">
          <div className="w-full flex items-center justify-between p-6 border-b border-white/10 bg-[#000a1a] sticky top-0 z-10 shadow-lg shrink-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Diretório do Laboratório</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Organização de Lideranças e Apoio Direto</p>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white/5 hover:bg-rose-500/20 text-white hover:text-rose-400 rounded-full flex items-center justify-center transition-all border border-white/10 shadow-sm shrink-0">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-10 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
            {renderTeamBlocks()}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;