import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, Plus, Trash2, Users, FileText, Award, Loader2, LayoutDashboard } from 'lucide-react';
import { app } from '../../firebaseConfig';

const defaultLabConfig = {
  sobre: "O Complexo Laboratorial Moura (CLM) é o centro de excelência focado em testes físicos, elétricos e mecânicos. Nossa missão é garantir a qualidade absoluta e impulsionar a inovação de todos os produtos.",
  principio: "Fazer melhor tudo que fazemos.",
  acreditacoes: [
    { id: 1, nome: "ISO 9001", desc: "Gestão da Qualidade", icon: "fa-certificate", color: "text-amber-400" },
    { id: 2, nome: "ISO/IEC 17025", desc: "Competência de Laboratórios", icon: "fa-award", color: "text-blue-400" }
  ],
  equipe: [
    { id: 1, nome: "Renato Oliveira", cargo: "Supervisor", liderId: null, imgUrl: "https://i.pravatar.cc/150?img=11" }
  ]
};

const coresTailwind = [
  { label: 'Amarelo (Amber)', value: 'text-amber-400' },
  { label: 'Azul (Blue)', value: 'text-blue-400' },
  { label: 'Verde (Emerald)', value: 'text-emerald-400' },
  { label: 'Vermelho (Rose)', value: 'text-rose-400' },
  { label: 'Roxo (Purple)', value: 'text-purple-400' },
  { label: 'Cinza (Slate)', value: 'text-slate-400' }
];

const LabSettingsView = ({ setToast }) => {
  const [config, setConfig] = useState(defaultLabConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');

  const db = getFirestore(app);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'lab_data', 'config_login');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data());
        } else {
          const local = localStorage.getItem('moura_lab_config');
          if (local) setConfig(JSON.parse(local));
        }
      } catch (error) {
        if(setToast) setToast({ message: 'Erro ao carregar configurações.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, [db, setToast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'lab_data', 'config_login'), config);
      localStorage.setItem('moura_lab_config', JSON.stringify(config)); 
      if(setToast) setToast({ message: 'Configurações do Portal atualizadas com sucesso!', type: 'success' });
    } catch (error) {
      if(setToast) setToast({ message: 'Erro ao salvar no banco de dados.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Funções para Acreditações ---
  const addAcreditacao = () => {
    setConfig({
      ...config,
      acreditacoes: [...config.acreditacoes, { id: Date.now(), nome: '', desc: '', icon: 'fa-certificate', color: 'text-blue-400' }]
    });
  };

  const updateAcreditacao = (index, field, value) => {
    const novas = [...config.acreditacoes];
    novas[index][field] = value;
    setConfig({ ...config, acreditacoes: novas });
  };

  const removeAcreditacao = (id) => {
    setConfig({ ...config, acreditacoes: config.acreditacoes.filter(a => a.id !== id) });
  };

  // --- Funções para Equipe ---
  const addMembro = () => {
    setConfig({
      ...config,
      equipe: [...config.equipe, { id: Date.now(), nome: '', cargo: '', liderId: null, imgUrl: '' }]
    });
  };

  const updateMembro = (index, field, value) => {
    const novaEquipe = [...config.equipe];
    novaEquipe[index][field] = field === 'liderId' ? (value === '' ? null : Number(value)) : value;
    setConfig({ ...config, equipe: novaEquipe });
  };

  const removeMembro = (id) => {
    const novaEquipe = config.equipe
      .filter(m => m.id !== id)
      .map(m => m.liderId === id ? { ...m, liderId: null } : m);
    setConfig({ ...config, equipe: novaEquipe });
  };

  // NOVO: Função para ler o arquivo de imagem e transformar em Base64
  const handleImageUpload = (index, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Trava de segurança: Arquivos de até 500KB (evita estourar o limite do Firestore)
    if (file.size > 500 * 1024) {
      if (setToast) setToast({ message: 'A imagem é muito grande! Escolha uma foto de até 500KB.', type: 'error' });
      // Limpa o input
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // O resultado é a string Base64 da imagem
      updateMembro(index, 'imgUrl', reader.result);
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  }

  return (
    <div className="w-full h-full flex flex-col relative animate-in fade-in duration-300">
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl text-white shadow-sm flex items-center justify-center">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Página Inicial (Login)</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Edite as informações exibidas na tela de entrada do sistema.</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 active:scale-95">
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar Alterações
        </button>
      </div>

      <div className="mt-6 flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl shrink-0 w-fit border border-slate-200 dark:border-slate-700/50">
        <button onClick={() => setActiveTab('geral')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'geral' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <FileText size={16} /> Sobre o Lab
        </button>
        <button onClick={() => setActiveTab('acreditacoes')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'acreditacoes' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <Award size={16} /> Acreditações
        </button>
        <button onClick={() => setActiveTab('equipe')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'equipe' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <Users size={16} /> Organograma
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-6 pb-20 custom-scrollbar">
        {/* ABA: GERAL */}
        {activeTab === 'geral' && (
          <div className="max-w-3xl space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 block">Texto de Missão / Apresentação</label>
              <textarea 
                value={config.sobre || ''} 
                onChange={(e) => setConfig({...config, sobre: e.target.value})}
                className="w-full h-32 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm leading-relaxed"
                placeholder="Digite a missão ou descrição do laboratório..."
              />
              
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 block">Princípio Moura</label>
                <input 
                  type="text"
                  value={config.principio || ''} 
                  onChange={(e) => setConfig({...config, principio: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold"
                  placeholder="Ex: Fazer melhor tudo que fazemos."
                />
                <p className="text-xs text-slate-400 mt-2">Este princípio será destacado abaixo da missão na tela inicial.</p>
              </div>
            </div>
          </div>
        )}

        {/* ABA: ACREDITAÇÕES */}
        {activeTab === 'acreditacoes' && (
          <div className="space-y-4 max-w-4xl animate-in slide-in-from-bottom-4 duration-300">
            {config.acreditacoes.map((item, index) => (
              <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700 ${item.color}`}>
                  <i className={`fa-solid ${item.icon} text-xl`}></i>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Sigla / Nome</label>
                    <input type="text" value={item.nome} onChange={(e) => updateAcreditacao(index, 'nome', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-blue-500 dark:text-white" placeholder="Ex: ISO 9001" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Descrição Longa</label>
                    <input type="text" value={item.desc} onChange={(e) => updateAcreditacao(index, 'desc', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-blue-500 dark:text-white" placeholder="Ex: Gestão da Qualidade" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Ícone (FontAwesome)</label>
                    <input type="text" value={item.icon} onChange={(e) => updateAcreditacao(index, 'icon', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-mono rounded-lg px-3 py-2 outline-none focus:border-blue-500 dark:text-white" placeholder="Ex: fa-certificate" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Cor do Ícone</label>
                    <select value={item.color} onChange={(e) => updateAcreditacao(index, 'color', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-blue-500 dark:text-white cursor-pointer">
                      {coresTailwind.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => removeAcreditacao(item.id)} className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 hover:bg-rose-500 hover:text-white transition-colors focus:outline-none">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button onClick={addAcreditacao} className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800/50 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all focus:outline-none">
              <Plus size={18} /> ADICIONAR ACREDITAÇÃO
            </button>
          </div>
        )}

        {/* ABA: EQUIPE */}
        {activeTab === 'equipe' && (
          <div className="space-y-4 max-w-5xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 rounded-xl text-xs text-blue-700 dark:text-blue-300 font-medium mb-6">
              <i className="fa-solid fa-circle-info mr-2"></i>
              O organograma é montado automaticamente ligando um membro ao seu Líder Direto. A pessoa que ficar com líder "Nenhum" será o topo da árvore. Imagens devem ter no máximo 500KB.
            </div>

            {config.equipe.map((item, index) => (
              <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-5 relative">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 border-2 border-slate-200 dark:border-slate-700 overflow-hidden relative group">
                  <img src={item.imgUrl || `https://ui-avatars.com/api/?name=${item.nome || 'Novo'}&background=cbd5e1&color=fff`} alt={item.nome} className="w-full h-full object-cover" />
                  {/* Botão de excluir foto (só aparece se tiver foto customizada) */}
                  {item.imgUrl && item.imgUrl.startsWith('data:image') && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => updateMembro(index, 'imgUrl', '')} title="Remover Foto">
                      <Trash2 size={16} className="text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nome do Colaborador</label>
                    <input type="text" value={item.nome} onChange={(e) => updateMembro(index, 'nome', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-blue-500 dark:text-white" placeholder="Ex: Renato Oliveira" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Cargo / Função</label>
                    <input type="text" value={item.cargo} onChange={(e) => updateMembro(index, 'cargo', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-blue-500 dark:text-white" placeholder="Ex: Supervisor" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Líder Direto</label>
                    <select value={item.liderId || ''} onChange={(e) => updateMembro(index, 'liderId', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-blue-500 dark:text-white cursor-pointer truncate">
                      <option value="">Nenhum (Topo da Hierarquia)</option>
                      {config.equipe.filter(m => m.id !== item.id).map(m => (
                        <option key={m.id} value={m.id}>{m.nome} ({m.cargo})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Foto do Perfil</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(index, e)}
                      className="w-full text-[11px] text-slate-500 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 dark:file:bg-slate-700 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-slate-600 transition-colors cursor-pointer"
                    />
                  </div>
                </div>

                <button onClick={() => removeMembro(item.id)} className="absolute top-2 right-2 md:static md:mt-1 w-8 h-8 md:w-10 md:h-10 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 hover:bg-rose-500 hover:text-white transition-colors focus:outline-none" title="Remover da Equipe">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button onClick={addMembro} className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800/50 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all focus:outline-none mt-4">
              <Plus size={18} /> ADICIONAR NOVO COLABORADOR
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabSettingsView;