import React, { useState } from 'react';
import { Clipboard, XCircle, AlertCircle, Clock } from 'lucide-react';

// =============================================================================
// HELPERS E COMPONENTES AUXILIARES (Integrados para evitar erros de importação)
// =============================================================================

// Função para normalizar strings (Remover acentos e caracteres especiais)
const normalizeStr = (str) => {
  if (!str) return '';
  return str.toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
};

// URL da API (Substituir pela URL do Render se necessário)
const API_URL = 'https://planilha-recursos.onrender.com/api';

// Modal de Protocolo Desconhecido (Integrado para garantir funcionamento)
const UnknownProtocolModal = ({ isOpen, line, onClose, onRegister }) => {
  const [duration, setDuration] = useState('');
  if (!isOpen) return null;

  // Tenta extrair um nome sugerido da linha do Digatron
  const suggestedName = line.split(/\s{2,}/).pop() || "TESTE_NOVO";

  const handleConfirm = () => {
    if (!duration || isNaN(duration)) {
      alert("Por favor, insira uma duração válida em horas.");
      return;
    }
    onRegister(suggestedName, parseInt(duration));
    setDuration('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-amber-500 text-white px-6 py-4 flex items-center gap-3">
          <AlertCircle size={24} />
          <h3 className="font-bold text-lg">Teste Desconhecido</h3>
        </div>
        <div className="p-6">
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">
            Identificamos um teste no texto que não está cadastrado no sistema. 
            Precisamos da duração para calcular a previsão de término.
          </p>
          <div className="bg-slate-100 p-3 rounded-lg mb-4 font-mono text-[10px] break-all border border-slate-200">
            {line}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">NOME IDENTIFICADO</label>
              <input 
                type="text" 
                disabled 
                value={suggestedName} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">DURAÇÃO ESTIMADA (HORAS)</label>
              <div className="relative">
                <input 
                  type="number" 
                  autoFocus
                  placeholder="Ex: 48"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-500 outline-none"
                />
                <Clock className="absolute right-3 top-3.5 text-amber-400" size={18} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors">Pular</button>
            <button onClick={handleConfirm} className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg transition-all">Cadastrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL: IMPORTMODAL
// =============================================================================

const ImportModal = ({ isOpen, onClose, onImportSuccess, protocols, onRegisterProtocol }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para gerenciar protocolos que não estão no banco de dados
  const [unknownLines, setUnknownLines] = useState([]);
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  const [currentUnknownLine, setCurrentUnknownLine] = useState('');

  // Varredura prévia para identificar protocolos não cadastrados
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
      // Requisição direta para evitar erros de importação de serviço externo
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
        alert(`Erro no processamento: ${data.erro || 'Falha desconhecida'}`);
      }
    } catch (e) {
      console.error("Erro na sincronização:", e);
      alert("Não foi possível conectar ao servidor Render. Tente novamente em alguns instantes.");
    }
    setLoading(false);
  };

  const handleRegisterUnknown = async (name, duration) => {
    // 1. Registra o protocolo
    await onRegisterProtocol(name, duration);
    
    // 2. Filtra outras linhas que tenham o mesmo nome (inteligência de lote)
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="bg-emerald-800 text-white px-6 py-4 flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2">
              <Clipboard size={20} /> Sincronizar Digatron
            </h2>
            <button 
              onClick={onClose} 
              className="hover:bg-emerald-700 p-1 rounded transition-colors"
            >
              <XCircle size={20} />
            </button>
          </div>
          
          <div className="p-6">
            <p className="text-[11px] text-slate-500 mb-2 font-bold uppercase tracking-wider">
              Cole as linhas de monitoramento do software:
            </p>
            <textarea
              className="w-full h-48 p-3 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none font-mono text-[10px] bg-slate-50 leading-relaxed transition-all"
              placeholder="Ex: Circuit001   29/08/2025 14:31   CIB50AGM68..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={onClose} 
                className="flex-1 py-3 px-4 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={startImportProcess} 
                disabled={loading || !text.trim()} 
                className="flex-1 py-3 px-4 bg-emerald-600 rounded-lg text-white font-bold hover:bg-emerald-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Processando..." : "Sincronizar Agora"}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de cadastro de novos testes */}
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