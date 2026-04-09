import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authenticador'; 



const getLabConfig = () => {
  const saved = localStorage.getItem('moura_lab_config');
  return saved ? JSON.parse(saved) : defaultLabConfig;
};

const TreeStyles = () => (
  <style>{`
    :root {
      --lvl-a: #007c7c; 
      --lvl-b: #34a853; 
      --lvl-c: #fbbc04; 
      --lvl-d: #f28b00; 
      --line-color: rgba(255, 255, 255, 0.4);
    }
    .org-tree-container { width: 100%; overflow-x: auto; text-align: center; padding: 10px 0 30px 0; -ms-overflow-style: none; scrollbar-width: none; }
    .org-tree-container::-webkit-scrollbar { display: none; }
    .tree { display: inline-block; white-space: nowrap; }
    .tree ul { padding-top: 25px; position: relative; transition: all 0.5s; display: flex; justify-content: center; padding-left: 0; margin: 0; }
    .tree li { text-align: center; list-style-type: none; position: relative; padding: 25px 10px 0 10px; transition: all 0.5s; }
    .tree li::before, .tree li::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 2px solid var(--line-color); width: 50%; height: 25px; }
    .tree li::after { right: auto; left: 50%; border-left: 2px solid var(--line-color); }
    .tree li:only-child::after, .tree li:only-child::before { display: none; }
    .tree li:only-child { padding-top: 0; }
    .tree li:first-child::before, .tree li:last-child::after { border: 0 none; }
    .tree li:last-child::before { border-right: 2px solid var(--line-color); border-radius: 0 6px 0 0; }
    .tree li:first-child::after { border-radius: 6px 0 0 0; }
    .tree ul ul::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid var(--line-color); width: 0; height: 25px; transform: translateX(-1px); }
    .org-node { display: inline-flex; position: relative; text-decoration: none; transition: transform 0.2s; }
    .org-node:hover { transform: translateY(-3px); z-index: 10; }
    .org-node.standard-pill { background: white; border-radius: 50px; padding: 8px 25px 8px 35px; box-shadow: 0 8px 20px rgba(0,0,0,0.15); min-width: 170px; text-align: left; margin-left: 20px; margin-top: 10px; align-items: center; }
    .org-node.special-pill { flex-direction: column; align-items: center; }
    .org-node.special-pill .pill-box { background: white; border-radius: 50px; padding: 12px 30px; box-shadow: 0 8px 20px rgba(0,0,0,0.15); min-width: 200px; text-align: center; position: relative; }
    .org-node.special-pill .avatar-ring { position: relative; top: 0; left: 0; transform: none; margin: 0 auto -20px auto; z-index: 2; width: 70px; height: 70px; }
    .org-node.special-pill .avatar-ring img { width: 60px; height: 60px; }
    .org-node.circle-node { flex-direction: column; align-items: center; width: 90px; }
    .org-node.circle-node .avatar-ring { position: relative; top: 0; left: 0; transform: none; margin-bottom: 8px; width: 55px; height: 55px; }
    .org-node.circle-node .node-title { color: white; white-space: normal; line-height: 1.1; margin-bottom: 4px; }
    .org-node.circle-node .node-desc { color: rgba(255,255,255,0.7); white-space: normal; line-height: 1; }
    .avatar-ring { position: absolute; top: 50%; left: -25px; transform: translateY(-50%); width: 55px; height: 55px; border-radius: 50%; border: 4px solid transparent; display: flex; align-items: center; justify-content: center; }
    .avatar-ring img { width: 45px; height: 45px; border-radius: 50%; border: 3px solid white; object-fit: cover; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
    .node-title { font-size: 13px; font-weight: 800; margin: 0 0 2px 0; text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
    .node-desc { font-size: 9px; font-weight: 700; color: #888; margin: 0; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
    .level-a .avatar-ring { border-left-color: var(--lvl-a); border-bottom-color: var(--lvl-a); }
    .level-a .node-title { color: var(--lvl-a); }
    .level-b .avatar-ring { border-left-color: var(--lvl-b); border-bottom-color: var(--lvl-b); }
    .level-b .node-title { color: var(--lvl-b); }
    .level-c .avatar-ring { border-left-color: var(--lvl-c); border-bottom-color: var(--lvl-c); }
    .level-c .node-title { color: var(--lvl-c); }
    .level-d .avatar-ring { border-left-color: var(--lvl-d); border-bottom-color: var(--lvl-d); }
    .level-d .node-title { color: var(--lvl-d); }
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
  const { loginWithMicrosoft, loginWithGoogle, loginWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const config = getLabConfig();

  const [isTechMode, setIsTechMode] = useState(false);
  const [techUsername, setTechUsername] = useState('');
  const [techPass, setTechPass] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === 2 ? 0 : prev + 1));
    }, 7000); 
    return () => clearInterval(timer);
  }, []);

  const handleMicrosoftLogin = async () => {
    setIsLoading(true); setError('');
    try { await loginWithMicrosoft(); }
    catch (err) { setError('Falha na autenticação corporativa.'); setIsLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true); setError('');
    try { await loginWithGoogle(); }
    catch (err) { setError('Falha no acesso via conta pessoal.'); setIsLoading(false); }
  };

  const handleTechLogin = async (e) => {
    e.preventDefault();
    if (!techUsername || !techPass) {
      setError('Preencha os dados de acesso.');
      return;
    }
    setIsLoading(true); setError('');
    try { 
      const formattedEmail = `${techUsername.trim().toLowerCase()}@bancada.moura.com`;
      await loginWithEmail(formattedEmail, techPass); 
    } catch (err) { 
      setError('Usuário não encontrado ou senha incorreta.'); 
      setIsLoading(false); 
    }
  };

  const renderOrgNode = (member, allMembers, depth = 0) => {
    const children = allMembers.filter(m => m.liderId === member.id);
    const isLeaf = children.length === 0;

    let levelClass = 'level-d';
    let layoutType = 'circle';

    if (depth === 0) {
      levelClass = 'level-a'; layoutType = 'special-pill';
    } else if (!isLeaf) {
      levelClass = depth === 1 ? 'level-b' : 'level-c'; layoutType = 'standard-pill';
    } else {
      levelClass = 'level-d'; layoutType = 'circle';
    }

    const MAX_ITEMS_PER_ROW = 4;
    const childChunks = chunkArray(children, MAX_ITEMS_PER_ROW);

    return (
      <li key={member.id}>
        {layoutType === 'special-pill' && (
          <div className={`org-node special-pill ${levelClass}`}>
            <div className="avatar-ring">
              <img src={member.imgUrl} alt={member.nome} onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${member.nome}&background=cbd5e1&color=fff` }} />
            </div>
            <div className="pill-box">
              <h3 className="node-title" title={member.nome}>{member.nome}</h3>
              <p className="node-desc" title={member.cargo}>{member.cargo}</p>
            </div>
          </div>
        )}
        {layoutType === 'standard-pill' && (
          <div className={`org-node standard-pill ${levelClass}`}>
            <div className="avatar-ring">
              <img src={member.imgUrl} alt={member.nome} onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${member.nome}&background=cbd5e1&color=fff` }} />
            </div>
            <div className="node-info">
              <h3 className="node-title" title={member.nome}>{member.nome}</h3>
              <p className="node-desc" title={member.cargo}>{member.cargo}</p>
            </div>
          </div>
        )}
        {layoutType === 'circle' && (
          <div className={`org-node circle-node ${levelClass}`}>
            <div className="avatar-ring">
              <img src={member.imgUrl} alt={member.nome} onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${member.nome}&background=cbd5e1&color=fff` }} />
            </div>
            <div className="node-info">
              <h3 className="node-title" title={member.nome}>{member.nome}</h3>
              <p className="node-desc" title={member.cargo}>{member.cargo}</p>
            </div>
          </div>
        )}
        {childChunks.length > 0 && (
          <div className="flex flex-col items-center w-full">
            {childChunks.map((chunk, index) => (
              <React.Fragment key={index}>
                {index > 0 && <div className="w-[2px] h-6 bg-white/40"></div>}
                <ul className="flex justify-center">
                  {chunk.map(child => renderOrgNode(child, allMembers, depth + 1))}
                </ul>
              </React.Fragment>
            ))}
          </div>
        )}
      </li>
    );
  };

  const roots = config.equipe.filter(m => !m.liderId);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans overflow-hidden bg-white">
      <TreeStyles />
      <div className="relative w-full lg:w-1/2 bg-gradient-to-br from-[#004D90] to-[#002855] flex-col hidden lg:flex min-h-screen overflow-hidden">
        <div className="absolute top-[-10%] right-[-20%] w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[600px] h-[600px] bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-[95%] 2xl:max-w-5xl mx-auto flex flex-col h-full justify-between p-8 xl:p-12 relative z-20">
          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-white/10 w-14 h-14 flex items-center justify-center rounded-2xl backdrop-blur-md border border-white/20 shadow-lg">
              <i className="fa-solid fa-bolt text-3xl text-amber-400"></i>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-none">CLM Moura</h1>
              <p className="text-blue-200 text-sm font-bold uppercase tracking-widest mt-1.5">Laboratório Físico</p>
            </div>
          </div>
          <div className="relative flex-1 w-full flex items-center my-6">
            <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-1000 transform ${currentSlide === 0 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
              <h2 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-8 tracking-tight">Gestão inteligente <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">para recursos físicos.</span></h2>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-xl">
                <h3 className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><i className="fa-solid fa-bullseye"></i> Nossa Missão</h3>
                <p className="text-blue-50 text-lg font-medium leading-relaxed">{config.sobre}</p>
              </div>
            </div>
            <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-1000 transform ${currentSlide === 1 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
              <h2 className="text-4xl xl:text-5xl font-extrabold text-white mb-10 tracking-tight">Acreditações de Excelência</h2>
              <div className="flex flex-col gap-5">
                {config.acreditacoes.map(cert => (
                  <div key={cert.id} className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-6 shadow-lg hover:bg-white/15 transition-all">
                    <div className={`w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20 ${cert.color}`}><i className={`fa-solid ${cert.icon} text-2xl`}></i></div>
                    <div>
                      <h4 className="font-black text-white text-xl">{cert.nome}</h4>
                      <span className="text-base font-medium text-blue-200">{cert.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-1000 transform ${currentSlide === 2 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
              <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight text-center">Nossa Estrutura</h2>
              <div className="org-tree-container"><div className="tree"><ul>{roots.map(root => renderOrgNode(root, config.equipe))}</ul></div></div>
            </div>
          </div>
          <div className="flex items-center justify-between shrink-0 pt-6 border-t border-white/10">
            <div className="flex gap-2.5">
              {[0, 1, 2].map((index) => (
                <button key={index} onClick={() => setCurrentSlide(index)} className={`h-2.5 rounded-full transition-all duration-500 ${currentSlide === index ? 'w-10 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'w-2.5 bg-white/30 hover:bg-white/50'}`} aria-label={`Ir para slide ${index + 1}`} />
              ))}
            </div>
            <div className="text-right flex items-center gap-3">
               <div className="flex flex-col items-end mr-1">
                 <span className="text-[10px] text-blue-200 font-bold uppercase tracking-widest leading-none mb-1">Status</span>
                 <span className="text-sm font-bold text-white leading-none">Sistema Operante</span>
               </div>
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10"><div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-pulse" /></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center relative bg-white p-6 sm:p-12">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="bg-[#004D90] w-12 h-12 flex items-center justify-center rounded-xl shadow-md"><i className="fa-solid fa-bolt text-2xl text-amber-400"></i></div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">CLM Moura</h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Laboratório Físico</p>
            </div>
          </div>
          
          <div className="w-20 h-20 bg-blue-50 text-[#004D90] rounded-3xl flex items-center justify-center shadow-inner border border-blue-100 mb-8 transition-all">
            <i className={`fa-solid ${isTechMode ? 'fa-user-gear' : 'fa-shield-halved'} text-4xl drop-shadow-sm`}></i>
          </div>
          
          <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2 text-center">
            {isTechMode ? 'Acesso Técnico' : 'Acesso Restrito'}
          </h2>
          <p className="text-base text-slate-500 font-medium mb-10 text-center">
            {isTechMode ? 'Insira seu nome de usuário da bancada.' : 'Utilize suas credenciais corporativas.'}
          </p>

          {error && (
            <div className="w-full mb-8 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <i className="fa-solid fa-circle-exclamation text-lg shrink-0"></i>{error}
            </div>
          )}

          {!isTechMode ? (
            <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <button onClick={handleMicrosoftLogin} disabled={isLoading} className="w-full bg-[#004D90] hover:bg-[#003870] active:scale-[0.98] text-white py-4 px-6 rounded-2xl font-bold text-base shadow-xl shadow-blue-900/20 transition-all duration-300 flex items-center justify-center gap-4 disabled:opacity-70 group hover:-translate-y-1">
                {isLoading ? (<i className="fa-solid fa-circle-notch fa-spin text-2xl text-white/80"></i>) : (
                  <><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg> Entrar com Microsoft Moura</>
                )}
              </button>

              <div className="flex items-center gap-4 my-4 w-full">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outras Opções</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => setIsTechMode(true)} disabled={isLoading} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]">
                  <i className="fa-solid fa-desktop"></i> Acesso de Local
                </button>
                <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full bg-white hover:bg-slate-50 text-slate-600 py-3.5 px-6 rounded-xl font-bold text-sm border-2 border-slate-200 transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98]">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="18" alt="Google" /> Acesso com conta Google
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleTechLogin} className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Usuário</label>
                <input 
                  type="text" 
                  value={techUsername}
                  onChange={(e) => setTechUsername(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:border-[#004D90] focus:ring-4 focus:ring-blue-900/10 transition-all"
                  placeholder="Ex: joao.victor"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Senha Local</label>
                <input 
                  type="password" 
                  value={techPass}
                  onChange={(e) => setTechPass(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:border-[#004D90] focus:ring-4 focus:ring-blue-900/10 transition-all"
                  placeholder="••••••••"
                />
              </div>
              
              <button type="submit" disabled={isLoading} className="w-full mt-2 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white py-4 px-6 rounded-xl font-bold text-base shadow-lg shadow-slate-800/20 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70">
                {isLoading ? <i className="fa-solid fa-circle-notch fa-spin text-xl"></i> : <><i className="fa-solid fa-right-to-bracket"></i> Acessar Sistema</>}
              </button>
              
              <button type="button" onClick={() => setIsTechMode(false)} className="mt-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors py-2">
                Voltar para Login Corporativo
              </button>
            </form>
          )}

          <p className="text-center text-xs text-slate-400 mt-12 font-medium leading-relaxed max-w-sm">Ambiente protegido. Suas informações são processadas diretamente pelos provedores oficiais de identidade.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;