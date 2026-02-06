import React, { useState } from 'react';
import { Clipboard, XCircle } from 'lucide-react';
import { normalizeStr } from '../../utils/helpers';
import { oeeService } from '../../services/oeeService';
import UnknownProtocolModal from './UnknownProtocolModal';

const ImportModal = ({ isOpen, onClose, onImportSuccess, protocols, onRegisterProtocol }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Controle de protocolos não identificados no texto colado
  const [unknownLines, setUnknownLines] = useState([]);
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  const [currentUnknownLine, setCurrentUnknownLine] = useState('');

  // Analisa o texto antes de enviar para garantir que todos os protocolos existam no banco
  const preScanText = () => {
    if (!text) return [];
    const lines = text.split('\n');
    const pattern = /Circuit\s*0*(\d+)/i;
    const missing = [];
    
    lines.forEach(line => {
      if (pattern.test(line)) {
        const cleanLine = normalizeStr(line);
        // Busca o nome do protocolo dentro da linha colada
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
    if (!text) return;
    
    // 1. Valida se há testes novos
    const missing = preScanText();
    
    // 2. Se houver nomes desconhecidos, exige o cadastro antes de prosseguir
    if (missing.length > 0) {
      setUnknownLines(missing);
      setCurrentUnknownLine(missing[0]);
      setShowUnknownModal(true);
      return;
    }
    
    // 3. Se todos os protocolos já existem, segue para importação direta
    await executeImport();
  };

  const executeImport = async () => {
    setLoading(true);
    try {
      // Uso do service centralizado para evitar erros de URL/CORS no Vercel
      const data = await oeeService.importDigatron(text);
      
      if (data.sucesso) {
        const count = data.atualizados ? data.atualizados.length : 0;
        let msg = "Sincronização concluída!";
        
        if (count > 0) {
          const lista = data.atualizados.join(", ");
          const listaExibida = lista.length > 30 ? lista.substring(0, 30) + "..." : lista;
          msg = `Circuitos atualizados (${count}): ${listaExibida}`;
        }

        onImportSuccess(data.db_atualizado, msg);
        setText('');
        onClose();
      }
    } catch (e) {
      console.error("Falha na importação:", e);
      alert("Erro de conexão com o servidor de banco de dados.");
    }
    setLoading(false);
  };

  const handleRegisterUnknown = async (name, duration) => {
    // 1. Persiste o novo protocolo no Firebase
    await onRegisterProtocol(name, duration);
    
   
    const newProtoClean = normalizeStr(name);

    const nextUnknowns = unknownLines.slice(1).filter(line => {
      const lineClean = normalizeStr(line);
      return !lineClean.includes(newProtoClean);
    });
    
    if (nextUnknowns.length > 0) {
      // Continua perguntando sobre os outros protocolos ainda desconhecidos
      setUnknownLines(nextUnknowns);
      setCurrentUnknownLine(nextUnknowns[0]);
    } else {
      // Todos cadastrados, finaliza o processo
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
            <button onClick={onClose} className="hover:bg-emerald-700 p-1 rounded transition">
              <XCircle size={20} />
            </button>
          </div>
          <div className="p-6">
            <p className="text-[11px] text-slate-500 mb-2 font-medium">COLE OS DADOS ABAIXO:</p>
            <textarea
              className="w-full h-48 p-3 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none font-mono text-[10px] bg-slate-50 leading-relaxed"
              placeholder="Ex: Circuit001  22/01/2025 08:00  TESTE_ABC..."
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
                {loading ? "Processando..." : "Sincronizar"}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de cadastro forçado para garantir integridade dos cálculos de previsão */}
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