import React, { useState, useEffect } from 'react';
import { ArrowRight, Lock } from 'lucide-react';

const AddCircuitModal = ({ isOpen, onClose, onConfirm, bathId, baths, setToast }) => {
  const [startNum, setStartNum] = useState('');
  const [endNum, setEndNum] = useState('');
  const [isRange, setIsRange] = useState(false);
  const [duplicateError, setDuplicateError] = useState(null);

  useEffect(() => {
    if (!isOpen) { setStartNum(''); setEndNum(''); setIsRange(false); setDuplicateError(null); }
  }, [isOpen]);

  const normalizeId = (id) => {
    if (!id) return null;
    const onlyNums = String(id).replace(/\D/g, '');
    return onlyNums ? parseInt(onlyNums, 10) : null;
  };

  const checkDuplicate = (numInput) => {
    if (!baths || !numInput) return null;
    const targetNum = normalizeId(numInput);
    for (const b of baths) {
      if (b.circuits) {
        const found = b.circuits.some(c => normalizeId(c.id) === targetNum);
        if (found) return b.id;
      }
    }
    return null;
  };

  const handleSave = () => {
    const s = normalizeId(startNum);
    if (!s) return;
    const existingBath = checkDuplicate(startNum);
    if (existingBath) {
      setDuplicateError({ circuit: s, bath: existingBath });
      if (setToast) setToast({ message: `Bloqueado: Circuito ${s} (ou similar) já existe!`, type: 'error' });
      return;
    }
    if (isRange && endNum) {
      const e = normalizeId(endNum);
      if (e < s) {
        if (setToast) setToast({ message: `Erro: O fim (${e}) é menor que o início (${s})`, type: 'error' });
        return;
      }
      for (let i = s; i <= e; i++) {
        const existRange = checkDuplicate(i);
        if (existRange) {
          setDuplicateError({ circuit: i, bath: existRange });
          if (setToast) setToast({ message: `Bloqueado: Circuito ${i} já existe em ${existRange}!`, type: 'error' });
          return;
        }
      }
    }
    onConfirm(bathId, startNum, isRange ? endNum : null);
    setStartNum(''); setEndNum(''); setIsRange(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in">
        <div className="bg-blue-900 text-white px-4 py-3 flex justify-between items-center"><h2 className="font-bold">Adicionar Circuito(s)</h2></div>
        <div className="p-4 text-center">
          {duplicateError ? (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-4 text-left animate-in shake">
              <div className="flex items-center gap-2 mb-2"><Lock size={16} className="text-rose-600" /><span className="text-xs font-black text-rose-800 uppercase">Duplicidade Detectada</span></div>
              <p className="text-xs text-rose-700 leading-relaxed mb-2">O circuito <strong>{duplicateError.circuit}</strong> (ou variação 0{duplicateError.circuit}) já está em uso na unidade:</p>
              <div className="bg-white border border-rose-200 p-2 rounded text-xs font-bold text-slate-700 text-center uppercase shadow-sm">{duplicateError.bath}</div>
              <button onClick={() => setDuplicateError(null)} className="mt-3 w-full py-2 bg-white border border-rose-200 text-rose-600 rounded-lg font-bold text-xs hover:bg-rose-50 transition-colors">Entendido, corrigir</button>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-4"><button onClick={() => setIsRange(!isRange)} className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${isRange ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{isRange ? 'Modo Faixa (Range) Ativo' : 'Ativar Modo Faixa'}</button></div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex flex-col items-center"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isRange ? 'De' : 'Circuito'}</span><div className="flex items-center"><input type="number" className="w-20 border-b-2 p-1 text-2xl font-black text-slate-800 focus:border-blue-500 outline-none text-center" value={startNum} onChange={(e) => setStartNum(e.target.value)} autoFocus placeholder="1" onKeyDown={e => e.key === 'Enter' && handleSave()} /></div></div>
                {isRange && (<><span className="text-slate-300 mt-4"><ArrowRight size={20} /></span><div className="flex flex-col items-center"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Até</span><div className="flex items-center"><input type="number" className="w-20 border-b-2 p-1 text-2xl font-black text-slate-800 focus:border-blue-500 outline-none text-center" value={endNum} onChange={(e) => setEndNum(e.target.value)} placeholder="10" onKeyDown={e => e.key === 'Enter' && handleSave()} /></div></div></>)}
              </div>
              <div className="flex gap-2"><button onClick={onClose} className="flex-1 py-2 border rounded-lg text-slate-500 font-bold text-sm">Cancelar</button><button onClick={handleSave} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md text-sm hover:bg-blue-700">Confirmar</button></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCircuitModal;