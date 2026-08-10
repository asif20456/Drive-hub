'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '@/types';
import { auth, db, isFirebaseConfigured } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getLocalUsers, saveLocalUser, initStorageSeed } from './storage';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUpCustomer: (name: string, email: string, pass: string) => Promise<void>;
  signUpOwner: (name: string, email: string, pass: string, companyName: string, city: string, address: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchDemoUser: (email: string) => void;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initStorageSeed();
    // Restore the stored demo session (or stay a guest) for quick dev experience
    const savedUid = localStorage.getItem('carhub_active_uid');
    const localUsers = getLocalUsers();
    if (savedUid) {
      const found = localUsers.find(u => u.uid === savedUid);
      if (found) setUser(found);
    }

    // Firebase Auth is only wired when a real project is configured; otherwise
    // the app runs fully on the localStorage demo dataset (no hanging requests).
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setUser(profile);
            saveLocalUser(profile);
            localStorage.setItem('carhub_active_uid', profile.uid);
          }
        } catch (e) {
          console.warn("Auth state sync fallback:", e);
        }
      }
      setLoading(false);
    });

    setLoading(false);
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);

    if (isFirebaseConfigured()) {
      try {
        const res = await signInWithEmailAndPassword(auth, email, pass);
        const userDoc = await getDoc(doc(db, 'users', res.user.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          setUser(profile);
          saveLocalUser(profile);
          localStorage.setItem('carhub_active_uid', profile.uid);
          toast.success(`Welcome back, ${profile.name}!`);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.warn("Firebase signin failed, attempting local fallback match:", err);
      }
    }

    // Demo-mode fallback: match against the seeded local users
    const localUsers = getLocalUsers();
    const match = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (match) {
      setUser(match);
      localStorage.setItem('carhub_active_uid', match.uid);
      toast.success(`Logged in as ${match.name} (${match.role})`);
      setLoading(false);
      return;
    }
    toast.error('Invalid credentials');
    setLoading(false);
    throw new Error('Invalid credentials');
  };

  const signUpCustomer = async (name: string, email: string, pass: string) => {
    setLoading(true);
    let uid = `cust_${Date.now()}`;
    if (isFirebaseConfigured()) {
      try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        uid = res.user.uid;
      } catch (e) {
        console.warn("Firebase signup fallback to local ID", e);
      }
    }

    const newProfile: UserProfile = {
      uid,
      name,
      email,
      role: 'customer',
      tenantId: null,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'users', uid), newProfile);
      } catch (e) {
        console.warn("Firestore save user fallback", e);
      }
    }

    saveLocalUser(newProfile);
    setUser(newProfile);
    localStorage.setItem('carhub_active_uid', newProfile.uid);
    toast.success('Account created successfully!');
    setLoading(false);
  };

  const signUpOwner = async (
    name: string, 
    email: string, 
    pass: string, 
    companyName: string, 
    city: string, 
    address: string, 
    phone: string
  ) => {
    setLoading(true);
    let uid = `owner_${Date.now()}`;
    const tenantId = `tenant_${Date.now()}`;

    if (isFirebaseConfigured()) {
      try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        uid = res.user.uid;
      } catch (e) {
        console.warn("Firebase owner signup fallback", e);
      }
    }

    // 1. Create Tenant Profile
    const newTenant = {
      id: tenantId,
      name: companyName,
      city,
      address,
      phone,
      status: 'active' as const,
      ownerId: uid,
      createdAt: new Date().toISOString(),
    };

    // 2. Create User Profile
    const newProfile: UserProfile = {
      uid,
      name,
      email,
      role: 'owner',
      tenantId,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'tenants', tenantId), newTenant);
        await setDoc(doc(db, 'users', uid), newProfile);
      } catch (e) {
        console.warn("Firestore save tenant/owner fallback", e);
      }
    }

    const { saveLocalTenant } = await import('./storage');
    saveLocalTenant(newTenant);
    saveLocalUser(newProfile);

    setUser(newProfile);
    localStorage.setItem('carhub_active_uid', newProfile.uid);
    toast.success(`Rental business "${companyName}" created successfully!`);
    setLoading(false);
  };

  const signOut = async () => {
    if (isFirebaseConfigured()) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        // ignore
      }
    }
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('carhub_active_uid');
    toast.success('Signed out');
  };

  const switchDemoUser = (email: string) => {
    const localUsers = getLocalUsers();
    const match = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (match) {
      setUser(match);
      localStorage.setItem('carhub_active_uid', match.uid);
      toast.success(`Switched active role to: ${match.name} (${match.role.toUpperCase()})`);
    } else {
      toast.error('User not found in demo dataset');
    }
  };

  const resetDemoData = () => {
    initStorageSeed(true);
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('carhub_active_uid');
    toast.success('Demo dataset reset to initial state!');
    if (typeof window !== 'undefined') window.location.reload();
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      signIn,
      signUpCustomer,
      signUpOwner,
      signOut,
      switchDemoUser,
      resetDemoData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
