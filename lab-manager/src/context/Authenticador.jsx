import React, { createContext, useContext, useState, useEffect } from 'react';
// IMPORTANTE: Adicionado o signInWithEmailAndPassword aqui na primeira linha!
import { getAuth, onAuthStateChanged, signInWithPopup, OAuthProvider, GoogleAuthProvider, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth(app);
  const db = getFirestore(app);

  const defaultClientePermissions = ['nova_solicitacao', 'meus_acompanhamentos', 'baterias'];
  
  const adminPermissions = ['dashboard', 'nova_solicitacao', 'meus_acompanhamentos', 'baterias', 'acompanhamento', 'lims', 'bancada', 'oee', 'history', 'protocolos', 'calendar', 'users', 'configuracoes', 'import_digatron'];

  const handleUserDatabase = async (loggedUser) => {
    const userRef = doc(db, 'users', loggedUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const newUser = {
        name: loggedUser.displayName || loggedUser.email.split('@')[0],
        email: loggedUser.email,
        role: 'cliente',
        permissions: defaultClientePermissions,
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, newUser);
      setUserRole('cliente');
      setUserPermissions(defaultClientePermissions);
    } else {
      const userData = userSnap.data();
      const role = userData.role || 'cliente';
      setUserRole(role);
      
      if (role === 'admin') {
        setUserPermissions(adminPermissions);
      } else {
        setUserPermissions(userData.permissions || defaultClientePermissions);
      }
    }
  };

  const loginWithMicrosoft = async () => {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({ prompt: 'select_account', tenant: 'common' });
    try {
      const result = await signInWithPopup(auth, provider);
      await handleUserDatabase(result.user);
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      await handleUserDatabase(result.user);
    } catch (error) {
      throw error; 
    }
  };


  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await handleUserDatabase(result.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const hasPermission = (moduleKey) => {
    return userPermissions.includes(moduleKey);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          const role = data.role || 'cliente';
          setUserRole(role);
          
          if (role === 'admin') {
             setUserPermissions(adminPermissions);
          } else {
             setUserPermissions(data.permissions || defaultClientePermissions);
          }

        } else {
          setUserRole('cliente'); 
          setUserPermissions(defaultClientePermissions);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserPermissions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);


  return (
    <AuthContext.Provider value={{ user, userRole, userPermissions, hasPermission, loading, loginWithMicrosoft, loginWithGoogle, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);