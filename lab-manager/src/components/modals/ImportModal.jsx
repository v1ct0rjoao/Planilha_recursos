import React, { useState } from 'react';
import { Clipboard, XCircle, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

// =============================================================================
// HELPERS INTEGRADOS
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
// SUB-MODAL DE CADASTRO RÁPIDO
// =============================================================================

const UnknownProtocolModal = ({ isOpen, line, onClose, onRegister }) => {
  const [duration, setDuration] = useState('');
  if (!isOpen) return null;

  const suggestedName = line.split(/\s{2,}/).pop() || "TESTE_NOVO";

  const handleConfirm = () => {
    if (!duration || isNaN(duration) || parseInt(duration) <= 0) {
      alert("Insira uma duração válida em horas.");
      return;
    }
    onRegister(suggestedName, parseInt(duration));
    setDuration('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-amber-500 text-white px-6 py-4 flex items-center gap-3">
          <AlertCircle size={24} />
          <h3 className="font-bold text-lg text-white">Teste não identificado</h3>
        </div>
        <div className="p-6">
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">
            O sistema encontrou um teste novo. Informe a duração para que possamos calcular o tempo de banho corretamente.
          </p>
          <div className="bg-slate-50 p-3 rounded-lg mb-4 font-mono text-[10px] border border-slate-200 text-slate-500 italic">
             "{line.length > 100 ? line.substring(0, 100) + '...' : line}"
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Nome do Teste</label>
              <input type="text" disabled value={suggestedName} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Duração (Horas)</label>
              <input 
                type="number" autoFocus placeholder="Ex: 72" value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-3 border-2 border-amber-100 rounded-lg focus:border-amber-500 outline-none font-bold text-slate-700" 
              />
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={onClose} className="flex-1 py-3 text-slate-400 font-bold text-xs uppercase hover:bg-slate-50 rounded-xl transition-all">Pular Linha</button>
            <button onClick={handleConfirm} className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg transition-all text-xs uppercase">Cadastrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MODAL PRINCIPAL DE IMPORTAÇÃO
// =============================================================================

const ImportModal = ({ isOpen, onClose, onImportSuccess, protocols, onRegisterProtocol }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [unknownLines, setUnknownLines] = useState([]);
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  const [currentUnknownLine, setCurrentUnknownLine] = useState('');

  const preScanText = () => {
    if (!text) return [];
    const lines = text.split('\n');
    const pattern = /Circuit\s*0*(\d+)/i;
    const missing = [];
    
    lines.forEach(line => {
      if (pattern.test(line)) {
        const cleanLine = normalizeStr(line);
        const found = protocols.some(p => cleanLine.includes(normalizeStr(p.name)));
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
        // Logica para extrair mensagem amigavel
        const count = data.atualizados ? data.atualizados.length : 0;
        let msg = count > 0 ? `Sucesso! ${count} circuitos foram atualizados.` : "Sincronização finalizada.";

        // --- CORREÇÃO DA TELA EM BRANCO ---
        // 1. Primeiro fechamos o modal e limpamos o estado local
        setText('');
        onClose();

        // 2. Só então disparamos o callback para atualizar a página principal
        // Verificamos se o callback existe e se os dados são válidos
        if (onImportSuccess && data.db_atualizado) {
            setTimeout(() => {
                onImportSuccess(data.db_atualizado, msg);
            }, 100); // Pequeno delay para garantir que o modal fechou
        }
      } else {
        alert(`Servidor recusou os dados: ${data.erro || 'Falha desconhecida'}`);
      }
    } catch (e) {
      console.error("Erro na sincronização:", e);
      alert("Falha crítica de conexão. Verifique se o servidor Render está ativo.");
    }
    setLoading(false);
  };

  const handleRegisterUnknown = async (name, duration) => {
    // Registra no Firebase
    await onRegisterProtocol(name, duration);
    
    // Limpa a fila de desconhecidos para esse mesmo nome
    const newProtoClean = normalizeStr(name);
    const nextUnknowns = unknownLines.slice(1).filter(line => !normalizeStr(line).includes(newProtoClean));
    
    if (nextUnknowns.length > 0) {
      setUnknownLines(nextUnknowns);
      setCurrentUnknownLine(nextUnknowns[0]);
    } else {
      setShowUnknownModal(false);
      // Dispara a importação final após todos os cadastros
      setTimeout(() => executeImport(), 300);
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="bg-emerald-800 text-white px-6 py-5 flex justify-between items-center border-b border-emerald-900/20">
            <div className="flex items-center gap-3">
               <div className="bg-emerald-700 p-2 rounded-lg shadow-inner"><Clipboard size={20} className="text-emerald-100" /></div>
               <h2 className="font-extrabold text-white tracking-tight">Sincronizar Digatron</h2>
            </div>
            <button onClick={onClose} className="hover:bg-emerald-700/50 p-2 rounded-full transition-all"><XCircle size={22} className="text-emerald-200" /></button>
          </div>
          
          <div className="p-8">
            <div className="mb-6">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-emerald-500" /> Instruções de Uso:
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Copie as linhas de monitoramento do software Digatron e cole na área abaixo. O sistema identificará automaticamente os circuitos, baterias e tempos de início.
                </p>
            </div>

            <textarea
              className="w-full h-48 p-4 border-2 border-slate-100 rounded-xl focus:border-emerald-500 focus:ring-0 focus:outline-none font-mono text-[10px] bg-slate-50 leading-relaxed shadow-inner"
              placeholder="Cole os dados aqui (Ex: Circuit001...)"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            
            <div className="flex gap-4 mt-8">
              <button 
                onClick={onClose} 
                className="flex-1 py-4 border border-slate-200 rounded-xl text-slate-400 font-bold text-xs uppercase hover:bg-slate-50 hover:text-slate-600 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={startImportProcess} 
                disabled={loading || !text.trim()} 
                className="flex-[2] py-4 bg-emerald-600 rounded-xl text-white font-black text-xs uppercase hover:bg-emerald-700 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Processando informações..." : "Sincronizar com Servidor"}
              </button>
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
    </>
  );
};

export default ImportModal;