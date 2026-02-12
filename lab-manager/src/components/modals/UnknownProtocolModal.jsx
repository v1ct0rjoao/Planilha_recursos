import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, XCircle } from 'lucide-react';

const UnknownProtocolModal = ({ isOpen, line, onClose, onRegister }) => {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('20');
  const inputRef = useRef(null);

  const extrairNomeDoTeste = (textoBruto) => {
    if (!textoBruto) return '';

    // 1. TRANSFORMA EM ARRAY (Remove espaços extras e tabs vazios)
    // O split(/\s+/) já elimina os buracos vazios que o TAB cria.
    const arrayDaLinha = textoBruto.trim().split(/\s+/);

    // 2. ACHA ONDE ESTÁ O CIRCUITO (Nossa âncora)
    // Ex: Se a linha for "22180 Circuit145...", o indexCircuito será 1
    // Ex: Se a linha for "Circuit353...", o indexCircuito será 0
    const indexCircuito = arrayDaLinha.findIndex(item => /^Circuit/i.test(item));

    // Se não achou circuito, aborta
    if (indexCircuito === -1) return '';

    // 3. PROCURA O NOME A PARTIR DO CIRCUITO
    // Começamos a olhar o array logo depois do circuito (indexCircuito + 1)
    for (let i = indexCircuito + 1; i < arrayDaLinha.length; i++) {
      const item = arrayDaLinha[i];

      // É Data? (XX/XX/XXXX ou XX-XX-XXXX)
      if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(item)) continue;
      
      // É Hora? (XX:XX ou XX:XX:XX)
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(item)) continue;

      // SE NÃO É DATA E NÃO É HORA, É O NOME!
      // Achamos! Retorna limpo.
      return item.replace(/[^a-zA-Z0-9_\-\.]/g, '');
    }

    return '';
  };

  useEffect(() => {
    if (isOpen && line) {
      setTimeout(() => inputRef.current?.focus(), 100);
      const nomeDetectado = extrairNomeDoTeste(line);
      setName(nomeDetectado.toUpperCase());
    }
  }, [isOpen, line]);

  if (!isOpen) return null;

  const handleRegister = () => {
    if (!name) return;
    onRegister(name, duration);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in">
        <div className="bg-amber-500 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2"><HelpCircle size={20} /> Teste Desconhecido Detectado</h2>
          <button onClick={onClose} className="hover:bg-amber-600 p-1 rounded"><XCircle size={20} /></button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-2">Encontramos uma linha sem teste correspondente:</p>
          <div className="bg-slate-100 p-3 rounded border border-slate-200 text-[10px] font-mono text-slate-700 mb-6 break-all overflow-x-auto whitespace-nowrap">
            {line}
          </div>
          
          <div className="mb-4 text-xs text-amber-600 font-bold bg-amber-50 p-2 rounded border border-amber-100 flex items-center gap-2">
             <span>🎯 Sugestão detectada:</span>
             <span className="text-sm uppercase bg-white px-2 py-0.5 rounded border border-amber-200 shadow-sm min-h-[24px] min-w-[50px]">
               {name || "..."}
             </span>
          </div>

          <h3 className="font-bold text-slate-800 text-sm mb-3">Deseja cadastrar este teste agora?</h3>
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Nome do Teste</label>
              <input 
                ref={inputRef} 
                type="text" 
                className="w-full p-2 border-2 border-slate-200 rounded-lg font-bold text-slate-700 outline-none uppercase focus:border-amber-500 transition-colors" 
                value={name} 
                onChange={e => setName(e.target.value.toUpperCase())} 
                onKeyDown={e => e.key === 'Enter' && handleRegister()} 
              />
            </div>
            <div className="w-24">
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Duração (h)</label>
              <input 
                type="number" 
                className="w-full p-2 border-2 border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-amber-500 transition-colors" 
                value={duration} 
                onChange={e => setDuration(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleRegister()} 
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-lg text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors">Pular Este</button>
            <button onClick={handleRegister} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-95">Cadastrar e Continuar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnknownProtocolModal;