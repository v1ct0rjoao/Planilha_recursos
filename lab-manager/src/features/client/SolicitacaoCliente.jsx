import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';

const InputField = ({ label, name, type = "text", placeholder, icon, value, onChange, required = true, readOnly = false, colSpan = "col-span-1" }) => (
  <div className={`flex flex-col gap-2 ${colSpan}`}>
    <label className="text-[13px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors">
      {label} {required && !readOnly && <span className="text-blue-500">*</span>}
    </label>
    <div className="relative group">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors">
          <i className={`fa-solid ${icon} text-base`}></i>
        </div>
      )}
      <input 
        type={type} name={name} placeholder={placeholder} 
        value={value || ''} onChange={onChange} required={required && !readOnly} readOnly={readOnly}
        className={`w-full ${icon ? 'pl-12' : 'pl-5'} pr-5 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm ${readOnly ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed' : 'hover:border-slate-300 dark:hover:border-slate-600'}`}
      />
    </div>
  </div>
);

const SelectionCard = ({ title, icon, isSelected, onClick, themeColor }) => (
  <div 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
      isSelected 
      ? `border-${themeColor}-500 bg-${themeColor}-50 dark:bg-${themeColor}-500/10 shadow-md scale-[1.02]` 
      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
    }`}
  >
    <i className={`fa-solid ${icon} text-3xl mb-3 transition-colors ${isSelected ? `text-${themeColor}-500 dark:text-${themeColor}-400` : 'text-slate-300 dark:text-slate-600'}`}></i>
    <span className={`font-black text-base uppercase tracking-wider transition-colors ${isSelected ? `text-${themeColor}-700 dark:text-${themeColor}-300` : 'text-slate-500 dark:text-slate-400'}`}>
      {title}
    </span>
  </div>
);

const ClientSolicitationView = ({ user, initialData, onClearInitialData, setToast, isEditMode, onCancelEdit, onSaveSuccess }) => {
  const [testCategory, setTestCategory] = useState(initialData?.tipo || 'eletrico');
  const [isThirdParty, setIsThirdParty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultFormState = {
    laboratorio: '', nomeSolicitante: '', emailContato: '', idSolicitacao: '',
    nomeProprietario: '', emailProprietario: '',
    descricao: '', gestorImediato: '',
    tituloProjeto: '', modeloAmostras: '', codigoSap: '', qtdAmostras: '', objetivoEnsaio: '',
    tipoProcedimento: 'normativo', tituloNorma: '', itemNorma: '', tituloEnsaio: '', nomeProcedimento: '',
    capacidadeNominal: '', cca: '', rc: '', densidade: '', nivelEletrolito: '', placaPos: '', placaNeg: '', separador: '',
    tipoBateria: '', tipoEnsaioMecanico: 'metalografica',
    dadosAmostra: '', caracteristicaAmostra: '', analiseSolicitada: '', composicaoLiga: '',
    especificacaoTeste: '', lote: '', fornecedor: '', notaFiscal: '', nomeProduto: '',
    destinoAmostra: '', emailRelatorio: '', termoAceite: null 
  };

  const [formData, setFormData] = useState(defaultFormState);

  useEffect(() => {
    if (initialData) {
      setTestCategory(initialData.tipo || 'eletrico');
      const targetId = isEditMode ? initialData.idSolicitacao : `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
      setFormData(prev => ({ ...prev, ...initialData, idSolicitacao: targetId, termoAceite: isEditMode ? 'concordo' : null }));
      setToast?.({ message: isEditMode ? "Modo de edição ativado." : "Dados carregados com sucesso!", type: "info" });
    }
  }, [initialData, isEditMode, setToast]);

  useEffect(() => {
    if (user && !initialData) {
      setFormData(prev => ({ ...prev, nomeSolicitante: user.displayName || '', emailContato: user.email || '' }));
    }
  }, [user, initialData]);

  useEffect(() => {
    if (!initialData) {
      const randomId = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
      setFormData(prev => ({ ...prev, idSolicitacao: randomId }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    onClearInitialData?.();
    setIsThirdParty(false);
    setFormData({
      ...defaultFormState,
      nomeSolicitante: user?.displayName || '',
      emailContato: user?.email || '',
      idSolicitacao: `REQ-${Math.floor(100000 + Math.random() * 900000)}`
    });
    setToast?.({ message: "Formulário limpo.", type: "success" });
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      if (isSubmitting) return; 
      
      setIsSubmitting(true);
      try {
        const payload = {
          ...formData,
          nomeProprietario: isThirdParty ? formData.nomeProprietario : formData.nomeSolicitante,
          emailProprietario: isThirdParty ? formData.emailProprietario : formData.emailContato,
          tipo: testCategory,
          status: isEditMode ? formData.status : 'pendente'
        };
      
        let response;
        if (isEditMode) {
           response = await apiRequest('/solicitacoes/update', 'POST', { id: formData.idSolicitacao, dados: payload });
        } else {
           response = await apiRequest('/solicitacoes/adicionar', 'POST', payload);
        }
        
        if (response.success) {
          setToast?.({ message: isEditMode ? `Edição salva com sucesso!` : `Sucesso! ID: ${formData.idSolicitacao}`, type: "success" });
          if (isEditMode) {
             if (onSaveSuccess) onSaveSuccess();
             else if (onCancelEdit) onCancelEdit();
          } else {
             setTimeout(() => window.location.reload(), 2000);
          }
        } else {
          setToast?.({ message: response.data?.erro || "Erro no servidor", type: "error" });
        }
      } catch (error) {
        setToast?.({ message: "Falha na conexão.", type: "error" });
      } finally {
        setIsSubmitting(false);
      }
  };

  const themes = {
    eletrico: {
      bgClass: 'bg-amber-50/50 dark:bg-amber-900/10', borderClass: 'border-amber-500', 
      textFocus: 'text-amber-600 dark:text-amber-400', iconClass: 'fa-bolt', iconLabel: 'text-amber-500', 
      btnMain: 'bg-amber-500 hover:bg-amber-600', decorativeIcon: 'fa-bolt', colorName: 'amber'
    },
    mecanico: {
      bgClass: 'bg-indigo-50/50 dark:bg-indigo-900/10', borderClass: 'border-indigo-500', 
      textFocus: 'text-indigo-600 dark:text-indigo-400', iconClass: 'fa-gears', iconLabel: 'text-indigo-500', 
      btnMain: 'bg-indigo-600 hover:bg-indigo-700', decorativeIcon: 'fa-gears', colorName: 'indigo'
    }
  };

  const activeTheme = themes[testCategory];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B1120] transition-colors duration-500 w-full h-full font-sans text-slate-900 dark:text-slate-100">
      
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-8 pb-6 px-6 lg:px-10 xl:px-12 transition-colors">
        <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`bg-${activeTheme.colorName}-100 dark:bg-${activeTheme.colorName}-500/20 text-${activeTheme.colorName}-700 dark:text-${activeTheme.colorName}-400 text-xs font-black px-3 py-1 rounded-md uppercase tracking-widest`}>
                {isEditMode ? 'Modo de Edição Administrativa' : 'Novo Registro'}
              </span>
              <span className="text-slate-400 dark:text-slate-500 text-sm font-mono font-bold">{formData.idSolicitacao}</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              {isEditMode ? 'Edição de Requisição' : 'Abertura de Requisição'}
              <i className={`fa-solid ${activeTheme.iconClass} ${activeTheme.iconLabel} animate-pulse`}></i>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-base font-medium">
              {isEditMode ? 'Altere os dados técnicos desta solicitação. Todas as mudanças ficarão registradas no histórico do processo.' : 'Preencha as especificações técnicas para iniciar a rastreabilidade da amostra no Complexo Laboratorial.'}
            </p>
          </div>
          
          <div className="flex gap-3">
            {isEditMode && onCancelEdit && (
               <button onClick={onCancelEdit} className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl text-sm font-bold transition-all border border-slate-300 dark:border-slate-700 hover:border-rose-400 shadow-sm flex items-center gap-2">
                 Cancelar Edição
               </button>
            )}
            {initialData && !isEditMode && (
               <button onClick={handleClear} className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl text-sm font-bold transition-all border border-slate-300 dark:border-slate-700 hover:border-rose-400 shadow-sm flex items-center gap-2">
                 <i className="fa-solid fa-rotate-left"></i> Descartar Dados Reutilizados
               </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full px-6 lg:px-10 xl:px-12 py-10 pb-24">
        
        <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm w-fit mb-10 transition-colors">
          <button 
            type="button" onClick={() => setTestCategory('eletrico')} 
            className={`px-10 py-3.5 text-sm font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-3 ${testCategory === 'eletrico' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <i className={`fa-solid fa-bolt text-lg ${testCategory === 'eletrico' ? 'text-white' : 'opacity-50'}`}></i> Elétrico
          </button>
          <button 
            type="button" onClick={() => setTestCategory('mecanico')} 
            className={`px-10 py-3.5 text-sm font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-3 ${testCategory === 'mecanico' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <i className={`fa-solid fa-gears text-lg ${testCategory === 'mecanico' ? 'text-white' : 'opacity-50'}`}></i> Mecânico
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 w-full relative z-10">
            
            <div className={`w-full rounded-[2.5rem] p-8 lg:p-10 transition-all duration-500 relative overflow-hidden bg-white dark:bg-slate-900 border-t-[8px] ${activeTheme.borderClass} shadow-md`}>
              <i className={`fa-solid ${activeTheme.decorativeIcon} absolute -bottom-10 -right-10 text-[350px] text-black dark:text-white transition-all duration-500 opacity-[0.02] pointer-events-none`}></i>
              
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 relative z-10">
                <i className={`fa-solid fa-address-card ${activeTheme.iconLabel} text-2xl`}></i> Informações Básicas da Requisição
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-6 lg:gap-8 mb-8 relative z-10">
                <InputField label="Preenchido por" name="nomeSolicitante" icon="fa-user" value={formData.nomeSolicitante} onChange={handleChange} readOnly={true} colSpan="xl:col-span-1 2xl:col-span-1" />
                <InputField label="E-mail do Emissor" name="emailContato" type="email" icon="fa-envelope" value={formData.emailContato} onChange={handleChange} readOnly={true} colSpan="xl:col-span-1 2xl:col-span-1" />
                <InputField label="Gestor Imediato" name="gestorImediato" icon="fa-sitemap" value={formData.gestorImediato} onChange={handleChange} colSpan="xl:col-span-1 2xl:col-span-1" />
                
                <div className="col-span-1 xl:col-span-1 2xl:col-span-2 flex items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-4 cursor-pointer w-full">
                    <div className={`w-6 h-6 flex items-center justify-center rounded border-2 transition-colors ${isThirdParty ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`}>
                      {isThirdParty && <i className="fa-solid fa-check text-white text-sm"></i>}
                    </div>
                    <input type="checkbox" checked={isThirdParty} onChange={(e) => setIsThirdParty(e.target.checked)} className="hidden" />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 select-none">
                      Emitir requisição em nome de outro colaborador
                    </span>
                  </label>
                </div>
              </div>

              {isThirdParty && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8 mb-8 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-900/30 animate-in fade-in slide-in-from-top-4 relative z-10">
                  <InputField label="Nome do colaborador" name="nomeProprietario" icon="fa-user-tie" value={formData.nomeProprietario} onChange={handleChange} required={isThirdParty} colSpan="xl:col-span-2" />
                  <InputField label="E-mail do colaborador" name="emailProprietario" type="email" icon="fa-envelope" value={formData.emailProprietario} onChange={handleChange} required={isThirdParty} colSpan="xl:col-span-2" />
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 border-t border-slate-100 dark:border-slate-800 pt-8 relative z-10">
                <div className="xl:col-span-1">
                  <label className="text-[13px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 block">Laboratório de Destino <span className="text-blue-500">*</span></label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {['UND 1', 'UND 8'].map(und => (
                      <SelectionCard 
                        key={und} title={`Lab. ${und}`} icon="fa-building" 
                        isSelected={formData.laboratorio === und} 
                        onClick={() => setFormData(prev => ({...prev, laboratorio: und}))} 
                        themeColor={activeTheme.colorName}
                      />
                    ))}
                  </div>
                </div>
                <div className="xl:col-span-2">
                  <label className="text-[13px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 block">Descrição / Escopo Geral da Solicitação <span className="text-blue-500">*</span></label>
                  <textarea 
                    name="descricao" rows="4" value={formData.descricao} onChange={handleChange} required 
                    placeholder="Descreva o propósito e contexto geral para facilitar o entendimento do laboratório..." 
                    className="w-full p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all resize-none shadow-sm hover:border-slate-300 dark:hover:border-slate-700"
                  />
                </div>
              </div>
            </div>

            {testCategory === 'eletrico' && (
              <>
                <div className="w-full bg-white dark:bg-slate-900 p-8 lg:p-10 rounded-[2.5rem] shadow-sm border border-slate-200/80 dark:border-slate-800 transition-colors">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <i className="fa-solid fa-car-battery text-amber-500 text-2xl"></i> Dados Técnicos do Projeto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-6 lg:gap-8 mb-8">
                    <InputField label="Título do Projeto" name="tituloProjeto" icon="fa-folder-open" value={formData.tituloProjeto} onChange={handleChange} colSpan="lg:col-span-2 2xl:col-span-2" />
                    <InputField label="Código SAP" name="codigoSap" icon="fa-barcode" value={formData.codigoSap} onChange={handleChange} colSpan="lg:col-span-1 2xl:col-span-1" />
                    <InputField label="Modelo (Bateria)" name="modeloAmostras" icon="fa-tag" value={formData.modeloAmostras} onChange={handleChange} colSpan="lg:col-span-1 2xl:col-span-2" />
                    <InputField label="Qtd. Amostras" name="qtdAmostras" type="number" icon="fa-boxes-stacked" value={formData.qtdAmostras} onChange={handleChange} colSpan="lg:col-span-1 2xl:col-span-1" />
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2">
                       <InputField label="Objetivo Específico do Ensaio" name="objetivoEnsaio" icon="fa-bullseye" value={formData.objetivoEnsaio} onChange={handleChange} />
                    </div>
                    <div className="xl:col-span-1">
                      <label className="text-[13px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 block">Tipo de Bateria <span className="text-blue-500">*</span></label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full">
                        {['SLI', 'VRLA', 'EFB', 'Outras'].map(tipo => (
                          <div 
                            key={tipo} onClick={() => setFormData(prev => ({...prev, tipoBateria: tipo}))}
                            className={`flex-1 flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all font-bold text-sm ${formData.tipoBateria === tipo ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                          >
                            {tipo}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-white dark:bg-slate-900 p-8 lg:p-10 rounded-[2.5rem] shadow-sm border border-slate-200/80 dark:border-slate-800 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                      <i className="fa-solid fa-list-check text-emerald-500 text-2xl"></i> Especificações do Procedimento
                    </h3>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button type="button" onClick={() => setFormData(prev => ({...prev, tipoProcedimento: 'normativo'}))} className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.tipoProcedimento === 'normativo' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>Base Normativa</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, tipoProcedimento: 'interno'}))} className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.tipoProcedimento === 'interno' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>Procedimento Interno</button>
                    </div>
                  </div>
                  
                  {formData.tipoProcedimento === 'normativo' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8 bg-emerald-50/50 dark:bg-emerald-900/10 p-8 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                      <InputField label="Título da Norma" name="tituloNorma" icon="fa-book" value={formData.tituloNorma} onChange={handleChange} />
                      <InputField label="Item da Norma" name="itemNorma" icon="fa-bookmark" value={formData.itemNorma} onChange={handleChange} />
                      <InputField label="Título do Ensaio" name="tituloEnsaio" icon="fa-microscope" value={formData.tituloEnsaio} onChange={handleChange} />
                    </div>
                  ) : (
                    <div className="mb-8 bg-emerald-50/50 dark:bg-emerald-900/10 p-8 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                      <InputField label="Nome e Código do Procedimento Interno" name="nomeProcedimento" icon="fa-file-signature" value={formData.nomeProcedimento} onChange={handleChange} />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-8 gap-6 lg:gap-8 pt-4">
                    <InputField label="C20 Nominal" name="capacidadeNominal" value={formData.capacidadeNominal} onChange={handleChange} />
                    <InputField label="CCA" name="cca" value={formData.cca} onChange={handleChange} />
                    <InputField label="RC" name="rc" value={formData.rc} onChange={handleChange} />
                    <InputField label="Densidade" name="densidade" value={formData.densidade} onChange={handleChange} />
                    <InputField label="Nível" name="nivelEletrolito" value={formData.nivelEletrolito} onChange={handleChange} />
                    <InputField label="Separador" name="separador" value={formData.separador} onChange={handleChange} />
                    <InputField label="Placa (+)" name="placaPos" value={formData.placaPos} onChange={handleChange} />
                    <InputField label="Placa (-)" name="placaNeg" value={formData.placaNeg} onChange={handleChange} />
                  </div>
                </div>
              </>
            )}

            {testCategory === 'mecanico' && (
              <div className="w-full bg-white dark:bg-slate-900 p-8 lg:p-10 rounded-[2.5rem] shadow-sm border border-slate-200/80 dark:border-slate-800 transition-colors">
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <i className="fa-solid fa-gears text-indigo-500 text-2xl"></i> Dados do Ensaio Mecânico
                </h3>
                
                <div className="mb-10">
                  <label className="text-[13px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4 block">Tipo de Ensaio Físico/Mecânico <span className="text-blue-500">*</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[
                      { id: 'metalografica', label: 'Metalografia', icon: 'fa-microscope' },
                      { id: 'alca', label: 'Teste de Alça', icon: 'fa-suitcase' },
                      { id: 'valvula', label: 'Teste de Válvula', icon: 'fa-gauge' }
                    ].map(tipo => (
                      <SelectionCard 
                        key={tipo.id} title={tipo.label} icon={tipo.icon} 
                        isSelected={formData.tipoEnsaioMecanico === tipo.id} 
                        onClick={() => setFormData(prev => ({...prev, tipoEnsaioMecanico: tipo.id}))} 
                        themeColor={activeTheme.colorName}
                      />
                    ))}
                  </div>
                </div>

                {formData.tipoEnsaioMecanico === 'metalografica' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                      <InputField label="Qtd. Amostras" name="qtdAmostras" type="number" icon="fa-boxes-stacked" value={formData.qtdAmostras} onChange={handleChange} colSpan="xl:col-span-1" />
                      <InputField label="Composição da Liga" name="composicaoLiga" icon="fa-flask" value={formData.composicaoLiga} onChange={handleChange} colSpan="xl:col-span-1" />
                      <InputField label="Análise Solicitada" name="analiseSolicitada" icon="fa-magnifying-glass-chart" value={formData.analiseSolicitada} onChange={handleChange} colSpan="md:col-span-full xl:col-span-2" />
                    </div>
                    <InputField label="Objetivo Técnico da Análise" name="objetivoEnsaio" icon="fa-bullseye" value={formData.objetivoEnsaio} onChange={handleChange} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                      <div>
                        <label className="text-[13px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Dados da Amostra</label>
                        <textarea name="dadosAmostra" rows="3" value={formData.dadosAmostra} onChange={handleChange} className="w-full p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none hover:border-slate-300 dark:hover:border-slate-600 shadow-sm" />
                      </div>
                      <div>
                        <label className="text-[13px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Características Visuais/Físicas</label>
                        <textarea name="caracteristicaAmostra" rows="3" value={formData.caracteristicaAmostra} onChange={handleChange} className="w-full p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none hover:border-slate-300 dark:hover:border-slate-600 shadow-sm" />
                      </div>
                    </div>
                  </div>
                )}

                {(formData.tipoEnsaioMecanico === 'alca' || formData.tipoEnsaioMecanico === 'valvula') && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                      <InputField label="Nome do Produto" name="nomeProduto" icon="fa-box" value={formData.nomeProduto} onChange={handleChange} colSpan="xl:col-span-2" />
                      <InputField label="Código SAP" name="codigoSap" icon="fa-barcode" value={formData.codigoSap} onChange={handleChange} colSpan="xl:col-span-1" />
                      <InputField label="Qtd." name="qtdAmostras" type="number" icon="fa-boxes-stacked" value={formData.qtdAmostras} onChange={handleChange} colSpan="xl:col-span-1" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                      <InputField label="Lote de Fab." name="lote" icon="fa-layer-group" value={formData.lote} onChange={handleChange} />
                      <InputField label="Fornecedor" name="fornecedor" icon="fa-truck-field" value={formData.fornecedor} onChange={handleChange} />
                      <InputField label="Nota Fiscal" name="notaFiscal" icon="fa-file-invoice-dollar" value={formData.notaFiscal} onChange={handleChange} />
                    </div>
                    <div className="pt-4">
                      <label className="text-[13px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Especificações de Teste</label>
                      <textarea name="especificacaoTeste" rows="3" value={formData.especificacaoTeste} onChange={handleChange} placeholder="Detalhe as necessidades e limites para o teste..." className="w-full p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none hover:border-slate-300 dark:hover:border-slate-600 shadow-sm" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="w-full bg-white dark:bg-slate-900 p-8 lg:p-10 rounded-[2.5rem] shadow-sm border border-slate-200/80 dark:border-slate-800 transition-colors">
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <i className="fa-solid fa-paperclip text-slate-500 text-2xl"></i> Finalização e Anexos
              </h3>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10 mb-10">
                <div>
                  <label className="text-[13px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 block">Ação com a amostra após ensaio <span className="text-blue-500">*</span></label>
                  <textarea name="destinoAmostra" rows="5" value={formData.destinoAmostra} onChange={handleChange} required placeholder="Ex: Devolver para a planta X, Descartar, Enviar para Metrologia..." className="w-full p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none hover:border-slate-300 dark:hover:border-slate-600 shadow-sm" />
                </div>
                
                <div className="space-y-8 flex flex-col justify-between">
                  <InputField label="Adicionar e-mails em cópia (Separar por vírgula)" name="emailRelatorio" placeholder="gestor@moura.com, eng@moura..." value={formData.emailRelatorio} onChange={handleChange} required={false} />
                  <div>
                    <label className="text-[13px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 block">Anexar Documentos (Fotos, Specs)</label>
                    <div className="relative">
                      <input type="file" multiple className="block w-full text-base font-bold text-slate-600 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-black file:bg-blue-100 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-200 dark:hover:file:bg-blue-900/50 file:transition-colors cursor-pointer border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 py-2 shadow-sm transition-colors hover:border-slate-300 dark:hover:border-slate-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 transition-colors flex flex-col xl:flex-row gap-8 items-center">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-base flex items-center gap-2">
                    <i className="fa-solid fa-scale-balanced text-slate-400"></i> Termos de Responsabilidade
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Ao confirmar, declaro que as amostras estão identificadas corretamente. Entendo que o prazo de execução depende da fila de equipamentos da Programação. Amostras sem recolhimento em 30 dias serão descartadas.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto shrink-0">
                  <label className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl border-2 cursor-pointer transition-all ${formData.termoAceite === 'concordo' ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-200 font-bold shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 font-semibold'}`}>
                    <input type="radio" name="termoAceite" value="concordo" onChange={handleChange} required className="hidden" />
                    <i className={`fa-solid fa-check text-lg ${formData.termoAceite === 'concordo' ? 'text-blue-600 dark:text-blue-500' : 'opacity-30'}`}></i> De Acordo
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl border-2 cursor-pointer transition-all ${formData.termoAceite === 'nao_concordo' ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 font-semibold'}`}>
                    <input type="radio" name="termoAceite" value="nao_concordo" onChange={handleChange} className="hidden" />
                    <i className={`fa-solid fa-xmark text-lg ${formData.termoAceite === 'nao_concordo' ? 'text-rose-500' : 'opacity-30'}`}></i> Recusar
                  </label>
                </div>
              </div>
            </div>

          <div className="pt-4 pb-8 w-full flex justify-end gap-4">
              <button 
                type="submit" 
                disabled={formData.termoAceite !== 'concordo'}
                className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex justify-center items-center gap-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-${activeTheme.colorName}-500/50 ${formData.termoAceite === 'concordo' ? `${activeTheme.btnMain} text-white shadow-md hover:shadow-lg active:scale-[0.98]` : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}
              >
                {isEditMode ? 'Salvar Alterações' : 'Enviar Solicitação'}
                <i className={isEditMode ? "fa-solid fa-save" : "fa-solid fa-paper-plane"}></i> 
              </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ClientSolicitationView;