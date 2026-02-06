import { API_URL } from '../utils/constants';

export const apiRequest = async (endpoint, method = 'GET', body = null, isFileUpload = false) => {
  const options = {
    method,
    headers: isFileUpload ? {} : { 'Content-Type': 'application/json' },
  };

  if (body) {
    options.body = isFileUpload ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error(`Erro na requisição ${endpoint}:`, error);
    return { success: false, error: 'Erro de conexão com o servidor.' };
  }
};