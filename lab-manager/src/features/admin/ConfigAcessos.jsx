import React, { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Users, ShieldCheck, Loader2, X, Plus, UserPlus } from 'lucide-react';
import { app } from '../../firebaseConfig';
import { apiRequest } from '../../services/api';

const MODULES = [
  { id: 'dashboard', label: 'Visão Geral (Circuitos/Banhos)', icon: 'fa-chart-pie' },
  { id: 'nova_solicitacao', label: 'Criar Solicitações', icon: 'fa-file-signature' },
  { id: 'meus_acompanhamentos', label: 'Meus Acompanhamentos (Cliente)', icon: 'fa-list-check' },
  { id: 'baterias', label: 'Minhas Baterias (Cliente)', icon: 'fa-car-battery' },
  { id: 'acompanhamento', label: 'Gestão de Solicitações (Admin)', icon: 'fa-clipboard-check' },
  { id: 'lims', label: 'Atividades LIMS', icon: 'fa-flask-vial' },
  { id: 'bancada', label: 'Bancada (Execução)', icon: 'fa-flask' },
  { id: 'oee', label: 'Gestão OEE (Inserção)', icon: 'fa-industry' },
  { id: 'history', label: 'Dashboard OEE (Relatórios)', icon: 'fa-chart-line' },
  { id: 'protocolos', label: 'Gerenciador de Protocolos', icon: 'fa-vial-circle-check' },
  { id: 'calendar', label: 'Agenda do Laboratório', icon: 'fa-calendar-days' },
  { id: 'users', label: 'Gestão de Acessos', icon: 'fa-users' },
  { id: 'configuracoes', label: 'Configurações do Portal', icon: 'fa-gear' },
  { id: 'import_digatron', label: 'Importar Digatron', icon: 'fa-file-import' }
];

const PRESETS = {
  admin: ['dashboard', 'nova_solicitacao', 'meus_acompanhamentos', 'baterias', 'acompanhamento', 'lims', 'bancada', 'oee', 'history', 'protocolos', 'calendar', 'users', 'configuracoes', 'import_digatron'],
  gestor: ['dashboard', 'nova_solicitacao', 'meus_acompanhamentos', 'baterias', 'acompanhamento', 'lims', 'bancada', 'oee', 'history', 'protocolos', 'calendar', 'users', 'configuracoes'],
  lider: ['dashboard', 'nova_solicitacao', 'meus_acompanhamentos', 'baterias', 'acompanhamento', 'lims', 'bancada', 'oee', 'history', 'protocolos', 'calendar', 'users', 'configuracoes'],
  programacao_adm: ['dashboard', 'nova_solicitacao', 'acompanhamento', 'lims', 'oee', 'history', 'protocolos', 'calendar'],
  programacao_relatorio: ['history', 'acompanhamento', 'lims'],
  tecnico: ['dashboard', 'nova_solicitacao', 'lims', 'bancada', 'calendar', 'import_digatron'],
  cliente: ['nova_solicitacao', 'meus_acompanhamentos', 'baterias']
};

const UserManagementView = ({ setToast }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para Edição
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Estados para Criação
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ nome: '', username: '', password: '' });

  // Estados Compartilhados (Permissões)
  const [tempRole, setTempRole] = useState('');
  const [tempPermissions, setTempPermissions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [filterType, setFilterType] = useState('todos');
  const [searchUser, setSearchUser] = useState('');

  const db = getFirestore(app);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (error) {
      setToast({ message: "Erro ao carregar utilizadores", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openEditModal = (user) => {
    setSelectedUser(user);
    setTempRole(user.role || 'cliente');
    setTempPermissions(user.permissions || PRESETS['cliente']);
  };

  const openCreateModal = () => {
    setCreateForm({ nome: '', username: '', password: '' });
    setTempRole('tecnico');
    setTempPermissions(PRESETS['tecnico']);
    setIsCreateModalOpen(true);
  };

  const handlePresetChange = (newRole) => {
    setTempRole(newRole);
    if (PRESETS[newRole]) {
      setTempPermissions([...PRESETS[newRole]]);
    }
  };

  const togglePermission = (moduleId) => {
    setTempRole('personalizado');
    setTempPermissions(prev =>
      prev.includes(moduleId) ? prev.filter(p => p !== moduleId) : [...prev, moduleId]
    );
  };

  const saveEditedPermissions = async () => {
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        role: tempRole,
        permissions: tempPermissions
      });
      setToast({ message: "Acessos atualizados com sucesso!", type: "success" });
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      setToast({ message: "Erro ao salvar permissões", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateBenchUser = async (e) => {
    e.preventDefault();
    if (!createForm.nome || !createForm.username || !createForm.password) {
      setToast({ message: "Preencha todos os campos obrigatórios.", type: "error" });
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = {
        nome: createForm.nome,
        username: createForm.username,
        password: createForm.password,
        role: tempRole,
        permissions: tempPermissions
      };
      
     const response = await apiRequest('/criar_conta_local', 'POST', payload);
      
      if (response.success) {
        setToast({ message: "Usuário criado com sucesso!", type: "success" });
        setIsCreateModalOpen(false);
        fetchUsers();
      } else {
        setToast({ message: "Erro: " + (response.error || "Falha na criação."), type: "error" });
      }
    } catch (error) {
      setToast({ message: "Falha de comunicação com o servidor.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchText = (u.name || '').toLowerCase().includes(searchUser.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchUser.toLowerCase());

      const isInterno = ['admin', 'programacao', 'tecnico', 'gestor', 'lider', 'programacao_adm', 'programacao_relatorio'].includes(u.role);
      const isExterno = !isInterno;

      let matchType = true;
      if (filterType === 'interno') matchType = isInterno;
      if (filterType === 'externo') matchType = isExterno;

      return matchText && matchType;
    });
  }, [users, searchUser, filterType]);

  if (loading) return (
    <div className="flex flex-col h-full w-full relative animate-pulse p-6 lg:p-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
        <div className="flex flex-col gap-2"><div className="w-64 h-6 bg-slate-200 rounded"></div><div className="w-40 h-4 bg-slate-200 rounded"></div></div>
      </div>
      <div className="w-full max-w-xl h-12 bg-slate-100 rounded-xl mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 h-48 flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-200"></div>
              <div className="flex-1"><div className="w-24 h-4 bg-slate-200 rounded mb-2"></div><div className="w-32 h-3 bg-slate-200 rounded"></div></div>
            </div>
            <div className="w-20 h-3 bg-slate-200 rounded mb-4"></div>
            <div className="w-full h-10 bg-slate-200 rounded-xl mt-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full relative">

      <div className="pb-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl text-white shadow-sm flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Acessos</h2>
            <p className="text-sm font-medium text-slate-500">Controle Específico por Módulo</p>
          </div>
        </div>

        <div className="flex bg-slate-50 p-1.5 rounded-xl shrink-0 overflow-x-auto border border-slate-200 shadow-sm">
          <button onClick={() => setFilterType('todos')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${filterType === 'todos' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Todos</button>
          <button onClick={() => setFilterType('interno')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${filterType === 'interno' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Equipe Lab</button>
          <button onClick={() => setFilterType('externo')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${filterType === 'externo' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Clientes Externos</button>
        </div>
      </div>

      <div className="pt-6 pb-2 shrink-0 flex items-center justify-between gap-4 flex-wrap">
        <div className="relative w-full max-w-xl">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text" placeholder="Buscar por nome ou e-mail..."
            value={searchUser} onChange={(e) => setSearchUser(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        
        <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap">
          <UserPlus size={18} /> Novo Acesso Local
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-2">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <i className="fa-solid fa-users-slash text-5xl mb-4 opacity-30"></i>
            <p className="text-base font-bold">Nenhum utilizador encontrado com estes filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
            {filteredUsers.map((u) => (
              <div key={u.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-md hover:border-blue-300 transition-all flex flex-col min-w-0 group">
                <div className="flex items-center gap-4 mb-5 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg uppercase shrink-0 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200">
                    {u.name?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-base truncate" title={u.name}>{u.name}</h3>
                    <p className="text-xs font-medium text-slate-500 truncate mt-0.5" title={u.email}>{u.email}</p>
                  </div>
                </div>

                <div className="mb-6 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Perfil Base</span>
                  <span className="inline-flex items-center bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors">
                    {u.role ? u.role.replace('_', ' ') : 'CLIENTE'}
                  </span>
                </div>

                {u.role === 'admin' ? (
                  <button disabled className="w-full py-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed" title="O perfil de Administrador é blindado.">
                    <i className="fa-solid fa-shield-halved text-blue-400"></i> Perfil Bloqueado
                  </button>
                ) : (
                  <button onClick={() => openEditModal(u)} className="w-full py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95">
                    <i className="fa-solid fa-user-lock"></i> Editar Acessos
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL DE EDIÇÃO --- */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-8">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 truncate pr-4">Acessos: {selectedUser.name}</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Selecione as permissões exatas para este utilizador.</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 shadow-sm transition-all shrink-0"><X size={20} /></button>
            </div>

            <div className="p-6 md:p-8 border-b border-slate-100 shrink-0 bg-slate-50/50">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Aplicar Template Rápido</label>
              <select value={tempRole} onChange={(e) => handlePresetChange(e.target.value)} className="w-full bg-white border border-slate-300 text-sm font-bold text-slate-800 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-sm transition-all">
                <option value="personalizado">🛠️ Personalizado (Livre)</option>
                <option value="gestor">👑 Gestor</option>
                <option value="lider">👑 Líder</option>
                <option value="programacao_adm">📋 Programação / Administração</option>
                <option value="programacao_relatorio">📊 Programação / Relatórios</option>
                <option value="tecnico">🔧 Técnico</option>
                <option value="cliente">👤 Cliente Padrão</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MODULES.map(mod => {
                  const isActive = tempPermissions.includes(mod.id);
                  return (
                    <label key={mod.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-sm ${isActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                      <input type="checkbox" checked={isActive} onChange={() => togglePermission(mod.id)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0" />
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}><i className={`fa-solid ${mod.icon}`}></i></div>
                        <span className={`text-sm font-bold truncate ${isActive ? 'text-blue-900' : 'text-slate-700'}`} title={mod.label}>{mod.label}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-slate-200 flex justify-end gap-3 bg-white shrink-0">
              <button onClick={() => setSelectedUser(null)} className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors">Cancelar</button>
              <button onClick={saveEditedPermissions} disabled={isSaving} className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center gap-2">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />} Salvar Acessos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE CRIAÇÃO (ACESSO LOCAL) --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-8">
          <form onSubmit={handleCreateBenchUser} className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Novo Acesso de Bancada</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Crie um login local que não requer e-mail da Microsoft.</p>
              </div>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 shadow-sm transition-all shrink-0"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30 custom-scrollbar space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Nome Completo</label>
                  <input required type="text" value={createForm.nome} onChange={e => setCreateForm({...createForm, nome: e.target.value})} placeholder="Ex: João Victor" className="w-full bg-slate-50 border border-slate-300 text-sm font-bold text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Nome de Usuário</label>
                  <input required type="text" value={createForm.username} onChange={e => setCreateForm({...createForm, username: e.target.value})} placeholder="Ex: joao.victor" className="w-full bg-slate-50 border border-slate-300 text-sm font-bold text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Senha de Acesso</label>
                  <input required type="password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} placeholder="Mínimo 6 caracteres" minLength="6" className="w-full bg-slate-50 border border-slate-300 text-sm font-bold text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Aplicar Template Rápido</label>
                <select value={tempRole} onChange={(e) => handlePresetChange(e.target.value)} className="w-full bg-white border border-slate-300 text-sm font-bold text-slate-800 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-sm transition-all mb-4">
                  <option value="personalizado">🛠️ Personalizado (Livre)</option>
                  <option value="tecnico">🔧 Técnico</option>
                  <option value="gestor">👑 Gestor</option>
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MODULES.map(mod => {
                    const isActive = tempPermissions.includes(mod.id);
                    return (
                      <label key={mod.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-sm ${isActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                        <input type="checkbox" checked={isActive} onChange={() => togglePermission(mod.id)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0" />
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}><i className={`fa-solid ${mod.icon}`}></i></div>
                          <span className={`text-sm font-bold truncate ${isActive ? 'text-blue-900' : 'text-slate-700'}`} title={mod.label}>{mod.label}</span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

            </div>

            <div className="p-6 md:p-8 border-t border-slate-200 flex justify-end gap-3 bg-white shrink-0">
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors">Cancelar</button>
              <button type="submit" disabled={isSaving} className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center gap-2">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />} Criar Usuário
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default UserManagementView;