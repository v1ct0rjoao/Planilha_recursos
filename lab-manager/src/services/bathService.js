import { apiRequest } from './api';

export const bathService = {
  getAllData: async () => {
    return await apiRequest('/data');
  },

  addBath: async (bathId, temp) => {
    return await apiRequest('/baths/add', 'POST', { bathId, temp });
  },
  deleteBath: async (bathId) => {
    return await apiRequest('/baths/delete', 'POST', { bathId });
  },
  renameBath: async (oldId, newId) => {
    return await apiRequest('/baths/rename', 'POST', { oldId, newId });
  },
  updateTemp: async (bathId, temp) => {
    return await apiRequest('/baths/temp', 'POST', { bathId, temp: Number(temp) });
  },

  addCircuit: async (bathId, circuitId) => {
    return await apiRequest('/circuits/add', 'POST', { bathId, circuitId });
  },
  deleteCircuit: async (bathId, circuitId) => {
    return await apiRequest('/circuits/delete', 'POST', { bathId, circuitId });
  },
  updateStatus: async (bathId, circuitId, status) => {
    return await apiRequest('/circuits/status', 'POST', { bathId, circuitId, status });
  },
  moveCircuit: async (sourceBathId, targetBathId, circuitId) => {
    return await apiRequest('/circuits/move', 'POST', { sourceBathId, targetBathId, circuitId });
  },
  linkCircuit: async (bathId, sourceId, targetId) => {
    return await apiRequest('/circuits/link', 'POST', { bathId, sourceId, targetId });
  },

  addProtocol: async (name, duration) => {
    return await apiRequest('/protocols/add', 'POST', { name, duration });
  },
  deleteProtocol: async (id) => {
    return await apiRequest('/protocols/delete', 'POST', { id });
  },

  updateExperienceOwner: async (expCode, ownerName) => {
    return await apiRequest('/experience/owners', 'POST', { [expCode]: ownerName });
  },

  importDigatron: async (text) => {
    return await apiRequest('/import', 'POST', { text });
  }
};