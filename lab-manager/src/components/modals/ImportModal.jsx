import React, { useState } from 'react';
import { Clipboard, XCircle } from 'lucide-react';
import { normalizeStr } from '../../utils/helpers';
import { API_URL } from '../../utils/constants';
import UnknownProtocolModal from './UnknownProtocolModal';

const ImportModal = ({ isOpen, onClose, onImportSuccess, protocols, onRegisterProtocol }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para lidar com protocolos desconhecidos
  const [unknownLines, setUnknownLines] = useState([]);
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  const [currentUnknownLine, setCurrentUnknownLine] = useState('');

  // Varre o texto antes de enviar para ver se tem testes novos (não cadastrados)
  const preScanText = () => {
    if (!text) return [];
    const lines = text.split('\n');
    const pattern = /Circuit\s*0*(\d+)/i;
    const missing = [];
    
    lines.forEach(line => {
      if (pattern.test(line)) {
        const cleanLine = normalizeStr(line);
        // Verifica se algum protocolo da lista existe dentro dessa linha
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
    
    // 1. Verifica desconhecidos
    const missing = preScanText();
    
    // 2. Se tiver desconhecidos, abre o modal de cadastro forçado
    if (missing.length > 0) {
      setUnknownLines(missing);
      setCurrentUnknownLine(missing[0]);
      setShowUnknownModal(true);
      return;
    }
    
    // 3. Se tudo ok, executa
    await executeImport();
  };

  const executeImport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      
      if (data.sucesso) {
        const count = data.atualizados ? data.atualizados.length : 0;
        let msg = "Sincronização concluída!";
        
        if (count > 0) {
          const lista = data.atualizados.join(", ");
          const listaExibida = lista.length > 30 ? lista.substring(0, 30) + "..." : lista;
          msg = `Atualizados (${count}): ${listaExibida}`;
        }
        
        onImportSuccess(data.db_atualizado, msg);
        setText('');
        onClose();
      }
    } catch (e) {
      alert("Erro de conexão.");
    }
    setLoading(false);
  };

  // Chamado quando o usuário cadastra um teste novo no modal filho
  const handleRegisterUnknown = async (name, duration) => {
    // 1. Cadastra o novo teste no sistema
    await onRegisterProtocol(name, duration);
    
    // 2. LÓGICA DE INTELIGÊNCIA:
    // Pega o nome que acabamos de aprender e normaliza
    const newProtoClean = normalizeStr(name);

    // Filtra a lista de pendências:
    // Removemos todas as linhas que contenham o nome do teste que acabamos de cadastrar.
    // Isso evita que o modal pergunte a mesma coisa de novo.
    const nextUnknowns = unknownLines.slice(1).filter(line => {
      const lineClean = normalizeStr(line);
      // Se a linha NÃO contém o nome do novo teste, ela continua na lista de desconhecidos
      return !lineClean.includes(newProtoClean);
    });
    
    if (nextUnknowns.length > 0) {
      // Se ainda tem linhas desconhecidas (de OUTROS testes), mostra o próximo
      setUnknownLines(nextUnknowns);
      setCurrentUnknownLine(nextUnknowns[0]);
    } else {
      // Se a lista zerou, fecha o modal e termina a importação
      setShowUnknownModal(false);
      await executeImport();
    }
  };

  // Chamado quando o usuário clica em "Não Adicionar" (Pular)
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
            <h2 className="font-bold flex items-center gap-2"><Clipboard size={20} /> Sincronizar Digatron</h2>
            <button onClick={onClose} className="hover:bg-emerald-700 p-1 rounded transition"><XCircle size={20} /></button>
          </div>
          <div className="p-6">
            <textarea
              className="w-full h-48 p-3 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none font-mono text-[10px] bg-slate-50"
              placeholder="Cole as linhas do Digatron aqui..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 py-3 px-4 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50">Cancelar</button>
              <button onClick={startImportProcess} disabled={loading} className="flex-1 py-3 px-4 bg-emerald-600 rounded-lg text-white font-bold hover:bg-emerald-700 shadow-md">
                {loading ? "Processando..." : "Sincronizar"}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal Filho: Aparece apenas se houver testes desconhecidos */}
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