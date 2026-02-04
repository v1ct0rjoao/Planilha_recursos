//Esse componente é aquele balãozinho que aparece no canto da tela dizendo "Salvo com sucesso" ou "Erro ao conectar"


import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Começa a animar a barrinha de tempo diminuindo
    requestAnimationFrame(() => setProgress(0));

    // Define o tempo de vida do aviso (3 segundos)
    const timer = setTimeout(() => {
      setVisible(false);
      // Espera a animação de saída terminar para fechar de vez
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  // Define as cores baseadas no tipo (sucesso, erro, etc)
  const styles = {
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-600', bar: 'bg-emerald-500', Icon: CheckCircle },
    error:   { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-800',    icon: 'text-rose-600',    bar: 'bg-rose-500',    Icon: AlertTriangle },
    info:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-800',    icon: 'text-blue-600',    bar: 'bg-blue-500',    Icon: Info },
    warning: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   icon: 'text-amber-600',   bar: 'bg-amber-500',   Icon: AlertTriangle }
  };

  const style = styles[type] || styles.info;
  const IconComponent = style.Icon;

  return (
    <div className={`fixed top-6 right-6 z-[200] flex flex-col overflow-hidden w-80 rounded-xl border shadow-2xl shadow-slate-200/50 backdrop-blur-md transition-all duration-300 transform ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${style.bg} ${style.border}`}>
      <div className="flex items-center gap-3 p-4">
        <div className={`p-2 bg-white rounded-full shadow-sm ${style.icon}`}>
          <IconComponent size={20} />
        </div>
        <p className={`text-sm font-bold ${style.text}`}>{message}</p>
        <button onClick={() => setVisible(false)} className="ml-auto text-slate-400 hover:text-slate-600">
          <XCircle size={18} />
        </button>
      </div>
      {/* Barra de progresso do tempo */}
      <div className="h-1 w-full bg-slate-200/50">
        <div 
          className={`h-full ${style.bar} transition-all duration-[3000ms] ease-linear`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Toast;