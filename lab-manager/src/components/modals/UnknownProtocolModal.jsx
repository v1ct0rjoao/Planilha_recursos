import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, XCircle } from 'lucide-react';

const UnknownProtocolModal = ({ isOpen, line, onClose, onRegister }) => {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('20');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && line) {
      setTimeout(() => inputRef.current?.focus(), 100);
      
      let candidateName = '';
      
      try {
        // LÓGICA NOVA E INTELIGENTE:
        // 1. Procura um padrão de hora (ex: 14:30 ou 14:30:00)
        // \d{2}:\d{2} acha os minutos. (?::\d{2})? acha os segundos (opcional)
        const timeMatch = line.match(/\d{2}:\d{2}(?::\d{2})?/);

        if (timeMatch) {
          // Se achou a hora, pega tudo que vem DEPOIS dela
          // (Pega a substring a partir do fim do horário encontrado)
          const afterTime = line.substring(timeMatch.index + timeMatch[0].length).trim();
          
          // Agora pega a primeira palavra que aparecer depois da hora
          const partsAfterTime = afterTime.split(/\s+/);
          if (partsAfterTime.length > 0) {
            candidateName = partsAfterTime[0];
          }
        } else {
          // Fallback: Se não achar hora nenhuma, tenta pegar o 5º elemento (índice 4)
          // Geralmente: 0=Circuit, 1=N, 2=Date, 3=Time, 4=TEST_NAME
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) candidateName = parts[4];
          else if (parts.length >= 4) candidateName = parts[3]; // Tenta o 4º se não tiver 5
        }
      } catch (e) { 
        console.log("Falha ao extrair nome automático", e); 
      }

      // Limpeza extra: Remove caracteres especiais que as vezes colam no nome (ex: parênteses)
      candidateName = candidateName.replace(/[^a-zA-Z0-9_-]/g, '');
      
      setName(candidateName.toUpperCase());
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
          <div className="bg-slate-100 p-3 rounded border border-slate-200 text-[10px] font-mono text-slate-700 mb-6 break-all">
            {line}
          </div>
          
          {/* Mostra a sugestão visualmente para conferência */}
          <div className="mb-4 text-xs text-amber-600 font-bold bg-amber-50 p-2 rounded border border-amber-100">
            Sugestão detectada: {name || "..."}
          </div>

          <h3 className="font-bold text-slate-800 text-sm mb-3">Deseja cadastrar este teste agora?</h3>
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Nome do Teste</label>
              <input 
                ref={inputRef} 
                type="text" 
                className="w-full p-2 border-2 border-slate-200 rounded-lg font-bold text-slate-700 outline-none uppercase focus:border-amber-500" 
                value={name} 
                onChange={e => setName(e.target.value.toUpperCase())} 
                onKeyDown={e => e.key === 'Enter' && handleRegister()} 
              />
            </div>
            <div className="w-24">
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Duração (h)</label>
              <input 
                type="number" 
                className="w-full p-2 border-2 border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-amber-500" 
                value={duration} 
                onChange={e => setDuration(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleRegister()} 
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-lg text-slate-500 font-bold text-sm hover:bg-slate-50">Pular Este</button>
            <button onClick={handleRegister} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm shadow-md">Cadastrar e Continuar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnknownProtocolModal;