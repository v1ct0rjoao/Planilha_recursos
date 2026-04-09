import { getAuth } from 'firebase/auth';
import { app } from '../firebaseConfig';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiRequest = async (endpoint, method = 'GET', body = null, isFileUpload = false) => {
  const auth = getAuth(app);
  
  await auth.authStateReady(); 

  const user = auth.currentUser;
  let token = '';

  if (user) {
    token = await user.getIdToken();
  }

  const options = {
    method,
    headers: isFileUpload ? {} : { 'Content-Type': 'application/json' },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = isFileUpload ? body : JSON.stringify(body);
  }

  try {

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
  
    if (!response.ok && response.status === 404) {
      console.error(`A rota ${API_BASE_URL}${endpoint} não foi encontrada (404).`);
      return { success: false, error: 'Servidor offline ou rota não encontrada.' };
    }

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error(`Erro na requisição ${endpoint}:`, error);
    return { success: false, error: 'Erro de conexão com o servidor.' };
  }
};