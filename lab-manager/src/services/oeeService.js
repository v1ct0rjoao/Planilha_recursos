import { apiRequest } from './api';

export const oeeService = {
  // Upload de arquivo (nota o true no final para indicar que é arquivo)
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    // Retorna direto o apiRequest configurado para multipart/form-data
    return await apiRequest('/oee/upload', 'POST', formData, true); 
  },

  calculate: async (payload) => {
    return await apiRequest('/oee/calculate', 'POST', payload);
  },

  getHistory: async () => {
    return await apiRequest('/oee/history');
  },

  saveHistory: async (kpi, mes, ano) => {
    return await apiRequest('/oee/save_history', 'POST', { kpi, mes, ano });
  }
};