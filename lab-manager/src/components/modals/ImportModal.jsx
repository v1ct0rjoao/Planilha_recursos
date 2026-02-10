import React, { useState } from 'react';
import { 
  Clipboard, X, CheckCircle2, AlertTriangle, 
  ArrowRight, FileText, Database, Loader2, Clock 
} from 'lucide-react';

// =============================================================================
// HELPERS (Mantidos)
// =============================================================================

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

// =============================================================================
// MODAL DE PROTOCOLO DESCONHECIDO (Ajustado para Amber/Blue)
// =============================================================================
const UnknownProtocolModal = ({ isOpen, line, onClose, onRegister }) => {
  const [duration, setDuration] = useState('');
  if (!isOpen) return null;

  const parts = line.split(/\s{2,}/); 
  const suggestedName = parts.length > 2 ? parts[parts.length - 1].trim() : "TESTE_NOVO";

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
             <code className="text-[10px] text-slate-600 font-mono break-all block leading-tight">
                {line}
             </code>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome Identificado</label>
              <input 
                type="text" 
                value={suggestedName} 
                readOnly
                className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duração (Horas)</label>
              <div className="relative">
                <input 
                  type="number" 
                  autoFocus
                  placeholder="Ex: 48"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
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

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

const ImportModal = ({ isOpen, onClose, onImportSuccess, protocols, onRegisterProtocol }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para Unknown Protocol
  const [unknownLines, setUnknownLines] = useState([]);
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  const [currentUnknownLine, setCurrentUnknownLine] = useState('');

  if (!isOpen) return null;

  // --- LÓGICA DE NEGÓCIO (Mantida Igual) ---
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

  const startImportProcess = async () => {
    if (!text || !text.trim()) return;
    const missing = preScanText();
    
    if (missing.length > 0) {
      setUnknownLines(missing);
      setCurrentUnknownLine(missing[0]);
      setShowUnknownModal(true);
      return;
    }
    await executeImport();
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
      await executeImport();
    }
  };

  const skipUnknown = () => {
    const remaining = unknownLines.slice(1);
    if (remaining.length > 0) {
      setUnknownLines(remaining);
      setCurrentUnknownLine(remaining[0]);
    } else {
      setShowUnknownModal(false);
      executeImport();
    }
  };

  // --- RENDERIZAÇÃO ---
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[600px] border border-slate-200">
          
          {/* LADO ESQUERDO: INSTRUÇÕES VISUAIS (AGORA EM AZUL/SLATE) */}
          <div className="w-full md:w-5/12 bg-slate-800 p-8 flex flex-col justify-between text-white relative overflow-hidden">
            {/* Elementos Decorativos de Fundo */}
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
                      <h4 className="font-bold text-sm mb-1 text-slate-100">Processamento IA</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">O sistema identifica automaticamente os circuitos e tempos.</p>
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

          {/* LADO DIREITO: ÁREA DE AÇÃO */}
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

      {/* Modal Secundário */}
      <UnknownProtocolModal
        isOpen={showUnknownModal}
        line={currentUnknownLine}
        onClose={skipUnknown}
        onRegister={handleRegisterUnknown}
      />
    </>
  );
};

export default ImportModal;