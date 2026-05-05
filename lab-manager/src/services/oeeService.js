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
    return await apiRequest('/oee/calcular', 'POST', payload);
  },

  autoDefineExtras: async (limite) => {
    return await apiRequest('/oee/auto_extras', 'POST', { limite });
  },

  clearExtras: async () => {
    return await apiRequest('/oee/clear_extras', 'POST', {});
  },

  updateCircuit: async (id, action) => {
    return await apiRequest('/oee/update_circuit', 'POST', { id: String(id), action });
  },


  saveHistory: async (kpi, mes, ano, justificativa) => {
    return await apiRequest('/oee/salvar_historico', 'POST', { kpi, mes, ano, justificativa });
  },


  deleteHistory: async (mes, ano) => {
    return await apiRequest('/oee/deletar_historico', 'POST', { mes, ano });
  },


  getHistory: async () => {
    return await apiRequest('/oee/history', 'GET');
  }
};
