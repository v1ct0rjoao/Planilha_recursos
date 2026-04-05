import React, { useState, useEffect, useRef } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, ArrowRight, FileText, Database, Loader2, Clock, Users 
} from 'lucide-react';


const normalizeStr = (str) => {
  if (!str) return '';
  return str.toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
};

const API_URL = 'https://planilha-recursos.onrender.com/api';


const UnknownProtocolModal = ({ isOpen, line, onClose, onRegister }) => {
  const [duration, setDuration] = useState('');
  const [suggestedName, setSuggestedName] = useState('');
  const inputRef = useRef(null);

  const extrairNomeDoTeste = (textoBruto) => {
    if (!textoBruto) return '';
    const arrayDaLinha = textoBruto.trim().split(/\s+/);
    const indexCircuito = arrayDaLinha.findIndex(item => /^Circuit/i.test(item));

    if (indexCircuito === -1) return '';

    for (let i = indexCircuito + 1; i < arrayDaLinha.length; i++) {
      const item = arrayDaLinha[i];
      if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(item)) continue;
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(item)) continue;
      return item.replace(/[^a-zA-Z0-9_\-\.]/g, '');
    }
    return "";
  };

  useEffect(() => {
    if (isOpen && line) {
      const nome = extrairNomeDoTeste(line);
      setSuggestedName(nome);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, line]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!duration || isNaN(duration)) {
      alert("Por favor, insira uma duração válida em horas.");
      return;
    }
    onRegister(suggestedName, parseInt(duration));
    setDuration('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-amber-200 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-amber-600">
            <div className="bg-amber-100 p-2 rounded-full">
               <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Novo Teste Detectado</h3>
          </div>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed">
            O sistema encontrou um teste não cadastrado. Precisamos da duração para calcular as previsões.
          </p>
          <div className="bg-slate-50 p-3 rounded-lg mb-6 border border-slate-200">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Linha Original</span>
             <code className="text-[10px] text-slate-600 font-mono break-all block leading-tight whitespace-pre-wrap">
                {line}
             </code>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome Identificado</label>
              <input 
                type="text" 
                value={suggestedName} 
                onChange={(e) => setSuggestedName(e.target.value.toUpperCase())}
                className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-amber-500 focus:outline-none transition-colors uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duração (Horas)</label>
              <div className="relative">
                <input 
                  ref={inputRef}
                  type="number" 
                  placeholder="Ex: 48"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                  className="w-full p-3 pl-10 border-2 border-slate-200 rounded-xl text-sm font-bold focus:border-amber-500 focus:outline-none transition-colors"
                />
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors">
              Pular Este
            </button>
            <button onClick={handleConfirm} className="flex-1 py-3 bg-amber-500 text-white font-bold text-sm rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all active:scale-95">
              Salvar & Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const MissingOwnersModal = ({ isOpen, missingCodes, onCancel, onSave }) => {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (isOpen) {
      const initial = {};
      missingCodes.forEach(code => initial[code] = '');
      setForm(initial);
    }
  }, [isOpen, missingCodes]);

  if (!isOpen) return null;

  const isComplete = missingCodes.every(code => form[code] && form[code].trim().length > 0);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-blue-200 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <div className="bg-blue-100 p-2 rounded-full">
               <Users size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Solicitantes Pendentes</h3>
          </div>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed">
            Nós detectamos novas baterias de experiência nestes logs. Por favor, <strong>identifique os solicitantes</strong> para continuarmos a sincronização.
          </p>

          <div className="max-h-60 overflow-y-auto space-y-3 custom-scrollbar pr-2 mb-6">
            {missingCodes.map((code, idx) => (
              <div key={code} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                   <span>Experiência: <span className="text-blue-600">{code}</span></span>
                </label>
                <input
                  autoFocus={idx === 0}
                  type="text"
                  placeholder="Ex: João Victor, Engenharia..."
                  value={form[code] || ''}
                  onChange={(e) => setForm({...form, [code]: e.target.value})}
                  className="w-full p-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors">
              Cancelar Importação
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={!isComplete}
              className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar e Sincronizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const ImportModal = ({ isOpen, onClose, onImportSuccess, protocols, onRegisterProtocol }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Controle dos modais e Cache de donos em tempo real
  const [unknownLines, setUnknownLines] = useState([]);
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  const [currentUnknownLine, setCurrentUnknownLine] = useState('');
  
  const [missingOwnersList, setMissingOwnersList] = useState([]);
  const [showOwnersModal, setShowOwnersModal] = useState(false);
  const [freshOwnersCache, setFreshOwnersCache] = useState({});

  if (!isOpen) return null;

  const preScanText = () => {
    if (!text) return [];
    const lines = text.split('\n');
    const pattern = /Circuit\s*0*(\d+)/i;
    const missing = [];
    
    lines.forEach(line => {
      if (pattern.test(line)) {
        const cleanLine = normalizeStr(line);
        const found = protocols.some(p => {
          const cleanProto = normalizeStr(p.name);
          return cleanLine.includes(cleanProto);
        });
        if (!found) missing.push(line.trim());
      }
    });
    return missing;
  };

 
  const preScanExperiences = (ownersAtualizados) => {
    if (!text) return [];
    const lines = text.split('\n');
    const missingSet = new Set();
    const batPattern = /(\d{5,}-[\w-]+)/;

    lines.forEach(line => {
      const match = line.match(batPattern);
      if (match) {
        const batId = match[1];
        const parts = batId.split('-');
        
        if (parts.length >= 2 && parts[1].toUpperCase().startsWith('E')) {
          let expCode = parts[1].toUpperCase();
          
          if (parts.length >= 3) {
             const anoLimpo = parts[2].split('_')[0]; 
             expCode = `${expCode}/${anoLimpo}`;      
          }
          const baseCode = parts[1].toUpperCase(); 
          
          // Se não existir no objeto que acabou de vir do servidor, eu cobro!
          if (!ownersAtualizados[expCode] && !ownersAtualizados[baseCode]) {
             missingSet.add(expCode);
          }
        }
      }
    });
    return Array.from(missingSet);
  };

 
  const startImportProcess = async () => {
    if (!text || !text.trim()) return;
    setLoading(true);

    try {

      const response = await fetch(`${API_URL}/data`);
      const dbData = await response.json();
      const donosFresquinhos = dbData.experienceOwners || {};
      
  
      setFreshOwnersCache(donosFresquinhos);


      const missingProtos = preScanText();
      if (missingProtos.length > 0) {
        setUnknownLines(missingProtos);
        setCurrentUnknownLine(missingProtos[0]);
        setShowUnknownModal(true);
        setLoading(false);
        return;
      }

      checkMissingOwnersAndImport(donosFresquinhos);
    } catch (e) {
      console.error(e);
      alert("Erro ao tentar conectar com o servidor.");
      setLoading(false);
    }
  };

  const checkMissingOwnersAndImport = (ownersAtualizados) => {
    const missingExps = preScanExperiences(ownersAtualizados);
    if (missingExps.length > 0) {
      setMissingOwnersList(missingExps);
      setShowOwnersModal(true);
      setLoading(false);
    } else {
      executeImport();
    }
  };

  const handleRegisterUnknown = async (name, duration) => {
    await onRegisterProtocol(name, duration);
    const newProtoClean = normalizeStr(name);
    const nextUnknowns = unknownLines.slice(1).filter(line => {
      const lineClean = normalizeStr(line);
      return !lineClean.includes(newProtoClean);
    });
    
    if (nextUnknowns.length > 0) {
      setUnknownLines(nextUnknowns);
      setCurrentUnknownLine(nextUnknowns[0]);
    } else {
      setShowUnknownModal(false);
      checkMissingOwnersAndImport(freshOwnersCache);
    }
  };

  const skipUnknown = () => {
    const remaining = unknownLines.slice(1);
    if (remaining.length > 0) {
      setUnknownLines(remaining);
      setCurrentUnknownLine(remaining[0]);
    } else {
      setShowUnknownModal(false);
      checkMissingOwnersAndImport(freshOwnersCache);
    }
  };

  const handleSaveMissingOwners = async (ownersDict) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/experience/owners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownersDict)
      });
      const data = await response.json();
      if (data.sucesso) {
         setShowOwnersModal(false);
         executeImport(); 
      } else {
         alert("Erro ao salvar os solicitantes.");
         setLoading(false);
      }
    } catch(e) {
      console.error(e);
      alert("Erro de conexão ao salvar solicitantes.");
      setLoading(false);
    }
  };

  const executeImport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      
      if (data.sucesso) {
        const count = data.atualizados ? data.atualizados.length : 0;
        let msg = "Sincronização concluída com sucesso!";
        if (count > 0) {
          const lista = data.atualizados.join(", ");
          const listaExibida = lista.length > 40 ? lista.substring(0, 40) + "..." : lista;
          msg = `Atualizados (${count}): ${listaExibida}`;
        }
        onImportSuccess(data.db_atualizado, msg);
        setText('');
        onClose();
      } else {
        alert(`Erro: ${data.erro}`);
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão com o servidor.");
    }
    setLoading(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[600px] border border-slate-200">
          
          <div className="w-full md:w-5/12 bg-slate-800 p-8 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                 <div className="bg-slate-700 p-2.5 rounded-xl border border-slate-600 shadow-lg text-blue-400">
                    <Database size={24} />
                 </div>
                 <h2 className="text-xl font-bold leading-tight">Sincronizar <br/>Digatron</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-600 text-blue-300 shadow-sm">1</div>
                   <div>
                      <h4 className="font-bold text-sm mb-1 text-slate-100">Copie do Software</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">Selecione as linhas na janela do Digatron e pressione Ctrl+C.</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-600 text-blue-300 shadow-sm">2</div>
                   <div>
                      <h4 className="font-bold text-sm mb-1 text-slate-100">Cole ao Lado</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">Use o campo de texto à direita para colar os dados brutos.</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-600 text-blue-300 shadow-sm">3</div>
                   <div>
                      <h4 className="font-bold text-sm mb-1 text-slate-100">Verificação Automática</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">A IA descobre protocolos novos e cobra nomes de solicitantes.</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 bg-slate-700/50 p-4 rounded-xl border border-slate-600/50 backdrop-blur-sm mt-4">
               <p className="text-[10px] text-slate-300 flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-blue-400" /> Dados seguros e processados localmente.
               </p>
            </div>
          </div>

          <div className="w-full md:w-7/12 bg-white flex flex-col h-full">
             <div className="p-4 flex justify-end">
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                   <X size={24} />
                </button>
             </div>

             <div className="flex-1 px-8 pb-8 flex flex-col">
                <div className="flex-1 flex flex-col">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileText size={14} className="text-blue-500" /> Área de Transferência
                   </label>
                   <textarea
                      className="flex-1 w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all resize-none font-mono text-xs text-slate-600 leading-relaxed custom-scrollbar placeholder:text-slate-300"
                      placeholder="Cole aqui as linhas do Digatron..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                   />
                </div>

                <div className="mt-6 flex justify-end">
                   <button 
                      onClick={startImportProcess} 
                      disabled={loading || !text.trim()} 
                      className="bg-blue-600 text-white font-bold py-4 px-8 rounded-xl shadow-xl shadow-blue-200 hover:shadow-2xl hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3 w-full md:w-auto justify-center group"
                   >
                      {loading ? (
                         <>
                           <Loader2 size={20} className="animate-spin" /> Processando...
                         </>
                      ) : (
                         <>
                           Sincronizar Dados <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                         </>
                      )}
                   </button>
                </div>
             </div>
          </div>

        </div>
      </div>

      <UnknownProtocolModal
        isOpen={showUnknownModal}
        line={currentUnknownLine}
        onClose={skipUnknown}
        onRegister={handleRegisterUnknown}
      />

      <MissingOwnersModal 
        isOpen={showOwnersModal}
        missingCodes={missingOwnersList}
        onCancel={() => setShowOwnersModal(false)}
        onSave={handleSaveMissingOwners}
      />
    </>
  );
};

export default ImportModal;
