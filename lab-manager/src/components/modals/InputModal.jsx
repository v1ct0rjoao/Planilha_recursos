import React, { useState, useEffect } from 'react';
import { HelpCircle, X, Check, RotateCcw } from 'lucide-react';

const InputModal = ({ 
  isOpen, 
  title, 
  message, 
  defaultValue, 
  onConfirm, 
  onClose, 
  onExtraAction, // Função do botão extra (Restaurar)
  extraLabel,    // Texto do tooltip do botão extra
  type = "number" 
}) => {
  const [value, setValue] = useState(defaultValue || '');

  // Reseta o valor sempre que o modal abre
  useEffect(() => {
    if (isOpen) setValue(defaultValue || '');
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(value);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Cabeçalho */}
        <div className="bg-amber-100 px-6 py-4 flex justify-between items-center border-b border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/50 rounded-full text-amber-600">
              <HelpCircle size={20} />
            </div>
            <h3 className="font-bold text-lg text-amber-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-amber-800/50 hover:text-amber-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-slate-600 text-sm mb-4 font-medium leading-relaxed">
            {message}
          </p>
          
          <input 
            type={type} 
            autoFocus
            className="w-full p-3 border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all mb-6"
            value={value} 
            onChange={(e) => setValue(e.target.value)}
          />

          <div className="flex gap-2">
            
            {/* Botão Extra (Restaurar) - Só aparece se a função for passada */}
            {onExtraAction && (
              <button 
                type="button" 
                onClick={onExtraAction} 
                className="px-4 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 hover:text-slate-700 transition-colors flex items-center justify-center border border-slate-200"
                title={extraLabel || "Ação Extra"}
              >
                <RotateCcw size={18} />
              </button>
            )}

            {/* Cancelar */}
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 border-2 border-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
            >
              Cancelar
            </button>

            {/* Confirmar */}
            <button 
              type="submit" 
              className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              Confirmar <Check size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputModal;