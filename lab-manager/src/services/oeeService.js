import { apiRequest } from './api';

export const oeeService = {

   uploadFile: async (file, mes, ano) => {
    const formData = new FormData();
    formData.append('file', file);
    if (mes) formData.append('mes', mes);
    if (ano) formData.append('ano', ano);
    return await apiRequest('/oee/upload', 'POST', formData, true); 
  },

  calculate: async (payload) => {
    return await apiRequest('/oee/calculate', 'POST', payload);
  },

  updateCircuit: async (id, action) => {
    return await apiRequest('/oee/update_circuit', 'POST', { id: String(id), action });
  },

  saveHistory: async (kpi, mes, ano) => {
    return await apiRequest('/oee/save_history', 'POST', { kpi, mes, ano });
  },

  // NOVA FUNÇÃO
  deleteHistory: async (mes, ano) => {
    return await apiRequest('/oee/history/delete', 'POST', { mes, ano });
  }
};