// URL do servidor na nuvem (Render) - Certifique-se que este link abre no navegador
const PROD_URL = 'https://planilha-recursos.onrender.com/api';

// URL do servidor no seu computador
const LOCAL_URL = 'http://127.0.0.1:5000/api';

// Detecta se o site está rodando no seu PC ou na Vercel
const isRunningLocally = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';


const PREFER_LOCAL_API = false; 

export const API_URL = (isRunningLocally && PREFER_LOCAL_API) 
  ? LOCAL_URL 
  : PROD_URL;

console.log(`🔌 Sistema conectado em: ${API_URL}`);