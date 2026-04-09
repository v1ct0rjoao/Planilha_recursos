//export const API_URL = 'https://planilha-recursos.onrender.com/api';
export const API_URL = import.meta.env.VITE_API_URL || '/api';

console.log(`🔌 Conexão estabelecida em: ${API_URL}`);
