'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Tenant } from '../types';

export const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL as string;

interface AuthContextData {
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  isSuperAdmin: boolean;
  logout: () => Promise<void>;
  refreshTenant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenant = async (uid: string) => {
    try {
      const docRef = doc(db, 'tenants', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTenant({ id: docSnap.id, ...docSnap.data() } as Tenant);
      } else {
        setTenant(null);
      }
    } catch (error) {
      console.error("Error fetching tenant data:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchTenant(currentUser.uid);
      } else {
        setTenant(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const refreshTenant = async () => {
    if (user) {
      await fetchTenant(user.uid);
    }
  };

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, tenant, loading, isSuperAdmin, logout, refreshTenant }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
