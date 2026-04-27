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

const OrgTreeStyles = () => (
  <style>{`
    html { font-size: 16px; }
    @media (max-width: 1600px) { html { font-size: 14px; } }
    @media (max-width: 1366px), (max-height: 800px) { html { font-size: 12px; } }
    @media (max-width: 1024px) { html { font-size: 14px; } }
    .modal-tree-container { width: 100%; height: 100%; overflow: auto; text-align: center; padding: 2.5rem 1.25rem; }
    .modal-tree-container::-webkit-scrollbar { height: 0.5rem; width: 0.5rem; }
    .modal-tree-container::-webkit-scrollbar-track { background: transparent; }
    .modal-tree-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 0.625rem; }
    .modal-tree-container::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
    .tree-wrapper { display: inline-block; margin: 0 auto; padding-bottom: 3.75rem; text-align: center; }
    .tree { display: inline-block; white-space: nowrap; }
    .tree ul { padding-top: 1.5rem; position: relative; transition: all 0.5s; display: flex; justify-content: center; padding-left: 0; margin: 0; }
    .tree li { text-align: center; list-style-type: none; position: relative; padding: 1.5rem 0.375rem 0 0.375rem; transition: all 0.5s; }
    .tree li::before, .tree li::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 0.125rem solid rgba(255,255,255,0.15); width: 50%; height: 1.5rem; }
    .tree li::after { right: auto; left: 50%; border-left: 0.125rem solid rgba(255,255,255,0.15); }
    .tree li:only-child::after, .tree li:only-child::before { display: none; }
    .tree li:only-child { padding-top: 0; }
    .tree li:first-child::before, .tree li:last-child::after { border: 0 none; }
    .tree li:last-child::before { border-right: 0.125rem solid rgba(255,255,255,0.15); border-radius: 0 0.5rem 0 0; }
    .tree li:first-child::after { border-radius: 0.5rem 0 0 0; }
    .tree ul ul::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 0.125rem solid rgba(255,255,255,0.15); width: 0; height: 1.5rem; transform: translateX(-1px); }
    .org-card { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0, 32, 92, 0.6); border: 1px solid rgba(0, 108, 176, 0.4); backdrop-filter: blur(12px); border-radius: 0.75rem; padding: 0.75rem 0.875rem; min-width: 8.125rem; max-width: 9.375rem; transition: all 0.2s; position: relative; z-index: 10; box-shadow: 0 0.25rem 1.25rem rgba(0,0,0,0.2); }
    .org-card:hover { transform: translateY(-3px); background: rgba(0, 108, 176, 0.2); border-color: #FFBF3C; }
    .org-avatar { width: 2.75rem; height: 2.75rem; border-radius: 50%; border: 0.125rem solid #FFBF3C; margin: 0 auto 0.5rem auto; object-fit: cover; }
    .org-name { color: white; font-size: 0.75rem; font-weight: 700; white-space: normal; line-height: 1.2; margin-bottom: 0.125rem;}
    .org-role { color: #8EB1D8; font-size: 0.5625rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; white-space: normal; line-height: 1.1;}
  `}</style>
);

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const LoginPage = () => {
  const { loginWithMicrosoft, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState(defaultLabConfig);
  const [isTechMode, setIsTechMode] = useState(false);
  const [techUsername, setTechUsername] = useState('');
  const [techPass, setTechPass] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [techName, setTechName] = useState('');

  useEffect(() => {
    const fetchConfigFromDB = async () => {
      try {
        const db = getFirestore(app);
        const docSnap = await getDoc(doc(db, 'lab_data', 'config_login'));
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
    catch (err) { setError('Falha na autenticação.'); setIsLoading(false); }
  };

  const handleTechLogin = async (e) => {
    e.preventDefault();
    if (!techUsername || !techPass) { setError('Preencha os dados.'); return; }
    setIsLoading(true); setError('');
    try { 
      const emailFormatado = techUsername.includes('@') ? techUsername : `${techUsername.trim().toLowerCase()}@moura.com`;
      await loginWithEmail(emailFormatado, techPass);
    } catch (err) { 
      setError('Credenciais inválidas.'); setIsLoading(false); 
    }
  };

  const handleTechRegister = async (e) => {
    e.preventDefault();
    if (!techName || !techUsername || !techPass) { setError('Preencha todos os dados.'); return; }
    if (techPass.length < 6) { setError('A palavra-passe deve ter pelo menos 6 caracteres.'); return; }
    
    setIsLoading(true); setError('');
    try { 
      const emailFormatado = techUsername.includes('@') ? techUsername : `${techUsername.trim().toLowerCase()}@moura.com`;
      await registerWithEmail(techName, emailFormatado, techPass); 
    } catch (err) { 
      setError('Erro ao criar conta. Verifique se o utilizador já existe.'); 
      setIsLoading(false); 
    }
  };

  const renderOrgNode = (member, allMembers) => {
    const children = allMembers.filter(m => m.liderId === member.id);
    const childChunks = chunkArray(children, 4);

    return (
      <li key={member.id}>
        <div className="org-card">
          <img src={member.imgUrl} alt={member.nome} className="org-avatar" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${member.nome}&background=0f172a&color=fff` }} />
          <h3 className="org-name" title={member.nome}>{member.nome}</h3>
          <p className="org-role" title={member.cargo}>{member.cargo}</p>
        </div>
        {childChunks.length > 0 && (
          <div className="flex flex-col items-center w-full">
            {childChunks.map((chunk, index) => (
              <React.Fragment key={index}>
                {index > 0 && <div className="w-[0.125rem] h-6 bg-[rgba(255,255,255,0.15)] relative z-0 mx-auto"></div>}
                <ul className="relative z-10">
                  {chunk.map(child => renderOrgNode(child, allMembers))}
                </ul>
              </React.Fragment>
            ))}
          </div>
        )}
      </li>
    );
  };

  const roots = config.equipe ? config.equipe.filter(m => !m.liderId) : [];

  return (
    <div className="min-h-screen bg-[#000a1a] text-white p-4 md:p-8 flex items-center justify-center relative overflow-hidden font-sans selection:bg-[#006CB0]">
      <OrgTreeStyles />
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#00205C] rounded-full blur-[150px] opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#006CB0] rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
  
        <div className="lg:col-span-8 bg-white/[0.03] border border-white/10 backdrop-blur-md rounded-3xl p-8 lg:p-12 flex flex-col justify-between shadow-2xl">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-gradient-to-br from-[#00205C] to-[#006CB0] rounded-2xl flex items-center justify-center shadow-lg border border-[#006CB0]/40">
              <i className="fa-solid fa-bolt text-2xl text-[#FFBF3C]"></i>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">CLM Moura</h1>
              <p className="text-[#FFBF3C] text-xs font-bold uppercase tracking-widest mt-1">Laboratório Físico</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.15] mb-6">
              Plataforma de Gestão<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBF3C] to-[#FFE082]">LabFísico.</span>
            </h2>
            <div 
              className="text-slate-300 text-lg max-w-2xl leading-relaxed mb-6 quill-content"
              dangerouslySetInnerHTML={{ __html: config.sobre }}
            />
            {config.principio && (
              <div className="inline-flex items-center gap-2 bg-[#006CB0]/20 border border-[#006CB0]/30 text-[#8EB1D8] px-4 py-2 rounded-full text-sm font-medium">
                <i className="fa-solid fa-leaf"></i> {config.principio}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 lg:row-span-2 bg-white border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00205C] to-[#FFBF3C]"></div>
          
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            {isTechMode ? (isRegisterMode ? 'Criar Conta' : 'Acesso Técnico') : 'Acessar Sistema'}
          </h3>
          <p className="text-slate-500 text-sm mb-8">
            {isTechMode ? (isRegisterMode ? 'Registre-se para acompanhar solicitações.' : 'Credenciais de bancada.') : 'Identidade corporativa.'}
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

              <button onClick={() => setIsTechMode(true)} disabled={isLoading} className="w-full flex items-center justify-center gap-3 bg-slate-50 border-2 border-slate-200 hover:border-[#006CB0] hover:bg-white text-slate-700 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]">
                <i className="fa-solid fa-terminal text-slate-400"></i> Conta Local
              </button>
              <button onClick={() => handleAuth(loginWithGoogle)} disabled={isLoading} className="w-full flex items-center justify-center gap-3 bg-slate-50 border-2 border-slate-200 hover:border-slate-300 hover:bg-white text-slate-700 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-4 h-4" alt="Google" /> Conta Google
              </button>
            </div>
          ) : (
            <form onSubmit={isRegisterMode ? handleTechRegister : handleTechLogin} className="flex flex-col gap-4 animate-in fade-in">
              
              {isRegisterMode && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nome Completo</label>
                  <input 
                    type="text" value={techName} onChange={(e) => setTechName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#006CB0] focus:ring-2 focus:ring-[#006CB0]/20 transition-all"
                    placeholder="Seu nome"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  email
                </label>
                <input 
                  type="text" value={techUsername} onChange={(e) => setTechUsername(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#006CB0] focus:ring-2 focus:ring-[#006CB0]/20 transition-all"
                  placeholder= "exemplo@email.com"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Palavra-passe</label>
                <input 
                  type="password" value={techPass} onChange={(e) => setTechPass(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#006CB0] focus:ring-2 focus:ring-[#006CB0]/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
              
              <button type="submit" disabled={isLoading} className="mt-2 w-full flex items-center justify-center gap-2 bg-[#006CB0] hover:bg-[#00205C] text-white py-4 rounded-xl text-sm font-bold transition-all active:scale-[0.98]">
                {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (isRegisterMode ? 'Criar Conta' : 'Acessar')}
              </button>
              
              <div className="flex flex-col items-center gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); }} 
                  className="text-xs font-bold text-[#006CB0] hover:text-[#00205C] transition-colors"
                >
                  {isRegisterMode ? 'Já tem conta? Faça Login' : 'Primeiro Acesso? Registe-se aqui'}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => { setIsTechMode(false); setIsRegisterMode(false); setError(''); }} 
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Voltar para Login Corporativo
                </button>
              </div>
            </form>
          )}
          
          <div className="mt-8 flex items-center justify-center gap-2">
             <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sistema Operacional</span>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="fa-solid fa-award"></i> Acreditações
            </h3>
            <div className="space-y-3">
              {config.acreditacoes?.slice(0, 3).map(cert => (
                <div key={cert.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[#8EB1D8]">
                    <i className={`fa-solid ${cert.icon} text-sm`}></i>
                  </div>
                  <div className="truncate">
                    <p className="text-white text-sm font-medium truncate">{cert.nome}</p>
                    <p className="text-slate-400 text-xs truncate">{cert.desc}</p>
                  </div>
                </div>
              ))}
              {config.acreditacoes?.length === 0 && <p className="text-slate-400 text-sm">Nenhum registro.</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white/[0.02] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="fa-solid fa-users"></i> Nossa Estrutura
            </h3>
            
            <div className="flex -space-x-3 mb-6">
              {config.equipe?.slice(0, 5).map(member => (
                <img key={member.id} src={member.imgUrl} alt={member.nome} className="w-10 h-10 rounded-full border-2 border-[#000a1a] object-cover" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${member.nome}&background=0f172a&color=fff` }} />
              ))}
              {config.equipe?.length > 5 && (
                <div className="w-10 h-10 rounded-full border-2 border-[#000a1a] bg-[#00205C] flex items-center justify-center text-xs font-bold text-[#FFBF3C]">
                  +{config.equipe.length - 5}
                </div>
              )}
            </div>

            <button onClick={() => setIsModalOpen(true)} className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors flex items-center justify-center gap-2">
              Ver organograma <i className="fa-solid fa-arrow-right text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#000a1a]/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200 overflow-hidden">
   
          <div className="w-full flex items-center justify-between p-6 border-b border-white/10 bg-[#000a1a] sticky top-0 z-10 shadow-lg">
            <div>
              <h2 className="text-2xl font-bold text-white">Organograma</h2>
              <p className="text-slate-400 text-sm mt-1">Estrutura Operacional do Laboratório</p>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="bg-white/5 hover:bg-rose-500/20 text-white hover:text-rose-400 px-4 py-2 rounded-xl flex items-center justify-center transition-all border border-white/10 shadow-sm text-sm font-bold">
              <i className="fa-solid fa-arrow-left mr-2"></i> Voltar
            </button>
          </div>
   
          <div className="flex-1 overflow-hidden">
            <div className="modal-tree-container">
              {roots.length > 0 ? (
                <div className="tree-wrapper">
                  <div className="tree">
                    <ul>{roots.map(root => renderOrgNode(root, config.equipe))}</ul>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">Estrutura não configurada.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;