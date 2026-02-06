// ============================================================================
// CONFIGURAÇÃO DE URLs DA API
// ============================================================================

// 1. URL da Hospedagem (Produção) - Adicionado /api no final
const PROD_URL = 'https://planilha-recursos.onrender.com/api';

// 2. URL do seu PC (Desenvolvimento) - Adicionado /api no final
const LOCAL_URL = 'http://127.0.0.1:5000/api'; 


// Detecta automaticamente se você está rodando o site no seu computador
const isRunningLocally = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';


const PREFER_LOCAL_API = true; 

export const API_URL = (isRunningLocally && PREFER_LOCAL_API) 
  ? LOCAL_URL 
  : PROD_URL;

console.log(`🔌 Conectado na API: ${API_URL}`);