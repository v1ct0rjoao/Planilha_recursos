import React from 'react';
import { useAuth } from '../../context/Authenticador';

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { user, hasPermission, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-blue-600 mb-4"></i>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">
          Verificando credenciais...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center border-t-4 border-rose-500 animate-in zoom-in-95 duration-300">
          
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-rose-100">
            <i className="fa-solid fa-triangle-exclamation text-4xl drop-shadow-sm"></i>
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Acesso Negado</h2>
          
          <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed">
            Seu perfil não possui permissão para acessar o módulo <span className="font-bold text-slate-700 uppercase">[{requiredPermission}]</span>. Solicite acesso à liderança.
          </p>
          
          <button 
            onClick={() => window.location.reload()} 
            className="bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-slate-700 w-full transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 group"
          >
            <i className="fa-solid fa-rotate-right group-hover:rotate-180 transition-transform duration-500"></i>
            Atualizar Sessão
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;