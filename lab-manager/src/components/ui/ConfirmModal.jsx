import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", type = "danger" }) => {
  
  // Esse useEffect serve para ouvir o teclado.
  // Se o modal estiver aberto e o usuário apertar Enter, confirma. Se apertar Esc, cancela.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Enter') onConfirm();
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Limpeza: remove o ouvinte quando o modal fecha para não pesar a memória
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
              {cancelText}
            </button>
            <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-lg text-white font-bold text-sm shadow-md transition-transform active:scale-95 ${type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;